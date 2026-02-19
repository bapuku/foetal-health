'use client';

import { useState, useEffect } from 'react';
import SkillCard, { type SkillItem } from '@/components/registry/SkillCard';
import PageBanner from '@/components/ui/PageBanner';

interface AgentSkills {
  name: string;
  port: number;
  endpoint?: string;
  skills: SkillItem[];
}

const AGENTS_SKILLS: AgentSkills[] = [
  {
    name: 'CTG Monitor',
    port: 8000,
    endpoint: '/api/ctg-monitor',
    skills: [
      { name: 'Analyse FIGO', description: 'Classification Normal/Suspect/Pathologique selon FIGO 2015.', inputs: 'FHR, STV, decelerations', outputs: 'classification, narrative, FHIR Observation', model: 'Claude Sonnet + CNN', latencyMs: 1500 },
      { name: 'Detection decelerations', description: 'Decelerations legeres et severes.', inputs: 'signal_60s', outputs: 'counts' },
      { name: 'Generation narrative', description: 'Narratif clinique pour le dossier.', model: 'Claude', latencyMs: 1200 },
    ],
  },
  {
    name: 'Apgar Transition',
    port: 8001,
    endpoint: '/api/apgar-transition',
    skills: [
      { name: 'Scoring Apgar', description: 'Score 0-10 a 1 et 5 min.', inputs: 'apgar_1min, apgar_5min, signes vitaux', outputs: 'narrative, risk_apgar_low, FHIR Observation', model: 'Claude Sonnet', latencyMs: 1000 },
      { name: 'Evaluation neonatale', description: 'Adaptation et transition neonatale.', outputs: 'HITL si Apgar 5min ≤ 6' },
    ],
  },
  {
    name: 'Symbolic Reasoning',
    port: 8002,
    endpoint: '/api/symbolic-reasoning',
    skills: [
      { name: 'Verification conformite', description: 'HAS 2022, FIGO 2015, CNGOF.', inputs: 'FHIR Bundle (outputs agents)', outputs: 'conformant, deviations, FHIR DetectedIssue', model: 'Claude Opus', latencyMs: 5000 },
      { name: 'Detection deviations', description: 'Ecarts aux recommandations.', outputs: 'narrative, count' },
    ],
  },
  {
    name: 'Polygraph Verifier',
    port: 8003,
    endpoint: '/api/polygraph',
    skills: [
      { name: 'Cross-verification', description: 'Verification croisee des narratifs LLM.', inputs: 'agent_narratives', outputs: 'confidence_score, hallucination_risk', model: 'Claude Research', latencyMs: 2000 },
      { name: 'Score confiance', description: 'Score de coherence entre agents.', outputs: 'FHIR Observation' },
    ],
  },
  {
    name: 'Bishop Partogram',
    port: 8004,
    endpoint: '/api/bishop-partogram',
    skills: [
      { name: 'Score Bishop', description: 'Calcul score Bishop (dilatation, effacement, etc.).', inputs: 'examen clinique', outputs: 'bishop_score, phase (latent/active)' },
      { name: 'Partogramme', description: 'Suivi courbe de travail.', outputs: 'visualisation' },
    ],
  },
  {
    name: 'RCIU Risk',
    port: 8005,
    endpoint: '/api/rciu-risk',
    skills: [
      { name: 'Evaluation percentiles', description: 'Risque restriction croissance intra-uterine.', inputs: 'biometrie, Doppler', outputs: 'risk_pct, narrative' },
      { name: 'Doppler / Biometrie', description: 'Integration donnees echographiques.', outputs: 'IC95%' },
    ],
  },
  {
    name: 'Quantum Optimizer',
    port: 8006,
    endpoint: '/api/quantum-optimizer',
    skills: [
      { name: 'Optimisation timing', description: 'Optimisation timing naissance.', inputs: 'bundle agents', outputs: 'optimal_hours, probability_success, narrative' },
    ],
  },
  {
    name: 'Mother-Baby Risk',
    port: 8007,
    endpoint: '/api/mother-baby-risk',
    skills: [
      { name: 'Correlation risques', description: 'Correlation risques mere-bebe.', inputs: 'outputs multi-agents', outputs: 'correlation, combined_risk, narrative' },
    ],
  },
  {
    name: 'Clinical Narrative',
    port: 8008,
    endpoint: '/api/clinical-narrative',
    skills: [
      { name: 'Rapport clinique', description: 'Generation rapport clinique structure (Harvard, triangulation).', inputs: 'FHIR Bundle', outputs: 'FHIR Composition, narrative' },
    ],
  },
  {
    name: 'User Engagement',
    port: 8009,
    endpoint: '/api/user-engagement',
    skills: [
      { name: 'Communication patiente', description: 'Messages et education patiente.', inputs: 'contexte', outputs: 'messages, satisfaction_score' },
    ],
  },
];

export default function SkillsPage() {
  const [statuses, setStatuses] = useState<Record<number, 'up' | 'down'>>({});

  useEffect(() => {
    AGENTS_SKILLS.forEach((a) => {
      fetch(`http://localhost:${a.port}/health`, { signal: AbortSignal.timeout(2000) })
        .then((r) => r.ok ? 'up' as const : 'down' as const)
        .catch(() => 'down' as const)
        .then((s) => setStatuses((prev) => ({ ...prev, [a.port]: s })));
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageBanner src="/images/surgical-team.png" alt="Équipe médicale" title="Registre des compétences (Skills)" subtitle="Capacités exposées par chaque agent" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registre des competences (Skills)</h1>
        <p className="text-sm text-slate-500">Capacites exposees par chaque agent.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS_SKILLS.map((agent) => (
          <SkillCard
            key={agent.port}
            agentName={agent.name}
            port={agent.port}
            status={statuses[agent.port] ?? 'down'}
            skills={agent.skills}
            endpoint={agent.endpoint}
          />
        ))}
      </div>
    </div>
  );
}