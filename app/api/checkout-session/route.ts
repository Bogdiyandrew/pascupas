import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { isPlanType, PLANS, PlanType } from '@/types/subscription';
import { adminAuth } from '@/lib/firebaseAdmin'; // Importă adminAuth

// Inițializează Stripe cu cheia secretă din variabilele de mediu.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Asociază tipurile de plan cu ID-urile de preț de la Stripe.
const planToPriceId: Record<PlanType, string | null> = {
  free: null,
  premium_monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
  premium_annual: process.env.STRIPE_PRICE_ID_ANNUAL!,
};

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return new NextResponse('Lipsă token de autorizare.', { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authenticatedUserId = decodedToken.uid;

    const { planId, userId, userEmail } = await req.json();

    if (authenticatedUserId !== userId) {
        return new NextResponse('Acțiune neautorizată.', { status: 403 });
    }

    // DEBUG: Loghează valoarea variabileai de mediu pentru a o verifica în log-urile de pe Vercel.
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl || appUrl.trim() === '') {
        console.error('[STRIPE_CHECKOUT_ERROR] Variabila NEXT_PUBLIC_APP_URL nu este definită.');
        return new NextResponse('Eroare la crearea sesiunii de plată: URL-ul aplicației nu este configurat.', { status: 500 });
    }

    const baseUrl = appUrl.startsWith('http') ? appUrl.replace(/\/+$/, '') : `https://${appUrl}`.replace(/\/+$/, '');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/planuri?success=true`,
      cancel_url: `${baseUrl}/planuri?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planId: planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'auth/id-token-expired') {
        return new NextResponse('Sesiunea a expirat. Te rugăm să te re-autentifici.', { status: 401 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Eroare internă de server.' }, { status: 500 });
  }
}