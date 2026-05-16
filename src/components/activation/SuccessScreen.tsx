'use client';

import { CheckCircle, XCircle, Loader2, Copy, ExternalLink } from 'lucide-react';

interface SuccessScreenProps {
  reference: string;
  transportType: string;
  company: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  departureTime: string;
  senderName: string;
  senderWhatsapp: string;
  receiverName: string;
  receiverWhatsapp: string;
  onReset: () => void;
  lang: 'fr' | 'en';
}

export default function SuccessScreen({
  reference,
  transportType,
  company,
  departureCity,
  arrivalCity,
  departureDate,
  departureTime,
  senderName,
  senderWhatsapp,
  receiverName,
  receiverWhatsapp,
  onReset,
  lang,
}: SuccessScreenProps) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  // Build WhatsApp messages
  const senderMsg = lang === 'fr'
    ? `Bonjour ${senderName}, votre colis (Réf: ${reference}) à destination de ${arrivalCity} est pris en charge par ${company} et est en cours de départ.`
    : `Hello ${senderName}, your package (Ref: ${reference}) heading to ${arrivalCity} has been taken by ${company} and is departing now.`;

  const receiverMsg = lang === 'fr'
    ? `Bonjour ${receiverName}, un colis envoyé par ${senderName} arrive à ${arrivalCity}. Vous recevrez un message à l'arrivée pour le retrait.`
    : `Hello ${receiverName}, a package sent by ${senderName} is arriving in ${arrivalCity}. You will receive a message upon arrival for pickup.`;

  const senderWaUrl = `https://wa.me/${senderWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(senderMsg)}`;
  const receiverWaUrl = `https://wa.me/${receiverWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(receiverMsg)}`;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/suivi/${reference}`
    : `/suivi/${reference}`;

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = trackingUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success banner */}
      <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl p-5 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full mb-3">
          <CheckCircle className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {t('Colis activé avec succès !', 'Package activated successfully!')}
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-mono">{reference}</p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          {t('Résumé du colis', 'Package summary')}
        </h3>

        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <span className="text-gray-400">{t('Trajet', 'Route')}</span>
          <span className="font-medium text-gray-800">{departureCity} → {arrivalCity}</span>

          <span className="text-gray-400">{t('Transport', 'Transport')}</span>
          <span className="font-medium text-gray-800">{transportType} — {company}</span>

          <span className="text-gray-400">{t('Départ', 'Departure')}</span>
          <span className="font-medium text-gray-800">{formatDate(departureDate)} {departureTime}</span>

          <span className="text-gray-400">{t('Expéditeur', 'Sender')}</span>
          <span className="font-medium text-gray-800">{senderName}</span>

          <span className="text-gray-400">{t('Destinataire', 'Receiver')}</span>
          <span className="font-medium text-gray-800">{receiverName}</span>
        </div>
      </div>

      {/* WhatsApp buttons */}
      <div className="space-y-3">
        <a
          href={senderWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1fb855] active:bg-[#1a9e49] text-white rounded-xl font-semibold text-sm shadow-lg shadow-green-500/20 transition-all no-underline"
        >
          💬 {t('Notifier l\'Expéditeur', 'Notify Sender')}
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
        <a
          href={receiverWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 bg-[#0077B6] hover:bg-[#005f8d] active:bg-[#004a6e] text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all no-underline"
        >
          💬 {t('Notifier le Destinataire', 'Notify Receiver')}
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
      </div>

      {/* Copy tracking link */}
      <button
        onClick={copyLink}
        className="flex items-center justify-center gap-2 w-full h-12 border-2 border-[#E5E7EB] hover:border-[#25D366] hover:bg-[#25D366]/5 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#25D366] transition-all"
      >
        <Copy className="w-4 h-4" />
        {t('Copier le lien de suivi public', 'Copy public tracking link')}
      </button>

      {/* New activation */}
      <button
        onClick={onReset}
        className="flex items-center justify-center gap-2 w-full h-12 text-gray-400 hover:text-gray-600 text-sm transition-colors"
      >
        <XCircle className="w-4 h-4" />
        {t('Activer un autre colis', 'Activate another package')}
      </button>
    </div>
  );
}
