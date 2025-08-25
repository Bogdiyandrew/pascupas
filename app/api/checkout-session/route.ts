import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { isPlanType, PLANS, PlanType } from '@/types/subscription';

// Inițializează Stripe cu cheia secretă din variabilele de mediu.
// Această cheie NU trebuie să fie publică.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Asociază tipurile de plan cu ID-urile de preț de la Stripe.
// Aceste ID-uri trebuie să fie configurate ca variabile de mediu.
const planToPriceId: Record<PlanType, string | null> = {
  free: null, // Planul gratuit nu are un Price ID
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

    // Verifică dacă variabila de mediu este setată.
    if (!appUrl || appUrl.trim() === '') {
        console.error('[STRIPE_CHECKOUT_ERROR] Variabila NEXT_PUBLIC_APP_URL nu este definită.');
        return new NextResponse('Eroare la crearea sesiunii de plată: URL-ul aplicației nu este configurat.', { status: 500 });
    }

    // Elimină un eventual trailing slash pentru a preveni URL-uri de forma "https://site.com//path".
    const cleanedUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Folosește URL-ul curățat
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
