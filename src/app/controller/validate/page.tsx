'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Bus,
  Delete,
  Check,
  ChevronDown,
  User,
  MapPin,
  Clock,
  Armchair,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

interface Agency {
  id: string;
  name: string;
  slug: string;
}

type ValidationStatus =
  | 'idle'
  | 'loading'
  | 'valid'
  | 'used'
  | 'cancelled'
  | 'not_found'
  | 'error';

interface ValidationResult {
  status: ValidationStatus;
  passengerName?: string;
  destination?: string;
  seatNumber?: string;
  departureTime?: string;
  controlCode?: string;
  validatedAt?: string;
}

// ─── Max code length ─────────────────────────────────────────────────────

const MAX_CODE_LENGTH = 8;

// ─── Main Component ─────────────────────────────────────────────────────

export default function ControllerValidatePage() {
  const [code, setCode] = useState('');
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [agenciesLoaded, setAgenciesLoaded] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [agenciesDropdownOpen, setAgenciesDropdownOpen] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const autoClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Fetch agencies on mount ──────────────────────────────────────────

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const res = await fetch('/api/controller/agencies');
        if (res.ok) {
          const data = await res.json();
          const list: Agency[] = data.agencies || [];
          setAgencies(list);
          if (list.length === 1) {
            setSelectedAgencyId(list[0].id);
          }
        }
      } catch {
        // Silently fail - will work without agency filter
      } finally {
        setAgenciesLoaded(true);
      }
    };
    fetchAgencies();
  }, []);

  // ─── Close dropdown on outside click ──────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAgenciesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Cleanup auto-clear timer ─────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (autoClearTimerRef.current) {
        clearTimeout(autoClearTimerRef.current);
      }
    };
  }, []);

  // ─── Web Audio API: Valid "ding" ──────────────────────────────────────

  const playDing = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Pleasant two-tone ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio not available
    }
  }, []);

  // ─── Web Audio API: Invalid "buzz" ───────────────────────────────────

  const playBuzz = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }, []);

  // ─── Haptic feedback ──────────────────────────────────────────────────

  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ─── Handle digit press ────────────────────────────────────────────────

  const handleDigit = useCallback(
    (digit: string) => {
      if (code.length >= MAX_CODE_LENGTH) return;
      triggerHaptic(10);
      setCode((prev) => prev + digit);
      // Clear previous result when entering new digits
      if (result) {
        setResult(null);
        setValidationStatus('idle');
        if (autoClearTimerRef.current) {
          clearTimeout(autoClearTimerRef.current);
          autoClearTimerRef.current = null;
        }
      }
    },
    [code.length, triggerHaptic, result],
  );

  // ─── Handle delete ───────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    triggerHaptic(10);
    setCode((prev) => prev.slice(0, -1));
  }, [triggerHaptic]);

  // ─── Clear result and code ────────────────────────────────────────────

  const clearResult = useCallback(() => {
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current);
      autoClearTimerRef.current = null;
    }
    setResult(null);
    setValidationStatus('idle');
    setCode('');
  }, []);

  // ─── Validate ticket ─────────────────────────────────────────────────

  const handleValidate = useCallback(async () => {
    if (code.length < 6 || validationStatus === 'loading') return;

    setValidationStatus('loading');
    triggerHaptic(20);

    try {
      const res = await fetch('/api/validate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlCode: code,
          agencyId: selectedAgencyId || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setValidationStatus('valid');
        setResult({
          status: 'valid',
          passengerName: data.passengerName,
          destination: data.destination,
          seatNumber: data.seatNumber,
          departureTime: data.departureTime,
          controlCode: code,
        });
        setValidCount((c) => c + 1);
        playDing();
        triggerHaptic([50, 50, 100]);
      } else if (res.ok && data.ticketStatus === 'VALIDATED') {
        setValidationStatus('used');
        setResult({
          status: 'used',
          validatedAt: data.validatedAt,
          controlCode: code,
        });
        setInvalidCount((c) => c + 1);
        playBuzz();
        triggerHaptic([100, 50, 100]);
      } else if (res.ok && data.ticketStatus === 'CANCELLED') {
        setValidationStatus('cancelled');
        setResult({ status: 'cancelled', controlCode: code });
        setInvalidCount((c) => c + 1);
        playBuzz();
        triggerHaptic([100, 50, 100]);
      } else {
        setValidationStatus('not_found');
        setResult({ status: 'not_found', controlCode: code });
        setInvalidCount((c) => c + 1);
        playBuzz();
        triggerHaptic([50]);
      }
    } catch {
      setValidationStatus('error');
      setResult({ status: 'error', controlCode: code });
      setInvalidCount((c) => c + 1);
      playBuzz();
      triggerHaptic([100, 100]);
    }

    // Auto-clear after 5 seconds
    autoClearTimerRef.current = setTimeout(() => {
      clearResult();
    }, 5000);
  }, [code, validationStatus, selectedAgencyId, triggerHaptic, playDing, playBuzz, clearResult]);

  // ─── Keyboard support ─────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleValidate();
      } else if (e.key === 'Escape') {
        clearResult();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleValidate, clearResult]);

  // ─── Display placeholder ──────────────────────────────────────────────

  const displayCode =
    code +
    '_'.repeat(MAX_CODE_LENGTH - code.length);

  // ─── Selected agency name ────────────────────────────────────────────

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);

  // ─── Keypad layout ───────────────────────────────────────────────────

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['delete', '0', 'validate'],
  ] as const;

  // ─── Format validated date ───────────────────────────────────────────

  const formatValidatedDate = (iso: string | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' \u00E0 ' + d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col select-none">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="bg-[#0d1117] border-b border-gray-800 px-4 py-3 safe-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20">
              <Bus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">
                Smarticket<span className="text-emerald-400">S</span>
              </h1>
              <p className="text-[11px] text-gray-400 -mt-0.5">Contr&ocirc;le</p>
            </div>
          </div>
          {selectedAgency && agencies.length > 1 && (
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {selectedAgency.name}
            </span>
          )}
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-4 gap-4">
        {/* ─── Agency Selector ────────────────────────────────── */}
        {agenciesLoaded && agencies.length > 1 && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setAgenciesDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3 text-sm active:scale-[0.98] transition-transform"
              aria-label="S\u00E9lectionner une agence"
              aria-expanded={agenciesDropdownOpen}
            >
              <span className={selectedAgency ? 'text-white' : 'text-gray-400'}>
                {selectedAgency ? selectedAgency.name : 'S\u00E9lectionner une agence'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  agenciesDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {agenciesDropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1f2937] border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                {agencies.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgencyId(a.id);
                      setAgenciesDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      a.id === selectedAgencyId
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Code Display Area ───────────────────────────────── */}
        <div className="bg-[#1f2937] border border-gray-700 rounded-2xl px-6 py-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
            Code de contr&ocirc;le
          </p>
          <div className="font-mono text-4xl sm:text-5xl tracking-[0.3em] text-white leading-relaxed relative">
            {displayCode.split('').map((ch, i) => (
              <span
                key={i}
                className={`inline-block transition-colors duration-150 ${
                  i < code.length ? 'text-white' : 'text-gray-600'
                }`}
              >
                {ch}
              </span>
            ))}
            {/* Blinking cursor */}
            {code.length < MAX_CODE_LENGTH && (
              <span className="inline-block w-[2px] h-8 bg-emerald-400 ml-0.5 animate-pulse absolute top-1/2 -translate-y-1/2"
                style={{
                  left: `calc(${code.length} * 1em + ${code.length * 0.3}em + 50% - ${MAX_CODE_LENGTH * 0.65}em)`,
                }}
              />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {code.length}/{MAX_CODE_LENGTH} chiffres
          </p>
        </div>

        {/* ─── Result Card ──────────────────────────────────────── */}
        {result && (
          <div
            onClick={clearResult}
            className="rounded-2xl p-5 border transition-all animate-in slide-in-from-bottom-4 duration-300 cursor-pointer"
            role="alert"
            aria-live="assertive"
            style={{
              backgroundColor:
                result.status === 'valid'
                  ? '#064e3b'
                  : result.status === 'used' || result.status === 'cancelled'
                    ? '#7f1d1d'
                    : result.status === 'not_found'
                      ? '#78350f'
                      : '#1f2937',
              borderColor:
                result.status === 'valid'
                  ? '#10b981'
                  : result.status === 'used' || result.status === 'cancelled'
                    ? '#ef4444'
                    : result.status === 'not_found'
                      ? '#f59e0b'
                      : '#4b5563',
            }}
          >
            {/* VALID */}
            {result.status === 'valid' && (
              <div className="space-y-3">
                <p className="text-emerald-300 font-bold text-center text-lg flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  BILLET VALIDE
                </p>
                <hr className="border-emerald-700/50" />
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-white font-medium">{result.passengerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-200">{result.destination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Armchair className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      Si&egrave;ge: <span className="font-semibold text-white">{result.seatNumber}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      D&eacute;part: <span className="font-semibold text-white">{result.departureTime}</span>
                    </span>
                  </div>
                </div>
                <hr className="border-emerald-700/50" />
                <p className="text-center text-xs text-emerald-400 font-mono">
                  Code: {result.controlCode}
                </p>
                <p className="text-center text-[10px] text-emerald-500/60 mt-1">
                  Appuyez pour effacer
                </p>
              </div>
            )}

            {/* ALREADY USED */}
            {result.status === 'used' && (
              <div className="space-y-3">
                <p className="text-red-300 font-bold text-center text-lg flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  BILLET D&Eacute;J&Agrave; UTILIS&Eacute;
                </p>
                <hr className="border-red-700/50" />
                {result.validatedAt && (
                  <p className="text-center text-sm text-gray-300">
                    Valid&eacute; le : {formatValidatedDate(result.validatedAt)}
                  </p>
                )}
                <p className="text-center text-[10px] text-red-400/60 mt-1">
                  Appuyez pour effacer
                </p>
              </div>
            )}

            {/* CANCELLED */}
            {result.status === 'cancelled' && (
              <div className="space-y-3">
                <p className="text-red-300 font-bold text-center text-lg flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  BILLET ANNUL&Eacute;
                </p>
                <hr className="border-red-700/50" />
                <p className="text-center text-[10px] text-red-400/60 mt-1">
                  Appuyez pour effacer
                </p>
              </div>
            )}

            {/* NOT FOUND */}
            {result.status === 'not_found' && (
              <div className="space-y-3">
                <p className="text-amber-300 font-bold text-center text-lg flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  CODE INCONNU
                </p>
                <hr className="border-amber-700/50" />
                <p className="text-center text-sm text-gray-300">
                  Ce code ne correspond &agrave; aucun billet actif
                </p>
                <p className="text-center text-[10px] text-amber-400/60 mt-1">
                  Appuyez pour effacer
                </p>
              </div>
            )}

            {/* ERROR */}
            {result.status === 'error' && (
              <div className="space-y-3">
                <p className="text-gray-300 font-bold text-center text-lg flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  ERREUR CONNEXION
                </p>
                <hr className="border-gray-600/50" />
                <p className="text-center text-sm text-gray-400">
                  Impossible de v&eacute;rifier le billet. R&eacute;essayez.
                </p>
                <p className="text-center text-[10px] text-gray-500/60 mt-1">
                  Appuyez pour effacer
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Numeric Keypad ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5 mt-auto">
          {keys.map((row, rowIdx) =>
            row.map((key) => {
              if (key === 'delete') {
                return (
                  <button
                    key="delete"
                    type="button"
                    onClick={handleDelete}
                    disabled={code.length === 0 || validationStatus === 'loading'}
                    className="h-[64px] rounded-xl flex items-center justify-center bg-[#374151] text-gray-300 hover:bg-[#4b5563] active:bg-[#6b7280] active:scale-95 transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Supprimer"
                  >
                    <Delete className="w-7 h-7" />
                  </button>
                );
              }

              if (key === 'validate') {
                return (
                  <button
                    key="validate"
                    type="button"
                    onClick={handleValidate}
                    disabled={
                      code.length < 6 || validationStatus === 'loading'
                    }
                    className={`h-[64px] rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed ${
                      code.length >= 6 && validationStatus !== 'loading'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/25'
                        : 'bg-[#374151] text-gray-500'
                    }`}
                    aria-label="Valider le billet"
                  >
                    {validationStatus === 'loading' ? (
                      <svg
                        className="animate-spin h-7 w-7"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <Check className="w-7 h-7" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDigit(key)}
                  disabled={validationStatus === 'loading' || code.length >= MAX_CODE_LENGTH}
                  className="h-[64px] rounded-xl flex items-center justify-center text-2xl font-semibold text-white bg-[#374151] hover:bg-[#4b5563] active:bg-[#6b7280] active:scale-95 transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`Chiffre ${key}`}
                >
                  {key}
                </button>
              );
            }),
          )}
        </div>

        {/* ─── Full-width Validate Button ───────────────────────── */}
        <button
          type="button"
          onClick={handleValidate}
          disabled={code.length < 6 || validationStatus === 'loading'}
          className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-base transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
            code.length >= 6 && validationStatus !== 'loading'
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-500/25'
              : 'bg-[#1f2937] text-gray-500 border border-gray-700'
          }`}
          aria-label="Valider le billet"
        >
          {validationStatus === 'loading' ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              V&eacute;rification en cours...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              VALIDER LE BILLET
            </>
          )}
        </button>
      </main>

      {/* ─── Stats Bar ────────────────────────────────────────────── */}
      <footer className="bg-[#0d1117] border-t border-gray-800 px-4 py-2.5 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-6 text-xs">
          <span className="text-gray-400">
            Valid&eacute;s :{' '}
            <span className="font-bold text-emerald-400">{validCount}</span>
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">
            Invalides :{' '}
            <span className="font-bold text-red-400">{invalidCount}</span>
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-500">
            Total :{' '}
            <span className="font-semibold text-gray-300">
              {validCount + invalidCount}
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
