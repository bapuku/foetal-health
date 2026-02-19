'use client';

import { useState, useRef, useEffect } from 'react';
import PageBanner from '@/components/ui/PageBanner';
import StructuredResponse from '@/components/assistant/StructuredResponse';
import FileUploadZone, { type UploadedFileInfo } from '@/components/assistant/FileUploadZone';
import MessageBubble from '@/components/assistant/MessageBubble';
import type { StructuredAIResponse } from '@/lib/assistant-types';
import type { HarvardCitation } from '@/lib/citations';
import { toRis } from '@/lib/citations';

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  sa: number;
  risque: string;
}

const MOCK_PATIENTS: Patient[] = [
  { id: 'P-2024-0847', nom: 'Martin', prenom: 'Sophie', sa: 38, risque: 'bas' },
  { id: 'P-2024-0845', nom: 'Dubois', prenom: 'Marie', sa: 36, risque: 'moyen' },
  { id: 'P-2024-0841', nom: 'Petit', prenom: 'Isabelle', sa: 34, risque: 'eleve' },
  { id: 'P-2024-0839', nom: 'Robert', prenom: 'Amelie', sa: 37, risque: 'moyen' },
  { id: 'P-2024-0831', nom: 'Leroy', prenom: 'Emma', sa: 32, risque: 'eleve' },
];

const ASSISTANT_SUGGESTIONS = [
  'Bonjour, comment puis-je vous aider ?',
  'Resume la situation de la patiente selectionnee',
  'Explique la classification FIGO',
  'Quels sont les risques obstetricaux ?',
  'Recherche recommandations HAS et CNGOF',
  'Evaluer un score Apgar',
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structuredResponse?: StructuredAIResponse;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: '',
      structuredResponse: {
        summary: 'Espace de travail médecin/équipe – Assistant Obstetric AI.',
        narrative: 'Posez des questions sur les patientes, les situations cliniques (CTG, Apgar, risques) et la recherche médicale obstétricale. Les réponses sont structurées (résumé, narratif technique, métriques, recommandations) et sourcées en Harvard Cite It Right. Vous pouvez joindre des fichiers pour enrichir le contexte (RAG) et sélectionner une patiente à droite.',
        references: [],
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedPatient = MOCK_PATIENTS.find((p) => p.id === selectedPatientId);

  const sessionReferences = (() => {
    const seen = new Set<string>();
    const refs: HarvardCitation[] = [];
    messages.forEach((m) => {
      m.structuredResponse?.references?.forEach((r) => {
        if (r.id && !seen.has(r.id)) {
          seen.add(r.id);
          refs.push(r);
        }
      });
    });
    return refs;
  })();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let filesForContext: { name: string; content: string; type: string }[] = [];
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach(({ file }) => formData.append('files', file));
        const uploadRes = await fetch('/api/assistant/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          filesForContext = (data.files || []).map((f: { name: string; extractedText: string; type: string }) => ({
            name: f.name,
            content: f.extractedText || '',
            type: f.type || '',
          }));
        }
      }

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          patientId: selectedPatientId || undefined,
          patientContext: selectedPatient
            ? { id: selectedPatient.id, nom: selectedPatient.nom, prenom: selectedPatient.prenom, sa: selectedPatient.sa, risque: selectedPatient.risque }
            : undefined,
          files: filesForContext,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const structured = (await res.json()) as StructuredAIResponse;
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: structured.summary,
        structuredResponse: structured,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Une erreur est survenue. Reessayez.',
      };
      setMessages((m) => [...m, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleExportRis() {
    const ris = toRis(sessionReferences);
    const blob = new Blob([ris], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assistant_references_${new Date().toISOString().slice(0, 10)}.ris`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <PageBanner src="/images/doctor-scans.png" alt="Assistant IA" title="Assistant IA" subtitle="Espace de travail médecin/équipe – interrogations, RAG, réponses structurées Harvard" />

      <div className="flex gap-4 min-h-[60vh]">
        {/* Colonne gauche : conversation */}
        <div className="flex w-[70%] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h1 className="text-lg font-semibold text-slate-900">Assistant Obstetric AI</h1>
            <p className="text-xs text-slate-500">Réponses hyperstructurées, narratif technique, Harvard Cite It Right</p>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-blue-600 px-4 py-2.5 text-sm text-white">
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              ) : msg.structuredResponse ? (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[95%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">
                    <StructuredResponse data={msg.structuredResponse} />
                  </div>
                </div>
              ) : (
                <MessageBubble key={msg.id} role="assistant" content={msg.content} />
              )
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-500">En train d&apos;écrire...</div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {ASSISTANT_SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInput(q)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Votre question (patient, CTG, Apgar, risques, recherche...)"
                className="input-field flex-1"
                disabled={loading}
              />
              <button type="button" onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary shrink-0">
                Envoyer
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite : contexte */}
        <div className="flex w-[30%] flex-col gap-4 overflow-y-auto">
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Contexte patient</h2>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="input-field w-full text-sm"
            >
              <option value="">Aucune patiente</option>
              {MOCK_PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prenom} {p.nom} ({p.id}) — {p.sa} SA
                </option>
              ))}
            </select>
          </div>
          <div className="card">
            <FileUploadZone files={uploadedFiles} onFilesChange={setUploadedFiles} disabled={loading} />
          </div>
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Références de la session (Harvard)</h2>
            {sessionReferences.length === 0 ? (
              <p className="text-xs text-slate-500">Les références apparaîtront au fil de la conversation.</p>
            ) : (
              <>
                <ul className="space-y-1 text-xs text-slate-600 mb-3 max-h-48 overflow-y-auto">
                  {sessionReferences.map((r) => (
                    <li key={r.id} className="border-l-2 border-slate-200 pl-2">
                      {r.authors} ({r.year}). {r.title}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={handleExportRis} className="btn-secondary text-xs w-full">
                  Exporter EndNote (.ris)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
