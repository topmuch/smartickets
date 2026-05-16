'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import SmartPhoneInput from './SmartPhoneInput';

interface ReceiverSectionProps {
  receiverName: string;
  setReceiverName: (v: string) => void;
  receiverPhone: string;
  setReceiverPhone: (v: string) => void;
  phoneError: string | null;
  lang: 'fr' | 'en';
}

export default function ReceiverSection({
  receiverName, setReceiverName,
  receiverPhone, setReceiverPhone,
  phoneError,
  lang,
}: ReceiverSectionProps) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  return (
    <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-2xl p-6">
      <h2 className="text-base font-bold text-green-800 mb-4 flex items-center gap-2">
        📥 {t('DESTINATAIRE', 'RECEIVER')}
      </h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="receiver_name" className="text-sm font-medium text-green-700">
            {t('Nom Complet', 'Full Name')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="receiver_name"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            placeholder={t('Ex: Fatou Sow', 'Ex: Fatou Sow')}
            className="h-12 bg-white border-green-200 focus-visible:ring-green-400 focus-visible:border-green-400 text-sm"
            aria-required="true"
          />
        </div>

        <SmartPhoneInput
          label="Numéro WhatsApp"
          value={receiverPhone}
          onChange={(v) => setReceiverPhone(v)}
          hint={t('Recevra le code de retrait par WhatsApp.', 'Will receive the pickup code via WhatsApp.')}
          error={phoneError}
          name="receiver_phone"
        />
      </div>
    </div>
  );
}
