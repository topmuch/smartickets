'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import SmartPhoneInput from './SmartPhoneInput';

interface SenderSectionProps {
  senderName: string;
  setSenderName: (v: string) => void;
  senderPhone: string;
  setSenderPhone: (v: string) => void;
  phoneError: string | null;
  lang: 'fr' | 'en';
}

export default function SenderSection({
  senderName, setSenderName,
  senderPhone, setSenderPhone,
  phoneError,
  lang,
}: SenderSectionProps) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  return (
    <div className="bg-[#2d60fa] rounded-2xl p-6">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        📤 {t('EXPÉDITEUR', 'SENDER')}
      </h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sender_name" className="text-sm font-medium text-white/90">
            {t('Nom Complet', 'Full Name')} <span className="text-yellow-300">*</span>
          </Label>
          <Input
            id="sender_name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder={t('Ex: Moussa Diop', 'Ex: Moussa Diop')}
            className="h-12 bg-white border-[#2d60fa]/30 focus-visible:ring-white/40 focus-visible:border-white/50 text-sm text-gray-800 placeholder:text-gray-400"
            aria-required="true"
          />
        </div>

        <SmartPhoneInput
          label="Numéro WhatsApp"
          value={senderPhone}
          onChange={(v) => setSenderPhone(v)}
          hint={t('Recevra la confirmation de départ.', 'Will receive the departure confirmation.')}
          error={phoneError}
          name="sender_phone"
          labelClassName="text-white/90"
          hintClassName="text-white/60"
        />
      </div>
    </div>
  );
}
