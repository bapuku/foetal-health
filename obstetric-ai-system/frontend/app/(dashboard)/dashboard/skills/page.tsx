'use client';

import { useState, useEffect } from 'react';
import SkillCard, { type SkillItem } from '@/components/registry/SkillCard';
import PageBanner from '@/components/ui/PageBanner';

const SKILLS_ACTIVE_STORAGE_KEY = 'obstetric-skills-active';

interface AgentSkills {
  name: string;
  port: number;
  endpoint?: string;
  skills: SkillItem[];
  /** Payload envoyé au clic "Tester" (sinon { demo: true }) */
  demoPayload?: Record<string, unknown>;
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
  {
    name: 'Prenatal Follow-up',
    port: 8010,
    endpoint: '/api/prenatal-followup/evaluate',
    demoPayload: {
      dossier: { patientId: 'P-2024-0847', calendar: { items: [] }, consultations: [], biologicalExams: [] },
      sa_courante: 28,
    },
    skills: [
      { name: 'Evaluation calendrier CSP', description: 'Conformite 7 consultations + EPP + 3 echos (CSP R2122-1/R2122-2).', inputs: 'dossier, sa', outputs: 'conforme, alertes, narrative, audit_hash', model: 'Opus 4.5 / Sonnet 4.5', latencyMs: 2000 },
      { name: 'Depistage T21 3 paliers', description: 'HAS 2017 : risque combine, DPNI, caryotype.', inputs: 'risque_combine', outputs: 'palier, indication_dpni, recommandation', latencyMs: 100 },
      { name: 'Depistage DG IADPSG', description: 'HGPO 75 g, criteres CNGOF/SFD 2010.', inputs: 'h0, h1, h2', outputs: 'diagnostic_dg, anomalies', latencyMs: 100 },
      { name: 'Depistage SGB', description: 'Streptocoque B 34-38 SA, antibioprophylaxie.', inputs: 'sa_prelevement, resultat', outputs: 'antibioprophylaxie_prevue', latencyMs: 100 },
      { name: 'Normes biologiques', description: 'Hb, plaquettes, ferritine, TSH, PA, BCF par trimestre.', inputs: 'sa', outputs: 'normes T1/T2/T3', latencyMs: 50 },
      { name: 'Rapport medico-diagnostique', description: 'Rapport structure par consultation (LLM + audit).', inputs: 'dossier, consultation, screenings', outputs: 'sections, FHIR DiagnosticReport', model: 'Opus 4.5', latencyMs: 4000 },
    ],
  },
];

export default function SkillsPage() {
  const [statuses, setStatuses] = useState<Record<number, 'up' | 'down'>>({});
  const [activeSkills, setActiveSkills] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(SKILLS_ACTIVE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const healthPaths: Record<number, string> = {
      8000: '/api/ctg-monitor/health',
      8001: '/api/apgar/health',
      8010: '/api/prenatal-followup/health',
    };
    AGENTS_SKILLS.forEach((a) => {
      const path = healthPaths[a.port] || `http://localhost:${a.port}/health`;
      const url = path.startsWith('http') ? path : path;
      fetch(url, { signal: AbortSignal.timeout(2000) })
        .then((r) => r.ok ? 'up' as const : 'down' as const)
        .catch(() => 'down' as const)
        .then((s) => setStatuses((prev) => ({ ...prev, [a.port]: s })));
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SKILLS_ACTIVE_STORAGE_KEY, JSON.stringify(activeSkills));
    } catch {
      // ignore
    }
  }, [activeSkills]);

  const handleToggleSkill = (key: string) => {
    setActiveSkills((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const skillKey = (agent: AgentSkills) => `${agent.name}-${agent.port}`;

  return (
    <div className="space-y-6">
      <PageBanner src="/images/surgical-team.png" alt="Équipe médicale" title="Registre des compétences (Skills)" subtitle="Capacités exposées par chaque agent" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registre des competences (Skills)</h1>
        <p className="text-sm text-slate-500">Capacites exposees par chaque agent. Activer/désactiver pour filtrer (état enregistré localement). Utilisées dans les workflows par agent.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Utilisation dans les workflows</p>
        <p className="mt-1">Chaque template de workflow (Suivi prénatal, CTG + Bishop, etc.) appelle des agents par ordre. Les skills listées ici correspondent aux capacités de chaque agent. L’état Activer/Désactiver est enregistré localement pour votre préférence d’affichage.</p>
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
            demoPayload={agent.demoPayload}
            active={activeSkills[skillKey(agent)] !== false}
            onToggleActive={() => handleToggleSkill(skillKey(agent))}
          />
        ))}
      </div>
    </div>
  );
}