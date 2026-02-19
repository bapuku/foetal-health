'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AssistantPanel from '@/components/assistant/AssistantPanel';

const CAPABILITIES = [
  {
    title: 'Monitoring CTG temps réel',
    description: 'Classification FIGO 2015, alertes HITL, explications SHAP.',
    image: '/images/ctg-monitor.png',
    href: '/dashboard/ctg',
  },
  {
    title: 'Analyse Échographique',
    description: 'Outils d’analyse et suivi échographique intégrés.',
    image: '/images/ultrasound-exam.png',
    href: '/dashboard/tools',
  },
  {
    title: 'Évaluation Score Apgar',
    description: 'Score néonatal et escalade HITL pédiatrique.',
    image: '/images/hero-newborn.png',
    href: '/dashboard/risks',
  },
  {
    title: 'Suivi Prénatal',
    description: 'Patients, risques, parcours de soins.',
    image: '/images/prenatal-checkup.png',
    href: '/dashboard/patients',
  },
  {
    title: 'Rapports Cliniques',
    description: 'Rapports structurés Harvard, export EndNote.',
    image: '/images/doctor-scans.png',
    href: '/dashboard/reports',
  },
  {
    title: '10 Agents IA Spécialisés',
    description: 'CTG, Apgar, Bishop, RCIU, Symbolic, Polygraph, etc.',
    image: '/images/surgical-team.png',
    href: '/dashboard/skills',
  },
];

const STATS = [
  { value: '< 2 s', label: 'Temps de réponse' },
  { value: '10', label: 'Agents spécialisés' },
  { value: 'FIGO 2015', label: 'Classification CTG' },
  { value: 'HITL', label: 'Surveillance humaine' },
];

const COMPLIANCE_BADGES = [
  'EU AI Act (haut risque)',
  'EU MDR Classe IIb',
  'ISO 14971',
  'ISO 13485',
  'ISO 27001',
  'RGPD',
];

export default function LandingPage() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">SOVEREIGNPIALPHA</span>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-blue-600">Obstetric AI</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#capacites" className="text-sm font-medium text-slate-600 hover:text-blue-600">Fonctionnalités</a>
            <a href="#conformite" className="text-sm font-medium text-slate-600 hover:text-blue-600">Conformité</a>
            <a href="#technologie" className="text-sm font-medium text-slate-600 hover:text-blue-600">Technologie</a>
            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600">Contact</a>
            <button
              type="button"
              onClick={() => setAssistantOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Assistant IA
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Accéder à la plateforme
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] overflow-hidden pt-16">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-newborn.png"
            alt="Soin néonatal"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 landing-hero-gradient" />
        </div>
        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8 lg:max-w-2xl">
          <motion.h1
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Intelligence obstétricale de rupture
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-slate-200 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Surveillance foeto-maternelle assistée par IA. Conforme EU AI Act et EU MDR. Décision clinique éclairée, HITL et traçabilité.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              Découvrir la plateforme
            </Link>
            <Link
              href="/dashboard/ctg"
              className="rounded-lg border border-white/80 bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Voir une démo CTG
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Capacités - badges cliquables */}
      <section id="capacites" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Capacités de la plateforme</h2>
            <p className="mt-3 text-lg text-slate-600">Cliquez sur une carte pour accéder à une démonstration concrète.</p>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={cap.href} className="landing-badge-card flex h-full flex-col">
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <Image
                      src={cap.image}
                      alt={cap.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-slate-900">{cap.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-slate-600">{cap.description}</p>
                    <span className="mt-2 text-sm font-medium text-blue-600">Voir la démo →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistiques / Impact */}
      <section className="border-t border-slate-200 landing-section-alt py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              className="relative h-80 overflow-hidden rounded-2xl lg:h-96"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Image
                src="/images/prenatal-consultation.png"
                alt="Consultation prénatale"
                fill
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-slate-900/20" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Impact clinique</h2>
              <p className="mt-4 text-slate-600">
                Plateforme agentique conçue pour la surveillance foeto-maternelle : classification CTG en temps réel, score Apgar, suivi des risques et rapports structurés. Human-in-the-loop pour les cas pathologiques et conformité réglementaire.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conformité & Legal */}
      <section id="conformite" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Conformité & cadre légal</h2>
              <p className="mt-4 text-slate-600">
                Solution développée et propriété de <strong>SOVEREIGNPIALPHA FRANCE LTD</strong>. Conformité EU AI Act (système à haut risque, Annexe III §5 Santé), EU MDR 2017/745 Classe IIb, ISO 14971 (gestion des risques), ISO 13485 (qualité dispositifs médicaux), ISO 27001 (sécurité de l’information) et RGPD.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {COMPLIANCE_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <motion.div
              className="relative h-80 overflow-hidden rounded-2xl lg:h-96"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Image
                src="/images/doctor-ultrasound.png"
                alt="Revue échographique"
                fill
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-slate-900/20" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technologie */}
      <section id="technologie" className="border-t border-slate-200 landing-section-alt py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              className="relative h-80 overflow-hidden rounded-2xl lg:order-2 lg:h-96"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Image
                src="/images/ultrasound-prints.png"
                alt="Données échographiques"
                fill
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-slate-900/20" />
            </motion.div>
            <div className="lg:order-1">
              <h2 className="text-3xl font-bold text-slate-900">Technologie</h2>
              <p className="mt-4 text-slate-600">
                Architecture multi-agents (10 microservices spécialisés), LLM Router (Claude, Mistral, Granite, GPT-4o), client FHIR R4, chaîne d’audit SHA-256 (conservation 10 ans), Human-in-the-Loop pour CTG pathologique et Apgar bas. Explicabilité (SHAP, GradCAM) et références aux guidelines HAS, FIGO, CNGOF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Link href="/dashboard" className="group relative block h-64 overflow-hidden rounded-2xl">
              <Image src="/images/delivery-room.png" alt="Salle d'accouchement" fill className="object-cover transition-transform group-hover:scale-105" sizes="50vw" />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 transition-colors group-hover:bg-slate-900/60">
                <span className="rounded-lg bg-white px-6 py-3 font-medium text-slate-900 shadow-lg transition-transform group-hover:scale-105">
                  Accéder à la plateforme
                </span>
              </div>
            </Link>
            <a href="#contact" className="group relative block h-64 overflow-hidden rounded-2xl cursor-pointer">
              <Image src="/images/labor-monitoring.png" alt="Surveillance travail" fill className="object-cover transition-transform group-hover:scale-105" sizes="50vw" />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 transition-colors group-hover:bg-slate-900/60">
                <span className="rounded-lg border-2 border-white px-6 py-3 font-medium text-white shadow-lg transition-transform group-hover:scale-105">
                  Contacter l&apos;equipe
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Contactez-nous</h2>
              <p className="mt-3 text-slate-600">
                Demandez une demonstration, un devis ou plus d&apos;informations sur Obstetric AI.
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  contact@sovereignpialpha.com
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  36 rue Scheffer, 75116 Paris
                </div>
              </div>
            </div>
            <form
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              onSubmit={(e) => { e.preventDefault(); alert('Message envoye ! Nous vous recontacterons rapidement.'); }}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nom</label>
                <input type="text" required className="input-field" placeholder="Dr. Dupont" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <input type="email" required className="input-field" placeholder="medecin@hopital.fr" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
                <textarea required rows={4} className="input-field" placeholder="Je souhaite une demonstration..."></textarea>
              </div>
              <button type="submit" className="btn-primary w-full">Envoyer</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-semibold text-white">SOVEREIGNPIALPHA FRANCE LTD</p>
              <p className="mt-2 text-sm">36 rue Scheffer<br />75116 Paris, France</p>
            </div>
            <div>
              <p className="font-semibold text-white">Liens</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li><Link href="/dashboard" className="hover:text-white">Plateforme</Link></li>
                <li><a href="#capacites" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#conformite" className="hover:text-white">Conformité</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">Legal</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white">CGV</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">Conformité</p>
              <p className="mt-2 text-xs text-slate-400">
                EU AI Act (haut risque), EU MDR Classe IIb, ISO 14971, ISO 13485, ISO 27001. Solution développée et propriété de SOVEREIGNPIALPHA FRANCE LTD.
              </p>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-700 pt-8 sm:flex-row">
            <p className="text-sm text-slate-500">© 2024-2026 SOVEREIGNPIALPHA FRANCE LTD. Tous droits réservés.</p>
            <div className="mt-4 flex gap-6 sm:mt-0">
              <a href="#" className="text-slate-500 hover:text-white" aria-label="LinkedIn">LinkedIn</a>
              <a href="#" className="text-slate-500 hover:text-white" aria-label="Twitter">Twitter</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Assistant button */}
      <button
        type="button"
        onClick={() => setAssistantOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all ${
          assistantOpen ? 'bg-blue-700 text-white scale-90' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110'
        }`}
        title={assistantOpen ? "Fermer l'assistant" : "Ouvrir l'assistant IA"}
        aria-label="Assistant IA"
      >
        {assistantOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>

      {/* Assistant AI panel */}
      <AssistantPanel isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
