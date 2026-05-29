'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QrCode, Loader2, CheckCircle, Package } from 'lucide-react';
import ColisInfoCard from '@/components/arrival/ColisInfoCard';
import ContactsCard from '@/components/arrival/ContactsCard';
import ConfirmForm from '@/components/arrival/ConfirmForm';
import ArrivalSuccess from '@/components/arrival/ArrivalSuccess';
import Link from 'next/link';

// ═══════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════

interface ColisData {
  reference: string;
  status: string;
  transportType: string;
  company: string;
  arrivalCity: string;
  departureDate: string | null;
  departureTime: string | null;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
}

// ═══════════════════════════════════════════════════
//  MAIN CONTENT (uses useSearchParams → needs Suspense)
// ═══════════════════════════════════════════════════

function ArriveeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const qrCode = ((params?.id as string) || '').toUpperCase().trim();
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [loadingData, setLoadingData] = useState(true);
  const [colis, setColis] = useState<ColisData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [successData, setSuccessData] = useState<{
    deliveryLocation: string;
    arrivalDate: string;
    arrivalTime: string;
  } | null>(null);

  // Check if returning from /sending page with notification status
  const notifiedParam = searchParams.get('notified'); // 'sender' | 'receiver'
  const isReturningFromNotify = notifiedParam === 'sender' || notifiedParam === 'receiver';

  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  // Fetch colis data on mount
  useEffect(() => {
    if (!qrCode) return;

    const fetchColis = async () => {
      try {
        setLoadingData(true);
        const res = await fetch(`/api/arrivee/${encodeURIComponent(qrCode)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setColis(data.colis);
        } else {
          setFetchError(data.message || t('Colis introuvable.', 'Package not found.'));
        }
      } catch {
        setFetchError(t('Erreur de connexion.', 'Connection error.'));
      } finally {
        setLoadingData(false);
      }
    };

    fetchColis();
  }, [qrCode]);

  const handleSuccess = (data: { deliveryLocation: string; arrivalDate: string; arrivalTime: string }) => {
    setConfirmed(true);
    setSuccessData(data);
  };

  // ─── Loading state ───
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
        <ArriveeHeader qrCode={qrCode} lang={lang} label={t("Confirmation d'Arrivée", 'Arrival Confirmation')} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('Chargement...', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Determine notified state ───
  // When returning from /sending after notifying sender, show ArrivalSuccess with sender done
  const notifiedState = isReturningFromNotify
    ? (notifiedParam as 'sender' | 'receiver')
    : 'none';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
      <ArriveeHeader qrCode={qrCode} lang={lang} label={t("Confirmation d'Arrivée", 'Arrival Confirmation')} />

      <main className="max-w-[600px] mx-auto px-4 py-6 pb-20">
        {/* ─── Error: not found ─── */}
        {fetchError && !colis && (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{fetchError}</h2>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 h-11 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-sm transition-colors no-underline"
            >
              🏠 {t("Retour à l'accueil", 'Back to home')}
            </Link>
          </div>
        )}

        {/* ─── Success state (normal confirm flow) ─── */}
        {confirmed && colis && successData && (
          <ArrivalSuccess
            reference={qrCode}
            arrivalCity={colis.arrivalCity}
            deliveryLocation={successData.deliveryLocation}
            arrivalDate={successData.arrivalDate}
            arrivalTime={successData.arrivalTime}
            senderName={colis.senderName}
            senderPhone={colis.senderPhone}
            receiverName={colis.receiverName}
            receiverPhone={colis.receiverPhone}
            companyName={colis.company}
            lang={lang}
            notified="none"
          />
        )}

        {/* ─── Returning from /sending (partial notification done) ─── */}
        {isReturningFromNotify && colis && !confirmed && (
          <ArrivalSuccess
            reference={qrCode}
            arrivalCity={colis.arrivalCity}
            deliveryLocation="—"
            arrivalDate={new Date().toISOString()}
            arrivalTime=""
            senderName={colis.senderName}
            senderPhone={colis.senderPhone}
            receiverName={colis.receiverName}
            receiverPhone={colis.receiverPhone}
            companyName={colis.company}
            lang={lang}
            notified={notifiedState}
          />
        )}

        {/* ─── Normal state: show info + form ─── */}
        {colis && !confirmed && !isReturningFromNotify && (
          <div className="space-y-4">
            {/* Already delivered */}
            {colis.status === 'delivered' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center animate-in fade-in">
                <span className="text-2xl">✅</span>
                <p className="text-sm font-semibold text-amber-800 mt-2">
                  {t('Ce colis a déjà été livré.', 'This package has already been delivered.')}
                </p>
                <Link
                  href={`/suivi/${qrCode}`}
                  className="inline-flex items-center justify-center gap-3 mt-4 px-8 h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-600/30 no-underline w-full max-w-xs mx-auto"
                >
                  🔍 {t('Voir le suivi', 'View tracking')}
                </Link>
              </div>
            )}

            {/* CARTE 1: Infos colis */}
            <ColisInfoCard
              reference={colis.reference}
              company={colis.company}
              arrivalCity={colis.arrivalCity}
              departureDate={colis.departureDate}
              departureTime={colis.departureTime}
              transportType={colis.transportType}
              lang={lang}
            />

            {/* CARTE 2: Contacts */}
            <ContactsCard
              senderName={colis.senderName}
              senderPhone={colis.senderPhone}
              receiverName={colis.receiverName}
              receiverPhone={colis.receiverPhone}
              reference={colis.reference}
              lang={lang}
            />

            {/* CARTE 3: Formulaire confirmation */}
            {colis.status === 'in_transit' && (
              <ConfirmForm
                reference={qrCode}
                senderName={colis.senderName}
                senderPhone={colis.senderPhone}
                receiverName={colis.receiverName}
                receiverPhone={colis.receiverPhone}
                arrivalCity={colis.arrivalCity}
                onSuccess={handleSuccess}
                lang={lang}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  HEADER COMPONENT
// ═══════════════════════════════════════════════════

function ArriveeHeader({ qrCode, lang, label }: { qrCode: string; lang: 'fr' | 'en'; label: string }) {
  return (
    <header className="bg-black text-white sticky top-0 z-50">
      <div className="max-w-[600px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#25D366] flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight block leading-tight">SmarticketS</span>
            {qrCode && <span className="text-[10px] font-mono text-white/40 leading-tight">{qrCode}</span>}
          </div>
        </div>
        <span className="text-sm text-white/60">📦 {label}</span>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════
//  PAGE EXPORT (with Suspense for useSearchParams)
// ═══════════════════════════════════════════════════

export default function ArriveePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
          <div className="max-w-[600px] mx-auto px-4 h-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        </div>
      }
    >
      <ArriveeContent />
    </Suspense>
  );
}
