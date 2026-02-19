'use client';

import { useState } from 'react';
import ActionModal from '@/components/ui/ActionModal';
import { CLINICAL_REFERENCES, formatHarvard } from '@/lib/citations';

const RISKS = [
  {
    name: 'RCIU',
    fullName: 'Restriction de Croissance Intra-Uterine',
    value: 12,
    unit: '%',
    ic95: '8-16',
    trend: 'stable' as const,
    color: 'amber',
    prob: 2,
    impact: 4,
    narrative: 'Risque RCIU evalue a partir de la biometrie foetale et du Doppler. Percentile de poids estime dans la fourchette basse-normale. Surveillance renforcee recommandee selon HAS 2022.',
    evidence: [
      { field: 'Percentile poids', value: '18e', seuil: '> 10e' },
      { field: 'Doppler art. ombilicale', value: 'Normal', seuil: '—' },
      { field: 'IC 95 %', value: '8-16 %', seuil: '—' },
    ],
    references: ['figo2015', 'has2022', 'cngof2021'],
  },
  {
    name: 'Cesarienne urgence',
    fullName: 'Probabilite de cesarienne en urgence',
    value: 18,
    unit: '%',
    ic95: '14-22',
    trend: 'up' as const,
    color: 'red',
    prob: 3,
    impact: 3,
    narrative: 'Probabilite de cesarienne en urgence estimee a partir du score de Bishop, du contexte obstetrical et des donnees CTG. Valeur dans la fourchette moderee ; plan de naissance adapte recommande.',
    evidence: [
      { field: 'Score Bishop', value: '7', seuil: '0-13' },
      { field: 'Phase travail', value: 'Latent', seuil: '—' },
      { field: 'IC 95 %', value: '14-22 %', seuil: '—' },
    ],
    references: ['cngof2021', 'nice2014'],
  },
  {
    name: 'Apgar <7 (5 min)',
    fullName: 'Risque Apgar bas a 5 minutes',
    value: 5,
    unit: '%',
    ic95: '2-8',
    trend: 'down' as const,
    color: 'green',
    prob: 1,
    impact: 5,
    narrative: 'Risque d\'Apgar inferieur a 7 a 5 minutes faible, base sur les sorties multi-agents (CTG, contexte neonatal). Pas d\'indication a une reanimation avancee preventive.',
    evidence: [
      { field: 'Risque estime', value: '5 %', seuil: '< 10 %' },
      { field: 'IC 95 %', value: '2-8 %', seuil: '—' },
    ],
    references: ['cngof2021', 'nice2014', 'acog2009'],
  },
  {
    name: 'Preterme',
    fullName: 'Risque d\'accouchement premature',
    value: 8,
    unit: '%',
    ic95: '5-11',
    trend: 'stable' as const,
    color: 'amber',
    prob: 2,
    impact: 4,
    narrative: 'Risque d\'accouchement premature evalue a 8 % (IC 95 % 5-11). Facteurs anamnestiques et cliniques integres. Surveillance et tocolyse si indique selon CNGOF.',
    evidence: [
      { field: 'SA actuelle', value: '38 SA', seuil: '—' },
      { field: 'Risque estime', value: '8 %', seuil: '—' },
      { field: 'IC 95 %', value: '5-11 %', seuil: '—' },
    ],
    references: ['has2022', 'cngof2021'],
  },
];

const SHAP_FEATURES = [
  { name: 'FHR baseline', impact: 0.35, direction: 'positive' as const },
  { name: 'Variabilite STV', impact: 0.28, direction: 'positive' as const },
  { name: 'Age gestationnel', impact: 0.18, direction: 'negative' as const },
  { name: 'Bishop score', impact: 0.12, direction: 'positive' as const },
  { name: 'Age maternel', impact: 0.07, direction: 'negative' as const },
];

type RiskItem = (typeof RISKS)[number];

const RISK_REPORT = {
  summary: 'Résumé diagnostique de haut niveau : les risques RCIU, césarienne en urgence, Apgar <7 à 5 min et prématurité ont été évalués à partir des données patient et des sorties multi-agents (CTG, Bishop, RCIU, Apgar). Les probabilités et intervalles de confiance sont cohérents avec les référentiels FIGO, HAS, CNGOF, NICE et ACOG. Aucun risque critique ne justifie une escalade HITL immédiate ; surveillance adaptée et plan de naissance personnalisé recommandés.',
  recommendations: [
    'Surveillance foetale selon HAS 2022 et FIGO 2015.',
    'Maintenir un point HITL si classification CTG pathologique ou Apgar ≤ 6.',
    'Documenter le consentement et les écarts mineurs (Symbolic).',
    'Exporter le rapport clinique (Harvard Cite It Right) pour traçabilité.',
  ],
};

function getRefHarvard(id: string): string {
  const c = CLINICAL_REFERENCES.find((r) => r.id === id);
  return c ? formatHarvard(c) : id;
}

export default function RiskDashboard() {
  const [detailRisk, setDetailRisk] = useState<RiskItem | null>(null);

  const matrixCells: { prob: number; impact: number; risks: string[] }[] = [];
  for (let impact = 5; impact >= 1; impact--) {
    for (let prob = 1; prob <= 5; prob++) {
      const risks = RISKS.filter((r) => r.prob === prob && r.impact === impact).map((r) => r.name);
      matrixCells.push({ prob, impact, risks });
    }
  }

  return (
    <div className="space-y-6">
      {/* Matrice 5x5 */}
      <div className="card">
        <h3 className="text-base font-semibold text-slate-900 mb-2">Matrice de risques (probabilité × impact)</h3>
        <p className="text-xs text-slate-500 mb-4">Positionnement des risques : probabilité 1-5 (abscisse), impact 1-5 (ordonnée).</p>
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-200 rounded-lg text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-200 p-1 text-slate-600 w-20">Impact ↓</th>
                {[1, 2, 3, 4, 5].map((p) => (
                  <th key={p} className="border border-slate-200 p-1 text-slate-600">Prob. {p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map((impact) => (
                <tr key={impact}>
                  <td className="border border-slate-200 p-1 font-medium text-slate-600 bg-slate-50">{impact}</td>
                  {[1, 2, 3, 4, 5].map((prob) => {
                    const cell = matrixCells.find((c) => c.impact === impact && c.prob === prob)!;
                    const severity = prob * impact;
                    const bg = severity >= 15 ? 'bg-red-100' : severity >= 10 ? 'bg-amber-100' : severity >= 5 ? 'bg-amber-50' : 'bg-green-50';
                    return (
                      <td key={prob} className={`border border-slate-200 p-2 align-top min-w-[100px] ${bg}`}>
                        {cell.risks.length > 0 ? (
                          cell.risks.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setDetailRisk(RISKS.find((r) => r.name === name)!)}
                              className="block w-full text-left rounded px-2 py-1 text-xs font-medium text-slate-800 hover:bg-white/80"
                            >
                              {name}
                            </button>
                          ))
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rapport risk assessment */}
      <div className="card">
        <h3 className="text-base font-semibold text-slate-900 mb-2">Rapport de risk assessment</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Résumé diagnostique</p>
            <p className="text-slate-700">{RISK_REPORT.summary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Preuves (données patient)</p>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Risque</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Indicateur</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Valeur</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Seuil</th>
                  </tr>
                </thead>
                <tbody>
                  {RISKS.flatMap((r) => (r.evidence ?? []).map((e, i) => (
                    <tr key={`${r.name}-${i}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{r.name}</td>
                      <td className="px-3 py-2 text-slate-700">{e.field}</td>
                      <td className="px-3 py-2 text-slate-700">{e.value}</td>
                      <td className="px-3 py-2 text-slate-600">{e.seuil}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Sources scientifiques (Harvard Cite It Right)</p>
            <ul className="space-y-1 text-xs text-slate-600">
              {CLINICAL_REFERENCES.slice(0, 5).map((c) => (
                <li key={c.id} className="border-l-2 border-slate-200 pl-2">{formatHarvard(c)}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Recommandations cliniques</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {RISK_REPORT.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RISKS.map((r) => (
          <button
            key={r.name}
            type="button"
            onClick={() => setDetailRisk(r)}
            className="card text-left cursor-pointer transition-colors hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">{r.name}</h3>
              {r.trend === 'up' && (
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898" />
                </svg>
              )}
              {r.trend === 'down' && (
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
                </svg>
              )}
              {r.trend === 'stable' && (
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              )}
            </div>
            <p className={`text-3xl font-bold ${
              r.value > 15 ? 'text-red-600' : r.value > 10 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {r.value}<span className="text-lg">{r.unit}</span>
            </p>
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${
                    r.value > 15 ? 'bg-red-500' : r.value > 10 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(r.value * 2, 100)}%` }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">IC95%: {r.ic95}%</p>
            <p className="text-xs text-slate-400">{r.fullName}</p>
          </button>
        ))}
      </div>

      <ActionModal
        isOpen={!!detailRisk}
        onClose={() => setDetailRisk(null)}
        title={detailRisk ? detailRisk.name : ''}
        size="lg"
        actions={<button type="button" onClick={() => setDetailRisk(null)} className="btn-primary">Fermer</button>}
      >
        {detailRisk && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-700">{detailRisk.fullName}</p>
            <p><strong>Valeur :</strong> {detailRisk.value}{detailRisk.unit} (IC95%: {detailRisk.ic95})</p>
            <p className="text-slate-500">Tendance : {detailRisk.trend === 'up' ? 'Hausse' : detailRisk.trend === 'down' ? 'Baisse' : 'Stable'}.</p>
            {detailRisk.narrative && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Narratif</p>
                <p className="text-slate-700">{detailRisk.narrative}</p>
              </div>
            )}
            {detailRisk.evidence && detailRisk.evidence.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Données probantes / Seuils</p>
                <table className="w-full border border-slate-200 rounded-lg text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Indicateur</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Valeur</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Seuil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRisk.evidence.map((e, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-800">{e.field}</td>
                        <td className="px-3 py-2 text-slate-700">{e.value}</td>
                        <td className="px-3 py-2 text-slate-600">{e.seuil}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {detailRisk.references && detailRisk.references.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Sources Harvard</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {detailRisk.references.map((id) => (
                    <li key={id} className="border-l-2 border-slate-200 pl-2">{getRefHarvard(id)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ActionModal>

      {/* SHAP Features */}
      <div className="card">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Explicabilite - SHAP Feature Importance</h3>
        <p className="text-xs text-slate-500 mb-4">Contribution des variables au risque global (dernier calcul)</p>
        <div className="space-y-3">
          {SHAP_FEATURES.map((f) => (
            <div key={f.name} className="flex items-center gap-4">
              <span className="w-36 text-sm text-slate-600 truncate">{f.name}</span>
              <div className="flex-1">
                <div className="h-6 w-full rounded bg-slate-100 relative">
                  <div
                    className={`h-6 rounded ${
                      f.direction === 'positive' ? 'bg-blue-400' : 'bg-orange-400'
                    }`}
                    style={{ width: `${f.impact * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-12 text-right text-sm font-mono font-medium text-slate-700">
                {(f.impact * 100).toFixed(0)}%
              </span>
              <span className={`text-xs ${f.direction === 'positive' ? 'text-blue-600' : 'text-orange-600'}`}>
                {f.direction === 'positive' ? 'augmente' : 'diminue'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
