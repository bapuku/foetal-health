'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import MessageBubble from './MessageBubble';
import SuggestedQuestions from './SuggestedQuestions';
import { analyzeCTG, evaluateApgar, healthCTG, healthApgar } from '@/lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function detectIntent(text: string): string {
  const t = text.toLowerCase().trim();
  if (/\b(ctg|analyse ctg|classification figo|fhr|cardio)\b/.test(t)) return 'ctg';
  if (/\b(apgar|score apgar|evaluer apgar|neonatal)\b/.test(t)) return 'apgar';
  if (/\b(rapport|generer|rapports)\b/.test(t)) return 'report';
  if (/\b(agents?|en ligne|sante|status|health)\b/.test(t)) return 'health';
  if (/\b(explique|figo|shap|recommandation)\b/.test(t)) return 'explain';
  if (/\b(bonjour|hello|salut)\b/.test(t)) return 'greeting';
  return 'default';
}

export default function AssistantPanel({ isOpen, onClose }: AssistantPanelProps) {
  const pathname = usePathname() ?? '/dashboard';
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: 'Bonjour, je suis l\'assistant Obstetric AI. Posez une question ou choisissez une suggestion ci-dessous.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const intent = detectIntent(text);
      let reply = '';

      switch (intent) {
        case 'ctg': {
          try {
            const out = await analyzeCTG({
              baseline_bpm: 140,
              stv_ms: 12,
              decelerations_light: 0,
              decelerations_severe: 0,
            });
            reply = `Analyse CTG effectuee.\nClassification FIGO : **${out.classification}** (confiance ${(out.confidence * 100).toFixed(0)}%).\n${out.narrative}${out.hitl_required ? '\n\nValidation humaine (HITL) requise.' : ''}`;
          } catch (e) {
            reply = `Impossible de contacter l'agent CTG (port 8000). Verifiez qu\'il est demarre.`;
          }
          break;
        }
        case 'apgar': {
          try {
            const out = await evaluateApgar({ apgar_1min: 8, apgar_5min: 9 });
            reply = `Evaluation Apgar : ${out.narrative}${out.risk_apgar_low ? ' Risque Apgar bas identifie.' : ''}${out.hitl_required ? ' Validation pediatre (HITL) requise.' : ''}`;
          } catch (e) {
            reply = `Impossible de contacter l'agent Apgar (port 8001). Verifiez qu\'il est demarre.`;
          }
          break;
        }
        case 'report':
          reply = 'Pour generer un rapport structure (Harvard Cite It Right, triangulation), allez dans **Rapports** via le menu, selectionnez une patiente et cliquez sur "Generer un rapport". Vous pourrez afficher et exporter en PDF.';
          break;
        case 'health': {
          const results: string[] = [];
          try {
            const ctg = await healthCTG();
            results.push(`CTG Monitor (8000) : ${ctg.status}`);
          } catch {
            results.push('CTG Monitor (8000) : hors ligne');
          }
          try {
            const apgar = await healthApgar();
            results.push(`Apgar (8001) : ${apgar.status}`);
          } catch {
            results.push('Apgar (8001) : hors ligne');
          }
          reply = 'Statut des agents :\n' + results.join('\n') + '\n\nLes autres agents (8002-8009) sont listes dans la sidebar.';
          break;
        }
        case 'explain':
          reply = '**Classification FIGO** (2015) : Normal (FHR 110-160 bpm, variabilite 5-25 bpm, accelerations, pas de decelerations), Suspect (1 critere anormal), Pathologique (2+ criteres). En cas de pathologique, un HITL (validation clinicien) est declenche. Les features SHAP expliquent le poids de chaque variable (FHR baseline, STV, etc.).';
          break;
        case 'greeting':
          reply = 'Bonjour. Je peux vous aider a lancer une analyse CTG ou Apgar, consulter le statut des agents, generer un rapport ou expliquer une classification. Que souhaitez-vous faire ?';
          break;
        default:
          reply = 'Je peux vous aider a : lancer une analyse CTG, evaluer un score Apgar, generer un rapport patient, expliquer la classification FIGO, ou afficher le statut des agents. Reformulez ou choisissez une suggestion.';
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply.replace(/\*\*(.*?)\*\*/g, '$1'),
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

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-20 flex w-[380px] flex-col border-l border-slate-200 bg-white shadow-lg">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <h2 className="text-sm font-semibold text-slate-900">OBSTETRIC AI Assistant</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fermer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
              En train d&apos;ecrire...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4 space-y-3">
        <SuggestedQuestions pathname={pathname} onSelect={(q) => setInput(q)} />
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Votre message..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-primary shrink-0"
          >
            Envoyer
          </button>
        </div>
      </div>
    </aside>
  );
}
