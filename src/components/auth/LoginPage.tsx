'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building2,
  ArrowRight,
  CheckCircle,
  Lock,
  Mail,
  Zap,
  Globe,
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

/* ══════════════════════════════════════════════
   CONFIG PER VARIANT
   ══════════════════════════════════════════════ */
type LoginVariant = 'agence' | 'superadmin';

interface LoginConfig {
  type: LoginVariant;
  title: string;
  subtitle: string;
  demoEmail: string;
  demoPassword: string;
  demoLabel: string;
  role: string;
  redirectPath: string;
  bgImage: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accentBg: string;
  accentHover: string;
  accentText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  leftTitle: string;
  leftSubtitle: string;
  leftTagline: string;
  switchText: string;
  switchLink: string;
  switchHref: string;
  features: { icon: typeof QrCode; title: string; desc: string }[];
}

const CONFIGS: Record<LoginVariant, LoginConfig> = {
  agence: {
    type: 'agence',
    title: 'Espace Agence',
    subtitle: 'Connectez-vous à votre espace professionnel',
    demoEmail: 'agence@qrtrans.com',
    demoPassword: 'agence123',
    demoLabel: 'Agence',
    role: 'agency',
    redirectPath: '/agence/tableau-de-bord',
    bgImage: '/images/login-bg.png',
    gradientFrom: '#FF6B35',
    gradientVia: '#FF1D8D',
    gradientTo: '#a855f7',
    accentBg: 'bg-[#FF6B35]',
    accentHover: 'hover:bg-[#e55a25]',
    accentText: 'text-[#FF6B35]',
    badgeBg: 'bg-orange-500/20',
    badgeBorder: 'border-orange-400/30',
    badgeText: 'text-orange-300',
    leftTitle: 'QRTrans pour les professionnels du voyage',
    leftSubtitle: 'Gérez vos colis, vos clients, vos QR — depuis un seul tableau de bord.',
    leftTagline: 'Conçu pour la performance',
    switchText: 'Vous êtes administrateur ?',
    switchLink: 'Connexion Admin →',
    switchHref: '/admin/connexion',
    features: [
      { icon: CheckCircle, title: 'Scan temps réel', desc: 'Suivez chaque colis instantanément' },
      { icon: QrCode, title: 'QR en 1 clic', desc: 'Générez des lots en 30 secondes' },
      { icon: Building2, title: 'Dashboard pro', desc: 'Statuts, trouvailles, rapports' },
      { icon: Shield, title: 'Support 24/7', desc: 'Assistance dédiée aux agences' },
    ],
  },
  superadmin: {
    type: 'superadmin',
    title: 'Espace Administrateur',
    subtitle: 'Accès réservé aux administrateurs système',
    demoEmail: 'admin@qrtrans.com',
    demoPassword: 'admin123',
    demoLabel: 'SuperAdmin',
    role: 'superadmin',
    redirectPath: '/admin/tableau-de-bord',
    bgImage: '/images/login-bg.png',
    gradientFrom: '#1a1a2e',
    gradientVia: '#16213e',
    gradientTo: '#0f3460',
    accentBg: 'bg-[#FF1D8D]',
    accentHover: 'hover:bg-[#e0167a]',
    accentText: 'text-[#FF1D8D]',
    badgeBg: 'bg-[#FF1D8D]/20',
    badgeBorder: 'border-[#FF1D8D]/30',
    badgeText: 'text-[#FF1D8D]',
    leftTitle: 'QRTrans — Contrôle centralisé',
    leftSubtitle: 'Gérez agences, QR codes, utilisateurs et API — tout depuis un seul panneau.',
    leftTagline: 'Sécurité & Performance',
    switchText: 'Vous êtes une agence ?',
    switchLink: 'Connexion Agence →',
    switchHref: '/agence/connexion',
    features: [
      { icon: Shield, title: 'Sécurité renforcée', desc: 'Authentification stricte, logs complets' },
      { icon: Globe, title: 'Panneau centralisé', desc: 'Suivi en temps réel global' },
      { icon: Zap, title: 'API intégrées', desc: 'Green API, géoloc, PDF à la demande' },
      { icon: CheckCircle, title: 'Rôles avancés', desc: 'Agences, admins, agents — contrôlés' },
    ],
  },
};

/* ══════════════════════════════════════════════
   ANIMATION VARIANTS
   ══════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ══════════════════════════════════════════════
   LOGIN PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function LoginPage({ variant }: { variant: LoginVariant }) {
  const config = CONFIGS[variant];
  const router = useRouter();
  const { user, login, loading: authLoading, isAgency, isSuperAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    if (user && ((variant === 'agence' && isAgency) || (variant === 'superadmin' && isSuperAdmin))) {
      router.replace(config.redirectPath);
    }
  }, [user, authLoading, isAgency, isSuperAdmin, variant, router, config.redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: config.role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push(config.redirectPath);
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(config.demoEmail);
    setPassword(config.demoPassword);
  };

  const isAgence = variant === 'agence';

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT: Hero Panel ─── */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[58%] min-h-screen overflow-hidden">
        {/* Background Image */}
        <Image
          src={config.bgImage}
          alt="QRTrans"
          fill
          className="object-cover"
          priority
          sizes="58vw"
        />

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40" />

        {/* Animated accent orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${config.gradientFrom}, transparent)` }}
        />
        <div className="absolute bottom-40 left-10 w-96 h-96 rounded-full opacity-15 blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${config.gradientTo}, transparent)`, animationDelay: '1s' }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 h-full flex flex-col p-10 xl:p-14"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Logo */}
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/15 transition-colors shadow-lg shadow-black/20">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white tracking-tight">QRTrans</span>
                <span className="block text-[11px] text-white/50 font-medium tracking-wider uppercase">
                  {isAgence ? 'Espace Pro' : 'Administration'}
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Content */}
          <div>
            {/* Badge */}
            <motion.div variants={fadeUp} custom={1} className="mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-xl border ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}>
                {isAgence ? <Building2 className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {config.badgeText === 'Admin' ? 'SuperAdmin' : config.badgeText}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2 variants={fadeUp} custom={2} className="text-3xl xl:text-4xl font-extrabold text-white mb-4 leading-tight max-w-xl">
              {config.leftTitle}
            </motion.h2>
            <motion.p variants={fadeUp} custom={3} className="text-white/60 text-base xl:text-lg leading-relaxed max-w-md mb-8">
              {config.leftSubtitle}
            </motion.p>

            {/* Features */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 gap-3 max-w-lg">
              {config.features.map((feat) => (
                <div
                  key={feat.title}
                  className="bg-white/[0.07] backdrop-blur-md rounded-2xl px-5 py-4 border border-white/[0.08] hover:bg-white/[0.12] hover:border-white/[0.15] transition-all duration-300 group"
                >
                  <feat.icon className="w-5 h-5 mb-2 text-white/40 group-hover:text-white/70 transition-colors" />
                  <p className="text-white text-sm font-bold leading-tight">{feat.title}</p>
                  <p className="text-white/40 text-xs mt-1 leading-snug">{feat.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Tagline */}
            <motion.div variants={fadeUp} custom={5} className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] text-white/30 font-semibold tracking-widest uppercase">{config.leftTagline}</span>
              <div className="h-px flex-1 bg-white/10" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="w-full lg:w-[45%] xl:w-[42%] min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6 py-12 sm:px-10 relative">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${config.gradientFrom}20, transparent)` }}
        />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${config.gradientTo}15, transparent)` }}
        />

        <motion.div
          className="w-full max-w-[420px] relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Mobile Logo + Badge */}
          <motion.div variants={fadeUp} custom={0} className="lg:hidden flex flex-col items-center mb-10">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#FF1D8D] flex items-center justify-center shadow-lg shadow-[#FF1D8D]/30">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800 tracking-tight">QRTrans</span>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}>
              {isAgence ? <Building2 className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              {config.badgeText === 'Admin' ? 'SuperAdmin' : config.badgeText}
            </span>
          </motion.div>

          {/* Desktop: Role indicator */}
          <motion.div variants={fadeUp} custom={0} className="hidden lg:flex items-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-lg ${config.accentBg} flex items-center justify-center`}>
              {isAgence ? <Building2 className="w-4 h-4 text-white" /> : <Shield className="w-4 h-4 text-white" />}
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isAgence ? 'Agence' : 'SuperAdmin'}
            </span>
          </motion.div>

          {/* Title */}
          <motion.div variants={fadeUp} custom={1} className="mb-8">
            <h1 className="text-[28px] sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {config.title}
            </h1>
            <p className="text-slate-500 text-[15px]">{config.subtitle}</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200/80 text-red-700 rounded-2xl text-sm flex items-center gap-3 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">⚠️</span>
              </div>
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            variants={stagger}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <motion.div variants={fadeUp} custom={2}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Adresse email
              </label>
              <div className={`relative rounded-2xl border-2 transition-all duration-300 ${
                focusedField === 'email'
                  ? 'border-[#FF1D8D] shadow-lg shadow-[#FF1D8D]/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium rounded-2xl"
                  placeholder={variant === 'agence' ? 'vous@agence.com' : 'admin@qrtrans.com'}
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} custom={3}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className={`relative rounded-2xl border-2 transition-all duration-300 ${
                focusedField === 'password'
                  ? 'border-[#FF1D8D] shadow-lg shadow-[#FF1D8D]/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium rounded-2xl"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Remember / Forgot */}
            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer gap-2.5 group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer h-4 w-4 rounded border-2 border-slate-300 appearance-none cursor-pointer checked:border-[#FF1D8D] checked:bg-[#FF1D8D] transition-colors"
                  />
                  <svg className="absolute left-0.5 top-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Se souvenir de moi</span>
              </label>
              <Link
                href="/forgot-password"
                className={`text-sm font-semibold ${config.accentText} hover:underline transition-colors`}
              >
                Mot de passe oublié ?
              </Link>
            </motion.div>

            {/* Submit */}
            <motion.div variants={fadeUp} custom={5}>
              <button
                type="submit"
                disabled={loading}
                className={`w-full ${config.accentBg} ${config.accentHover} text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-[15px] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${
                  isAgence ? 'shadow-orange-500/25 hover:shadow-orange-500/40' : 'shadow-[#FF1D8D]/25 hover:shadow-[#FF1D8D]/40'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          </motion.form>

          {/* Demo Account */}
          <motion.div
            variants={fadeUp}
            custom={6}
            className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Compte démo
              </h3>
              <button
                type="button"
                onClick={fillDemo}
                className={`text-xs font-bold ${config.accentText} hover:underline transition-colors flex items-center gap-1`}
              >
                Auto-remplir
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                isAgence
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-[#FF1D8D]/10 text-[#FF1D8D]'
              }`}>
                {config.demoLabel}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {config.demoEmail} / {config.demoPassword}
              </span>
            </div>
          </motion.div>

          {/* Switch */}
          <motion.div variants={fadeUp} custom={7} className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              {config.switchText}{' '}
              <Link
                href={config.switchHref}
                className={`font-bold ${config.accentText} hover:underline transition-colors`}
              >
                {config.switchLink}
              </Link>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeUp} custom={8} className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} QRTrans — Tous droits réservés
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
