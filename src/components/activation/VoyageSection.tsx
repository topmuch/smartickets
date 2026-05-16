'use client';

import { Bus, Truck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface VoyageSectionProps {
  transportType: string;
  setTransportType: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  departureCity: string;
  setDepartureCity: (v: string) => void;
  arrivalCity: string;
  setArrivalCity: (v: string) => void;
  departureDate: string;
  setDepartureDate: (v: string) => void;
  departureTime: string;
  setDepartureTime: (v: string) => void;
  lang: 'fr' | 'en';
}

export default function VoyageSection({
  transportType, setTransportType,
  company, setCompany,
  departureCity, setDepartureCity,
  arrivalCity, setArrivalCity,
  departureDate, setDepartureDate,
  departureTime, setDepartureTime,
  lang,
}: VoyageSectionProps) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;

  return (
    <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-6">
      <h2 className="text-base font-bold text-blue-800 mb-4 flex items-center gap-2">
        🚌 {t('ITINÉRAIRE', 'ITINERARY')}
      </h2>

      <div className="space-y-4">
        {/* Transport Type Toggle */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-blue-700">
            {t('Type de Transport', 'Transport Type')} <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTransportType('GP')}
              aria-pressed={transportType === 'GP'}
              className={`flex items-center justify-center gap-2 h-12 rounded-lg border-2 text-sm font-semibold transition-all ${
                transportType === 'GP'
                  ? 'border-blue-500 bg-blue-500/5 text-blue-500 shadow-sm shadow-blue-200'
                  : 'border-blue-200 text-blue-300 hover:border-blue-300 hover:text-blue-500'
              }`}
            >
              <Truck className="w-4 h-4" />
              GP 🚛
            </button>
            <button
              type="button"
              onClick={() => setTransportType('BUS')}
              aria-pressed={transportType === 'BUS'}
              className={`flex items-center justify-center gap-2 h-12 rounded-lg border-2 text-sm font-semibold transition-all ${
                transportType === 'BUS'
                  ? 'border-blue-500 bg-blue-500/5 text-blue-500 shadow-sm shadow-blue-200'
                  : 'border-blue-200 text-blue-300 hover:border-blue-300 hover:text-blue-500'
              }`}
            >
              <Bus className="w-4 h-4" />
              BUS 🚌
            </button>
          </div>
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <Label htmlFor="company_name" className="text-sm font-medium text-blue-700">
            {t('Compagnie de Transport', 'Transport Company')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="company_name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Ex: Salam, Aline, Fatick Express..."
            className="h-12 bg-white border-blue-200 focus-visible:ring-blue-400 focus-visible:border-blue-400 text-sm"
            aria-required="true"
          />
        </div>

        {/* Cities */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="departure_city" className="text-sm font-medium text-blue-700">
              {t('Ville de Départ', 'Departure City')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="departure_city"
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              placeholder={t('Ex: Dakar', 'Ex: Dakar')}
              className="h-12 bg-white border-blue-200 focus-visible:ring-blue-400 focus-visible:border-blue-400 text-sm"
              aria-required="true"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arrival_city" className="text-sm font-medium text-blue-700">
              {t("Ville d'Arrivée", 'Arrival City')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="arrival_city"
              value={arrivalCity}
              onChange={(e) => setArrivalCity(e.target.value)}
              placeholder={t('Ex: Ziguinchor', 'Ex: Ziguinchor')}
              className="h-12 bg-white border-blue-200 focus-visible:ring-blue-400 focus-visible:border-blue-400 text-sm"
              aria-required="true"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="departure_date" className="text-sm font-medium text-blue-700">
              {t('Date de Départ', 'Departure Date')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="departure_date"
              type="date"
              value={departureDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="h-12 bg-white border-blue-200 focus-visible:ring-blue-400 focus-visible:border-blue-400 text-sm [color-scheme:light]"
              aria-required="true"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="departure_time" className="text-sm font-medium text-blue-700">
              {t('Heure de Départ', 'Departure Time')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="departure_time"
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="h-12 bg-white border-blue-200 focus-visible:ring-blue-400 focus-visible:border-blue-400 text-sm [color-scheme:light]"
              aria-required="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
