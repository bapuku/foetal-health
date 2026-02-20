'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ActionModal from '@/components/ui/ActionModal';
import PageBanner from '@/components/ui/PageBanner';
import { generateAgentDemoResult, type AgentDemoResult } from '@/lib/agent-demo-results';

const AGENTS = [
  { name: 'CTG Monitor', port: 8000, desc: 'Classification FIGO temps reel', endpoint: '/api/ctg-monitor' },
  { name: 'Apgar Transition', port: 8001, desc: 'Score Apgar et adaptation neonatale', endpoint: '/api/apgar-transition' },
  { name: 'Symbolic Reasoning', port: 8002, desc: 'Conformite HAS/FIGO/CNGOF', endpoint: '/api/symbolic-reasoning' },
  { name: 'Polygraph Verifier', port: 8003, desc: 'Detection hallucinations LLM', endpoint: '/api/polygraph' },
  { name: 'Bishop Partogram', port: 8004, desc: 'Score Bishop et partogramme', endpoint: '/api/bishop-partogram' },
  { name: 'RCIU Risk', port: 8005, desc: 'Risque de restriction de croissance', endpoint: '/api/rciu-risk' },
  { name: 'Quantum Optimizer', port: 8006, desc: 'Optimisation timing naissance', endpoint: '/api/quantum-optimizer' },
  { name: 'Mother-Baby Risk', port: 8007, desc: 'Correlation risques mere-bebe', endpoint: '/api/mother-baby-risk' },
  { name: 'Clinical Narrative', port: 8008, desc: 'Generation rapport clinique', endpoint: '/api/clinical-narrative' },
  { name: 'User Engagement', port: 8009, desc: 'Communication patiente', endpoint: '/api/user-engagement' },
];

type AgentStatus = { name: string; port: number; desc: string; endpoint: string; status: 'up' | 'down' | 'loading' };

type HitlAlert = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

const INITIAL_HITL_ALERTS: HitlAlert[] = [
  { id: 'hitl-ctg-0831', title: 'CTG Pathologique', detail: 'Patiente #P-2024-0831', time: '14:15' },
  { id: 'hitl-apgar-0309', title: 'Apgar 5 min ≤ 6', detail: 'Naissance #N-0309', time: '13:02' },
  { id: 'hitl-has-0841', title: 'Déviation HAS', detail: 'Patiente #P-2024-0841', time: '12:45' },
];

export default function DashboardOverview() {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(
    AGENTS.map((a) => ({ ...a, status: 'loading' as const }))
  );
  const [hitlModalOpen, setHitlModalOpen] = useState(false);
  const [hitlAlerts, setHitlAlerts] = useState<HitlAlert[]>(INITIAL_HITL_ALERTS);
  const [hitlSelected, setHitlSelected] = useState<HitlAlert | null>(null);
  const [hitlComment, setHitlComment] = useState('');
  const [hitlActionMsg, setHitlActionMsg] = useState<string | null>(null);
  const [agentModal, setAgentModal] = useState<AgentStatus | null>(null);
  const [agentDemoResult, setAgentDemoResult] = useState<AgentDemoResult | null>(null);
  const [agentDemoLoading, setAgentDemoLoading] = useState(false);

  useEffect(() => {
    AGENTS.forEach((agent, idx) => {
      fetch(`http://localhost:${agent.port}/health`, { signal: AbortSignal.timeout(3000) })
        .then((r) => r.ok ? 'up' as const : 'down' as const)
        .catch(() => 'down' as const)
        .then((status) => {
          setAgentStatuses((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], status };
            return next;
          });
        });
    });
  }, []);

  const upCount = agentStatuses.filter((a) => a.status === 'up').length;
  const downCount = agentStatuses.filter((a) => a.status === 'down').length;

  const approveAllHitl = () => {
    setHitlAlerts([]);
    setHitlSelected(null);
    setHitlComment('');
    setHitlActionMsg('Toutes les alertes HITL ont été approuvées.');
  };

  const rejectAllHitl = () => {
    setHitlAlerts([]);
    setHitlSelected(null);
    setHitlComment('');
    setHitlActionMsg('Toutes les alertes HITL ont été rejetées.');
  };

  const approveOneHitl = (id: string) => {
    setHitlAlerts((prev) => prev.filter((a) => a.id !== id));
    setHitlSelected(null);
    setHitlComment('');
    setHitlActionMsg('Alerte approuvée.');
  };

  const rejectOneHitl = (id: string) => {
    setHitlAlerts((prev) => prev.filter((a) => a.id !== id));
    setHitlSelected(null);
    setHitlComment('');
    setHitlActionMsg('Alerte rejetée.');
  };

  const recentActivity = [
    { time: '14:32', event: 'Analyse CTG patiente #P-2024-0847', type: 'ctg', result: 'Normal' },
    { time: '14:28', event: 'Score Apgar evalue - Naissance #N-0312', type: 'apgar', result: 'Apgar 9/10' },
    { time: '14:15', event: 'Alerte RCIU detectee - Patiente #P-2024-0831', type: 'alert', result: 'HITL requis' },
    { time: '13:58', event: 'Rapport clinique genere - Patiente #P-2024-0845', type: 'narrative', result: 'Complet' },
    { time: '13:42', event: 'Verification Polygraph - 3 narratifs valides', type: 'polygraph', result: 'Confiance 97%' },
    { time: '13:30', event: 'Bishop score calcule - Patiente #P-2024-0839', type: 'bishop', result: 'Score 7/13' },
  ];

  return (
    <div className="space-y-8">
      <PageBanner
        src="/images/prenatal-consultation.png"
        alt="Consultation prénatale"
        title="Vue d'ensemble"
        subtitle="Surveillance foeto-maternelle et état des agents"
      />
      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Patientes suivies</p>
            <div className="rounded-lg bg-blue-100 p-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">24</p>
          <p className="mt-1 text-xs text-green-600 font-medium">+3 aujourd&apos;hui</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Analyses CTG</p>
            <div className="rounded-lg bg-indigo-100 p-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">147</p>
          <p className="mt-1 text-xs text-slate-500">ce mois</p>
        </div>

        <div className="card cursor-pointer transition-colors hover:shadow-md" onClick={() => setHitlModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setHitlModalOpen(true)}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Alertes HITL</p>
            <div className="rounded-lg bg-amber-100 p-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-600">{hitlAlerts.length}</p>
          <p className="mt-1 text-xs text-amber-600 font-medium">{hitlAlerts.length > 0 ? 'en attente validation (cliquer)' : 'aucune alerte en attente'}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Agents actifs</p>
            <div className="rounded-lg bg-green-100 p-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{upCount}<span className="text-lg text-slate-400">/{AGENTS.length}</span></p>
          {downCount > 0 && <p className="mt-1 text-xs text-red-600 font-medium">{downCount} hors ligne</p>}
          {downCount === 0 && upCount === AGENTS.length && <p className="mt-1 text-xs text-green-600 font-medium">Tous operationnels</p>}
          {agentStatuses.some((a) => a.status === 'loading') && <p className="mt-1 text-xs text-slate-400">Verification...</p>}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Agents Status */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Statut des 10 agents</h3>
              <span className="text-xs text-slate-400">Temps reel</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {agentStatuses.map((agent) => (
                <button
                  key={agent.port}
                  type="button"
                  onClick={() => { setAgentModal(agent); setAgentDemoResult(null); }}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      agent.status === 'up'
                        ? 'bg-green-400'
                        : agent.status === 'down'
                        ? 'bg-red-400'
                        : 'animate-pulse bg-slate-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{agent.name}</p>
                    <p className="text-xs text-slate-400 truncate">{agent.desc}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 shrink-0">:{agent.port}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Activite recente</h3>
          </div>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 flex flex-col items-center">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.type === 'alert' ? 'bg-amber-400' : item.type === 'ctg' ? 'bg-blue-400' : 'bg-green-400'
                    }`}
                  />
                  {i < recentActivity.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-slate-700">{item.event}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-400">{item.time}</span>
                    <span
                      className={
                        item.type === 'alert'
                          ? 'badge-warn'
                          : item.result.includes('Normal') || item.result.includes('Complet') || item.result.includes('Confiance')
                          ? 'badge-ok'
                          : 'badge-info'
                      }
                    >
                      {item.result}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Actions rapides</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/ctg"
            className="flex items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="rounded-lg bg-blue-100 p-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Nouvelle analyse CTG</p>
              <p className="text-xs text-slate-400">Lancer un monitoring</p>
            </div>
          </Link>

          <Link
            href="/dashboard/risks"
            className="flex items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50"
          >
            <div className="rounded-lg bg-amber-100 p-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Evaluer Apgar</p>
              <p className="text-xs text-slate-400">Score postnatal</p>
            </div>
          </Link>

          <Link
            href="/dashboard/patients"
            className="flex items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 p-4 transition-colors hover:border-green-300 hover:bg-green-50"
          >
            <div className="rounded-lg bg-green-100 p-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Ajouter patiente</p>
              <p className="text-xs text-slate-400">Nouveau dossier FHIR</p>
            </div>
          </Link>

          <Link
            href="/dashboard/workflows"
            className="flex items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <div className="rounded-lg bg-indigo-100 p-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Orchestration</p>
              <p className="text-xs text-slate-400">Dynamique des workflows</p>
            </div>
          </Link>
        </div>
      </div>

      <ActionModal
        isOpen={hitlModalOpen}
        onClose={() => {
          setHitlModalOpen(false);
          setHitlActionMsg(null);
        }}
        title="Validation HITL - Alertes en attente"
        size="lg"
        actions={
          <>
            <button type="button" onClick={() => setHitlModalOpen(false)} className="btn-secondary">Fermer</button>
            <button
              type="button"
              onClick={approveAllHitl}
              disabled={hitlAlerts.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              Approuver tout
            </button>
            <button
              type="button"
              onClick={rejectAllHitl}
              disabled={hitlAlerts.length === 0}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
            >
              Rejeter
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          {hitlActionMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
              {hitlActionMsg}
            </div>
          )}

          <p className="text-slate-600">
            {hitlAlerts.length > 0
              ? `${hitlAlerts.length} alerte(s) en attente de validation clinicien.`
              : 'Aucune alerte HITL en attente.'}
          </p>

          {hitlAlerts.length > 0 && (
            <>
              <ul className="space-y-2">
                {hitlAlerts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => { setHitlSelected(a); setHitlComment(''); }}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                          <p className="text-xs text-slate-500">{a.detail}</p>
                        </div>
                        <span className="text-xs font-mono text-slate-400 shrink-0">{a.time}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-slate-500 text-xs">Cliquez sur une alerte pour commenter ou valider individuellement.</p>
            </>
          )}
        </div>
      </ActionModal>

      <ActionModal
        isOpen={!!hitlSelected}
        onClose={() => { setHitlSelected(null); setHitlComment(''); }}
        title={hitlSelected ? `Validation HITL — ${hitlSelected.title}` : ''}
        size="md"
        actions={
          hitlSelected ? (
            <>
              <button type="button" onClick={() => { setHitlSelected(null); setHitlComment(''); }} className="btn-secondary">
                Annuler
              </button>
              <button type="button" onClick={() => approveOneHitl(hitlSelected.id)} className="btn-primary">
                Approuver
              </button>
              <button
                type="button"
                onClick={() => rejectOneHitl(hitlSelected.id)}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
              >
                Rejeter
              </button>
            </>
          ) : null
        }
      >
        {hitlSelected && (
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <strong>Contexte :</strong> {hitlSelected.detail} ({hitlSelected.time})
            </p>
            <p>Commentaire (optionnel) :</p>
            <textarea
              className="input-field min-h-[90px]"
              placeholder="Commentaire clinique..."
              value={hitlComment}
              onChange={(e) => setHitlComment(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              (Démo UI) Le commentaire n’est pas encore persisté côté backend.
            </p>
          </div>
        )}
      </ActionModal>

      <ActionModal
        isOpen={!!agentModal}
        onClose={() => { setAgentModal(null); setAgentDemoResult(null); }}
        title={agentModal ? agentModal.name : ''}
        size="lg"
        actions={
          <>
            {agentModal && (
              <button
                type="button"
                onClick={async () => {
                  if (!agentModal) return;
                  setAgentDemoLoading(true);
                  setAgentDemoResult(null);
                  try {
                    const res = await fetch(`http://localhost:${agentModal.port}${agentModal.endpoint}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ demo: true }),
                      signal: AbortSignal.timeout(5000),
                    });
                    const data = await res.json().catch(() => null);
                    const hasStructured = data && typeof data.narrative === 'string' && Array.isArray(data.metrics);
                    setAgentDemoResult(hasStructured ? data as AgentDemoResult : generateAgentDemoResult(agentModal.name));
                  } catch {
                    setAgentDemoResult(generateAgentDemoResult(agentModal.name));
                  } finally {
                    setAgentDemoLoading(false);
                  }
                }}
                disabled={agentDemoLoading}
                className="btn-primary"
              >
                {agentDemoLoading ? 'Execution...' : 'Voir la dynamique (demo)'}
              </button>
            )}
            <button type="button" onClick={() => { setAgentModal(null); setAgentDemoResult(null); }} className="btn-secondary">Fermer</button>
          </>
        }
      >
        {agentModal && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${agentModal.status === 'up' ? 'bg-green-500' : agentModal.status === 'down' ? 'bg-red-500' : 'bg-slate-400 animate-pulse'}`} />
              <span className={agentModal.status === 'up' ? 'text-green-700 font-medium' : 'text-red-600'}>{agentModal.status === 'up' ? 'En ligne' : 'Hors ligne (demo disponible)'}</span>
            </div>
            <p><strong>Rôle :</strong> {agentModal.desc}</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Dynamique de l&apos;agent</p>
              <p className="text-slate-600 mb-1"><strong>Entrées :</strong> donnees cliniques (trace CTG, scores, FHIR) ou sorties d&apos;autres agents.</p>
              <p className="text-slate-600 mb-1"><strong>Traitement :</strong> analyse specialisee (FIGO, HAS, modeles) puis production d&apos;un narratif et de metriques.</p>
              <p className="text-slate-600"><strong>Sorties :</strong> resume, narratif clinique, metriques, references Harvard.</p>
            </div>
            {agentDemoResult && (
              <div className="space-y-4 rounded-lg border border-green-200 bg-green-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-800">Resultat de la demo (sortie de l&apos;agent)</p>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">Resume</p>
                  <p className="text-slate-700">{agentDemoResult.summary}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">Narratif</p>
                  <p className="text-slate-700 leading-relaxed">{agentDemoResult.narrative}</p>
                </div>
                {agentDemoResult.metrics?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-600">Metriques</p>
                    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Metrique</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Valeur</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Seuil</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentDemoResult.metrics.map((m, i) => (
                          <tr key={i} className="border-t border-slate-200">
                            <td className="px-3 py-2 text-slate-800">{m.name}</td>
                            <td className="px-3 py-2 text-slate-700">{m.value}</td>
                            <td className="px-3 py-2 text-slate-600">{m.threshold}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'normal' ? 'bg-green-100 text-green-800' : m.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{m.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {agentDemoResult.references?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-600">Sources</p>
                    <ul className="space-y-1 text-xs text-slate-600 border-l-2 border-slate-200 pl-2">
                      {agentDemoResult.references.slice(0, 3).map((ref, i) => (
                        <li key={i}>{ref.harvard}</li>
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
