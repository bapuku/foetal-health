'use client';

import { useState, useMemo, useEffect } from 'react';
import ToolCard, { type ToolCategory } from '@/components/registry/ToolCard';
import PageBanner from '@/components/ui/PageBanner';

const STORAGE_KEY = 'obstetric-tools-active';

interface ToolDef {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  status: 'active' | 'inactive';
  version?: string;
}

const TOOLS: ToolDef[] = [
  { id: 'bishop', name: 'Calculateur Bishop', description: 'Score de Bishop pour maturation cervicale et prediction travail.', category: 'medical', status: 'active', version: '1.0' },
  { id: 'rciu', name: 'Calculateur RCIU', description: 'Percentiles et evaluation restriction croissance intra-uterine.', category: 'medical', status: 'active', version: '1.0' },
  { id: 'apgar', name: 'Score Apgar', description: 'Evaluation adaptation neonatale a 1 et 5 minutes.', category: 'medical', status: 'active', version: '1.0' },
  { id: 'prenatal-calendar', name: 'Prenatal Calendar', description: 'Calendrier 7 consultations + EPP + 3 echos (CSP R2122), normes biologiques par trimestre.', category: 'medical', status: 'active', version: '1.0' },
  { id: 'screening-t21', name: 'Screening T21', description: 'Depistage trisomie 21 (3 paliers HAS 2017), DPNI, caryotype.', category: 'medical', status: 'active', version: '1.0' },
  { id: 'hgpo-calculator', name: 'HGPO Calculator', description: 'Diabete gestationnel : HGPO 75 g, criteres IADPSG (CNGOF/SFD 2010).', category: 'medical', status: 'active', version: '1.0' },
  { id: 'gbs-screening', name: 'GBS Screening', description: 'Streptocoque B (34-38 SA), antibioprophylaxie per-partum.', category: 'medical', status: 'active', version: '1.0' },
  { id: 'doppler', name: 'Doppler uterins', description: 'Indices Doppler arteres uterines et umbilicale.', category: 'medical', status: 'inactive', version: '0.9' },
  { id: 'biometrie', name: 'Biometrie foetale', description: 'Estimation poids foetal et percentiles (HC, AC, FL).', category: 'medical', status: 'active', version: '1.0' },
  { id: 'llm-router', name: 'LLM Router', description: 'Claude, Mistral HF, Granite HF, GPT-4o - routage par tache et complexite.', category: 'ai', status: 'active', version: '1.0' },
  { id: 'ctg-cnn', name: 'Classification CNN CTG', description: 'Modele PyTorch classification FIGO cardiotocographie.', category: 'ai', status: 'active', version: '1.0' },
  { id: 'cesarean-xgb', name: 'Predicteur cesarienne XGBoost', description: 'Risque cesarienne en urgence (modele ML).', category: 'ai', status: 'active', version: '1.0' },
  { id: 'fhir-client', name: 'Client FHIR R4', description: 'Acces HAPI FHIR : Patient, Observation, Condition, etc.', category: 'fhir', status: 'active', version: '1.0' },
  { id: 'consent', name: 'Consent Manager', description: 'FHIR Consent - collect, treatment, research.', category: 'fhir', status: 'active', version: '1.0' },
  { id: 'patient-search', name: 'Patient Search', description: 'Recherche patients FHIR avec filtres.', category: 'fhir', status: 'active', version: '1.0' },
  { id: 'audit-sha', name: 'Audit Logger SHA-256', description: 'Chaine de hachage immuable, tracabilite 10 ans.', category: 'audit', status: 'active', version: '1.0' },
  { id: 'k-anon', name: 'Anonymisation k-anonymity', description: 'k ≥ 5 sur quasi-identifiants (age, BMI, SA).', category: 'audit', status: 'active', version: '1.0' },
  { id: 'dp', name: 'Differential Privacy', description: 'Bruit Laplace epsilon=1.0 sur donnees sensibles.', category: 'audit', status: 'active', version: '1.0' },
];

const CATEGORIES: { value: ToolCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'medical', label: 'Medicaux' },
  { value: 'ai', label: 'IA' },
  { value: 'fhir', label: 'FHIR' },
  { value: 'audit', label: 'Audit' },
];

export default function ToolsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeOverrides));
    } catch {
      // ignore
    }
  }, [activeOverrides]);

  const filtered = useMemo(() => {
    return TOOLS.filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || t.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const effectiveStatus = (tool: ToolDef): 'active' | 'inactive' => {
    if (tool.id in activeOverrides) return activeOverrides[tool.id] ? 'active' : 'inactive';
    return tool.status;
  };

  const handleToggle = (toolId: string) => {
    setActiveOverrides((prev) => ({ ...prev, [toolId]: !(prev[toolId] ?? TOOLS.find((t) => t.id === toolId)?.status === 'active') }));
  };

  return (
    <div className="space-y-6">
      <PageBanner src="/images/ultrasound-probe.png" alt="Échographie" title="Registre des outils" subtitle="Outils médicaux, IA, FHIR et audit disponibles dans le système" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registre des outils</h1>
        <p className="text-sm text-slate-500">Outils medicaux, IA, FHIR et audit disponibles dans le systeme. Activer/désactiver pour enregistrer votre préférence (local).</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Utilisation dans les workflows</p>
        <p className="mt-1">Prenatal Calendar, Screening T21, HGPO Calculator, GBS Screening : agent Prenatal Follow-up (port 8010). Bishop, RCIU, Apgar : agents Bishop Partogram, RCIU Risk, Apgar Transition. CTG CNN : agent CTG Monitor. Client FHIR et Patient Search utilisent la connexion FHIR configurée en Admin.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Rechercher (nom, description)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                category === c.value ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => (
          <ToolCard
            key={tool.id}
            id={tool.id}
            name={tool.name}
            description={tool.description}
            category={tool.category}
            status={effectiveStatus(tool)}
            version={tool.version}
            onToggleActive={() => handleToggle(tool.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-8">Aucun outil trouve.</p>
      )}
    </div>
  );
}
