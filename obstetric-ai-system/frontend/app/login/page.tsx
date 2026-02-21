'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step2fa = searchParams.get('step') === '2fa';
  const userIdParam = searchParams.get('user_id');
  const [step, setStep] = useState<'credentials' | '2fa'>(step2fa ? '2fa' : 'credentials');
  const [userId, setUserId] = useState<string | null>(step2fa && userIdParam ? userIdParam : null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step2fa && userIdParam) {
      setStep('2fa');
      setUserId(userIdParam);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [step2fa, userIdParam]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Identifiants invalides');
        setLoading(false);
        return;
      }
      if (data.require_2fa && data.user_id) {
        router.replace(`/login?step=2fa&user_id=${encodeURIComponent(data.user_id)}`);
        return;
      }
      router.replace('/dashboard');
      return;
    } catch {
      setError('Erreur de connexion');
    }
    setLoading(false);
  }

  async function handle2FASubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Code invalide');
        setLoading(false);
        return;
      }
      router.replace('/dashboard');
      return;
    } catch {
      setError('Erreur de connexion');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">SOVEREIGNPIALPHA</span>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-blue-600">Obstetric AI</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600">Retour à l&apos;accueil</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              {step === '2fa' && userId ? 'Vérification en deux étapes' : 'Connexion'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {step === '2fa' && userId
                ? 'Saisissez le code à 6 chiffres de votre application d’authentification.'
                : 'Accédez à la plateforme avec votre email et mot de passe.'}
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {error}
              </div>
            )}

            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field mt-1"
                    placeholder="vous@exemple.fr"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">Mot de passe</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field mt-1"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5"
                >
                  {loading ? 'Connexion…' : 'Se connecter'}
                </button>
              </form>
            ) : !userId ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-slate-600">Session 2FA invalide. Veuillez vous reconnecter.</p>
                <button
                  type="button"
                  onClick={() => { router.replace('/login'); setStep('credentials'); setUserId(null); setError(''); }}
                  className="btn-primary w-full py-2.5"
                >
                  Saisir mes identifiants
                </button>
              </div>
            ) : (
              <form onSubmit={handle2FASubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="totp-code" className="block text-sm font-medium text-slate-700">Code à 6 chiffres</label>
                  <input
                    id="totp-code"
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(digits);
                      if (digits.length === 6) {
                        setError('');
                        setLoading(true);
                        fetch('/api/auth/verify-2fa', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ user_id: userId, code: digits }),
                        })
                          .then((res) => res.json().then((data) => ({ res, data })))
                          .then(({ res, data }) => {
                            if (res.ok) router.replace('/dashboard');
                            else setError(data.error || 'Code invalide');
                          })
                          .catch(() => setError('Erreur de connexion'))
                          .finally(() => setLoading(false));
                      }
                    }}
                    className="input-field mt-1 text-center text-lg tracking-[0.4em]"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="btn-primary w-full py-2.5"
                >
                  {loading ? 'Vérification…' : 'Vérifier'}
                </button>
                <button
                  type="button"
                  onClick={() => { router.replace('/login'); setStep('credentials'); setUserId(null); setCode(''); setError(''); }}
                  className="w-full text-sm text-slate-600 hover:text-slate-900"
                >
                  Utiliser un autre compte
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Chargement…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
