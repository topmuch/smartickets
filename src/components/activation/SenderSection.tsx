'use client';

import { Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SenderSectionProps {
  senderName: string;
  setSenderName: (v: string) => void;
  senderWhatsapp: string;
  setSenderWhatsapp: (v: string) => void;
  whatsappError: string | null;
  lang: 'fr' | 'en';
}

export default function SenderSection({
  senderName, setSenderName,
  senderWhatsapp, setSenderWhatsapp,
  whatsappError,
  lang,
}: SenderSectionProps) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5 border-t-[3px] border-t-[#25D366]">
      <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">📤</span>
        {t('EXPÉDITEUR', 'SENDER')}
      </h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sender_name" className="text-sm font-medium text-[#4B5563]">
            {t('Nom & Prénom', 'Full name')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender_name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder={t('Nom complet de l\'expéditeur', 'Full name of the sender')}
            className="h-12 border-[#E5E7EB] focus-visible:ring-[#25D366] focus-visible:border-[#25D366] text-sm"
            aria-required="true"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sender_whatsapp" className="text-sm font-medium text-[#4B5563]">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Numéro WhatsApp
            </span>
            <span className="text-red-500"> *</span>
          </Label>
          <Input
            id="sender_whatsapp"
            type="tel"
            value={senderWhatsapp}
            onChange={(e) => setSenderWhatsapp(e.target.value)}
            placeholder="+221 77 123 45 67"
            className={`h-12 border-[#E5E7EB] focus-visible:ring-[#25D366] focus-visible:border-[#25D366] text-sm font-mono ${whatsappError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            aria-required="true"
            aria-invalid={!!whatsappError}
            aria-describedby={whatsappError ? 'sender-wa-error' : undefined}
          />
          <p id="sender-wa-error" className={`text-xs ${whatsappError ? 'text-red-500' : 'text-gray-400'}`} role="alert">
            {whatsappError || t('Ce numéro recevra la confirmation de départ.', 'This number will receive the departure confirmation.')}
          </p>
        </div>
      </div>
    </div>
  );
}
