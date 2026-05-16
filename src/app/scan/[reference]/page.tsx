import { redirect } from 'next/navigation';

/**
 * /scan/[reference] → redirects to /suivi/[reference]
 * This route exists for backward compatibility — QR codes were generated with /scan/ URLs.
 */
export default async function ScanRedirectPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  redirect(`/suivi/${reference}`);
}
