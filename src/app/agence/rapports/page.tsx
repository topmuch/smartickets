'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  MapPin,
  QrCode,
  CheckCircle,
  BarChart3,
  AlertCircle,
  Loader2,
  Ticket,
  Package,
  Activity,
  Building2,
} from 'lucide-react';
import { useAgency } from '../layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ───────────────────────────────────────────────────

interface Station {
  id: string;
  name: string;
  city: string;
  slug: string;
  address?: string | null;
  isActive: boolean;
}

interface StationStats {
  total: number;
  pending: number;
  active: number;
  activeTickets?: number;
  activeParcels?: number;
  terminated?: number;
  todayActivations: number;
}

interface AllStats {
  totalStations: number;
  activeStations: number;
  totalBaggages: number;
  todayActivations: number;
}

interface AllStatsResponse {
  stations: Record<string, StationStats>;
  allStats: AllStats;
}

// ─── KPI Card Skeleton ────────────────────────────────────────

function KpiSkeleton() {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Table Row Skeleton ────────────────────────────────────────

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      </TableCell>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-5 w-10 rounded mx-auto" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── KPI Card ────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accentBg,
  accentText,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentBg: string;
  accentText: string;
  delay: number;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 overflow-hidden relative group hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: accentText }}
            >
              {value.toLocaleString('fr-FR')}
            </p>
          </div>
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: accentBg }}
          >
            {icon}
          </div>
        </div>
      </CardContent>
      {/* Accent bar at bottom */}
      <div
        className="absolute bottom-0 left-0 h-[3px] transition-all duration-700 ease-out"
        style={{
          backgroundColor: accentText,
          width: `${Math.min(value * 5 + 20, 100)}%`,
          transitionDelay: `${delay}ms`,
        }}
      />
    </Card>
  );
}

// ─── Main Page Component ─────────────────────────────────────

export default function AgencyReportsPage() {
  const { agencyId, agencyName } = useAgency();

  // Data state
  const [stations, setStations] = useState<Station[]>([]);
  const [statsResponse, setStatsResponse] = useState<AllStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedStationId, setSelectedStationId] = useState<string>('all');

  // ─── Fetch stations ───────────────────────────────────────
  useEffect(() => {
    if (!agencyId) return;

    const fetchStations = async () => {
      try {
        const res = await fetch(`/api/stations?agencyId=${agencyId}`);
        if (!res.ok) throw new Error('Erreur lors du chargement des gares');
        const json = await res.json();
        setStations(json.stations || []);
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError('Impossible de charger les gares. Veuillez réessayer.');
      }
    };

    fetchStations();
  }, [agencyId]);

  // ─── Fetch stats ───────────────────────────────────────────
  useEffect(() => {
    if (!agencyId) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/agency/stations/all-stats?agencyId=${agencyId}`
        );
        if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
        const json = await res.json();
        setStatsResponse(json);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(
          'Impossible de charger les statistiques. Veuillez réessayer.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [agencyId]);

  // ─── Merge station data with stats ────────────────────────
  const stationRows = useMemo(() => {
    return stations.map((station) => {
      const stats = statsResponse?.stations?.[station.id];
      return {
        ...station,
        totalAssigned: stats?.total ?? 0,
        available: stats?.pending ?? 0,
        activeTickets: stats?.activeTickets ?? 0,
        activeParcels: stats?.activeParcels ?? 0,
        terminated: stats?.terminated ?? 0,
        todayActivations: stats?.todayActivations ?? 0,
        totalActive: stats?.active ?? 0,
      };
    });
  }, [stations, statsResponse]);

  // ─── Filtered rows ─────────────────────────────────────────
  const filteredRows = useMemo(() => {
    if (selectedStationId === 'all') return stationRows;
    return stationRows.filter((r) => r.id === selectedStationId);
  }, [stationRows, selectedStationId]);

  // ─── Aggregate stats for KPIs ─────────────────────────────
  const kpiData = useMemo(() => {
    const allStations = statsResponse?.allStats;
    return {
      totalStations: allStations?.totalStations ?? stations.length,
      totalAssigned: allStations?.totalBaggages ?? stationRows.reduce((sum, r) => sum + r.totalAssigned, 0),
      totalAvailable: stationRows.reduce((sum, r) => sum + r.available, 0),
      todayActivations: allStations?.todayActivations ?? stationRows.reduce((sum, r) => sum + r.todayActivations, 0),
    };
  }, [statsResponse, stations.length, stationRows]);

  // ─── CSV Export ───────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Gare',
      'Ville',
      'QR Assignés',
      'Disponibles',
      'Tickets Actifs',
      'Colis Actifs',
      'Terminés',
      'Activations Aujourd\'hui',
    ];

    const rows = filteredRows.map((r) => [
      r.name,
      r.city,
      r.totalAssigned.toString(),
      r.available.toString(),
      r.activeTickets.toString(),
      r.activeParcels.toString(),
      r.terminated.toString(),
      r.todayActivations.toString(),
    ]);

    const totalRow = [
      'TOTAL',
      '',
      kpiData.totalAssigned.toString(),
      kpiData.totalAvailable.toString(),
      filteredRows.reduce((s, r) => s + r.activeTickets, 0).toString(),
      filteredRows.reduce((s, r) => s + r.activeParcels, 0).toString(),
      filteredRows.reduce((s, r) => s + r.terminated, 0).toString(),
      kpiData.todayActivations.toString(),
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      totalRow.map((cell) => `"${cell}"`).join(','),
    ].join('\n');

    // BOM for UTF-8 Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapports-gares-${agencyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredRows, kpiData, agencyName]);

  // ─── Retry handler ────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/stations?agencyId=${agencyId}`).then((r) => r.json()),
      fetch(`/api/agency/stations/all-stats?agencyId=${agencyId}`).then((r) => r.json()),
    ])
      .then(([stationsJson, statsJson]) => {
        setStations(stationsJson.stations || []);
        setStatsResponse(statsJson);
      })
      .catch(() => {
        setError('Erreur lors du rechargement des données.');
      })
      .finally(() => setLoading(false));
  }, [agencyId]);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6" style={{ color: '#FF1D8D' }} />
            Rapports multi-gares
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Vue d&apos;ensemble des statistiques par gare — {agencyName}
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={loading || filteredRows.length === 0}
          className="gap-2 font-medium"
          style={{
            backgroundColor: '#FF1D8D',
            color: '#fff',
          }}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exporter CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>
      </div>

      {/* ─── Station Filter ─────────────────────────────────── */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Building2 className="w-4 h-4" />
              <span>Filtrer par gare :</span>
            </div>
            <Select
              value={selectedStationId}
              onValueChange={setSelectedStationId}
            >
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Toutes les gares" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Toutes les gares
                  </span>
                </SelectItem>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {station.name} — {station.city}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStationId !== 'all' && (
              <Badge
                variant="secondary"
                className="bg-[#FF1D8D]/10 text-[#FF1D8D] hover:bg-[#FF1D8D]/20 cursor-pointer transition-colors"
                onClick={() => setSelectedStationId('all')}
              >
                Réinitialiser le filtre
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── KPI Cards ──────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      ) : error ? null : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Gares"
            value={kpiData.totalStations}
            icon={<Building2 className="w-5 h-5 text-white" />}
            accentBg="#FF1D8D"
            accentText="#FF1D8D"
            delay={0}
          />
          <KpiCard
            label="QR Assignés"
            value={kpiData.totalAssigned}
            icon={<QrCode className="w-5 h-5 text-white" />}
            accentBg="#6366f1"
            accentText="#6366f1"
            delay={100}
          />
          <KpiCard
            label="QR Disponibles"
            value={kpiData.totalAvailable}
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            accentBg="#10b981"
            accentText="#10b981"
            delay={200}
          />
          <KpiCard
            label="Activations Aujourd'hui"
            value={kpiData.todayActivations}
            icon={<Activity className="w-5 h-5 text-white" />}
            accentBg="#f59e0b"
            accentText="#f59e0b"
            delay={300}
          />
        </div>
      )}

      {/* ─── Error State ─────────────────────────────────────── */}
      {error && (
        <Card className="border-rose-200 dark:border-rose-800/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-rose-700 dark:text-rose-400">
                  Erreur de chargement
                </h3>
                <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <Loader2 className="w-4 h-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Data Table ─────────────────────────────────────── */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {/* Table header skeleton */}
              <div className="flex items-center gap-4 px-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <div className="space-y-3">
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">Aucune donnée disponible</p>
              <p className="text-sm mt-1">
                {stations.length === 0
                  ? 'Aucune gare enregistrée pour cette agence.'
                  : 'Aucune gare correspondante au filtre sélectionné.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 hover:bg-transparent">
                    <TableHead className="min-w-[200px]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#FF1D8D]" />
                        Gare
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1.5 justify-center">
                        <QrCode className="w-3.5 h-3.5 text-slate-400" />
                        QR Assignés
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1.5 justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                        Disponibles
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1.5 justify-center">
                        <Ticket className="w-3.5 h-3.5 text-slate-400" />
                        Tickets Actifs
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1.5 justify-center">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        Colis Actifs
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1.5 justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                        Terminés
                      </span>
                    </TableHead>
                    <TableHead className="text-center min-w-[140px]">
                      <span className="flex items-center gap-1.5 justify-center">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        Act. Aujourd&apos;hui
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const isHighlighted = selectedStationId !== 'all' && row.id === selectedStationId;
                    return (
                      <TableRow
                        key={row.id}
                        className={`transition-colors duration-200 ${
                          isHighlighted
                            ? 'bg-[#FF1D8D]/5 dark:bg-[#FF1D8D]/10 hover:bg-[#FF1D8D]/8'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        {/* Station Name */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: isHighlighted ? '#FF1D8D' : '#f1f5f9',
                                color: isHighlighted ? '#fff' : '#64748b',
                              }}
                            >
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 dark:text-white truncate">
                                {row.name}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                {row.city}
                              </p>
                            </div>
                            {isHighlighted && (
                              <Badge className="bg-[#FF1D8D]/10 text-[#FF1D8D] text-[10px] px-1.5 py-0 border-0 shrink-0">
                                Sélectionnée
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* QR Assignés */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center font-semibold text-slate-800 dark:text-white tabular-nums">
                            {row.totalAssigned}
                          </span>
                        </TableCell>

                        {/* Disponibles */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center">
                            {row.available > 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold tabular-nums"
                              >
                                {row.available}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 tabular-nums">0</span>
                            )}
                          </span>
                        </TableCell>

                        {/* Tickets Actifs */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center gap-1 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                            <Ticket className="w-3 h-3 text-slate-400" />
                            {row.activeTickets}
                          </span>
                        </TableCell>

                        {/* Colis Actifs */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center gap-1 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                            <Package className="w-3 h-3 text-slate-400" />
                            {row.activeParcels}
                          </span>
                        </TableCell>

                        {/* Terminés */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center">
                            {row.terminated > 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 font-semibold tabular-nums"
                              >
                                {row.terminated}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 tabular-nums">0</span>
                            )}
                          </span>
                        </TableCell>

                        {/* Activations Aujourd'hui */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center">
                            {row.todayActivations > 0 ? (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 font-semibold tabular-nums border-0">
                                <Activity className="w-3 h-3 mr-1" />
                                {row.todayActivations}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 tabular-nums">0</span>
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Total Row */}
                  <TableRow className="bg-slate-100/60 dark:bg-slate-800/60 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
                    <TableCell>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        Total ({filteredRows.length} gare{filteredRows.length > 1 ? 's' : ''})
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">
                        {filteredRows.reduce((s, r) => s + r.totalAssigned, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {filteredRows.reduce((s, r) => s + r.available, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {filteredRows.reduce((s, r) => s + r.activeTickets, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {filteredRows.reduce((s, r) => s + r.activeParcels, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {filteredRows.reduce((s, r) => s + r.terminated, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {filteredRows.reduce((s, r) => s + r.todayActivations, 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
