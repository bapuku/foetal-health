'use client';

import { useState } from 'react';
import Link from 'next/link';
import BadgeAction from '@/components/ui/BadgeAction';
import ActionModal from '@/components/ui/ActionModal';
import PageBanner from '@/components/ui/PageBanner';

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  sa: number;
  risque: 'bas' | 'moyen' | 'eleve';
  derniereVisite: string;
  statut: 'actif' | 'accouchee' | 'suivi';
}

interface Consultation {
  date: string;
  type: string;
  sa: number;
  resume: string;
}

interface AnalyseResult {
  type: string;
  date: string;
  resultat: string;
  details?: string;
}

function getDossierDemo(patient: Patient): {
  consultations: Consultation[];
  analyses: AnalyseResult[];
  recommandations: string;
} {
  const consultations: Consultation[] = [
    { date: patient.derniereVisite, type: 'Consultation prenatal', sa: patient.sa, resume: 'Examen clinique, auscultation cardiaque fœtale, mesure de la hauteur uterine. Patiente en bon etat general.' },
    { date: '11/02/2026', type: 'Suivi', sa: patient.sa - 1, resume: 'Controle tensionnel normal. Bilan sanguin demande.' },
    { date: '04/02/2026', type: 'Echographie', sa: patient.sa - 2, resume: 'Echo morphologique normale. Biometrie dans les normes.' },
  ];
  const analyses: AnalyseResult[] = [
    { type: 'CTG', date: patient.derniereVisite, resultat: patient.risque === 'eleve' ? 'Suspect' : 'Normal', details: 'FHR baseline 138 bpm, STV 12 ms, accelerations presentes. Classification FIGO 2015.' },
    { type: 'Score Bishop', date: patient.derniereVisite, resultat: '7/13', details: 'Col favorable, phase latent.' },
    ...(patient.statut === 'accouchee' ? [{ type: 'Apgar', date: patient.derniereVisite, resultat: '8 / 9', details: '1 min et 5 min. Adaptation neonatale satisfaisante.' } as AnalyseResult] : []),
  ];
  const recommandations = patient.risque === 'eleve'
    ? 'Surveillance renforcee. Bilan RCIU et Doppler ombilical recommandes. Controle CTG rapproche.'
    : patient.risque === 'moyen'
      ? 'Surveillance standard. Reevaluation au prochain RDV. Poursuite du suivi selon protocole HAS.'
      : 'Suivi habituel. Prochaine consultation programmee.';
  return { consultations, analyses, recommandations };
}

const MOCK_PATIENTS: Patient[] = [
  { id: 'P-2024-0847', nom: 'Martin', prenom: 'Sophie', age: 31, sa: 38, risque: 'bas', derniereVisite: '18/02/2026', statut: 'actif' },
  { id: 'P-2024-0845', nom: 'Dubois', prenom: 'Marie', age: 28, sa: 36, risque: 'moyen', derniereVisite: '17/02/2026', statut: 'actif' },
  { id: 'P-2024-0843', nom: 'Bernard', prenom: 'Claire', age: 35, sa: 40, risque: 'bas', derniereVisite: '17/02/2026', statut: 'actif' },
  { id: 'P-2024-0841', nom: 'Petit', prenom: 'Isabelle', age: 29, sa: 34, risque: 'eleve', derniereVisite: '16/02/2026', statut: 'actif' },
  { id: 'P-2024-0839', nom: 'Robert', prenom: 'Amelie', age: 32, sa: 37, risque: 'moyen', derniereVisite: '16/02/2026', statut: 'actif' },
  { id: 'P-2024-0837', nom: 'Richard', prenom: 'Julie', age: 27, sa: 39, risque: 'bas', derniereVisite: '15/02/2026', statut: 'actif' },
  { id: 'P-2024-0835', nom: 'Moreau', prenom: 'Camille', age: 34, sa: 41, risque: 'eleve', derniereVisite: '15/02/2026', statut: 'suivi' },
  { id: 'P-2024-0831', nom: 'Leroy', prenom: 'Emma', age: 26, sa: 32, risque: 'eleve', derniereVisite: '14/02/2026', statut: 'actif' },
  { id: 'P-2024-0312', nom: 'Simon', prenom: 'Laura', age: 30, sa: 40, risque: 'bas', derniereVisite: '18/02/2026', statut: 'accouchee' },
  { id: 'P-2024-0308', nom: 'Laurent', prenom: 'Chloe', age: 33, sa: 39, risque: 'moyen', derniereVisite: '13/02/2026', statut: 'accouchee' },
];

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | 'actif' | 'eleve'>('tous');
  const [riskModalPatient, setRiskModalPatient] = useState<Patient | null>(null);
  const [dossierPatient, setDossierPatient] = useState<Patient | null>(null);

  const riskBadge = (r: Patient['risque'], p: Patient) => {
    const variant = r === 'bas' ? 'ok' : r === 'moyen' ? 'warn' : 'danger';
    const label = r === 'bas' ? 'Bas' : r === 'moyen' ? 'Moyen' : 'Eleve';
    return (
      <BadgeAction variant={variant} onClick={() => setRiskModalPatient(p)} title="Voir detail risque">
        {label}
      </BadgeAction>
    );
  };

  const statutBadge = (s: Patient['statut']) => {
    if (s === 'actif') return <span className="badge-info">Actif</span>;
    if (s === 'accouchee') return <span className="badge-ok">Accouchee</span>;
    return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Suivi</span>;
  };

  const filtered = MOCK_PATIENTS.filter((p) => {
    const matchSearch =
      search === '' ||
      `${p.nom} ${p.prenom} ${p.id}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'tous' ||
      (filter === 'actif' && p.statut === 'actif') ||
      (filter === 'eleve' && p.risque === 'eleve');
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <PageBanner src="/images/prenatal-checkup.png" alt="Suivi prénatal" title="Dossiers patients" subtitle="Suivi des patientes et niveaux de risque" />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dossiers patients</h1>
          <p className="text-sm text-slate-500">{MOCK_PATIENTS.length} patientes enregistrees (donnees de demonstration)</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvelle patiente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher (nom, prenom, ID)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['tous', 'actif', 'eleve'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'tous' ? 'Toutes' : f === 'actif' ? 'Actives' : 'Risque eleve'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left font-medium text-slate-500">ID</th>
                <th className="px-5 py-3 text-left font-medium text-slate-500">Patiente</th>
                <th className="px-5 py-3 text-left font-medium text-slate-500">Age</th>
                <th className="px-5 py-3 text-left font-medium text-slate-500">SA</th>
                <th className="px-5 py-3 text-left font-medium text-slate-500">Risque</th>
                <th className="px-5 py-3 text-left font-medium text-slate-500">Derniere visite</th>
                <th className="px-5 py-3 text-left font-medium text-slate-500">Statut</th>
                <th className="px-5 py-3 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                        {p.prenom[0]}{p.nom[0]}
                      </div>
                      <span className="font-medium text-slate-800">{p.prenom} {p.nom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.age} ans</td>
                  <td className="px-5 py-3 font-medium text-slate-700">{p.sa} SA</td>
                  <td className="px-5 py-3">{riskBadge(p.risque, p)}</td>
                  <td className="px-5 py-3 text-slate-500">{p.derniereVisite}</td>
                  <td className="px-5 py-3">{statutBadge(p.statut)}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => setDossierPatient(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Voir dossier
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Aucune patiente trouvee
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ActionModal
        isOpen={!!riskModalPatient}
        onClose={() => setRiskModalPatient(null)}
        title={`Detail risque - ${riskModalPatient ? `${riskModalPatient.prenom} ${riskModalPatient.nom}` : ''}`}
        size="md"
        actions={<button type="button" onClick={() => setRiskModalPatient(null)} className="btn-primary">Fermer</button>}
      >
        {riskModalPatient && (
          <div className="space-y-3 text-sm">
            <p><strong>Niveau de risque :</strong> {riskModalPatient.risque === 'eleve' ? 'Eleve' : riskModalPatient.risque === 'moyen' ? 'Moyen' : 'Bas'}</p>
            <p><strong>Historique :</strong> Derniere visite {riskModalPatient.derniereVisite}. SA {riskModalPatient.sa}.</p>
            <p className="text-slate-600">Recommandations : {riskModalPatient.risque === 'eleve' ? 'Surveillance renforcee, bilan RCIU/Doppler si indique.' : riskModalPatient.risque === 'moyen' ? 'Surveillance standard, reevaluation au prochain RDV.' : 'Suivi habituel.'}</p>
          </div>
        )}
      </ActionModal>

      {/* Modal Dossier patient */}
      <ActionModal
        isOpen={!!dossierPatient}
        onClose={() => setDossierPatient(null)}
        title={dossierPatient ? `Dossier — ${dossierPatient.prenom} ${dossierPatient.nom} (${dossierPatient.id})` : ''}
        size="xl"
        actions={
          <div className="flex gap-2">
            <Link href={dossierPatient ? `/dashboard/reports?patient=${encodeURIComponent(dossierPatient.id)}` : '#'} className="btn-primary">
              Generer un rapport
            </Link>
            <button type="button" onClick={() => setDossierPatient(null)} className="btn-secondary">Fermer</button>
          </div>
        }
      >
        {dossierPatient && (() => {
          const dossier = getDossierDemo(dossierPatient);
          const riskLabel = dossierPatient.risque === 'bas' ? 'Bas' : dossierPatient.risque === 'moyen' ? 'Moyen' : 'Eleve';
          const riskVariant = dossierPatient.risque === 'bas' ? 'ok' : dossierPatient.risque === 'moyen' ? 'warn' : 'danger';
          return (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Informations (anonymisees)</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p><span className="font-medium text-slate-600">ID :</span> {dossierPatient.id}</p>
                  <p><span className="font-medium text-slate-600">Age :</span> {dossierPatient.age} ans</p>
                  <p><span className="font-medium text-slate-600">SA :</span> {dossierPatient.sa} SA</p>
                  <p><span className="font-medium text-slate-600">Risque :</span> <BadgeAction variant={riskVariant}>{riskLabel}</BadgeAction></p>
                  <p><span className="font-medium text-slate-600">Statut :</span> {dossierPatient.statut === 'actif' ? 'Actif' : dossierPatient.statut === 'accouchee' ? 'Accouchee' : 'Suivi'}</p>
                  <p><span className="font-medium text-slate-600">Derniere visite :</span> {dossierPatient.derniereVisite}</p>
                  <p className="mt-2">
                    <Link href={`/dashboard/prenatal`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Suivi prénatal — calendrier, dépistages T21/DG/SGB
                    </Link>
                  </p>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Historique des consultations</h3>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Type</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">SA</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Resume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dossier.consultations.map((c, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-slate-700">{c.date}</td>
                          <td className="px-4 py-2 text-slate-700">{c.type}</td>
                          <td className="px-4 py-2 text-slate-700">{c.sa} SA</td>
                          <td className="px-4 py-2 text-slate-600">{c.resume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Resultats d&apos;analyses</h3>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Type</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Resultat</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dossier.analyses.map((a, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-medium text-slate-800">{a.type}</td>
                          <td className="px-4 py-2 text-slate-700">{a.date}</td>
                          <td className="px-4 py-2 text-slate-700">{a.resultat}</td>
                          <td className="px-4 py-2 text-slate-600">{a.details ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Niveau de risque et recommandations</h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-700">{dossier.recommandations}</p>
                </div>
              </section>
            </div>
          );
        })()}
      </ActionModal>
    </div>
  );
}
