'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ActivationHeader from '@/components/activation/ActivationHeader';
import ActivationForm from '@/components/activation/ActivationForm';
import TicketActivationForm from '@/components/activation/TicketActivationForm';
import { notificationSound } from '@/lib/notification-sound';

// API pour récupérer les données du QR (existant + category)
async function fetchBaggageData(qrCode: string) {
  const res = await fetch(`/api/arrivee/${encodeURIComponent(qrCode)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

function ActivateContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrCode = ((params?.id as string) || '').toUpperCase().trim();
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [mode, setMode] = useState<'parcel' | 'ticket' | 'hajj'>('parcel');
  const [baggageData, setBaggageData] = useState<any>(null);
  const [agencyId, setAgencyId] = useState<string>('');
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(false);

  // Check if we're returning from /sending (WhatsApp notification flow)
  const notifiedParam = searchParams.get('notified');
  const isReturningFromNotify = notifiedParam === 'sender' || notifiedParam === 'receiver';

  // Pre-load audio on page mount
  useEffect(() => {
    notificationSound.unlock();
  }, []);

  // Status-based routing: check if colis is already in_transit → redirect to retrieve
  useEffect(() => {
    if (!qrCode) {
      setChecking(false);
      return;
    }

    // Skip status check when returning from WhatsApp notification flow
    if (isReturningFromNotify) {
      setChecking(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const data = await fetchBaggageData(qrCode);

        if (data?.success && data?.colis) {
          setBaggageData(data);
          setAgencyId(data.colis.agencyId || '');
          const status = data.colis.status;

          // Auto-détection du mode selon la catégorie du baggage
          const category = data.colis.category;
          if (category === 'ticket') setMode('ticket');
          else if (category === 'hajj') setMode('hajj');
          else setMode('parcel');

          // If already in_transit → redirect to retrieve page
          if (status === 'in_transit') {
            router.replace(`/retrieve/${qrCode}`);
            return;
          }

          // If already delivered → redirect to retrieve page
          if (status === 'delivered') {
            router.replace(`/retrieve/${qrCode}`);
            return;
          }
        }
      } catch {
        // If check fails, let user continue with form (colis might be pending_activation)
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [qrCode, router, isReturningFromNotify]);

  // Loading: checking status
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
        <ActivationHeader qrCode={qrCode} onLangChange={setLang} currentLang={lang} />
        <div className="flex items-center justify-center py-24 sm:py-32">
          <div className="text-center">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin mx-auto mb-3" />
            <p className="text-sm sm:text-base text-white">Vérification en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      <ActivationHeader qrCode={qrCode} onLangChange={setLang} currentLang={lang} />

      <main className="max-w-[600px] mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
        {/* Switch de mode Ticket / Colis / Hajj */}
        {!isReturningFromNotify && (
          <div className="mb-6">
            <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl inline-flex">
              <button
                onClick={() => setMode('parcel')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === 'parcel'
                    ? 'bg-white shadow-lg text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📦 Colis
              </button>
              <button
                onClick={() => setMode('ticket')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === 'ticket'
                    ? 'bg-white shadow-lg text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🎫 Ticket
              </button>
              <button
                onClick={() => setMode('hajj')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === 'hajj'
                    ? 'bg-white shadow-lg text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ✈️ Hajj
              </button>
            </div>
          </div>
        )}

        {/* Formulaire dynamique selon le mode */}
        {isReturningFromNotify ? (
          // Mode retour depuis WhatsApp: afficher le formulaire colis existant
          // ActivationForm gère la restoration depuis sessionStorage
          <ActivationForm qrCode={qrCode} lang={lang} />
        ) : mode === 'ticket' ? (
          <TicketActivationForm
            baggageId={baggageData?.colis?.id || qrCode}
            agencyId={agencyId}
            reference={qrCode}
          />
        ) : mode === 'hajj' ? (
          <ActivationForm qrCode={qrCode} lang={lang} />
        ) : (
          <ActivationForm qrCode={qrCode} lang={lang} />
        )}
      </main>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
