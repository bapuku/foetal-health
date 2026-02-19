'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ActionModal from '@/components/ui/ActionModal';
import BadgeAction from '@/components/ui/BadgeAction';
import { generateAgentDemoResult, type AgentDemoResult } from '@/lib/agent-demo-results';

const NAV_ITEMS = [
  {
    label: 'Assistant IA',
    href: '/dashboard/assistant',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    label: 'Vue d\'ensemble',
    href: '/dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: 'Patients',
    href: '/dashboard/patients',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: 'Monitoring CTG',
    href: '/dashboard/ctg',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'Risques',
    href: '/dashboard/risks',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    label: 'Rapports',
    href: '/dashboard/reports',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

const REGISTRY_ITEMS = [
  {
    label: 'Outils',
    href: '/dashboard/tools',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.47-.62.282-1.017-.098-1.412M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    label: 'Skills',
    href: '/dashboard/skills',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
];

const WORKFLOW_ITEMS = [
  {
    label: 'Orchestration',
    href: '/dashboard/workflows',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
      </svg>
    ),
  },
];

const ADMIN_ITEMS = [
  {
    label: 'Administration',
    href: '/dashboard/admin',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const AGENTS = [
  { name: 'CTG Monitor', port: 8000, desc: 'Classification FIGO CTG temps reel. Alertes HITL pour cas pathologiques.', endpoint: '/api/ctg-monitor' },
  { name: 'Apgar', port: 8001, desc: 'Score Apgar 1/5 min. Escalade HITL si Apgar ≤ 6.', endpoint: '/api/apgar-transition' },
  { name: 'Symbolic', port: 8002, desc: 'Verification conformite HAS, FIGO, CNGOF. Detection deviations.', endpoint: '/api/symbolic-reasoning' },
  { name: 'Polygraph', port: 8003, desc: 'Cross-verification des narratifs LLM. Score confiance anti-hallucination.', endpoint: '/api/polygraph' },
  { name: 'Bishop', port: 8004, desc: 'Calcul score Bishop, partogramme, phase de travail.', endpoint: '/api/bishop-partogram' },
  { name: 'RCIU', port: 8005, desc: 'Risque restriction croissance intra-uterine. Percentiles et Doppler.', endpoint: '/api/rciu-risk' },
  { name: 'Quantum', port: 8006, desc: 'Optimisation timing naissance. Probabilite de succes.', endpoint: '/api/quantum-optimizer' },
  { name: 'Mom-Baby', port: 8007, desc: 'Correlation risques mere-bebe. Analyse multi-agents.', endpoint: '/api/mother-baby-risk' },
  { name: 'Narrative', port: 8008, desc: 'Generation rapport clinique structure Harvard + triangulation.', endpoint: '/api/clinical-narrative' },
  { name: 'Engagement', port: 8009, desc: 'Communication et education patiente. Messages personnalises.', endpoint: '/api/user-engagement' },
];

type AgentInfo = typeof AGENTS[number];
type AgentStatus = 'up' | 'down' | 'loading' | 'demo';
interface AgentLiveStatus { status: AgentStatus; latencyMs?: number; demoResult?: AgentDemoResult }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [systemHealthModalOpen, setSystemHealthModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [agentLive, setAgentLive] = useState<AgentLiveStatus>({ status: 'loading' });
  const [demoMode, setDemoMode] = useState(true);
  const [sidebarStatuses, setSidebarStatuses] = useState<Record<number, AgentStatus>>(
    Object.fromEntries(AGENTS.map((a) => [a.port, 'loading']))
  );

  useEffect(() => {
    let cancelled = false;
    const t0 = Date.now();
    fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(2000) })
      .then((r) => {
        if (cancelled) return;
        if (r.ok) setDemoMode(false);
      })
      .catch(() => {
        if (!cancelled) setDemoMode(true);
      });
    return () => { cancelled = true; };
  }, []);

  const refreshSidebarStatuses = () => {
    if (demoMode) {
      setSidebarStatuses(Object.fromEntries(AGENTS.map((a) => [a.port, 'demo'])));
      return;
    }
    AGENTS.forEach((agent) => {
      const t0 = Date.now();
      fetch(`http://localhost:${agent.port}/health`, { signal: AbortSignal.timeout(3000) })
        .then((r) => r.ok ? 'up' as const : 'down' as const)
        .catch(() => 'down' as const)
        .then((s) => setSidebarStatuses((prev) => ({ ...prev, [agent.port]: s })));
    });
  };

  useEffect(() => {
    refreshSidebarStatuses();
    const interval = setInterval(refreshSidebarStatuses, 15000);
    return () => clearInterval(interval);
  }, [demoMode]);

  const openAgentModal = (agent: AgentInfo) => {
    setSelectedAgent(agent);
    const demoResult = generateAgentDemoResult(agent.name);
    if (demoMode) {
      setAgentLive({ status: 'demo', demoResult });
      return;
    }
    setAgentLive({ status: 'loading', demoResult });
    const t0 = Date.now();
    fetch(`http://localhost:${agent.port}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => setAgentLive((prev) => ({ ...prev, status: r.ok ? 'up' : 'down', latencyMs: Date.now() - t0 })))
      .catch(() => setAgentLive((prev) => ({ ...prev, status: 'down', latencyMs: Date.now() - t0 })));
  };

  const executeAgent = async (agent: AgentInfo) => {
    const fallbackResult = generateAgentDemoResult(agent.name);
    if (demoMode) {
      setAgentLive((prev) => ({ ...prev, status: 'loading' }));
      setTimeout(() => setAgentLive({ status: 'demo', latencyMs: 0, demoResult: fallbackResult }), 150);
      return;
    }
    setAgentLive((prev) => ({ ...prev, status: 'loading' }));
    const t0 = Date.now();
    try {
      const res = await fetch(`http://localhost:${agent.port}${agent.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json().catch(() => null);
      const hasStructured = data && typeof data.narrative === 'string' && Array.isArray(data.metrics);
      const demoResult = hasStructured ? (data as AgentDemoResult) : fallbackResult;
      setAgentLive({ status: res.ok ? 'up' : 'down', latencyMs: Date.now() - t0, demoResult });
    } catch {
      setAgentLive({ status: 'down', latencyMs: Date.now() - t0, demoResult: fallbackResult });
    }
  };

  const isNavActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">Obstetric AI</h1>
            <p className="text-xs text-slate-500">Sante Foetale</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isNavActive(item.href) ? 'sidebar-link-active' : 'sidebar-link'}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="my-4 border-t border-slate-200" />
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registres
          </p>
          {REGISTRY_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isNavActive(item.href) ? 'sidebar-link-active' : 'sidebar-link'}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="my-4 border-t border-slate-200" />
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workflows
          </p>
          {WORKFLOW_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isNavActive(item.href) ? 'sidebar-link-active' : 'sidebar-link'}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="my-4 border-t border-slate-200" />
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Administration
          </p>
          {ADMIN_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isNavActive(item.href) ? 'sidebar-link-active' : 'sidebar-link'}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="my-4 border-t border-slate-200" />
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Agents ({AGENTS.length})
          </p>
          <div className="space-y-1">
            {AGENTS.map((agent) => (
              <button
                key={agent.port}
                type="button"
                onClick={() => openAgentModal(agent)}
                className="sidebar-link text-xs w-full text-left"
              >
                <span className={`h-2 w-2 rounded-full ${sidebarStatuses[agent.port] === 'up' || sidebarStatuses[agent.port] === 'demo' ? 'bg-green-500' : sidebarStatuses[agent.port] === 'down' ? 'bg-red-400' : 'bg-slate-300 animate-pulse'}`} />
                {agent.name}
                <span className="ml-auto text-xs text-slate-400">:{agent.port}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-400">EU MDR Classe IIb</p>
          <p className="text-xs text-slate-400">EU AI Act - Haut risque</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 transition-all">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {NAV_ITEMS.find((i) => i.href === pathname)?.label ||
                REGISTRY_ITEMS.find((i) => i.href === pathname)?.label ||
                WORKFLOW_ITEMS.find((i) => i.href === pathname)?.label ||
                ADMIN_ITEMS.find((i) => i.href === pathname)?.label ||
                'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <BadgeAction variant="ok" onClick={() => setSystemHealthModalOpen(true)} title="Voir sante systeme">
              Systeme operationnel
            </BadgeAction>
            <Link
              href="/dashboard/assistant"
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                pathname === '/dashboard/assistant' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Ouvrir l'assistant IA"
              aria-label="Ouvrir assistant"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </Link>
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
              Dr
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>

      <ActionModal
        isOpen={systemHealthModalOpen}
        onClose={() => setSystemHealthModalOpen(false)}
        title="Sante du systeme"
        size="lg"
        actions={
          <button type="button" onClick={() => setSystemHealthModalOpen(false)} className="btn-primary">
            Fermer
          </button>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">Vue d&apos;ensemble des services et agents.</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>Frontend Next.js : actif</li>
            <li>Agents backend : verifier via la page Vue d\'ensemble</li>
            <li>FHIR : configurer FHIR_BASE_URL pour HAPI FHIR.</li>
          </ul>
        </div>
      </ActionModal>

      {/* Agent detail modal */}
      <ActionModal
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        title={selectedAgent?.name ?? ''}
        size="lg"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => selectedAgent && executeAgent(selectedAgent)} disabled={agentLive.status === 'loading'} className="btn-primary">
              {agentLive.status === 'loading' ? 'Execution...' : 'Executer (demo)'}
            </button>
            <button type="button" onClick={() => setSelectedAgent(null)} className="btn-secondary">Fermer</button>
          </div>
        }
      >
        {selectedAgent && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${agentLive.status === 'up' || agentLive.status === 'demo' ? 'bg-green-100 text-green-800' : agentLive.status === 'down' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
                <span className={`h-2 w-2 rounded-full ${agentLive.status === 'up' || agentLive.status === 'demo' ? 'bg-green-500' : agentLive.status === 'down' ? 'bg-red-500' : 'bg-slate-400 animate-pulse'}`} />
                {agentLive.status === 'up' ? 'Actif' : agentLive.status === 'demo' ? 'Actif (demo)' : agentLive.status === 'down' ? 'Inactif' : 'Verification...'}
              </span>
              {agentLive.latencyMs != null && <span className="text-xs text-slate-500">{agentLive.latencyMs} ms</span>}
              <span className="text-xs text-slate-400">Port {selectedAgent.port}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-800">Description fonctionnelle</p>
              <p className="mt-1 text-slate-600">{selectedAgent.desc}</p>
              <p className="mt-2 text-xs text-slate-400">Endpoint : POST {selectedAgent.endpoint}</p>
            </div>
            {agentLive.demoResult && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 border-b border-slate-100 pb-2">Rapport d&apos;analyse (mode démo — affiché même si les services backend sont inactifs)</p>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Résumé diagnostique</p>
                  <p className="text-slate-700">{agentLive.demoResult.summary}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Narratif clinique</p>
                  <p className="text-slate-700">{agentLive.demoResult.narrative}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Métriques</p>
                  <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="px-3 py-2 font-medium text-slate-700">Métrique</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Valeur</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Seuil</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentLive.demoResult.metrics.map((m, i) => (
                        <tr key={i} className="border-t border-slate-200">
                          <td className="px-3 py-2 text-slate-800">{m.name}</td>
                          <td className="px-3 py-2 text-slate-700">{m.value}</td>
                          <td className="px-3 py-2 text-slate-600">{m.threshold}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'normal' ? 'bg-green-100 text-green-800' : m.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {agentLive.demoResult.patientData?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Données patient (démo)</p>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {agentLive.demoResult.patientData.map((p, i) => (
                        <li key={i}><span className="font-medium text-slate-600">{p.field}:</span> {p.value}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {agentLive.demoResult.references?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sources scientifiques (Harvard)</p>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {agentLive.demoResult.references.map((ref, i) => (
                        <li key={i} className="border-l-2 border-slate-200 pl-2">{ref.harvard}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ActionModal>
    </div>
  );
}
