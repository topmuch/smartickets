'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

type LoginStatus = 'idle' | 'loading' | 'error';

export default function DriverLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setStatus('loading');

      try {
        const res = await fetch('/api/driver/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          router.push('/driver/deliveries');
          return;
        }

        setError(data.error || 'Erreur de connexion');
        setStatus('error');
      } catch {
        setError('Erreur réseau. Vérifiez votre connexion.');
        setStatus('error');
      } finally {
        if (status !== 'idle') setStatus('idle');
      }
    },
    [email, password, router, status],
  );

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d1117] border-b border-gray-800 px-4 py-3 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">
                Smarticket<span className="text-amber-400">S</span>
              </h1>
              <p className="text-[11px] text-gray-400 -mt-0.5">Chauffeur</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Login card */}
          <div className="bg-[#1f2937] border border-gray-700 rounded-2xl p-6 space-y-6">
            {/* Card header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-2">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Connexion Chauffeur</h2>
              <p className="text-sm text-gray-400">
                Accédez à votre espace de livraison
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="driver-email"
                  className="block text-sm font-medium text-gray-300"
                >
                  Email
                </label>
                <input
                  id="driver-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chauffeur@agence.com"
                  className="w-full h-12 px-4 bg-[#111827] border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                  aria-label="Adresse email"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="driver-password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="driver-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 px-4 pr-12 bg-[#111827] border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                    aria-label="Mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 transition-colors"
                    aria-label={
                      showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400" role="alert">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'loading' || !email || !password}
                className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-base transition-all duration-200 ${
                  status !== 'loading' && email && password
                    ? 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 active:scale-[0.98] shadow-lg shadow-amber-500/25'
                    : 'bg-[#374151] text-gray-500 cursor-not-allowed'
                }`}
                aria-label="Se connecter"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'SE CONNECTER'
                )}
              </button>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Espace réservé aux chauffeurs SmarticketS
          </p>
        </div>
      </main>
    </div>
  );
}
