/**
 * LANDING CHATBOT: API Route — Chatbot Page d'Accueil (Guest Mode)
 *
 * POST /api/landing/chat
 *
 * Route publique (sans auth) pour le chatbot de la landing page.
 * Version simplifiée du /api/scan/chat SANS référence requise.
 *
 * Sécurité:
 *   - Rate limiting: 10 req/min par IP
 *   - Validation stricte de la question
 *   - Kill switch: GROQ_AI_ENABLED
 *   - Sanitization HTML de la question utilisateur
 *   - Ne bloque jamais: fallback SAV si Groq échoue/timeout
 *
 * Fonctionnalités:
 *   - Réponses IA avec KB complète QRBag (tarifs, FAQ, contact, pages)
 *   - Détection dynamique de référence pour génération de lien de suivi
 *   - Support trilingue: fr/en/ar
 */

import { NextRequest, NextResponse } from 'next/server';
import { callGroqAI } from '@/lib/groq';
import { GROQ_AI_ENABLED } from '@/lib/config';
import { logMetric } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import type { Language } from '@/lib/i18n';
import type { GroqMessage, GroqResult } from '@/types/ai';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

/** Timeout strict pour la réponse Groq chatbot (3s) */
const CHATBOT_TIMEOUT_MS = 3000;

/** Regex pour détecter une référence QRBag (ex: VOL26-XXXXXX) */
const REFERENCE_REGEX = /[A-Z]{2,4}\d{2}-[A-Z0-9]{6}/;

/** Mots-clés de suivi par langue */
const TRACKING_KEYWORDS: Record<string, RegExp> = {
  fr: /\b(suivi|bagage|où|lien|track|localis|trouv|perd|valise|ma\s*valise|mon\s*bagage)\b/i,
  en: /\b(track|baggage|where|link|locate|find|lost|suitcase|my\s*bag)\b/i,
  ar: /\b(أين|متابعة|حقيبة|وجدت|فقدت|أمتعة|رابط)\b/i,
};

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface ChatRequestBody {
  question: string;
  locale?: Language;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface ChatResponse {
  success: boolean;
  answer?: string;
  trackingLink?: string;
  askReference?: boolean;
  fallback?: boolean;
  latencyMs?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════
//  FALLBACK RESPONSES (orienté SAV)
// ═══════════════════════════════════════════════════════

const FALLBACK_RESPONSES: Record<Language, string> = {
  fr: 'Je rencontre un problème technique. Veuillez contacter le SAV : info@qrbags.com',
  en: 'I am experiencing a technical issue. Please contact support: info@qrbags.com',
  ar: 'أواجه مشكلة تقنية. يرجى التواصل مع الدعم: info@qrbags.com',
};

// ═══════════════════════════════════════════════════════
//  SYSTEM PROMPTS (KB QRBag — Landing/Guest Mode)
// ═══════════════════════════════════════════════════════

function buildSystemPrompt(locale: Language): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';

  const prompts: Record<Language, string> = {
    fr: `Tu es l'assistant QRBag, un agent de support intelligent sur la page d'accueil. Réponds en français, de façon concise (max 3 phrases) et empathique.

CONNAISSANCES QRBag :
• Service de protection de bagages via QR codes uniques. Multi-contextes (✈️ avion, 🚆 train, 🚢 bateau, 🚌 bus).
• Pages clés :
  - Activation : ${appUrl}/inscrire
  - Suivi bagage : ${appUrl}/suivi/[RÉFÉRENCE]
  - Dashboard Agence : ${appUrl}/agence
• Confidentialité stricte : numéros/emails jamais affichés en clair. Mise en relation sécurisée via boutons.
• Modèle B2C : vente de packs QR aux voyageurs. Pas de consigne/stockage.

💰 TARIFS :
• Pack 3 QR : 9,90 EUR
• Pack 10 QR : 24,90 EUR
• Pack 30 QR : 59,90 EUR
• Livraison digitale immédiate. Paiement : Carte, Mobile Money.
• Achat : ${appUrl}/inscrire

🆘 CONTACT SAV :
• Email : info@qrbags.com
• WhatsApp SAV : +221 78 XXX XX XX
• Horaires : Lun-Ven 9h-18h GMT
• Délai réponse : <2h. Orientations empathiques vers le SAV si hors scope ou sensible.

FAQ TOP 5 :
1. Activation ? → ${appUrl}/inscrire + référence QR
2. Bagage perdu ? → Alerte WhatsApp + suivi si scan par trouveur
3. Données sécurisées ? → Oui, jamais en clair, boutons de contact uniquement
4. QR unique ? → Oui, 1 QR = 1 bagage pour sécurité
5. Trouveur injoignable ? → Contacter l'agence ou le SAV

RÈGLES :
- Réponds UNIQUEMENT sur QRBag, les bagages, le voyage, la protection.
- Si question sensible/hors scope → oriente empathiquement vers le SAV (info@qrbags.com).
- Ne jamais inventer d'info non présente dans la KB.
- Ne jamais donner de conseil juridique ou médical.
- Si l'utilisateur demande un lien de suivi, demande-lui sa référence QR (format: VOL26-XXXXXX).`,

    en: `You are the QRBag assistant, an intelligent support agent on the landing page. Respond in English, concisely (max 3 sentences) and empathetically.

QRBag KNOWLEDGE:
• Baggage protection service via unique QR codes. Multi-context (✈️ flight, 🚆 train, 🚢 boat, 🚌 bus).
• Key pages:
  - Activation: ${appUrl}/inscrire
  - Baggage tracking: ${appUrl}/suivi/[REFERENCE]
  - Agency Dashboard: ${appUrl}/agence
• Strict confidentiality: phone/email never shown in plain text. Secure connection via buttons.
• B2C model: selling QR packs to travelers. No luggage storage/consignment.

💰 PRICING:
• Pack 3 QR: 9.90 EUR
• Pack 10 QR: 24.90 EUR
• Pack 30 QR: 59.90 EUR
• Instant digital delivery. Payment: Card, Mobile Money.
• Purchase: ${appUrl}/inscrire

🆘 SUPPORT CONTACT:
• Email: info@qrbags.com
• WhatsApp SAV: +221 78 XXX XX XX
• Hours: Mon-Fri 9am-6pm GMT
• Response time: <2h. Empathetic redirection to support if off-scope or sensitive.

TOP 5 FAQ:
1. Activation? → ${appUrl}/inscrire + QR reference
2. Lost baggage? → WhatsApp alert + tracking if scanned by finder
3. Data secure? → Yes, never in plain text, buttons only
4. Unique QR? → Yes, 1 QR = 1 baggage for security
5. Finder unreachable? → Contact the agency or support

RULES:
- Respond ONLY about QRBag, baggage, travel, protection.
- If sensitive/off-topic question → empathetically redirect to support (info@qrbags.com).
- Never invent info not in the KB.
- Never give legal or medical advice.
- If the user asks for a tracking link, ask for their QR reference (format: VOL26-XXXXXX).`,

    ar: `أنت مساعد QRBag، وكيل دعم ذكي على الصفحة الرئيسية. أجب باللغة العربية، بطريقة موجزة (بحد أقصى 3 جمل) وبلطف.

معرفة QRBag :
• خدمة حماية الأمتعة عبر رموز QR فريدة. متعددة السياقات (✈️ طائرة، 🚆 قطار، 🚢 سفينة، 🚌 حافلة).
• الصفحات الرئيسية :
  - التفعيل : ${appUrl}/inscrire
  - تتبع الأمتعة : ${appUrl}/suivi/[المرجع]
  - لوحة الوكالة : ${appUrl}/agence
• سرية صارمة: الأرقام/البريد لا تُعرض أبداً. تواصل آمن عبر أزرار.
• نموذج B2C: بيع باقات QR للمسافرين. لا تخزين أمتعة.

💰 الأسعار :
• باقة 3 QR : 9.90 EUR
• باقة 10 QR : 24.90 EUR
• باقة 30 QR : 59.90 EUR
• تسليم رقمي فوري. الدفع: بطاقة، أموال محمولة.
• الشراء: ${appUrl}/inscrire

🆘 اتصل بالدعم :
• البريد: info@qrbags.com
• واتساب SAV: +221 78 XXX XX XX
• الساعات: الاثنين-الجمعة 9ص-6م GMT
• وقت الرد: <2 ساعة. توجيه بلطف إلى الدعم إذا خارج النطاق.

الأسئلة الأكثر شيوعاً :
1. التفعيل؟ → ${appUrl}/inscrire + مرجع QR
2. أمتعة مفقودة؟ → تنبيه واتساب + تتبع
3. البيانات آمنة؟ → نعم، أبداً بشكل واضح
4. QR فريد؟ → نعم، 1 QR = 1 حقيبة
5. لم يتم العثور على من وجدها؟ → اتصل بالوكالة أو الدعم

القواعد :
• أجب فقط عن QRBag، الأمتعة، السفر، الحماية.
• إذا كان السؤال حساساً/خارج النطاق → وجّه بلطف إلى الدعم (info@qrbags.com).
• لا تخترع معلومات غير موجودة في المعرفة.
• لا تقدم نصيحة قانونية أو طبية.
• إذا طلب المستخدم رابط تتبع، اطلب منه مرجع QR (الصيغة: VOL26-XXXXXX).`,
  };

  return prompts[locale] || prompts.fr;
}

// ═══════════════════════════════════════════════════════
//  SANITIZATION
// ═══════════════════════════════════════════════════════

function sanitizeQuestion(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`[^`]*`/g, '')
    .trim();
}

// ═══════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════

function validateBody(body: unknown): { valid: true; data: ChatRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' };
  }

  const data = body as Record<string, unknown>;

  if (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
    return { valid: false, error: 'Question is required.' };
  }

  if (data.question.trim().length > 500) {
    return { valid: false, error: 'Question too long (max 500 characters).' };
  }

  return {
    valid: true,
    data: {
      question: data.question.trim().substring(0, 500),
      locale: typeof data.locale === 'string' && ['fr', 'en', 'ar'].includes(data.locale)
        ? (data.locale as Language)
        : undefined,
    },
  };
}

// ═══════════════════════════════════════════════════════
//  TRACKING LINK DETECTION
// ═══════════════════════════════════════════════════════

/**
 * Détecte si la question porte sur le suivi de bagage et extrait la référence.
 * Retourne null si ce n'est pas une question de suivi.
 */
function detectTrackingRequest(
  question: string,
  locale: Language
): { type: 'link'; reference: string } | { type: 'ask_reference' } | null {
  const trackingRegex = TRACKING_KEYWORDS[locale] || TRACKING_KEYWORDS.fr;
  if (!trackingRegex.test(question)) return null;

  // Chercher une référence dans la question
  const refMatch = question.match(REFERENCE_REGEX);
  if (refMatch) {
    const ref = refMatch[0];
    // Validation supplémentaire: au moins 2 lettres suivies de 2+ chiffres, tiret, 6 alphanum
    if (/^[A-Z]{2,4}\d{2}-[A-Z0-9]{6}$/.test(ref)) {
      return { type: 'link', reference: ref };
    }
    // Référence trouvée mais invalide
    return { type: 'ask_reference' };
  }

  // Mots-clés de suivi trouvés mais pas de référence → la demander
  return { type: 'ask_reference' };
}

// ═══════════════════════════════════════════════════════
//  TIMEOUT WRAPPER
// ═══════════════════════════════════════════════════════

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(fallback), ms)
    ),
  ]);
}

// ═══════════════════════════════════════════════════════
//  POST HANDLER
// ═══════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // ─── Parse body ───
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const validation = validateBody(rawBody);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { question } = validation.data;

    // Sanitize question
    const sanitizedQuestion = sanitizeQuestion(question);

    // ─── 1. Rate limiting (10 req/min par IP) ───
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    if (rateLimit(`landing-chat:${clientIp}`, { windowMs: 60_000, maxRequests: 10 })) {
      return NextResponse.json(
        { success: false, error: 'Too many messages. Please wait.' },
        { status: 429 }
      );
    }

    // ─── 2. Kill switch ───
    const locale: Language = validation.data.locale || 'fr';

    if (!GROQ_AI_ENABLED) {
      return NextResponse.json({
        success: true,
        fallback: true,
        answer: FALLBACK_RESPONSES[locale],
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    // ─── 3. Detect tracking request BEFORE calling Groq ───
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';
    const trackingResult = detectTrackingRequest(sanitizedQuestion, locale);

    if (trackingResult?.type === 'link') {
      const trackingLink = `${appUrl}/suivi/${trackingResult.reference}`;
      const answer = locale === 'fr'
        ? `Voici votre lien de suivi : ${trackingLink} (cliquez pour ouvrir)`
        : locale === 'en'
        ? `Here is your tracking link: ${trackingLink} (click to open)`
        : `رابط التتبع الخاص بك: ${trackingLink} (انقر للفتح)`;

      console.log(`[Landing/Chat] Tracking link generated for ${trackingResult.reference} (${Date.now() - startTime}ms)`);

      logMetric('groq', 'landing_tracking_link', Date.now() - startTime, true, {
        key: trackingResult.reference,
        details: `locale=${locale}`,
      });

      return NextResponse.json({
        success: true,
        trackingLink: answer,
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    if (trackingResult?.type === 'ask_reference') {
      const answer = locale === 'fr'
        ? 'Quelle est la référence de votre QR code ? (ex: VOL26-XXXXXX)'
        : locale === 'en'
        ? 'What is your QR code reference? (e.g. VOL26-XXXXXX)'
        : 'ما هو مرجع رمز QR الخاص بك؟ (مثال: VOL26-XXXXXX)';

      return NextResponse.json({
        success: true,
        askReference: true,
        answer,
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    // ─── 4. Build messages with KB-enriched system prompt ───
    const systemPrompt = buildSystemPrompt(locale);

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sanitizedQuestion },
    ];

    // Add history if provided — validate each entry to prevent prompt injection
    const historyPayload = rawBody as Record<string, unknown>;
    const rawHistory = historyPayload.history;
    if (Array.isArray(rawHistory) && rawHistory.length > 0) {
      const validHistory = rawHistory
        .filter((m) =>
          m && typeof m === 'object' &&
          typeof m.role === 'string' && (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' && m.content.length <= 500
        )
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: sanitizeQuestion(m.content as string).substring(0, 500),
        }));
      if (validHistory.length > 0) {
        messages.splice(1, 0, ...validHistory);
      }
    }

    // ─── 5. Call Groq with timeout 3s ───
    const timeoutFallback: GroqResult = {
      success: false,
      error: 'Landing chatbot timeout (3s)',
      fallback: true,
      latencyMs: CHATBOT_TIMEOUT_MS,
    };

    const result = await withTimeout(
      callGroqAI({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
      CHATBOT_TIMEOUT_MS,
      timeoutFallback,
    );

    const latencyMs = Date.now() - startTime;

    // ─── 6. Process result ───
    if (result.success && result.content) {
      const cleaned = result.content
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();

      console.log(`[Groq/LandingChat] ✓ Response in ${latencyMs}ms (${cleaned.length} chars, locale=${locale})`);

      logMetric('groq', 'landing_chat_response', latencyMs, true, {
        details: `locale=${locale}, chars=${cleaned.length}`,
      });

      return NextResponse.json({
        success: true,
        fallback: false,
        answer: cleaned,
        latencyMs,
      } satisfies ChatResponse);
    }

    // Fallback
    logMetric('groq', 'landing_chat_response', latencyMs, false, {
      details: result.error || 'unknown',
    });

    return NextResponse.json({
      success: true,
      fallback: true,
      answer: FALLBACK_RESPONSES[locale],
      latencyMs,
    } satisfies ChatResponse);

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error(`[Groq/LandingChat] ✗ Error:`, error);

    logMetric('groq', 'landing_chat_response', latencyMs, false, {
      details: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
