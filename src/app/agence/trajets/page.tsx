'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Clock,
  Route,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Bus,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useAgency } from '../layout';

/* ══════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════ */
interface RouteItem {
  id: string;
  name: string;
  origin: string;
  destination: string;
  isRoundTrip: boolean;
  durationMinutes: number | null;
  distanceKm: number | null;
  price: number | null;
  _count: { departures: number };
  createdAt: string;
}

interface RouteFormData {
  name: string;
  origin: string;
  destination: string;
  isRoundTrip: boolean;
  durationMinutes: string;
  distanceKm: string;
  price: string;
}

const emptyForm: RouteFormData = {
  name: '',
  origin: '',
  destination: '',
  isRoundTrip: false,
  durationMinutes: '',
  distanceKm: '',
  price: '',
};

/* ══════════════════════════════════════════════
   Route Modal
   ══════════════════════════════════════════════ */
function RouteModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEdit,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RouteFormData) => void;
  initialData?: RouteFormData;
  isEdit: boolean;
  loading: boolean;
}) {
  const [form, setForm] = useState<RouteFormData>(initialData || emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF1D8D] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Route className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isEdit ? 'Modifier la route' : 'Nouvelle route'}
                    </h3>
                    <p className="text-white/70 text-xs">
                      {isEdit ? 'Mettez à jour les informations' : 'Ajoutez un trajet à votre réseau'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Route Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nom de la route
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Dakar ↔ Saint-Louis"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all"
                  required
                />
              </div>

              {/* Origin / Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ville de départ
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={form.origin}
                      onChange={(e) => setForm({ ...form, origin: e.target.value })}
                      placeholder="Ex: Dakar"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                    <input
                      type="text"
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      placeholder="Ex: Mbour"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Round Trip Toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isRoundTrip: !form.isRoundTrip })}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    form.isRoundTrip
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1D8D]'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                      form.isRoundTrip ? 'left-6.5' : 'left-0.5'
                    }`}
                    style={{ left: form.isRoundTrip ? '26px' : '2px' }}
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#FF6B35]" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Trajet Aller-Retour
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Activez si le bus fait le retour automatiquement
                  </p>
                </div>
              </div>

              {/* Duration / Distance / Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Durée (min)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={form.durationMinutes}
                      onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                      placeholder="180"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Distance (km)
                  </label>
                  <div className="relative">
                    <Route className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={form.distanceKm}
                      onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                      placeholder="165"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Prix (FCFA)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">FCFA</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="5000"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF1D8D] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#FF6B35]/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {isEdit ? 'Mettre à jour' : 'Créer la route'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════
   Delete Confirmation Modal
   ══════════════════════════════════════════════ */
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  routeName,
  departureCount,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  routeName: string;
  departureCount: number;
  loading: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Supprimer la route
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Cette action est irréversible
                </p>
              </div>
            </div>

            {departureCount > 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ Cette route a <strong>{departureCount} départ(s)</strong> associé(s). Supprimez-les d&apos;abord.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Voulez-vous vraiment supprimer la route <strong>{routeName}</strong> ?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || departureCount > 0}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════ */
export default function TrajetsPage() {
  const { agencyId } = useAgency();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<RouteItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/routes?agencyId=${agencyId}`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    if (agencyId) fetchRoutes();
  }, [agencyId, fetchRoutes]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Create route
  const handleCreate = async (data: RouteFormData) => {
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes) : null,
          distanceKm: data.distanceKm ? parseInt(data.distanceKm) : null,
          price: data.price ? parseInt(data.price) : null,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        showToast('Route créée avec succès', 'success');
        fetchRoutes();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erreur lors de la création', 'error');
      }
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Update route
  const handleUpdate = async (data: RouteFormData) => {
    if (!editingRoute) return;
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/routes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRoute.id,
          ...data,
          durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes) : null,
          distanceKm: data.distanceKm ? parseInt(data.distanceKm) : null,
          price: data.price ? parseInt(data.price) : null,
        }),
      });
      if (res.ok) {
        setEditingRoute(null);
        showToast('Route mise à jour', 'success');
        fetchRoutes();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete route
  const handleDelete = async () => {
    if (!deletingRoute) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/routes?id=${deletingRoute.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingRoute(null);
        showToast('Route supprimée', 'success');
        fetchRoutes();
      } else {
        const err = await res.json();
        showToast(err.error || err.message || 'Erreur lors de la suppression', 'error');
      }
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter routes
  const filteredRoutes = routes.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalRoutes = routes.length;
  const roundTrips = routes.filter((r) => r.isRoundTrip).length;
  const totalDepartures = routes.reduce((sum, r) => sum + r._count.departures, 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF1D8D] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
              <Route className="w-5 h-5 text-white" />
            </div>
            Mes Trajets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gérez les routes et trajets de votre réseau de transport
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF1D8D] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#FF6B35]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouveau trajet
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total routes</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalRoutes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
              <Route className="w-6 h-6 text-[#FF6B35]" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Aller-Retour</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{roundTrips}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Départs actifs</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalDepartures}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Bus className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une route..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
        />
        <button
          onClick={fetchRoutes}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Routes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
            <span className="text-slate-500">Chargement des trajets...</span>
          </div>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Route className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
            {searchQuery ? 'Aucun résultat' : 'Aucun trajet créé'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {searchQuery
              ? 'Essayez un autre terme de recherche'
              : 'Commencez par créer votre première route de transport'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF1D8D] text-white rounded-xl font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Créer mon premier trajet
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRoutes.map((route, index) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#FF6B35]/30 hover:shadow-lg hover:shadow-[#FF6B35]/5 transition-all duration-300 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Route Visual */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35]/10 to-[#FF1D8D]/10 flex items-center justify-center flex-shrink-0">
                      <Bus className="w-6 h-6 text-[#FF6B35]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {route.name}
                        </h3>
                        {route.isRoundTrip && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[11px] font-bold">
                            <ArrowRightLeft className="w-3 h-3" />
                            ALLER-RETOUR
                          </span>
                        )}
                      </div>
                      {/* Origin → Destination */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {route.origin}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-rose-500 dark:text-rose-400">
                          {route.destination}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {route.durationMinutes && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3" />
                        {Math.floor(route.durationMinutes / 60)}h{route.durationMinutes % 60 > 0 ? ` ${route.durationMinutes % 60}min` : ''}
                      </span>
                    )}
                    {route.distanceKm && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <Route className="w-3 h-3" />
                        {route.distanceKm} km
                      </span>
                    )}
                    {route.price && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                        {route.price.toLocaleString()} FCFA
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF6B35]/10 text-xs font-medium text-[#FF6B35]">
                      <Bus className="w-3 h-3" />
                      {route._count.departures} départ(s)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingRoute(route)}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#FF6B35] transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingRoute(route)}
                      className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <RouteModal
          key="create"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
          isEdit={false}
          loading={saveLoading}
        />
      )}

      {/* Edit Modal */}
      {editingRoute && (
        <RouteModal
          key={editingRoute.id}
          isOpen={!!editingRoute}
          onClose={() => setEditingRoute(null)}
          onSave={handleUpdate}
        initialData={
          editingRoute
            ? {
                name: editingRoute.name,
                origin: editingRoute.origin,
                destination: editingRoute.destination,
                isRoundTrip: editingRoute.isRoundTrip,
                durationMinutes: editingRoute.durationMinutes?.toString() || '',
                distanceKm: editingRoute.distanceKm?.toString() || '',
                price: editingRoute.price?.toString() || '',
              }
            : undefined
        }
        isEdit={true}
        loading={saveLoading}
      />
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        isOpen={!!deletingRoute}
        onClose={() => setDeletingRoute(null)}
        onConfirm={handleDelete}
        routeName={deletingRoute?.name || ''}
        departureCount={deletingRoute?._count.departures || 0}
        loading={deleteLoading}
      />
    </div>
  );
}
