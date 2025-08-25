// app/api/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isPlanType, PlanType } from '@/types/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// NU seta apiVersion arbitrar; lasă defaultul contului Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Mapare plan -> price id (din .env)
const planToPriceId: Record<PlanType, string | null> = {
  free: null,
  premium_monthly: process.env.STRIPE_PRICE_ID_MONTHLY || '',
  premium_annual: process.env.STRIPE_PRICE_ID_ANNUAL || '',
};

// Validează și normalizează URL-ul public al aplicației
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || '';
  if (!raw) throw new Error('NEXT_PUBLIC_APP_URL nu este setat.');
  if (!/^https?:\/\//i.test(raw)) {
    throw new Error('NEXT_PUBLIC_APP_URL trebuie să includă schema (ex: https://pascupas.online).');
  }
  return raw.replace(/\/+$/, ''); // fără trailing slash
}

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, userEmail } = await req.json();

    if (!planId || !userId || !userEmail) {
      return new NextResponse('Lipsesc parametri necesari (planId/userId/userEmail).', { status: 400 });
    }

    if (!isPlanType(planId) || planId === 'free') {
      return new NextResponse('Plan invalid sau gratuit.', { status: 400 });
    }

    const priceId = planToPriceId[planId];
    if (!priceId) {
      return new NextResponse('ID de preț Stripe invalid sau nedefinit în .env.', { status: 400 });
    }

    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/planuri?success=true`,
      cancel_url: `${baseUrl}/planuri?canceled=true`,
      customer_email: userEmail,
      metadata: { userId, planId },
      // opțional
      allow_promotion_codes: true,
      // payment_method_types nu e necesar; Stripe alege singur pe baza contului
    });

    // întoarce URL-ul pentru redirect
    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error('Create checkout session failed:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}