'use client';

import { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Home, Download } from 'lucide-react';

interface ArrivalSuccessProps {
  reference: string;
  arrivalCity: string;
  deliveryLocation: string;
  arrivalDate: string;
  arrivalTime: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  lang: 'fr' | 'en';
}

export default function ArrivalSuccess({
  reference, arrivalCity, deliveryLocation, arrivalDate, arrivalTime,
  senderName, senderPhone, receiverName, receiverPhone, lang,
}: ArrivalSuccessProps) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;
  const [copied, setCopied] = useState(false);

  const cleanPhone = (p: string) => p.replace(/[^0-9]/g, '');

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  // WhatsApp messages exacts du cahier des charges
  const senderMessage = lang === 'fr'
    ? `Bonjour ${senderName},\nVotre colis (Réf: #${reference}) est bien ARRIVÉ à ${arrivalCity} et a été livré au destinataire.\nMerci d'avoir utilisé QRTrans.`
    : `Hello ${senderName},\nYour package (Ref: #${reference}) has ARRIVED in ${arrivalCity} and has been delivered to the recipient.\nThank you for using QRTrans.`;

  const receiverMessage = lang === 'fr'
    ? `Bonjour ${receiverName},\nVotre colis (Réf: #${reference}) est ARRIVÉ à ${arrivalCity} !\nVenez le retirer à : ${deliveryLocation}\nHoraires : 8h00 - 18h00`
    : `Hello ${receiverName},\nYour package (Ref: #${reference}) has ARRIVED in ${arrivalCity}!\nPick it up at: ${deliveryLocation}\nHours: 8:00 AM - 6:00 PM`;

  const senderWaUrl = `https://wa.me/${cleanPhone(senderPhone)}?text=${encodeURIComponent(senderMessage)}`;
  const receiverWaUrl = `https://wa.me/${cleanPhone(receiverPhone)}?text=${encodeURIComponent(receiverMessage)}`;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/suivi/${reference}`
    : `/suivi/${reference}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = trackingUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success banner */}
      <div className="bg-gradient-to-br from-[#25D366]/10 to-[#25D366]/5 border border-[#25D366]/20 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#25D366] rounded-full mb-3 shadow-lg shadow-green-500/30">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          ✅ {t('ARRIVÉE CONFIRMÉE !', 'ARRIVAL CONFIRMED!')}
        </h2>
        <div className="mt-2 flex items-center justify-center gap-3 text-sm text-gray-600">
          <span>{formatDate(arrivalDate)} {t('à', 'at')} {arrivalTime}</span>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          📍 {deliveryLocation}
        </div>
      </div>

      {/* WhatsApp Buttons */}
      <div className="space-y-3">
        <a
          href={senderWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-[56px] bg-[#25D366] hover:bg-[#1fb855] active:bg-[#1a9e49] text-white rounded-xl font-bold text-[15px] shadow-lg shadow-green-500/25 transition-all no-underline"
        >
          🟢 {t('NOTIFIER L\'ENVOYEUR (Livraison)', 'NOTIFY SENDER (Delivery)')}
          <ExternalLink className="w-3.5 h-3.5 opacity-50" />
        </a>
        <a
          href={receiverWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-[56px] bg-[#0077B6] hover:bg-[#005f8d] active:bg-[#004a6e] text-white rounded-xl font-bold text-[15px] shadow-lg shadow-blue-500/25 transition-all no-underline"
        >
          🔵 {t('NOTIFIER LE RECEVEUR (Retrait)', 'NOTIFY RECEIVER (Pickup)')}
          <ExternalLink className="w-3.5 h-3.5 opacity-50" />
        </a>
      </div>

      {/* Extra options */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 space-y-3">
        <button
          onClick={copyLink}
          className="flex items-center gap-2 w-full h-12 text-sm font-semibold text-gray-600 hover:text-[#25D366] transition-colors"
        >
          <Copy className="w-4 h-4" />
          {copied ? '✅ ' + t('Copié !', 'Copied!') : t('Copier le lien de suivi public', 'Copy public tracking link')}
        </button>

        <a
          href="/"
          className="flex items-center gap-2 w-full h-12 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors no-underline"
        >
          <Home className="w-4 h-4" />
          {t('Retour à l\'accueil', 'Back to home')}
        </a>
      </div>
    </div>
  );
}
