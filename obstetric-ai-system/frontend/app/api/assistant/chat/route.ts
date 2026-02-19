import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredDemoResponse } from '@/lib/assistant-demo-engine';
import type { StructuredAIResponse } from '@/lib/assistant-types';
import { CLINICAL_REFERENCES } from '@/lib/citations';
import { getEnrichedPatientContext } from '@/lib/patient-context';
import { getKnowledgeChunksForQuery } from '@/lib/knowledge-retrieval';
import type { KnowledgeChunk } from '@/lib/knowledge-types';

const SYSTEM_PROMPT_BASE = `Tu es l'assistant Obstetric AI pour médecins et équipes. Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après, selon le schéma suivant :
{
  "summary": "1-2 phrases de synthèse",
  "narrative": "Narratif technique détaillé en français, langage clinique, avec références (auteur, année) pour chaque affirmation",
  "metrics": [{"name": "string", "value": "string", "threshold": "string (optionnel)", "status": "normal|warning|critical (optionnel)"}],
  "recommendations": [{"action": "string", "level": "string (ex: I-A, II-B)"}],
  "references": [{"id": "string", "authors": "string", "year": number, "title": "string", "journal": "string (optionnel)", "type": "guideline|journal|book|online|model"}],
  "patientContext": [{"field": "string", "value": "string"}],
  "triangulation": [{"parameter": "string", "agentCtg": "string", "agentApgar": "string", "fhir": "string", "guidelines": "string", "convergence": "convergent|divergent|contradictory"}]
}
Style Harvard Cite It Right. Chaque référence doit être exportable EndNote (.ris).`;

const SYSTEM_PROMPT_PATIENT = `${SYSTEM_PROMPT_BASE}

RÈGLE (question sur une patiente) : Réponds UNIQUEMENT à partir des données patient fournies et des extraits de la base de connaissances fournis. N'invente aucune donnée patient. Cite les extraits (auteur, année) pour chaque affirmation clinique.`;

const SYSTEM_PROMPT_GENERAL = `${SYSTEM_PROMPT_BASE}

RÈGLE (question générale obstétrique / néonatal / maternelle) : Réponds à partir des extraits de la base de connaissances fournis. Narration technique, médicalement fondée. Ne cite que des sources fournies dans les extraits.`;

function mapToHarvardCitation(r: { id?: string; authors?: string; year?: number; title?: string; journal?: string; type?: string }): (typeof CLINICAL_REFERENCES)[0] | null {
  const id = (r.id || 'custom').toString();
  const known = CLINICAL_REFERENCES.find((c) => c.id === id);
  if (known) return known;
  if (r.authors && r.year && r.title)
    return {
      id,
      authors: r.authors,
      year: Number(r.year),
      title: r.title,
      journal: r.journal,
      type: (r.type as 'guideline') || 'guideline',
    };
  return null;
}

function chunkToCitation(c: KnowledgeChunk): (typeof CLINICAL_REFERENCES)[0] {
  const known = c.source_id ? CLINICAL_REFERENCES.find((r) => r.id === c.source_id) : null;
  if (known) return known;
  return {
    id: c.id,
    authors: c.authors || c.source,
    year: c.year ?? new Date().getFullYear(),
    title: c.title || c.chunk_text.slice(0, 100),
    journal: (c.metadata as { journal?: string })?.journal,
    type: ((c.metadata as { type?: string })?.type as 'journal') || 'journal',
  };
}

function retrieveKnowledgeChunks(query: string): KnowledgeChunk[] {
  return getKnowledgeChunksForQuery(query, 10);
}

function isPatientQuestion(message: string, hasPatientContext: boolean): boolean {
  if (!hasPatientContext) return false;
  const t = message.toLowerCase();
  return (
    /\b(patiente?|dossier|suivi|elle|sa\s+situation|son\s+état|risque|ctg|apgar|bishop|consultation)\b/.test(t) ||
    /\b(quelle|comment|quoi|résumé|bilan)\b.*\b(patiente?|dossier)\b/.test(t)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, patientId, patientContext, files = [], history = [] } = body as {
      message: string;
      patientId?: string;
      patientContext?: { id: string; nom: string; prenom: string; sa: number; risque: string };
      files?: { name: string; content: string; type: string }[];
      history?: { role: string; content: string }[];
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const useClaude = apiKey && apiKey !== 'sk-dummy' && apiKey.length > 10;

    const enrichedPatient = getEnrichedPatientContext(patientContext, patientId);
    const hasPatientContext = Boolean(enrichedPatient);
    const isPatient = isPatientQuestion(message, hasPatientContext);

    const kbChunks = retrieveKnowledgeChunks(message);

    const kbBlock =
      kbChunks.length > 0
        ? `Base de connaissances (extraits pertinents) :\n${kbChunks
            .map(
              (c) =>
                `[${c.title || c.source}] (${c.authors || c.source}, ${c.year ?? 'n.d.'}):\n${c.chunk_text}`
            )
            .join('\n\n---\n\n')}`
        : '';

    const patientBlock = enrichedPatient
      ? `Données patient (à utiliser comme seule source pour les affirmations sur cette patiente) :\n${enrichedPatient}`
      : '';

    const ragFiles =
      files.length > 0
        ? `\n\nDocuments fournis par l'utilisateur :\n${files
            .map((f: { name: string; content: string }) => `[${f.name}]\n${(f.content || '').slice(0, 3000)}`)
            .join('\n\n')}`
        : '';

    const userContent = [kbBlock, patientBlock].filter(Boolean).join('\n\n') + ragFiles + `\n\nQuestion : ${message}`;

    if (useClaude) {
      try {
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey });
        const systemPrompt = isPatient ? SYSTEM_PROMPT_PATIENT : SYSTEM_PROMPT_GENERAL;
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        });
        const textBlock = response.content?.find((b: { type: string }) => b.type === 'text');
        const text = textBlock && 'text' in textBlock ? (textBlock as { text: string }).text : '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          const refs: (typeof CLINICAL_REFERENCES)[number][] = Array.isArray(parsed.references)
            ? (parsed.references as Record<string, unknown>[])
                .map((r) => mapToHarvardCitation(r as Parameters<typeof mapToHarvardCitation>[0]))
                .filter((c): c is NonNullable<typeof c> => Boolean(c))
            : [];
          const fromChunks =
            refs.length === 0 && kbChunks.length > 0
              ? kbChunks.slice(0, 5).map((c) => chunkToCitation(c))
              : [];
          const result: StructuredAIResponse = {
            summary: String(parsed.summary ?? ''),
            narrative: String(parsed.narrative ?? ''),
            metrics: Array.isArray(parsed.metrics) ? (parsed.metrics as StructuredAIResponse['metrics']) : undefined,
            recommendations: Array.isArray(parsed.recommendations)
              ? (parsed.recommendations as StructuredAIResponse['recommendations'])
              : undefined,
            references: refs.length > 0 ? refs : fromChunks.length > 0 ? fromChunks : CLINICAL_REFERENCES.slice(0, 3),
            patientContext: Array.isArray(parsed.patientContext)
              ? (parsed.patientContext as StructuredAIResponse['patientContext'])
              : undefined,
            triangulation: Array.isArray(parsed.triangulation)
              ? (parsed.triangulation as StructuredAIResponse['triangulation'])
              : undefined,
          };
          return NextResponse.json(result);
        }
      } catch (claudeError) {
        console.warn('Claude API error, using demo:', claudeError);
      }
    }

    const patient = patientContext || (patientId ? { id: patientId, nom: '', prenom: '', sa: 38, risque: 'bas' } : undefined);
    const demo = generateStructuredDemoResponse(message, patient);
    return NextResponse.json(demo);
  } catch (err) {
    console.error('Assistant chat error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
