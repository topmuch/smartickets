import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getTestEmailTemplate, updateTestStatus, getEmailSettings } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST - Send a test email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Check email settings are configured
    const settings = await getEmailSettings();
    if (!settings) {
      const errorMsg = 'Configuration email non trouvée. Veuillez configurer les paramètres email.';
      await updateTestStatus(false, errorMsg);
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 500 }
      );
    }

    // Get test email template
    const template = getTestEmailTemplate();

    // Send the test email
    const result = await sendEmail({
      to,
      subject: 'QRBag - Email de test',
      html: template.html,
      text: template.text,
      type: 'test',
    });

    if (result.success) {
      await updateTestStatus(true);
      return NextResponse.json({
        success: true,
        message: 'Email de test envoyé avec succes !',
      });
    } else {
      const errorMsg = result.error || "Erreur lors de l'envoi";
      await updateTestStatus(false, errorMsg);
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    const errorMsg = "Erreur lors de l'envoi de l'email de test";
    await updateTestStatus(false, errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
