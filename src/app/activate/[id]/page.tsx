'use client';

import { useState } from 'react';
import { use } from 'react';
import ActivationHeader from '@/components/activation/ActivationHeader';
import ActivationForm from '@/components/activation/ActivationForm';

export default function ActivatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qrCode = (id || '').toUpperCase().trim();
  const [lang, setLang] = useState<'fr' | 'en'>('fr');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
      <ActivationHeader qrCode={qrCode} onLangChange={setLang} currentLang={lang} />

      <main className="max-w-[600px] mx-auto px-4 py-6 pb-20">
        <ActivationForm qrCode={qrCode} lang={lang} />
      </main>
    </div>
  );
}
