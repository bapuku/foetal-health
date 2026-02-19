import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Obstetric AI | Santé Fœtale - SOVEREIGNPIALPHA FRANCE LTD',
  description: 'Plateforme agentique de surveillance foeto-maternelle. Conforme EU AI Act, EU MDR Classe IIb, ISO. Intelligence obstétricale de rupture.',
  openGraph: {
    title: 'Obstetric AI - Santé Fœtale',
    description: 'Plateforme agentique de surveillance foeto-maternelle. Conforme EU AI Act, EU MDR Classe IIb.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
