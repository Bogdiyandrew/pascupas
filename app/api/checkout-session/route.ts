import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { isPlanType, PLANS, PlanType } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // Versiune actualizată
});

// Mapăm PlanType la Stripe Price ID (TREBUIE SĂ LE COMPLETEZI DIN TABLOUL DE BORD STRIPE)
const planToPriceId: Record<PlanType, string | null> = {
  free: null, // Planul gratuit nu are un Price ID
  premium_monthly: process.env.STRIPE_PRICE_ID_MONTHLY!, // ex: 'price_1P0JvY...
  premium_annual: process.env.STRIPE_PRICE_ID_ANNUAL!, // ex: 'price_1P0JyA...
};

export async function POST(req: NextRequest) {
  const { planId, userId, userEmail } = await req.json();

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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/planuri?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/planuri?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planId: planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    if (error instanceof Error) {
        return new NextResponse(`Eroare la crearea sesiunii de checkout: ${error.message}`, { status: 500 });
    }
    return new NextResponse('Eroare internă de server.', { status: 500 });
  }
}
