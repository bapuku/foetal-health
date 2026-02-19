'use client';

import { useState, useEffect } from 'react';
import PageBanner from '@/components/ui/PageBanner';

type TabId = 'observability' | 'connections' | 'alerts';

const TABS: { id: TabId; label: string }[] = [
  { id: 'observability', label: 'Observabilité' },
  { id: 'connections', label: 'Connexions APIs hôpital' },
  { id: 'alerts', label: 'Alertes (SMS, email, WhatsApp)' },
];

interface ObservabilityData {
  services: { name: string; status: string; latencyMs?: number; requestsPerMin?: number }[];
  grafanaUrl?: string;
  prometheusUrl?: string;
  logsUrl?: string;
}

interface ConnectionConfig {
  fhir: { baseUrl: string; authType: string };
  hl7: { endpoint: string; enabled: boolean };
  other: { endpoints: { name: string; url: string }[] };
}

interface AlertConfig {
  email: { enabled: boolean; provider: string; from: string; apiKeyConfigured: boolean };
  sms: { enabled: boolean; provider: string; from: string; configured: boolean };
  whatsapp: { enabled: boolean; provider: string; from: string; configured: boolean };
  recipients: { type: string; email?: string; phone?: string }[];
}

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>('observability');
  const [observability, setObservability] = useState<ObservabilityData | null>(null);
  const [connections, setConnections] = useState<ConnectionConfig | null>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testChannel, setTestChannel] = useState<'email' | 'sms' | 'whatsapp' | null>(null);
  const [testTarget, setTestTarget] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/observability').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/connections').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/alert-config').then((r) => (r.ok ? r.json() : null)),
    ]).then(([obs, conn, alert]) => {
      setObservability(obs ?? null);
      setConnections(conn ?? null);
      setAlertConfig(alert ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveConnections = async (payload: ConnectionConfig) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) setConnections(payload);
    } finally {
      setSaving(false);
    }
  };

  const saveAlertConfig = async (payload: AlertConfig) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/alert-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) setAlertConfig(payload);
    } finally {
      setSaving(false);
    }
  };

  const sendTestAlert = async (channel: 'email' | 'sms' | 'whatsapp', target: string) => {
    setTestChannel(channel);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/send-test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, target }),
      });
      const data = await res.json().catch(() => ({}));
      setTestResult(res.ok ? (data.message || 'Envoyé.') : (data.error || res.statusText));
    } finally {
      setTestChannel(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageBanner src="/images/doctor-ultrasound.png" alt="Administration" title="Administration" subtitle="Observabilité, connexions APIs hôpital et alertes (SMS, email, WhatsApp)" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm text-slate-500">
          Observabilité, connexions aux systèmes hospitaliers et configuration des alertes (SMS, email, WhatsApp).
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-slate-100 text-slate-900 border-b-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Chargement…</p>
      )}

      {!loading && tab === 'observability' && (
        <ObservabilityTab data={observability} />
      )}
      {!loading && tab === 'connections' && (
        <ConnectionsTab data={connections} saving={saving} onSave={saveConnections} />
      )}
      {!loading && tab === 'alerts' && (
        <AlertsTab
          data={alertConfig}
          saving={saving}
          onSave={saveAlertConfig}
          testChannel={testChannel}
          testTarget={testTarget}
          setTestTarget={setTestTarget}
          testResult={testResult}
          onSendTest={sendTestAlert}
        />
      )}
    </div>
  );
}

function ObservabilityTab({ data }: { data: ObservabilityData | null }) {
  const services = data?.services ?? [
    { name: 'CTG Monitor', status: 'up', latencyMs: 12, requestsPerMin: 42 },
    { name: 'Apgar', status: 'up', latencyMs: 8, requestsPerMin: 18 },
    { name: 'FHIR Client', status: 'up', latencyMs: 45, requestsPerMin: 120 },
    { name: 'Frontend', status: 'up', latencyMs: 5, requestsPerMin: 200 },
  ];
  const grafanaUrl = data?.grafanaUrl ?? process.env.NEXT_PUBLIC_GRAFANA_URL;
  const prometheusUrl = data?.prometheusUrl ?? process.env.NEXT_PUBLIC_PROMETHEUS_URL;
  const logsUrl = data?.logsUrl ?? process.env.NEXT_PUBLIC_LOGS_URL;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">État des services</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4">Service</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Latence (ms)</th>
                <th className="pb-2">Req/min</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.name} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{s.name}</td>
                  <td className="py-2 pr-4">
                    <span className={s.status === 'up' ? 'text-emerald-600' : 'text-amber-600'}>
                      {s.status === 'up' ? 'Opérationnel' : 'Dégradé'}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{s.latencyMs ?? '—'}</td>
                  <td className="py-2">{s.requestsPerMin ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Liens externes</h2>
        <ul className="space-y-2 text-sm">
          {grafanaUrl && (
            <li>
              <a href={grafanaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Grafana
              </a>
            </li>
          )}
          {prometheusUrl && (
            <li>
              <a href={prometheusUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Prometheus
              </a>
            </li>
          )}
          {logsUrl && (
            <li>
              <a href={logsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Journaux (ELK / autre)
              </a>
            </li>
          )}
          {!grafanaUrl && !prometheusUrl && !logsUrl && (
            <li className="text-slate-500">
              Configurer NEXT_PUBLIC_GRAFANA_URL, NEXT_PUBLIC_PROMETHEUS_URL ou NEXT_PUBLIC_LOGS_URL pour afficher les liens.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ConnectionsTab({
  data,
  saving,
  onSave,
}: {
  data: ConnectionConfig | null;
  saving: boolean;
  onSave: (c: ConnectionConfig) => void;
}) {
  const [fhirUrl, setFhirUrl] = useState(data?.fhir?.baseUrl ?? '');
  const [fhirAuth, setFhirAuth] = useState(data?.fhir?.authType ?? 'none');
  const [hl7Endpoint, setHl7Endpoint] = useState(data?.hl7?.endpoint ?? '');
  const [hl7Enabled, setHl7Enabled] = useState(data?.hl7?.enabled ?? false);
  const [otherEndpoints, setOtherEndpoints] = useState(data?.other?.endpoints ?? []);

  useEffect(() => {
    if (data) {
      setFhirUrl(data.fhir?.baseUrl ?? '');
      setFhirAuth(data.fhir?.authType ?? 'none');
      setHl7Endpoint(data.hl7?.endpoint ?? '');
      setHl7Enabled(data.hl7?.enabled ?? false);
      setOtherEndpoints(data.other?.endpoints ?? []);
    }
  }, [data]);

  const handleSave = () => {
    onSave({
      fhir: { baseUrl: fhirUrl, authType: fhirAuth },
      hl7: { endpoint: hl7Endpoint, enabled: hl7Enabled },
      other: { endpoints: otherEndpoints },
    });
  };

  const addOther = () => setOtherEndpoints([...otherEndpoints, { name: '', url: '' }]);
  const updateOther = (i: number, field: 'name' | 'url', value: string) => {
    const next = [...otherEndpoints];
    next[i] = { ...next[i], [field]: value };
    setOtherEndpoints(next);
  };
  const removeOther = (i: number) => setOtherEndpoints(otherEndpoints.filter((_, j) => j !== i));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">FHIR R4</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">URL de base</label>
            <input
              type="url"
              value={fhirUrl}
              onChange={(e) => setFhirUrl(e.target.value)}
              placeholder="https://fhir.hopital.example/fhir"
              className="input-field w-full max-w-md"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Authentification</label>
            <select
              value={fhirAuth}
              onChange={(e) => setFhirAuth(e.target.value)}
              className="input-field w-full max-w-xs"
            >
              <option value="none">Aucune</option>
              <option value="bearer">Bearer token</option>
              <option value="basic">Basic</option>
            </select>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">HL7</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hl7Enabled} onChange={(e) => setHl7Enabled(e.target.checked)} />
            <span className="text-sm">Activer HL7</span>
          </label>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Endpoint</label>
            <input
              type="text"
              value={hl7Endpoint}
              onChange={(e) => setHl7Endpoint(e.target.value)}
              placeholder="tcp://mllp:2575"
              className="input-field w-full max-w-md"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Autres APIs (PACS, labo, etc.)</h2>
        {otherEndpoints.map((e, i) => (
          <div key={i} className="mb-3 flex gap-2">
            <input
              type="text"
              value={e.name}
              onChange={(ev) => updateOther(i, 'name', ev.target.value)}
              placeholder="Nom"
              className="input-field flex-1"
            />
            <input
              type="url"
              value={e.url}
              onChange={(ev) => updateOther(i, 'url', ev.target.value)}
              placeholder="URL"
              className="input-field flex-1"
            />
            <button type="button" onClick={() => removeOther(i)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Supprimer
            </button>
          </div>
        ))}
        <button type="button" onClick={addOther} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
          + Ajouter un endpoint
        </button>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer les connexions'}
      </button>
    </div>
  );
}

function AlertsTab({
  data,
  saving,
  onSave,
  testChannel,
  testTarget,
  setTestTarget,
  testResult,
  onSendTest,
}: {
  data: AlertConfig | null;
  saving: boolean;
  onSave: (a: AlertConfig) => void;
  testChannel: 'email' | 'sms' | 'whatsapp' | null;
  testTarget: string;
  setTestTarget: (v: string) => void;
  testResult: string | null;
  onSendTest: (channel: 'email' | 'sms' | 'whatsapp', target: string) => void;
}) {
  const [emailEnabled, setEmailEnabled] = useState(data?.email?.enabled ?? false);
  const [emailFrom, setEmailFrom] = useState(data?.email?.from ?? '');
  const [smsEnabled, setSmsEnabled] = useState(data?.sms?.enabled ?? false);
  const [smsFrom, setSmsFrom] = useState(data?.sms?.from ?? '');
  const [waEnabled, setWaEnabled] = useState(data?.whatsapp?.enabled ?? false);
  const [waFrom, setWaFrom] = useState(data?.whatsapp?.from ?? '');
  const [recipients, setRecipients] = useState(data?.recipients ?? []);

  useEffect(() => {
    if (data) {
      setEmailEnabled(data.email?.enabled ?? false);
      setEmailFrom(data.email?.from ?? '');
      setSmsEnabled(data.sms?.enabled ?? false);
      setSmsFrom(data.sms?.from ?? '');
      setWaEnabled(data.whatsapp?.enabled ?? false);
      setWaFrom(data.whatsapp?.from ?? '');
      setRecipients(data.recipients ?? []);
    }
  }, [data]);

  const handleSave = () => {
    onSave({
      email: { enabled: emailEnabled, provider: 'sendgrid', from: emailFrom, apiKeyConfigured: !!process.env.SENDGRID_API_KEY },
      sms: { enabled: smsEnabled, provider: 'twilio', from: smsFrom, configured: !!process.env.TWILIO_ACCOUNT_SID },
      whatsapp: { enabled: waEnabled, provider: 'twilio', from: waFrom, configured: !!process.env.TWILIO_WHATSAPP_FROM },
      recipients,
    });
  };

  const addRecipient = () => setRecipients([...recipients, { type: 'critical', email: '', phone: '' }]);
  const updateRecipient = (i: number, field: string, value: string) => {
    const next = [...recipients];
    next[i] = { ...next[i], [field]: value };
    setRecipients(next);
  };
  const removeRecipient = (i: number) => setRecipients(recipients.filter((_, j) => j !== i));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Email</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
            <span className="text-sm">Activer les alertes email (SendGrid / SMTP)</span>
          </label>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Expéditeur (From)</label>
            <input
              type="text"
              value={emailFrom}
              onChange={(e) => setEmailFrom(e.target.value)}
              placeholder="alerts@hopital.example"
              className="input-field w-full max-w-md"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">SMS (Twilio)</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />
            <span className="text-sm">Activer les alertes SMS</span>
          </label>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Numéro expéditeur</label>
            <input
              type="text"
              value={smsFrom}
              onChange={(e) => setSmsFrom(e.target.value)}
              placeholder="+33..."
              className="input-field w-full max-w-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">WhatsApp (Twilio)</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={waEnabled} onChange={(e) => setWaEnabled(e.target.checked)} />
            <span className="text-sm">Activer les alertes WhatsApp</span>
          </label>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Numéro / canal expéditeur</label>
            <input
              type="text"
              value={waFrom}
              onChange={(e) => setWaFrom(e.target.value)}
              placeholder="whatsapp:+33..."
              className="input-field w-full max-w-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Destinataires par type d&apos;alerte</h2>
        {recipients.map((r, i) => (
          <div key={i} className="mb-3 flex flex-wrap gap-2">
            <select
              value={r.type}
              onChange={(e) => updateRecipient(i, 'type', e.target.value)}
              className="input-field w-32"
            >
              <option value="critical">Critique</option>
              <option value="hitl">HITL</option>
              <option value="info">Info</option>
            </select>
            <input
              type="text"
              value={r.email ?? ''}
              onChange={(e) => updateRecipient(i, 'email', e.target.value)}
              placeholder="Email"
              className="input-field w-48"
            />
            <input
              type="text"
              value={r.phone ?? ''}
              onChange={(e) => updateRecipient(i, 'phone', e.target.value)}
              placeholder="Téléphone"
              className="input-field w-36"
            />
            <button type="button" onClick={() => removeRecipient(i)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Supprimer
            </button>
          </div>
        ))}
        <button type="button" onClick={addRecipient} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
          + Ajouter un destinataire
        </button>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Test d&apos;envoi</h2>
        <p className="mb-3 text-xs text-slate-600">
          Envoyer un message de test. Les clés API (Twilio, SendGrid) doivent être définies côté serveur (variables d&apos;environnement).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Email ou numéro</label>
            <input
              type="text"
              value={testTarget}
              onChange={(e) => setTestTarget(e.target.value)}
              placeholder="email@exemple.com ou +33..."
              className="input-field w-64"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSendTest('email', testTarget)}
              disabled={!testTarget || !!testChannel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Test email
            </button>
            <button
              type="button"
              onClick={() => onSendTest('sms', testTarget)}
              disabled={!testTarget || !!testChannel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Test SMS
            </button>
            <button
              type="button"
              onClick={() => onSendTest('whatsapp', testTarget)}
              disabled={!testTarget || !!testChannel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Test WhatsApp
            </button>
          </div>
        </div>
        {testChannel && <p className="mt-2 text-sm text-slate-500">Envoi en cours…</p>}
        {testResult !== null && (
          <p className={`mt-2 text-sm ${testResult.startsWith('Envoyé') ? 'text-emerald-600' : 'text-amber-600'}`}>
            {testResult}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer la configuration des alertes'}
      </button>
    </div>
  );
}
