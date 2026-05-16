'use client';

import { Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ReceiverSectionProps {
  receiverName: string;
  setReceiverName: (v: string) => void;
  receiverWhatsapp: string;
  setReceiverWhatsapp: (v: string) => void;
  whatsappError: string | null;
  lang: 'fr' | 'en';
}

export default function ReceiverSection({
  receiverName, setReceiverName,
  receiverWhatsapp, setReceiverWhatsapp,
  whatsappError,
  lang,
}: ReceiverSectionProps) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5 border-t-[3px] border-t-[#0077B6]">
      <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">📥</span>
        {t('DESTINATAIRE', 'RECEIVER')}
      </h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="receiver_name" className="text-sm font-medium text-[#4B5563]">
            {t('Nom & Prénom', 'Full name')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="receiver_name"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            placeholder={t('Nom complet du destinataire', 'Full name of the receiver')}
            className="h-12 border-[#E5E7EB] focus-visible:ring-[#25D366] focus-visible:border-[#25D366] text-sm"
            aria-required="true"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="receiver_whatsapp" className="text-sm font-medium text-[#4B5563]">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Numéro WhatsApp
            </span>
            <span className="text-red-500"> *</span>
          </Label>
          <Input
            id="receiver_whatsapp"
            type="tel"
            value={receiverWhatsapp}
            onChange={(e) => setReceiverWhatsapp(e.target.value)}
            placeholder="+221 76 123 45 67"
            className={`h-12 border-[#E5E7EB] focus-visible:ring-[#25D366] focus-visible:border-[#25D366] text-sm font-mono ${whatsappError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            aria-required="true"
            aria-invalid={!!whatsappError}
            aria-describedby={whatsappError ? 'receiver-wa-error' : undefined}
          />
          <p id="receiver-wa-error" className={`text-xs ${whatsappError ? 'text-red-500' : 'text-gray-400'}`} role="alert">
            {whatsappError || t('Ce numéro recevra la notification d\'arrivée.', 'This number will receive the arrival notification.')}
          </p>
        </div>
      </div>
    </div>
  );
}
