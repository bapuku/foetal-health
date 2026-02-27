'use client';

import { useState, useEffect } from 'react';
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

const DEMO_PATIENTS_FALLBACK: Patient[] = [
  { id: 'P-2024-0847', nom: 'Martin', prenom: 'Sophie', age: 31, sa: 38, risque: 'bas', derniereVisite: '18/02/2026', statut: 'actif' },
  { id: 'P-2024-0845', nom: 'Dubois', prenom: 'Marie', age: 28, sa: 36, risque: 'moyen', derniereVisite: '17/02/2026', statut: 'actif' },
  { id: 'P-2024-0841', nom: 'Petit', prenom: 'Isabelle', age: 29, sa: 34, risque: 'eleve', derniereVisite: '16/02/2026', statut: 'actif' },
];

interface DossierConsultation {
  id?: string;
  date: string;
  sa?: number;
  consultationNumber?: number;
  paSystolique?: number;
  paDiastolique?: number;
  poids?: number;
  hauteurUterine?: number;
  proteinurieBandelette?: string;
  bcfBpm?: number;
  resumeClinique?: string;
}

interface DossierBiologicalExam {
  id?: string;
  type: string;
  date: string;
  trimestre?: number;
  resultatNumerique?: number;
  resultatQualitatif?: string;
  statut: string;
  commentaire?: string;
}

interface DossierCtgResult {
  id?: string;
  date: string;
  baselineBpm?: number;
  stvMs?: number;
  classification?: string;
  narrative?: string;
}

interface DossierUltrasound {
  id?: string;
  type: 't1' | 't2' | 't3';
  data: Record<string, unknown>;
}

interface DossierData {
  patientId: string;
  consultations: DossierConsultation[];
  biologicalExams: DossierBiologicalExam[];
  ctgResults: DossierCtgResult[];
  ultrasounds: DossierUltrasound[];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | 'actif' | 'eleve'>('tous');
  const [riskModalPatient, setRiskModalPatient] = useState<Patient | null>(null);
  const [dossierPatient, setDossierPatient] = useState<Patient | null>(null);
  const [dossierData, setDossierData] = useState<DossierData | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [addForm, setAddForm] = useState<'consultation' | 'exam' | 'ctg' | 'ultrasound' | null>(null);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ nom: '', prenom: '', age: 28, sa: 12, risque: 'bas' as Patient['risque'], statut: 'actif' as Patient['statut'] });
  const [savingNew, setSavingNew] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Patient[]) => setPatients(Array.isArray(list) ? list : []))
      .catch(() => setPatients(DEMO_PATIENTS_FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const refetchPatients = () => {
    fetch('/api/patients')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Patient[]) => setPatients(Array.isArray(list) ? list : patients))
      .catch(() => {});
  };

  useEffect(() => {
    if (!dossierPatient) {
      setDossierData(null);
      return;
    }
    setLoadingDossier(true);
    fetch(`/api/dossiers/${dossierPatient.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DossierData | null) => {
        if (data) {
          setDossierData({
            patientId: data.patientId ?? dossierPatient.id,
            consultations: Array.isArray(data.consultations) ? data.consultations : [],
            biologicalExams: Array.isArray(data.biologicalExams) ? data.biologicalExams : [],
            ctgResults: Array.isArray(data.ctgResults) ? data.ctgResults : [],
            ultrasounds: Array.isArray(data.ultrasounds) ? data.ultrasounds : [],
          });
        } else {
          setDossierData({
            patientId: dossierPatient.id,
            consultations: [],
            biologicalExams: [],
            ctgResults: [],
            ultrasounds: [],
          });
        }
      })
      .catch(() => setDossierData({ patientId: dossierPatient.id, consultations: [], biologicalExams: [], ctgResults: [], ultrasounds: [] }))
      .finally(() => setLoadingDossier(false));
  }, [dossierPatient]);

  const refetchDossier = () => {
    if (!dossierPatient) return;
    fetch(`/api/dossiers/${dossierPatient.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DossierData | null) => {
        if (data) {
          setDossierData({
            patientId: data.patientId ?? dossierPatient.id,
            consultations: Array.isArray(data.consultations) ? data.consultations : [],
            biologicalExams: Array.isArray(data.biologicalExams) ? data.biologicalExams : [],
            ctgResults: Array.isArray(data.ctgResults) ? data.ctgResults : [],
            ultrasounds: Array.isArray(data.ultrasounds) ? data.ultrasounds : [],
          });
        }
      })
      .catch(() => {});
  };

  const [formConsultation, setFormConsultation] = useState({ date: '', sa: '', paSystolique: '', paDiastolique: '', poids: '', hauteurUterine: '', bcfBpm: '', proteinurieBandelette: '', resumeClinique: '' });
  const [formExam, setFormExam] = useState({ type: 'NFS', date: '', trimestre: 1 as 1 | 2 | 3, resultatNumerique: '', resultatQualitatif: '', statut: 'normal' as string });
  const [formCtg, setFormCtg] = useState({ date: new Date().toISOString().slice(0, 10), baselineBpm: '', stvMs: '', classification: 'normal', narrative: '' });
  const [formUltrasound, setFormUltrasound] = useState({ type: 't1' as 't1' | 't2' | 't3', date: '', sa: '', lccMm: '', clarteNucaleMm: '', vitalite: true, nombreEmbryons: 1, bipMm: '', poidsEstimeG: '', presentation: '' });

  const handleAddConsultation = async () => {
    if (!dossierPatient) return;
    setSavingAdd(true); setAddError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierPatient.id}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formConsultation.date || new Date().toISOString().slice(0, 10),
          sa: formConsultation.sa ? Number(formConsultation.sa) : undefined,
          paSystolique: formConsultation.paSystolique ? Number(formConsultation.paSystolique) : undefined,
          paDiastolique: formConsultation.paDiastolique ? Number(formConsultation.paDiastolique) : undefined,
          poids: formConsultation.poids ? Number(formConsultation.poids) : undefined,
          hauteurUterine: formConsultation.hauteurUterine ? Number(formConsultation.hauteurUterine) : undefined,
          bcfBpm: formConsultation.bcfBpm ? Number(formConsultation.bcfBpm) : undefined,
          proteinurieBandelette: formConsultation.proteinurieBandelette || undefined,
          resumeClinique: formConsultation.resumeClinique || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAddError((d.error as string) || res.statusText); return; }
      setAddForm(null);
      setFormConsultation({ date: '', sa: '', paSystolique: '', paDiastolique: '', poids: '', hauteurUterine: '', bcfBpm: '', proteinurieBandelette: '', resumeClinique: '' });
      refetchDossier();
    } finally { setSavingAdd(false); }
  };

  const handleAddExam = async () => {
    if (!dossierPatient) return;
    setSavingAdd(true); setAddError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierPatient.id}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formExam.type,
          date: formExam.date || new Date().toISOString().slice(0, 10),
          trimestre: formExam.trimestre,
          resultatNumerique: formExam.resultatNumerique ? Number(formExam.resultatNumerique) : undefined,
          resultatQualitatif: formExam.resultatQualitatif || undefined,
          statut: formExam.statut,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAddError((d.error as string) || res.statusText); return; }
      setAddForm(null);
      setFormExam({ type: 'NFS', date: '', trimestre: 1, resultatNumerique: '', resultatQualitatif: '', statut: 'normal' });
      refetchDossier();
    } finally { setSavingAdd(false); }
  };

  const handleAddCtg = async () => {
    if (!dossierPatient) return;
    setSavingAdd(true); setAddError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierPatient.id}/ctg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formCtg.date,
          baselineBpm: formCtg.baselineBpm ? Number(formCtg.baselineBpm) : undefined,
          stvMs: formCtg.stvMs ? Number(formCtg.stvMs) : undefined,
          classification: formCtg.classification,
          narrative: formCtg.narrative,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAddError((d.error as string) || res.statusText); return; }
      setAddForm(null);
      setFormCtg({ date: new Date().toISOString().slice(0, 10), baselineBpm: '', stvMs: '', classification: 'normal', narrative: '' });
      refetchDossier();
    } finally { setSavingAdd(false); }
  };

  const handleAddUltrasound = async () => {
    if (!dossierPatient) return;
    setSavingAdd(true); setAddError(null);
    const base: Record<string, unknown> = { date: formUltrasound.date, sa: formUltrasound.sa ? Number(formUltrasound.sa) : undefined };
    if (formUltrasound.type === 't1') {
      base.lccMm = formUltrasound.lccMm ? Number(formUltrasound.lccMm) : undefined;
      base.clarteNucaleMm = formUltrasound.clarteNucaleMm ? Number(formUltrasound.clarteNucaleMm) : undefined;
      base.vitalite = formUltrasound.vitalite;
      base.nombreEmbryons = formUltrasound.nombreEmbryons;
    } else if (formUltrasound.type === 't2') {
      base.bipMm = formUltrasound.bipMm ? Number(formUltrasound.bipMm) : undefined;
    } else {
      base.poidsEstimeG = formUltrasound.poidsEstimeG ? Number(formUltrasound.poidsEstimeG) : undefined;
      base.presentation = formUltrasound.presentation || undefined;
    }
    try {
      const res = await fetch(`/api/dossiers/${dossierPatient.id}/ultrasounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: formUltrasound.type, data: base }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAddError((d.error as string) || res.statusText); return; }
      setAddForm(null);
      setFormUltrasound({ type: 't1', date: '', sa: '', lccMm: '', clarteNucaleMm: '', vitalite: true, nombreEmbryons: 1, bipMm: '', poidsEstimeG: '', presentation: '' });
      refetchDossier();
    } finally { setSavingAdd(false); }
  };

  const handleCreatePatient = async () => {
    if (!newPatientForm.nom.trim() || !newPatientForm.prenom.trim()) {
      setSaveError('Nom et prénom requis.');
      return;
    }
    setSavingNew(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: newPatientForm.nom.trim(),
          prenom: newPatientForm.prenom.trim(),
          age: newPatientForm.age,
          sa: newPatientForm.sa,
          risque: newPatientForm.risque,
          statut: newPatientForm.statut,
          derniereVisite: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError((data.error as string) || res.statusText);
        return;
      }
      setNewPatientOpen(false);
      setNewPatientForm({ nom: '', prenom: '', age: 28, sa: 12, risque: 'bas', statut: 'actif' });
      refetchPatients();
    } finally {
      setSavingNew(false);
    }
  };

  const openEdit = (p: Patient) => {
    setEditPatient(p);
    setEditForm({ nom: p.nom, prenom: p.prenom, age: p.age, sa: p.sa, risque: p.risque, derniereVisite: p.derniereVisite, statut: p.statut });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editPatient) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/patients/${editPatient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditError((data.error as string) || res.statusText);
        return;
      }
      setEditPatient(null);
      refetchPatients();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!deletePatient) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/patients/${deletePatient.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError((data.error as string) || res.statusText);
        return;
      }
      setDeletePatient(null);
      refetchPatients();
    } finally {
      setDeleting(false);
    }
  };

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

  const filtered = patients.filter((p) => {
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
          <p className="text-sm text-slate-500">{loading ? 'Chargement…' : `${patients.length} patiente(s) enregistrée(s)`}</p>
        </div>
        <button type="button" onClick={() => { setNewPatientOpen(true); setSaveError(null); }} className="btn-primary flex items-center gap-2">
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
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setDossierPatient(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Voir dossier</button>
                      <button type="button" onClick={() => openEdit(p)} className="text-slate-600 hover:text-slate-800 text-xs font-medium">Modifier</button>
                      <button type="button" onClick={() => setDeletePatient(p)} className="text-red-600 hover:text-red-800 text-xs font-medium">Supprimer</button>
                    </div>
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

      {/* Modal Nouvelle patiente */}
      <ActionModal
        isOpen={newPatientOpen}
        onClose={() => setNewPatientOpen(false)}
        title="Nouvelle patiente"
        size="md"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={handleCreatePatient} disabled={savingNew} className="btn-primary">
              {savingNew ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setNewPatientOpen(false)} className="btn-secondary">Annuler</button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          {saveError && <p className="text-red-600">{saveError}</p>}
          <div>
            <label className="mb-1 block font-medium text-slate-600">Nom</label>
            <input type="text" value={newPatientForm.nom} onChange={(e) => setNewPatientForm((f) => ({ ...f, nom: e.target.value }))} className="input-field w-full" placeholder="Nom" />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-600">Prénom</label>
            <input type="text" value={newPatientForm.prenom} onChange={(e) => setNewPatientForm((f) => ({ ...f, prenom: e.target.value }))} className="input-field w-full" placeholder="Prénom" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-slate-600">Âge</label>
              <input type="number" min={1} max={60} value={newPatientForm.age} onChange={(e) => setNewPatientForm((f) => ({ ...f, age: Number(e.target.value) || 0 }))} className="input-field w-full" />
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-600">SA</label>
              <input type="number" min={0} max={42} value={newPatientForm.sa} onChange={(e) => setNewPatientForm((f) => ({ ...f, sa: Number(e.target.value) || 0 }))} className="input-field w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-slate-600">Risque</label>
              <select value={newPatientForm.risque} onChange={(e) => setNewPatientForm((f) => ({ ...f, risque: e.target.value as Patient['risque'] }))} className="input-field w-full">
                <option value="bas">Bas</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-600">Statut</label>
              <select value={newPatientForm.statut} onChange={(e) => setNewPatientForm((f) => ({ ...f, statut: e.target.value as Patient['statut'] }))} className="input-field w-full">
                <option value="actif">Actif</option>
                <option value="accouchee">Accouchée</option>
                <option value="suivi">Suivi</option>
              </select>
            </div>
          </div>
        </div>
      </ActionModal>

      {/* Modal Modifier patient */}
      <ActionModal
        isOpen={!!editPatient}
        onClose={() => setEditPatient(null)}
        title={editPatient ? `Modifier — ${editPatient.prenom} ${editPatient.nom}` : ''}
        size="md"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary">{savingEdit ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button type="button" onClick={() => setEditPatient(null)} className="btn-secondary">Annuler</button>
          </div>
        }
      >
        {editPatient && (
          <div className="space-y-3 text-sm">
            {editError && <p className="text-red-600">{editError}</p>}
            <div>
              <label className="mb-1 block font-medium text-slate-600">Nom</label>
              <input type="text" value={editForm.nom ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-600">Prénom</label>
              <input type="text" value={editForm.prenom ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))} className="input-field w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-medium text-slate-600">Âge</label>
                <input type="number" min={1} max={60} value={editForm.age ?? 0} onChange={(e) => setEditForm((f) => ({ ...f, age: Number(e.target.value) || 0 }))} className="input-field w-full" />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-600">SA</label>
                <input type="number" min={0} max={42} value={editForm.sa ?? 0} onChange={(e) => setEditForm((f) => ({ ...f, sa: Number(e.target.value) || 0 }))} className="input-field w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-medium text-slate-600">Risque</label>
                <select value={editForm.risque ?? 'bas'} onChange={(e) => setEditForm((f) => ({ ...f, risque: e.target.value as Patient['risque'] }))} className="input-field w-full">
                  <option value="bas">Bas</option>
                  <option value="moyen">Moyen</option>
                  <option value="eleve">Élevé</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-600">Statut</label>
                <select value={editForm.statut ?? 'actif'} onChange={(e) => setEditForm((f) => ({ ...f, statut: e.target.value as Patient['statut'] }))} className="input-field w-full">
                  <option value="actif">Actif</option>
                  <option value="accouchee">Accouchée</option>
                  <option value="suivi">Suivi</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-600">Dernière visite</label>
              <input type="date" value={editForm.derniereVisite ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, derniereVisite: e.target.value }))} className="input-field w-full" />
            </div>
          </div>
        )}
      </ActionModal>

      {/* Modal Supprimer patient */}
      <ActionModal
        isOpen={!!deletePatient}
        onClose={() => setDeletePatient(null)}
        title="Confirmer la suppression"
        size="sm"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={handleDeletePatient} disabled={deleting} className="btn-primary bg-red-600 hover:bg-red-700">{deleting ? 'Suppression…' : 'Supprimer'}</button>
            <button type="button" onClick={() => setDeletePatient(null)} className="btn-secondary">Annuler</button>
          </div>
        }
      >
        {deletePatient && (
          <div className="space-y-2">
            {deleteError && <p className="text-red-600 text-sm">{deleteError}</p>}
            <p className="text-sm text-slate-700">Voulez-vous vraiment supprimer la patiente <strong>{deletePatient.prenom} {deletePatient.nom}</strong> ({deletePatient.id}) ? Son dossier sera également supprimé.</p>
          </div>
        )}
      </ActionModal>

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
        onClose={() => { setDossierPatient(null); setAddForm(null); }}
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
        {dossierPatient && (
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Informations (anonymisees)</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p><span className="font-medium text-slate-600">ID :</span> {dossierPatient.id}</p>
                <p><span className="font-medium text-slate-600">Age :</span> {dossierPatient.age} ans</p>
                <p><span className="font-medium text-slate-600">SA :</span> {dossierPatient.sa} SA</p>
                <p><span className="font-medium text-slate-600">Risque :</span> <BadgeAction variant={dossierPatient.risque === 'bas' ? 'ok' : dossierPatient.risque === 'moyen' ? 'warn' : 'danger'}>{dossierPatient.risque === 'bas' ? 'Bas' : dossierPatient.risque === 'moyen' ? 'Moyen' : 'Eleve'}</BadgeAction></p>
                <p><span className="font-medium text-slate-600">Statut :</span> {dossierPatient.statut === 'actif' ? 'Actif' : dossierPatient.statut === 'accouchee' ? 'Accouchee' : 'Suivi'}</p>
                <p><span className="font-medium text-slate-600">Derniere visite :</span> {dossierPatient.derniereVisite}</p>
                <p className="mt-2">
                  <Link href={`/dashboard/prenatal`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Suivi prénatal — calendrier, dépistages T21/DG/SGB
                  </Link>
                </p>
              </div>
            </section>
            {loadingDossier ? (
              <p className="text-slate-500">Chargement du dossier…</p>
            ) : dossierData && (
              <>
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Consultations</h3>
                  {addForm !== 'consultation' && (
                    <button type="button" onClick={() => { setAddForm('consultation'); setAddError(null); }} className="mb-2 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Ajouter une consultation</button>
                  )}
                  {addForm === 'consultation' && (
                    <div className="mb-4 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-sm">
                      {addError && <p className="text-red-600">{addError}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Date (AAAA-MM-JJ)" value={formConsultation.date} onChange={(e) => setFormConsultation((f) => ({ ...f, date: e.target.value }))} className="input-field" />
                        <input placeholder="SA" type="number" value={formConsultation.sa} onChange={(e) => setFormConsultation((f) => ({ ...f, sa: e.target.value }))} className="input-field" />
                        <input placeholder="PA syst" type="number" value={formConsultation.paSystolique} onChange={(e) => setFormConsultation((f) => ({ ...f, paSystolique: e.target.value }))} className="input-field" />
                        <input placeholder="PA diast" type="number" value={formConsultation.paDiastolique} onChange={(e) => setFormConsultation((f) => ({ ...f, paDiastolique: e.target.value }))} className="input-field" />
                        <input placeholder="Poids (kg)" type="number" value={formConsultation.poids} onChange={(e) => setFormConsultation((f) => ({ ...f, poids: e.target.value }))} className="input-field" />
                        <input placeholder="Hauteur uterine (cm)" type="number" value={formConsultation.hauteurUterine} onChange={(e) => setFormConsultation((f) => ({ ...f, hauteurUterine: e.target.value }))} className="input-field" />
                        <input placeholder="BCF (bpm)" type="number" value={formConsultation.bcfBpm} onChange={(e) => setFormConsultation((f) => ({ ...f, bcfBpm: e.target.value }))} className="input-field" />
                        <input placeholder="Proteinurie" value={formConsultation.proteinurieBandelette} onChange={(e) => setFormConsultation((f) => ({ ...f, proteinurieBandelette: e.target.value }))} className="input-field" />
                      </div>
                      <input placeholder="Resume clinique" value={formConsultation.resumeClinique} onChange={(e) => setFormConsultation((f) => ({ ...f, resumeClinique: e.target.value }))} className="input-field w-full" />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddConsultation} disabled={savingAdd} className="btn-primary">Enregistrer</button>
                        <button type="button" onClick={() => setAddForm(null)} className="btn-secondary">Annuler</button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">SA</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">PA</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">BCF</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Resume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dossierData.consultations.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-3 text-slate-400">Aucune consultation</td></tr>
                        ) : dossierData.consultations.map((c, i) => (
                          <tr key={c.id ?? i}>
                            <td className="px-4 py-2 text-slate-700">{c.date}</td>
                            <td className="px-4 py-2 text-slate-700">{c.sa != null ? `${c.sa} SA` : '—'}</td>
                            <td className="px-4 py-2 text-slate-700">{c.paSystolique != null && c.paDiastolique != null ? `${c.paSystolique}/${c.paDiastolique}` : '—'}</td>
                            <td className="px-4 py-2 text-slate-700">{c.bcfBpm != null ? `${c.bcfBpm} bpm` : '—'}</td>
                            <td className="px-4 py-2 text-slate-600">{c.resumeClinique ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Examens biologiques</h3>
                  {addForm !== 'exam' && (
                    <button type="button" onClick={() => { setAddForm('exam'); setAddError(null); }} className="mb-2 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Ajouter un examen biologique</button>
                  )}
                  {addForm === 'exam' && (
                    <div className="mb-4 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-sm">
                      {addError && <p className="text-red-600">{addError}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <select value={formExam.type} onChange={(e) => setFormExam((f) => ({ ...f, type: e.target.value }))} className="input-field">
                          <option value="NFS">NFS</option>
                          <option value="toxoplasmose">Toxoplasmose</option>
                          <option value="rubeole">Rubéole</option>
                          <option value="glycémie à jeun">Glycémie à jeun</option>
                          <option value="HGPO 75g">HGPO 75g</option>
                          <option value="créatinine">Créatinine</option>
                          <option value="protéinurie 24h">Protéinurie 24h</option>
                          <option value="streptocoque B">Streptocoque B</option>
                        </select>
                        <input type="date" value={formExam.date} onChange={(e) => setFormExam((f) => ({ ...f, date: e.target.value }))} className="input-field" />
                        <select value={formExam.trimestre} onChange={(e) => setFormExam((f) => ({ ...f, trimestre: Number(e.target.value) as 1 | 2 | 3 }))} className="input-field">
                          <option value={1}>T1</option>
                          <option value={2}>T2</option>
                          <option value={3}>T3</option>
                        </select>
                        <select value={formExam.statut} onChange={(e) => setFormExam((f) => ({ ...f, statut: e.target.value }))} className="input-field">
                          <option value="normal">Normal</option>
                          <option value="anormal">Anormal</option>
                          <option value="en_attente">En attente</option>
                        </select>
                        <input placeholder="Résultat numérique" value={formExam.resultatNumerique} onChange={(e) => setFormExam((f) => ({ ...f, resultatNumerique: e.target.value }))} className="input-field" />
                        <input placeholder="Résultat qualitatif" value={formExam.resultatQualitatif} onChange={(e) => setFormExam((f) => ({ ...f, resultatQualitatif: e.target.value }))} className="input-field" />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddExam} disabled={savingAdd} className="btn-primary">Enregistrer</button>
                        <button type="button" onClick={() => setAddForm(null)} className="btn-secondary">Annuler</button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Type</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Trim.</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Resultat</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dossierData.biologicalExams.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-3 text-slate-400">Aucun examen</td></tr>
                        ) : dossierData.biologicalExams.map((b, i) => (
                          <tr key={b.id ?? i}>
                            <td className="px-4 py-2 font-medium text-slate-800">{b.type}</td>
                            <td className="px-4 py-2 text-slate-700">{b.date}</td>
                            <td className="px-4 py-2 text-slate-700">{b.trimestre != null ? `T${b.trimestre}` : '—'}</td>
                            <td className="px-4 py-2 text-slate-700">{b.resultatNumerique != null ? String(b.resultatNumerique) : b.resultatQualitatif ?? '—'}</td>
                            <td className="px-4 py-2 text-slate-700">{b.statut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Resultats CTG</h3>
                  {addForm !== 'ctg' && (
                    <button type="button" onClick={() => { setAddForm('ctg'); setAddError(null); }} className="mb-2 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Ajouter un resultat CTG</button>
                  )}
                  {addForm === 'ctg' && (
                    <div className="mb-4 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-sm">
                      {addError && <p className="text-red-600">{addError}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={formCtg.date} onChange={(e) => setFormCtg((f) => ({ ...f, date: e.target.value }))} className="input-field" />
                        <input placeholder="FHR baseline (bpm)" type="number" value={formCtg.baselineBpm} onChange={(e) => setFormCtg((f) => ({ ...f, baselineBpm: e.target.value }))} className="input-field" />
                        <input placeholder="STV (ms)" type="number" value={formCtg.stvMs} onChange={(e) => setFormCtg((f) => ({ ...f, stvMs: e.target.value }))} className="input-field" />
                        <select value={formCtg.classification} onChange={(e) => setFormCtg((f) => ({ ...f, classification: e.target.value }))} className="input-field">
                          <option value="normal">Normal</option>
                          <option value="suspect">Suspect</option>
                          <option value="pathologique">Pathologique</option>
                        </select>
                      </div>
                      <input placeholder="Narratif" value={formCtg.narrative} onChange={(e) => setFormCtg((f) => ({ ...f, narrative: e.target.value }))} className="input-field w-full" />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddCtg} disabled={savingAdd} className="btn-primary">Enregistrer</button>
                        <button type="button" onClick={() => setAddForm(null)} className="btn-secondary">Annuler</button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">FHR baseline</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">STV</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Classification</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Narratif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dossierData.ctgResults.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-3 text-slate-400">Aucun resultat CTG</td></tr>
                        ) : dossierData.ctgResults.map((ctg, i) => (
                          <tr key={ctg.id ?? i}>
                            <td className="px-4 py-2 text-slate-700">{ctg.date}</td>
                            <td className="px-4 py-2 text-slate-700">{ctg.baselineBpm != null ? `${ctg.baselineBpm} bpm` : '—'}</td>
                            <td className="px-4 py-2 text-slate-700">{ctg.stvMs != null ? `${ctg.stvMs} ms` : '—'}</td>
                            <td className="px-4 py-2 font-medium text-slate-800">{ctg.classification ?? '—'}</td>
                            <td className="px-4 py-2 text-slate-600">{ctg.narrative ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Echographies</h3>
                  {addForm !== 'ultrasound' && (
                    <button type="button" onClick={() => { setAddForm('ultrasound'); setAddError(null); }} className="mb-2 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Ajouter une echographie</button>
                  )}
                  {addForm === 'ultrasound' && (
                    <div className="mb-4 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-sm">
                      {addError && <p className="text-red-600">{addError}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <select value={formUltrasound.type} onChange={(e) => setFormUltrasound((f) => ({ ...f, type: e.target.value as 't1' | 't2' | 't3' }))} className="input-field">
                          <option value="t1">T1</option>
                          <option value="t2">T2</option>
                          <option value="t3">T3</option>
                        </select>
                        <input type="date" placeholder="Date" value={formUltrasound.date} onChange={(e) => setFormUltrasound((f) => ({ ...f, date: e.target.value }))} className="input-field" />
                        <input placeholder="SA" type="number" value={formUltrasound.sa} onChange={(e) => setFormUltrasound((f) => ({ ...f, sa: e.target.value }))} className="input-field" />
                        {formUltrasound.type === 't1' && (
                          <>
                            <input placeholder="LCC (mm)" type="number" value={formUltrasound.lccMm} onChange={(e) => setFormUltrasound((f) => ({ ...f, lccMm: e.target.value }))} className="input-field" />
                            <input placeholder="Clarté nucale (mm)" type="number" value={formUltrasound.clarteNucaleMm} onChange={(e) => setFormUltrasound((f) => ({ ...f, clarteNucaleMm: e.target.value }))} className="input-field" />
                            <label className="flex items-center gap-2"><input type="checkbox" checked={formUltrasound.vitalite} onChange={(e) => setFormUltrasound((f) => ({ ...f, vitalite: e.target.checked }))} /> Vitalité</label>
                            <input placeholder="Nombre embryons" type="number" min={1} value={formUltrasound.nombreEmbryons} onChange={(e) => setFormUltrasound((f) => ({ ...f, nombreEmbryons: Number(e.target.value) || 1 }))} className="input-field" />
                          </>
                        )}
                        {formUltrasound.type === 't2' && (
                          <input placeholder="BIP (mm)" type="number" value={formUltrasound.bipMm} onChange={(e) => setFormUltrasound((f) => ({ ...f, bipMm: e.target.value }))} className="input-field" />
                        )}
                        {formUltrasound.type === 't3' && (
                          <>
                            <input placeholder="Poids estimé (g)" type="number" value={formUltrasound.poidsEstimeG} onChange={(e) => setFormUltrasound((f) => ({ ...f, poidsEstimeG: e.target.value }))} className="input-field" />
                            <input placeholder="Présentation" value={formUltrasound.presentation} onChange={(e) => setFormUltrasound((f) => ({ ...f, presentation: e.target.value }))} className="input-field" />
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddUltrasound} disabled={savingAdd} className="btn-primary">Enregistrer</button>
                        <button type="button" onClick={() => setAddForm(null)} className="btn-secondary">Annuler</button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Type</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">SA</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dossierData.ultrasounds.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-3 text-slate-400">Aucune echographie</td></tr>
                        ) : dossierData.ultrasounds.map((u, i) => (
                          <tr key={u.id ?? i}>
                            <td className="px-4 py-2 font-medium text-slate-800">T{u.type.replace('t', '')}</td>
                            <td className="px-4 py-2 text-slate-700">{(u.data?.date as string) ?? '—'}</td>
                            <td className="px-4 py-2 text-slate-700">{u.data?.sa != null ? `${u.data.sa} SA` : '—'}</td>
                            <td className="px-4 py-2 text-slate-600">{u.data ? JSON.stringify(u.data).slice(0, 80) + (JSON.stringify(u.data).length > 80 ? '…' : '') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </ActionModal>
    </div>
  );
}
