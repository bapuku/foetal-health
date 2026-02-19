#!/usr/bin/env node
/**
 * Agent crawler éthique permanent pour toutes les sources internet.
 * Utilisé par les pipelines d'ingestion (Europe PMC, WHO, Cochrane, NICE, etc.).
 *
 * Principes :
 * - User-Agent identifié (recherche / base de connaissances, pas de scraping abusif)
 * - Respect de robots.txt (optionnel mais activé par défaut pour les domaines supportés)
 * - Rate limiting strict par domaine (délai minimal entre requêtes)
 * - Cache disque pour éviter de re-solliciter les serveurs
 * - Retry avec backoff sur 429 / 5xx
 * - Journal des requêtes pour audit
 */

const fs = require('fs');
const path = require('path');

const CRAWLER_NAME = 'ObstetricAI-EthicalCrawler';
const CRAWLER_VERSION = '1.0';
const CRAWLER_URL = 'https://github.com/agentic-medtech/foetal-health';
const USER_AGENT = `${CRAWLER_NAME}/${CRAWLER_VERSION} (research; knowledge-base; +${CRAWLER_URL})`;

/** Domaines institutionnels autorisés (origines uniquement). Vide = tous autorisés. */
const ALLOWED_ORIGINS = [
  'https://www.ebi.ac.uk',
  'https://europepmc.org',
  'https://www.ncbi.nlm.nih.gov',
  'https://pubmed.ncbi.nlm.nih.gov',
  'https://www.who.int',
  'https://www.nice.org.uk',
  'https://www.cochrane.org',
  'https://www.figo.org',
  'https://www.has-sante.fr',
  'https://www.cochranelibrary.com',
].map((u) => new URL(u).origin);

const DEFAULT_MIN_DELAY_MS = 1000;
const DEFAULT_CACHE_DIR = path.join(__dirname, '.cache');
const DEFAULT_AUDIT_LOG = path.join(__dirname, '.crawler-audit.log');
const ROBOTS_CACHE_MS = 3600 * 1000; // 1h
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

/**
 * @typedef {Object} CrawlerOptions
 * @property {string} [cacheDir] - Dossier cache (désactivé si falsy)
 * @property {number} [cacheMaxAgeMs] - Âge max du cache (défaut 24h)
 * @property {string} [auditLogPath] - Fichier de log des requêtes
 * @property {number} [minDelayMs] - Délai minimum entre deux requêtes (par domaine)
 * @property {boolean} [respectRobots=true] - Vérifier robots.txt avant fetch
 * @property {number} [requestTimeoutMs] - Timeout par requête (défaut 30000)
 * @property {boolean} [allowedOriginsOnly=true] - N'autoriser que les domaines institutionnels listés
 */

/**
 * Parse simple de robots.txt : cherche Disallow pour notre User-Agent ou *.
 * Retourne true si l'URL est autorisée, false si interdite.
 */
function isAllowedByRobots(robotsTxt, url) {
  if (!robotsTxt || typeof robotsTxt !== 'string') return true;
  const u = new URL(url);
  const pathname = u.pathname || '/';
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.trim());
  let currentUserAgent = null;
  const disallowPaths = [];

  for (const line of lines) {
    const [key, ...rest] = line.split(':').map((s) => s.trim());
    const value = rest.join(':').trim();
    if (!key) continue;
    const k = key.toLowerCase();
    if (k === 'user-agent') {
      currentUserAgent = value;
    } else if (k === 'disallow' && currentUserAgent !== null) {
      if (currentUserAgent === '*' || currentUserAgent.includes('ObstetricAI') || currentUserAgent.includes('EthicalCrawler')) {
        if (value) disallowPaths.push(value);
      }
    }
  }

  for (const disallow of disallowPaths) {
    if (disallow === '/') return false;
    if (pathname === disallow || pathname.startsWith(disallow.replace(/\*$/, ''))) return false;
  }
  return true;
}

/**
 * Récupère robots.txt pour l'origine d'une URL et vérifie si l'URL est autorisée.
 */
async function checkRobots(allowedOrigin, url, fetchFn) {
  try {
    const u = new URL(url);
    const origin = u.origin;
    const robotsUrl = `${origin}/robots.txt`;
    const res = await fetchFn(robotsUrl, { method: 'GET', headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return true; // pas de robots.txt => on autorise
    const text = await res.text();
    return isAllowedByRobots(text, url);
  } catch {
    return true;
  }
}

/**
 * Crée l'agent crawler éthique.
 * @param {CrawlerOptions} [options]
 * @returns {{ fetch: (url: string, init?: RequestInit) => Promise<Response>, getDomain: (url: string) => string }}
 */
function createEthicalCrawler(options = {}) {
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const cacheMaxAgeMs = options.cacheMaxAgeMs ?? 24 * 3600 * 1000;
  const auditLogPath = options.auditLogPath ?? DEFAULT_AUDIT_LOG;
  const minDelayMs = options.minDelayMs ?? DEFAULT_MIN_DELAY_MS;
  const respectRobots = options.respectRobots !== false;
  const requestTimeoutMs = options.requestTimeoutMs ?? 30000;
  const allowedOriginsOnly = options.allowedOriginsOnly !== false;

  const lastRequestByOrigin = new Map();
  const robotsCache = new Map(); // origin -> { txt, at }

  function getOrigin(url) {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  }

  function logAudit(msg) {
    if (!auditLogPath) return;
    try {
      const line = `[${new Date().toISOString()}] ${msg}\n`;
      fs.appendFileSync(auditLogPath, line, 'utf-8');
    } catch (e) {
      console.warn('Crawler audit log failed:', e.message);
    }
  }

  function cachePath(url) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
    return path.join(cacheDir, `${hash}.json`);
  }

  function readCache(url) {
    if (!cacheDir) return null;
    try {
      const p = cachePath(url);
      const raw = fs.readFileSync(p, 'utf-8');
      const data = JSON.parse(raw);
      if (Date.now() - (data.at || 0) > cacheMaxAgeMs) return null;
      logAudit(`CACHE_HIT ${url}`);
      return data.body;
    } catch {
      return null;
    }
  }

  function writeCache(url, body) {
    if (!cacheDir) return;
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      const p = cachePath(url);
      fs.writeFileSync(p, JSON.stringify({ at: Date.now(), body }), 'utf-8');
    } catch (e) {
      console.warn('Crawler cache write failed:', e.message);
    }
  }

  async function delayForOrigin(origin) {
    const last = lastRequestByOrigin.get(origin) ?? 0;
    const elapsed = Date.now() - last;
    if (elapsed < minDelayMs) {
      await new Promise((r) => setTimeout(r, minDelayMs - elapsed));
    }
    lastRequestByOrigin.set(origin, Date.now());
  }

  async function fetchRobotsTxt(origin) {
    const cached = robotsCache.get(origin);
    if (cached && Date.now() - cached.at < ROBOTS_CACHE_MS) return cached.txt;
    const robotsUrl = `${origin}/robots.txt`;
    const res = await global.fetch(robotsUrl, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    const txt = res.ok ? await res.text() : '';
    robotsCache.set(origin, { txt, at: Date.now() });
    return txt;
  }

  /**
   * Fetch éthique : rate limit, User-Agent, cache, retry, optional robots.txt.
   * Pour GET, le corps de la réponse est mis en cache (texte uniquement).
   * @param {string} url
   * @param {RequestInit} [init]
   * @returns {Promise<Response>}
   */
  async function ethicalFetch(url, init = {}) {
    const origin = getOrigin(url);
    const method = (init.method || 'GET').toUpperCase();

    const doRequest = async (attempt = 0) => {
      await delayForOrigin(origin);

      const headers = new Headers(init.headers);
      if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
      const signal = init.signal || controller.signal;

      try {
        const res = await fetch(url, { ...init, headers, signal });
        clearTimeout(timeoutId);

        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          if (attempt < MAX_RETRIES) {
            const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
            logAudit(`RETRY ${res.status} ${url} in ${backoff}ms`);
            await new Promise((r) => setTimeout(r, backoff));
            return doRequest(attempt + 1);
          }
        }

        logAudit(`${res.status} ${method} ${url}`);
        return res;
      } catch (e) {
        clearTimeout(timeoutId);
        if (attempt < MAX_RETRIES && (e.name === 'AbortError' || e.code === 'ECONNRESET')) {
          const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
          logAudit(`RETRY ERROR ${url} ${e.message} in ${backoff}ms`);
          await new Promise((r) => setTimeout(r, backoff));
          return doRequest(attempt + 1);
        }
        throw e;
      }
    };

    if (allowedOriginsOnly && ALLOWED_ORIGINS.length) {
      if (!ALLOWED_ORIGINS.includes(origin)) {
        logAudit(`ORIGIN_DISALLOW ${url} (origin ${origin} not in allowed list)`);
        throw new Error(`Crawler policy: origin ${origin} is not in the allowed institutional list`);
      }
    }

    if (respectRobots && method === 'GET') {
      const robotsTxt = await fetchRobotsTxt(origin);
      if (!isAllowedByRobots(robotsTxt, url)) {
        logAudit(`ROBOTS_DISALLOW ${url}`);
        throw new Error(`Crawler policy: ${url} disallowed by robots.txt`);
      }
    }

    if (method === 'GET' && cacheDir) {
      const cached = readCache(url);
      if (cached !== null) {
        return new Response(cached, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Crawler-Cache': 'HIT' },
        });
      }
    }

    const res = await doRequest();
    if (method === 'GET' && cacheDir && res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        const clone = res.clone();
        try {
          const body = await clone.text();
          writeCache(url, body);
        } catch {
          // ignore
        }
      }
    }
    return res;
  }

  return {
    fetch: ethicalFetch,
    getDomain: (url) => getOrigin(url),
    USER_AGENT,
  };
}

module.exports = {
  createEthicalCrawler,
  USER_AGENT,
  isAllowedByRobots,
  ALLOWED_ORIGINS,
};
