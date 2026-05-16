'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import VoyageSection from './VoyageSection';
import SenderSection from './SenderSection';
import ReceiverSection from './ReceiverSection';
import SuccessScreen from './SuccessScreen';

const WHATSAPP_REGEX = /^\+[1-9]\d{1,14}$/;

interface ActivationFormProps {
  qrCode: string;
  lang: 'fr' | 'en';
}

export default function ActivationForm({ qrCode, lang }: ActivationFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Voyage
  const [transportType, setTransportType] = useState('');
  const [company, setCompany] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');

  // Sender
  const [senderName, setSenderName] = useState('');
  const [senderWhatsapp, setSenderWhatsapp] = useState('');

  // Receiver
  const [receiverName, setReceiverName] = useState('');
  const [receiverWhatsapp, setReceiverWhatsapp] = useState('');

  // WhatsApp validation
  const [senderWaError, setSenderWaError] = useState<string | null>(null);
  const [receiverWaError, setReceiverWaError] = useState<string | null>(null);

  // Validate a single whatsapp
  const validateWhatsapp = (value: string): string | null => {
    if (!value) return lang === 'fr' ? 'Numéro requis' : 'Number required';
    const cleaned = value.replace(/\s/g, '');
    if (!WHATSAPP_REGEX.test(cleaned)) {
      return lang === 'fr'
        ? 'Format invalide. Ex: +221771234567'
        : 'Invalid format. Ex: +221771234567';
    }
    return null;
  };

  const handleSenderWaBlur = () => {
    setSenderWaError(validateWhatsapp(senderWhatsapp.replace(/\s/g, '')));
  };

  const handleReceiverWaBlur = () => {
    setReceiverWaError(validateWhatsapp(receiverWhatsapp.replace(/\s/g, '')));
  };

  // Full form validation
  const validateAll = (): string | null => {
    const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

    if (!transportType) return t('Sélectionnez le type de transport.', 'Select the transport type.');
    if (!company.trim()) return t('Saisissez la compagnie.', 'Enter the transport company.');
    if (!departureCity.trim()) return t('Saisissez la ville de départ.', 'Enter the departure city.');
    if (!arrivalCity.trim()) return t("Saisissez la ville d'arrivée.", 'Enter the arrival city.');
    if (!departureDate) return t('Saisissez la date de départ.', 'Enter the departure date.');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(departureDate + 'T00:00:00') < today) {
      return t('La date ne peut pas être dans le passé.', 'Date cannot be in the past.');
    }

    if (!departureTime) return t("Saisissez l'heure de départ.", 'Enter the departure time.');
    if (!senderName.trim()) return t("Saisissez le nom de l'expéditeur.", "Enter the sender's name.");

    const sErr = validateWhatsapp(senderWhatsapp.replace(/\s/g, ''));
    if (sErr) return sErr;

    if (!receiverName.trim()) return t('Saisissez le nom du destinataire.', "Enter the receiver's name.");

    const rErr = validateWhatsapp(receiverWhatsapp.replace(/\s/g, ''));
    if (rErr) return rErr;

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateAll();
    if (validationError) {
      setErrorCode('validation');
      setErrorMessage(validationError);
      return;
    }

    setErrorCode(null);
    setErrorMessage('');
    setLoading(true);

    try {
      const payload = {
        transport_type: transportType as 'GP' | 'BUS',
        company_name: company.trim(),
        departure_city: departureCity.trim(),
        arrival_city: arrivalCity.trim(),
        departure_date: departureDate,
        departure_time: departureTime,
        sender_name: senderName.trim(),
        sender_whatsapp: senderWhatsapp.replace(/\s/g, ''),
        receiver_name: receiverName.trim(),
        receiver_whatsapp: receiverWhatsapp.replace(/\s/g, ''),
      };

      const res = await fetch(`/api/activate/${encodeURIComponent(qrCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (data.error === 'already_in_transit' || data.error === 'already_delivered' || data.error === 'already_active') {
        setErrorCode(data.error);
        setErrorMessage(data.message);
      } else if (data.error === 'not_found') {
        setErrorCode('not_found');
        setErrorMessage(data.message);
      } else if (data.error === 'blocked') {
        setErrorCode('blocked');
        setErrorMessage(data.message);
      } else {
        setErrorCode('server_error');
        setErrorMessage(data.message || "Échec de l'activation. Vérifiez votre connexion et réessayez.");
      }
    } catch {
      setErrorCode('network');
      setErrorMessage("Échec de l'activation. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setErrorCode(null);
    setErrorMessage('');
    setTransportType('');
    setCompany('');
    setDepartureCity('');
    setArrivalCity('');
    setDepartureDate('');
    setDepartureTime('');
    setSenderName('');
    setSenderWhatsapp('');
    setReceiverName('');
    setReceiverWhatsapp('');
    setSenderWaError(null);
    setReceiverWaError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  // Success state
  if (success) {
    return (
      <SuccessScreen
        reference={qrCode}
        transportType={transportType}
        company={company}
        departureCity={departureCity}
        arrivalCity={arrivalCity}
        departureDate={departureDate}
        departureTime={departureTime}
        senderName={senderName}
        senderWhatsapp={senderWhatsapp.replace(/\s/g, '')}
        receiverName={receiverName}
        receiverWhatsapp={receiverWhatsapp.replace(/\s/g, '')}
        onReset={handleReset}
        lang={lang}
      />
    );
  }

  // Already active/delivered state
  if (errorCode === 'already_in_transit' || errorCode === 'already_delivered' || errorCode === 'already_active') {
    return (
      <div className="text-center py-12 space-y-4 animate-in fade-in duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{errorMessage}</h2>
        <p className="text-sm text-gray-500 font-mono">{qrCode}</p>
        <a
          href={`/suivi/${qrCode}`}
          className="inline-flex items-center gap-2 px-6 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-sm transition-colors no-underline"
        >
          🔍 {t('Voir le suivi', 'View tracking')}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Error banner */}
      {errorCode && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-lg mt-0.5">🚨</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {errorCode === 'network' || errorCode === 'server_error'
                ? t("Échec de l'activation", 'Activation failed')
                : t('Erreur de validation', 'Validation error')}
            </p>
            <p className="text-sm text-red-600 mt-0.5">{errorMessage}</p>
          </div>
          <button type="button" onClick={() => { setErrorCode(null); setErrorMessage(''); }} className="text-red-400 hover:text-red-600 text-lg leading-none" aria-label="Fermer">&times;</button>
        </div>
      )}

      {/* Voyage */}
      <VoyageSection
        transportType={transportType} setTransportType={setTransportType}
        company={company} setCompany={setCompany}
        departureCity={departureCity} setDepartureCity={setDepartureCity}
        arrivalCity={arrivalCity} setArrivalCity={setArrivalCity}
        departureDate={departureDate} setDepartureDate={setDepartureDate}
        departureTime={departureTime} setDepartureTime={setDepartureTime}
        lang={lang}
      />

      {/* Sender */}
      <SenderSection
        senderName={senderName} setSenderName={setSenderName}
        senderWhatsapp={senderWhatsapp} setSenderWhatsapp={setSenderWhatsapp}
        whatsappError={senderWaError}
        lang={lang}
      />

      {/* Receiver */}
      <ReceiverSection
        receiverName={receiverName} setReceiverName={setReceiverName}
        receiverWhatsapp={receiverWhatsapp} setReceiverWhatsapp={setReceiverWhatsapp}
        whatsappError={receiverWaError}
        lang={lang}
      />

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full h-14 bg-[#25D366] hover:bg-[#1fb855] active:bg-[#1a9e49] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base shadow-lg shadow-green-500/20 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('Activation en cours...', 'Activating...')}
            </>
          ) : (
            <>
              ✅ {t('Valider & Activer le Colis', 'Validate & Activate Package')}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="flex items-center justify-center w-full h-12 border-2 border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
        >
          ❌ {t('Annuler', 'Cancel')}
        </button>
      </div>
    </form>
  );
}
