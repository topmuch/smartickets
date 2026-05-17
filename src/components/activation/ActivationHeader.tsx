'use client';

import { QrCode, Truck, Globe } from 'lucide-react';

interface ActivationHeaderProps {
  qrCode: string;
  onLangChange: (lang: 'fr' | 'en') => void;
  currentLang: 'fr' | 'en';
}

export default function ActivationHeader({ qrCode, onLangChange, currentLang }: ActivationHeaderProps) {
  return (
    <header className="bg-[#8b5cf6] text-white sticky top-0 z-50">
      <div className="max-w-[600px] mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FF6B35] flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block leading-tight text-white">QRTrans</span>
            {qrCode && (
              <span className="text-xs font-mono text-white/80 leading-tight">{qrCode}</span>
            )}
          </div>
        </div>

        {/* Badge Chauffeur */}
        <div className="flex items-center gap-2 border-2 border-dashed border-white rounded-full px-4 py-2">
          <Truck className="w-5 h-5 text-white" />
          <span className="text-lg font-bold text-white uppercase">
            {currentLang === 'fr' ? 'Mode Chauffeur' : 'Driver Mode'}
          </span>
        </div>

        {/* Lang */}
        <button
          onClick={() => onLangChange(currentLang === 'fr' ? 'en' : 'fr')}
          className="flex items-center gap-1.5 text-sm font-medium text-white hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/10"
          aria-label="Switch language"
        >
          <Globe className="w-4 h-4" />
          {currentLang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      {/* Title bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[600px] mx-auto px-4 py-3">
          <h1 className="text-2xl font-extrabold text-white uppercase">
            📦 {currentLang === 'fr' ? 'Activation du Colis' : 'Package Activation'}
          </h1>
        </div>
      </div>
    </header>
  );
}
