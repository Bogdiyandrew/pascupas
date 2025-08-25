import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { isPlanType, PLANS, PlanType } from '@/types/subscription';

// Inițializează Stripe cu cheia secretă din variabilele de mediu.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Asociază tipurile de plan cu ID-urile de preț de la Stripe.
const planToPriceId: Record<PlanType, string | null> = {
  free: null,
  premium_monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
  premium_annual: process.env.STRIPE_PRICE_ID_ANNUAL!,
};

export async function POST(req: NextRequest) {
  const { planId, userId, userEmail } = await req.json();

  // DEBUG: Loghează valoarea variabilei de mediu pentru a o verifica în log-urile de pe Vercel.
  console.log('Valoarea NEXT_PUBLIC_APP_URL este:', process.env.NEXT_PUBLIC_APP_URL);

  if (!planId || !userId || !userEmail) {
    return new NextResponse('Lipsesc parametri necesari.', { status: 400 });
  }

  if (!isPlanType(planId) || planId === 'free') {
    return new NextResponse('Plan invalid sau gratuit.', { status: 400 });
  }

  const priceId = planToPriceId[planId];
  if (!priceId) {
    return new NextResponse('ID de preț Stripe invalid.', { status: 400 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl || appUrl.trim() === '') {
        console.error('[STRIPE_CHECKOUT_ERROR] Variabila NEXT_PUBLIC_APP_URL nu este definită.');
        return new NextResponse('Eroare la crearea sesiunii de plată: URL-ul aplicației nu este configurat.', { status: 500 });
    }

    // Funcție utilitară pentru a asigura că URL-ul are un prefix HTTPS valid.
    const ensureHttps = (url: string) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    // Curăță URL-ul și asigură-te că are prefixul https://
    const cleanedUrl = ensureHttps(appUrl).endsWith('/') ? ensureHttps(appUrl).slice(0, -1) : ensureHttps(appUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${cleanedUrl}/planuri?success=true`,
      cancel_url: `${cleanedUrl}/planuri?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planId: planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Eroare internă de server.' }, { status: 500 });
  }
}
