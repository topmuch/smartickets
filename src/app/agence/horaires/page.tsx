'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Bus,
  ArrowRightLeft,
  CalendarDays,
  RefreshCw,
  MapPin,
  ChevronRight,
  Users,
  AlertTriangle,
  Timer,
  CheckCircle,
  Play,
  Ban,
  ExternalLink,
} from 'lucide-react';
import { useAgency } from '../layout';

/* ══════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════ */
interface ScheduleDeparture {
  id: string;
  lineNumber: string;
  destination: string;
  departureType: string;
  scheduledTime: string;
  effectiveTime: string;
  platform: string;
  status: string;
  delayMinutes: number;
  availableSeats: number;
  totalSeats: number;
  occupancy: number;
  countdownMin: number;
  isToday: boolean;
}

interface ScheduleRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  isRoundTrip: boolean;
  durationMinutes: number | null;
  distanceKm: number | null;
  price: number | null;
  departures: ScheduleDeparture[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  SCHEDULED: { label: 'Programmé', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800', icon: Clock },
  BOARDING: { label: 'Embarquement', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', icon: Play },
  DEPARTED: { label: 'Parti', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
  CANCELLED: { label: 'Annulé', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800', icon: Ban },
  DELAYED: { label: 'Retardé', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800', icon: Timer },
};

/* ══════════════════════════════════════════════
   Countdown Display
   ══════════════════════════════════════════════ */
function CountdownDisplay({ minutes, status }: { minutes: number; status: string }) {
  if (status === 'DEPARTED') {
    return (
      <span className="text-xs font-mono text-emerald-500 font-medium">
        Parti depuis {minutes}min
      </span>
    );
  }
  if (status === 'CANCELLED') {
    return null;
  }
  if (minutes <= 0) {
    return <span className="text-xs font-mono text-amber-500 font-medium">Maintenant</span>;
  }
  if (minutes < 60) {
    return (
      <span className="text-xs font-mono text-[#FF1D8D] font-bold">
        dans {minutes}min
      </span>
    );
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <span className="text-xs font-mono text-slate-500 font-medium">
      dans {h}h{m > 0 ? `${m}min` : ''}
    </span>
  );
}

/* ══════════════════════════════════════════════
   Occupancy Bar
   ══════════════════════════════════════════════ */
function OccupancyBar({ percent }: { percent: number }) {
  const color =
    percent >= 90 ? 'bg-red-500' :
    percent >= 70 ? 'bg-amber-500' :
    percent >= 40 ? 'bg-[#FF6B35]' :
    'bg-emerald-500';

  const textColor =
    percent >= 90 ? 'text-red-500' :
    percent >= 70 ? 'text-amber-500' :
    'text-slate-600 dark:text-slate-300';

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-bold min-w-[32px] ${textColor}`}>{percent}%</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════ */
export default function HorairesPage() {
  const { agencyId } = useAgency();
  const [routes, setRoutes] = useState<ScheduleRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Auto-refresh timer
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedules?agencyId=${agencyId}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [agencyId, selectedDate]);

  useEffect(() => {
    if (agencyId) fetchSchedules();
  }, [agencyId, fetchSchedules, refreshCount]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount((c) => c + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter departures by type
  const getFilteredDepartures = (departures: ScheduleDeparture[]) => {
    if (typeFilter === 'ALL') return departures;
    return departures.filter((d) => d.departureType === typeFilter);
  };

  // Filter routes
  const filteredRoutes = routes
    .map((route) => ({
      ...route,
      departures: getFilteredDepartures(route.departures),
    }))
    .filter((route) => route.departures.length > 0);

  // Stats
  const totalDepartures = filteredRoutes.reduce((sum, r) => sum + r.departures.length, 0);
  const totalAvailable = filteredRoutes.reduce(
    (sum, r) => sum + r.departures.reduce((ds, d) => ds + d.availableSeats, 0),
    0
  );
  const nowDepartures = filteredRoutes.reduce(
    (sum, r) => sum + r.departures.filter((d) => d.countdownMin <= 30 && d.status !== 'DEPARTED' && d.status !== 'CANCELLED').length,
    0
  );

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Horaires
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consultez les horaires de vos bus en temps réel
            {isToday && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                En direct
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/horaires?agencyId=${agencyId}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Page publique
          </a>
          <button
            onClick={() => setRefreshCount((c) => c + 1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Départs du jour</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalDepartures}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Bus className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Places disponibles</p>
              <p className="text-2xl font-extrabold text-[#FF1D8D] mt-1">{totalAvailable}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FF1D8D]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#FF1D8D]" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Prochains ≤30min</p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{nowDepartures}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Timer className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date Picker */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-800">
          <CalendarDays className="w-4 h-4 text-emerald-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200"
          />
          {isToday && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              AUJOURD&apos;HUI
            </span>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl px-1 py-1 border border-slate-200 dark:border-slate-800">
          {[
            { value: 'ALL', label: 'Tous' },
            { value: 'OUTBOUND', label: 'Aller' },
            { value: 'RETURN', label: 'Retour' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === opt.value
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Routes with departures */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-slate-500">Chargement des horaires...</span>
          </div>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
            Aucun horaire pour cette date
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun départ n&apos;est programmé pour le {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRoutes.map((route, routeIndex) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: routeIndex * 0.08 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Route Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 flex items-center justify-center">
                      <Bus className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{route.name}</h3>
                        {route.isRoundTrip && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                            <ArrowRightLeft className="w-3 h-3" />
                            ALLER-RETOUR
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{route.origin}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{route.destination}</span>
                        {route.durationMinutes && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-xs text-slate-400">{Math.floor(route.durationMinutes / 60)}h{route.durationMinutes % 60 > 0 ? `${route.durationMinutes % 60}` : ''}</span>
                          </>
                        )}
                        {route.distanceKm && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-xs text-slate-400">{route.distanceKm} km</span>
                          </>
                        )}
                        {route.price && (
                          <span className="text-xs font-bold text-amber-500">{route.price.toLocaleString()} FCFA</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {route.departures.length} départ(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Departures Table */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {route.departures.map((dep) => {
                  const status = statusConfig[dep.status] || statusConfig.SCHEDULED;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={dep.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Time */}
                      <div className="flex items-center gap-3 sm:w-32">
                        <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                          {new Date(dep.scheduledTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {dep.delayMinutes > 0 && (
                          <span className="text-[11px] font-bold text-orange-500">+{dep.delayMinutes}min</span>
                        )}
                      </div>

                      {/* Type Badge */}
                      <span className={`inline-flex self-start sm:self-center items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        dep.departureType === 'RETURN'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                      }`}>
                        {dep.departureType === 'RETURN' ? 'RETOUR' : 'ALLER'}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{dep.lineNumber}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{dep.destination}</span>
                          {dep.platform && (
                            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                              Quai {dep.platform}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Occupancy */}
                      <div className="flex items-center gap-2 sm:w-44">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <OccupancyBar percent={dep.occupancy} />
                      </div>

                      {/* Status & Countdown */}
                      <div className="flex items-center gap-3 sm:w-52 justify-between sm:justify-end">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        {dep.isToday && (
                          <CountdownDisplay minutes={dep.countdownMin} status={dep.status} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
