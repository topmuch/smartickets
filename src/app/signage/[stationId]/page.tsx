'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

// Types
interface Departure {
  id: string;
  lineNumber: string;
  destination: string;
  scheduledTime: string;
  effectiveTime: string;
  platform: string;
  status: string;
  delayMinutes: number;
  availableSeats: number;
  totalSeats: number;
  occupancy: number;
  countdownMin: number;
  companyName: string;
}

interface TickerMessage {
  id: string;
  text: string;
  priority: 'info' | 'urgent';
  active: boolean;
}

interface StationData {
  stationId: string;
  stationName: string;
  currentTime: string;
  currentDate: string;
  departures: Departure[];
  totalDepartures: number;
  boardingCount: number;
  delayedCount: number;
  alertThreshold: number;
  alertSoundEnabled: boolean;
  tickerMessages: TickerMessage[];
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

// Statut config
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; animate: boolean }> = {
  SCHEDULED: { label: 'PLANIFIÉ', color: 'text-blue-700', bg: 'bg-blue-100', animate: false },
  BOARDING: { label: 'EMBARQUEMENT', color: 'text-green-700', bg: 'bg-green-100', animate: true },
  DELAYED: { label: 'RETARDÉ', color: 'text-orange-700', bg: 'bg-orange-100', animate: false },
  DEPARTED: { label: 'PARTI', color: 'text-gray-500', bg: 'bg-gray-100', animate: false },
  CANCELLED: { label: 'ANNULÉ', color: 'text-red-700', bg: 'bg-red-100', animate: false },
};

export default function SignagePage() {
  const params = useParams();
  const stationId = params.stationId as string;
  const [data, setData] = useState<StationData | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevBoardingRef = useRef<Set<string>>(new Set());
  const prevDataRef = useRef<StationData | null>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const tickerPosRef = useRef<number>(0);
  const tickerAnimRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // ─── Horloge locale ──────────────────────────────────────────────────
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().slice(0, 8));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Alerte sonore embarquement ───────────────────────────────────────
  const playBoardingAlert = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc2.start(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio not available
    }
  }, []);

  // ─── Polling données départs ──────────────────────────────────────────
  useEffect(() => {
    if (!stationId) return;

    const fetchDepartures = async () => {
      try {
        const res = await fetch(`/api/signage/${stationId}/departures`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
          setLastUpdate(new Date().toLocaleTimeString('fr-FR'));

          if (json.alertThreshold) {
            setAlertThreshold(json.alertThreshold);
          }

          // Check if sound should be enabled from settings
          if (json.alertSoundEnabled === false) {
            setSoundEnabled(false);
          } else if (json.alertSoundEnabled === true) {
            setSoundEnabled(true);
          }

          // Vérifier nouveaux embarquements pour alerte sonore
          if (prevDataRef.current) {
            const currentBoarding = new Set(
              json.departures
                .filter((d: Departure) => d.status === 'BOARDING')
                .map((d: Departure) => d.id)
            );
            currentBoarding.forEach(id => {
              if (!prevBoardingRef.current.has(id as string) && soundEnabled) {
                playBoardingAlert();
              }
            });
            prevBoardingRef.current = currentBoarding as Set<string>;
          }
          prevDataRef.current = json;
        }
      } catch (err) {
        console.error('Erreur chargement départs:', err);
      }
    };

    fetchDepartures();
    const interval = setInterval(fetchDepartures, 15000);
    return () => clearInterval(interval);
  }, [stationId, soundEnabled, playBoardingAlert]);

  // ─── Ticker animation ────────────────────────────────────────────────
  useEffect(() => {
    const tickerEl = tickerRef.current;
    if (!tickerEl || !data || data.tickerMessages.length === 0) return;

    const activeMessages = data.tickerMessages.filter(m => m.active);
    if (activeMessages.length === 0) return;

    const animate = () => {
      tickerPosRef.current -= 0.5;
      if (tickerPosRef.current < -tickerEl.scrollWidth) {
        tickerPosRef.current = tickerEl.clientWidth;
      }
      tickerEl.style.transform = `translateX(${tickerPosRef.current}px)`;
      tickerAnimRef.current = requestAnimationFrame(animate);
    };

    tickerPosRef.current = tickerEl.clientWidth;
    tickerAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (tickerAnimRef.current) {
        cancelAnimationFrame(tickerAnimRef.current);
      }
    };
  }, [data]);

  // ─── Format countdown ─────────────────────────────────────────────────
  const formatCountdown = (min: number) => {
    if (min < 0) return 'Parti';
    if (min === 0) return 'Maintenant';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  // ─── Couleur countdown ────────────────────────────────────────────────
  const getCountdownColor = (min: number, status: string) => {
    if (status === 'DEPARTED') return 'text-gray-400';
    if (status === 'CANCELLED') return 'text-red-400';
    if (min <= alertThreshold) return 'text-red-600 font-bold animate-pulse';
    if (min <= 15) return 'text-orange-600 font-bold';
    return 'text-green-700 font-bold';
  };

  // ─── Dynamic colors from settings ─────────────────────────────────────
  const headerGradientFrom = data?.primaryColor || '#1e3a5f';
  const headerGradientTo = data?.secondaryColor || '#2563eb';

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-xl">Chargement des départs...</p>
        </div>
      </div>
    );
  }

  // Active ticker messages
  const activeTicker = data.tickerMessages.filter(m => m.active);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header
        className="px-6 py-4 shadow-lg flex items-center justify-between"
        style={{
          background: `linear-gradient(to right, ${headerGradientFrom}, ${headerGradientTo})`,
        }}
      >
        <div className="flex items-center gap-4">
          {data.logoUrl && (
            <img
              src={data.logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1"
            />
          )}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <h1 className="text-2xl font-bold tracking-wide">{data.stationName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm text-white/70">{data.currentDate}</div>
          <div className="text-3xl font-mono font-bold tabular-nums">{currentTime}</div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-gray-900 px-6 py-3 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center gap-8 text-sm">
          <span className="text-gray-400">
            🚌 <span className="font-bold text-white">{data.totalDepartures}</span> départs aujourd&apos;hui
          </span>
          {data.boardingCount > 0 && (
            <span className="text-green-400 animate-pulse">
              ✅ {data.boardingCount} embarquement{data.boardingCount > 1 ? 's' : ''} en cours
            </span>
          )}
          {data.delayedCount > 0 && (
            <span className="text-orange-400">
              ⚠️ {data.delayedCount} retard{data.delayedCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-gray-500 ml-auto text-xs">
            Dernière MAJ: {lastUpdate}
          </span>
        </div>
      </div>

      {/* Tableau des départs */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {data.departures.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">Aucun départ prévu aujourd&apos;hui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* En-tête tableau */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <div className="col-span-2">Départ</div>
              <div className="col-span-3">Destination</div>
              <div className="col-span-2">Ligne</div>
              <div className="col-span-1">Quai</div>
              <div className="col-span-1">Places</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-1 text-right">Countdown</div>
            </div>

            {/* Lignes */}
            {data.departures.map(dep => {
              const statusCfg = STATUS_CONFIG[dep.status] || STATUS_CONFIG.SCHEDULED;
              return (
                <div
                  key={dep.id}
                  className={`grid grid-cols-12 gap-3 px-4 py-4 rounded-lg items-center transition-all ${
                    statusCfg.animate
                      ? 'bg-green-950 border border-green-800 shadow-lg shadow-green-900/20'
                      : dep.status === 'DEPARTED'
                      ? 'bg-gray-900/50 opacity-60'
                      : dep.status === 'CANCELLED'
                      ? 'bg-red-950/50 opacity-60'
                      : 'bg-gray-900 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Heure effective */}
                  <div className="col-span-2">
                    <div className={`text-xl font-mono font-bold ${
                      dep.status === 'BOARDING' ? 'text-green-400' : 'text-white'
                    }`}>
                      {dep.effectiveTime}
                    </div>
                    {dep.delayMinutes > 0 && dep.status !== 'DEPARTED' && (
                      <div className="text-xs text-orange-400 line-through">
                        {dep.scheduledTime}
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <div className="col-span-3">
                    <div className="text-lg font-bold truncate">{dep.destination}</div>
                    <div className="text-xs text-gray-500">{dep.companyName}</div>
                  </div>

                  {/* Ligne */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-300">{dep.lineNumber}</div>
                  </div>

                  {/* Quai */}
                  <div className="col-span-1">
                    <div className={`inline-flex items-center justify-center w-12 h-8 rounded-md text-sm font-bold ${
                      dep.platform === '-' ? 'bg-gray-800 text-gray-500' : 'bg-blue-900 text-blue-300'
                    }`}>
                      {dep.platform}
                    </div>
                  </div>

                  {/* Places */}
                  <div className="col-span-1">
                    <div className={`text-sm font-bold ${
                      dep.availableSeats <= 5 ? 'text-red-400' : dep.availableSeats <= 15 ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {dep.availableSeats}
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          dep.occupancy > 90 ? 'bg-red-500' : dep.occupancy > 70 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, dep.occupancy)}%` }}
                      />
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="col-span-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusCfg.color} ${statusCfg.bg}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Countdown */}
                  <div className="col-span-1 text-right">
                    <div className={`text-xl font-mono ${getCountdownColor(dep.countdownMin, dep.status)}`}>
                      {formatCountdown(dep.countdownMin)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Ticker bar */}
      {activeTicker.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-800 overflow-hidden h-10 flex items-center">
          <div className="flex-shrink-0 bg-red-600 text-white text-xs font-bold px-3 py-1 h-full flex items-center">
            {activeTicker.some(m => m.priority === 'urgent') ? '🚨' : 'ℹ️'}
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div
              ref={tickerRef}
              className="whitespace-nowrap inline-block text-sm text-gray-300"
            >
              {activeTicker.map(m => (
                <span key={m.id} className="inline-block mr-8">
                  {m.priority === 'urgent' ? '🚨 ' : ''}{m.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>SmarticketS — Affichage Gare</span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1 rounded-md transition ${soundEnabled ? 'bg-green-800 text-green-300 hover:bg-green-700' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
          >
            🔔 Son {soundEnabled ? 'ON' : 'OFF'}
          </button>
          <span>Station: {stationId}</span>
          <span>MAJ auto: 15s</span>
        </div>
      </footer>
    </div>
  );
}
