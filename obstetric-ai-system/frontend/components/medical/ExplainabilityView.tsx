'use client';

export default function ExplainabilityView() {
  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Transparence IA - Explicabilite</h2>
        <p className="text-xs text-slate-500">Conformite EU AI Act - Haut risque : traçabilite et explicabilite obligatoires</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* SHAP */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded bg-blue-100 p-1.5">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">SHAP Values</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Feature importance locale et globale. Force plots pour chaque prediction individuelle. 
            Top features : FHR baseline, variabilite STV, age gestationnel.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="badge-info">Global</span>
            <span className="badge-info">Local</span>
          </div>
        </div>

        {/* GradCAM */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded bg-purple-100 p-1.5">
              <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Grad-CAM</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Heatmap temporelle sur le trace CTG. Identification des segments critiques ayant declenche la classification.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="badge-info">CNN</span>
            <span className="badge-info">Temporel</span>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded bg-green-100 p-1.5">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Audit Trail</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chaine de hachage SHA-256 immuable. Chaque decision tracee avec modele, version, timestamp, entrees/sorties.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="badge-ok">SHA-256</span>
            <span className="badge-ok">10 ans</span>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-500 mb-2">Modeles utilises</p>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded bg-white p-2 border border-slate-200">
            <p className="font-medium text-slate-700">Claude (Anthropic)</p>
            <p className="text-slate-400">Narratifs cliniques</p>
          </div>
          <div className="rounded bg-white p-2 border border-slate-200">
            <p className="font-medium text-slate-700">Mistral (HF)</p>
            <p className="text-slate-400">Raisonnement rapide</p>
          </div>
          <div className="rounded bg-white p-2 border border-slate-200">
            <p className="font-medium text-slate-700">Granite (HF)</p>
            <p className="text-slate-400">Classification medicale</p>
          </div>
          <div className="rounded bg-white p-2 border border-slate-200">
            <p className="font-medium text-slate-700">CTG-CNN (PyTorch)</p>
            <p className="text-slate-400">Classification FIGO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
