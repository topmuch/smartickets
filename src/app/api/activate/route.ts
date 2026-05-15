import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateExpirationDate } from '@/lib/qr';
import { z } from 'zod';

const WHATSAPP_REGEX = /^\+[1-9]\d{1,14}$/;

const activateSchema = z.object({
  reference: z.string().min(1, 'La référence est obligatoire'),
  // Itinéraire
  transportMode: z.enum(['bus', 'gp']),
  company: z.string().min(1, 'La compagnie de transport est obligatoire'),
  departureCity: z.string().min(1, 'La ville de départ est obligatoire'),
  arrivalCity: z.string().min(1, "La ville d'arrivée est obligatoire"),
  departureDate: z.string().min(1, 'La date de départ est obligatoire'),
  departureTime: z.string().min(1, "L'heure de départ est obligatoire"),
  // Expéditeur
  senderName: z.string().min(1, "Le nom de l'expéditeur est obligatoire"),
  senderWhatsapp: z.string().regex(WHATSAPP_REGEX, 'Format WhatsApp invalide (ex: +221771234567)'),
  // Destinataire
  receiverName: z.string().min(1, 'Le nom du destinataire est obligatoire'),
  receiverWhatsapp: z.string().regex(WHATSAPP_REGEX, 'Format WhatsApp invalide (ex: +221761234567)'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    // Find baggage by reference
    const baggage = await db.baggage.findUnique({
      where: { reference: validatedData.reference.toUpperCase() },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Colis non trouvé', message: 'Ce code QR ne correspond à aucun colis.' },
        { status: 404 }
      );
    }

    if (baggage.status !== 'pending_activation') {
      return NextResponse.json(
        { error: 'Déjà activé', message: 'Ce colis a déjà été activé.' },
        { status: 400 }
      );
    }

    // Calculate expiration
    const expiresAt = calculateExpirationDate('voyageur', 'sticker');

    // Map transport mode to DB field
    const dbTransportMode = validatedData.transportMode === 'gp' ? 'bus' : 'bus';
    const dbCompany = validatedData.company;

    // Update baggage
    const updatedBaggage = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        travelerFirstName: validatedData.senderName,
        whatsappOwner: validatedData.senderWhatsapp,
        airlineName: dbCompany,
        destination: validatedData.arrivalCity,
        departureDate: new Date(validatedData.departureDate + 'T00:00:00'),
        departureTime: validatedData.departureTime,
        transportMode: dbTransportMode,
        busCompany: dbCompany,
        status: 'active',
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        type: updatedBaggage.type,
        status: updatedBaggage.status,
        expiresAt: updatedBaggage.expiresAt,
      },
      activation: {
        reference: updatedBaggage.reference,
        transportMode: validatedData.transportMode,
        company: validatedData.company,
        departureCity: validatedData.departureCity,
        arrivalCity: validatedData.arrivalCity,
        departureDate: validatedData.departureDate,
        departureTime: validatedData.departureTime,
        senderName: validatedData.senderName,
        senderWhatsapp: validatedData.senderWhatsapp,
        receiverName: validatedData.receiverName,
        receiverWhatsapp: validatedData.receiverWhatsapp,
      },
    });
  } catch (error) {
    console.error('Activation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', message: error.issues[0].message, details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur', message: "Une erreur est survenue lors de l'activation." },
      { status: 500 }
    );
  }
}
