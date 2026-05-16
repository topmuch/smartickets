'use client';

import { QrCode, Truck, Globe } from 'lucide-react';

interface ActivationHeaderProps {
  qrCode: string;
  onLangChange: (lang: 'fr' | 'en') => void;
  currentLang: 'fr' | 'en';
}

export default function ActivationHeader({ qrCode, onLangChange, currentLang }: ActivationHeaderProps) {
  return (
    <header className="bg-black text-white sticky top-0 z-50">
      <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">QRTrans</span>
        </div>

        {/* Center: Badge */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#FF6B35]/15 border border-[#FF6B35]/30 rounded-full px-3 py-1">
          <Truck className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span className="text-xs font-semibold text-[#FF6B35]">
            {currentLang === 'fr' ? 'Mode Chauffeur' : 'Driver Mode'}
          </span>
        </div>

        {/* Right: Lang */}
        <button
          onClick={() => onLangChange(currentLang === 'fr' ? 'en' : 'fr')}
          className="flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white transition-colors"
          aria-label="Switch language"
        >
          <Globe className="w-3.5 h-3.5" />
          {currentLang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      {/* Subtitle */}
      {qrCode && (
        <div className="max-w-[600px] mx-auto px-4 pb-3">
          <p className="text-white/50 text-xs">
            {currentLang === 'fr' ? "Activation d'un colis en transit" : 'Package transit activation'} — <span className="font-mono text-white/80">{qrCode}</span>
          </p>
        </div>
      )}
    </header>
  );
}
