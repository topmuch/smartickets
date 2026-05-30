import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    const { stationId } = await params;
    const now = new Date();

    // Début de journée (00:00)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Fin de journée (23:59:59)
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Récupérer les départs de la gare (via agencyId = stationId)
    const departures = await db.departure.findMany({
      where: {
        agencyId: stationId,
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        agency: {
          select: { name: true },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // ─── Read signage settings ──────────────────────────────────────────
    const signageSettings = await db.setting.findMany({
      where: { key: { startsWith: 'signage_' } },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of signageSettings) {
      settingsMap[s.key] = s.value;
    }

    const stationName = settingsMap['signage_stationName'] || 'Gare Routière';
    const alertThreshold = parseInt(settingsMap['signage_alertThresholdMinutes'] || '5') || 5;
    const alertSoundEnabled = settingsMap['signage_alertSoundEnabled'] !== 'false';

    // Ticker messages
    let tickerMessages: { id: string; text: string; priority: string; active: boolean }[] = [];
    try {
      tickerMessages = JSON.parse(settingsMap['signage_tickerMessages'] || '[]');
    } catch {
      tickerMessages = [];
    }

    // Logo and colors (defaults match admin settings defaults)
    const logoUrl = settingsMap['signage_logoUrl'] || '';
    const primaryColor = settingsMap['signage_primaryColor'] || '#0f172a';
    const secondaryColor = settingsMap['signage_secondaryColor'] || '#1e293b';

    // ─── Calcul dynamique des statuts ────────────────────────────────────
    const processed = departures.map(dep => {
      const scheduled = new Date(dep.scheduledTime);
      const effectiveTime = new Date(scheduled.getTime() + dep.delayMinutes * 60000);
      const effectiveDiff = Math.floor((effectiveTime.getTime() - now.getTime()) / 60000);

      let status = dep.status;

      // Auto-recalcul si le statut est encore SCHEDULED
      if (status === 'SCHEDULED') {
        if (effectiveDiff < -15) {
          status = 'DEPARTED';
        } else if (effectiveDiff >= 0 && effectiveDiff <= 10) {
          status = 'BOARDING';
        }
      }

      // Si DELAYED, recalculer le countdown avec le retard
      const countdownMin = status === 'DEPARTED'
        ? Math.abs(effectiveDiff)
        : Math.max(0, effectiveDiff);

      // Taux de remplissage
      const occupancy = dep.totalSeats > 0
        ? Math.round(((dep.totalSeats - dep.availableSeats) / dep.totalSeats) * 100)
        : 0;

      return {
        id: dep.id,
        lineNumber: dep.lineNumber,
        destination: dep.destination,
        scheduledTime: scheduled.toTimeString().slice(0, 5),
        effectiveTime: effectiveTime.toTimeString().slice(0, 5),
        platform: dep.platform || '-',
        status,
        delayMinutes: dep.delayMinutes,
        availableSeats: dep.availableSeats,
        totalSeats: dep.totalSeats,
        occupancy,
        countdownMin,
        companyName: dep.agency.name,
      };
    });

    // Filtrer les départs déjà partis depuis plus de 30 min
    const filtered = processed.filter(dep =>
      !(dep.status === 'DEPARTED' && dep.countdownMin > 30)
    );

    return NextResponse.json({
      stationId,
      stationName,
      currentTime: now.toTimeString().slice(0, 8),
      currentDate: now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      departures: filtered,
      totalDepartures: filtered.length,
      boardingCount: filtered.filter(d => d.status === 'BOARDING').length,
      delayedCount: filtered.filter(d => d.status === 'DELAYED').length,
      alertThreshold,
      alertSoundEnabled,
      tickerMessages,
      logoUrl,
      primaryColor,
      secondaryColor,
    });

  } catch (error) {
    console.error('[/api/signage/departures] GET error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
