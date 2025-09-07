import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin'; 
import { PLANS } from '@/types/subscription';
import { Timestamp } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return new NextResponse('Lipsă token de autorizare.', { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authenticatedUserId = decodedToken.uid;

    const { stripeSubscriptionId, userId } = await req.json();

    // Validare crucială: Verificăm dacă utilizatorul autentificat este cel corect
    if (authenticatedUserId !== userId) {
        return new NextResponse('Acțiune neautorizată.', { status: 403 });
    }
    
    console.log(`[CANCEL_API] Request received for userId: ${userId} and subscriptionId: ${stripeSubscriptionId}`);

    if (!stripeSubscriptionId || !userId) {
      console.error('[CANCEL_API] Missing required parameters');
      return new NextResponse('Lipsesc parametri necesari (stripeSubscriptionId sau userId).', { status: 400 });
    }

    if (typeof stripeSubscriptionId !== 'string' || !stripeSubscriptionId.startsWith('sub_')) {
      console.error(`[CANCEL_API] Invalid subscription ID format: ${stripeSubscriptionId}`);
      return new NextResponse('ID-ul de abonament Stripe este invalid.', { status: 400 });
    }

    // Anulează abonamentul în Stripe
    try {
      await stripe.subscriptions.cancel(stripeSubscriptionId);
      console.log(`[CANCEL_API] Subscription ${stripeSubscriptionId} successfully canceled on Stripe.`);
    } catch (stripeError: unknown) {
      console.error('[CANCEL_API] Stripe API error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Eroare necunoscută la Stripe.';
      return new NextResponse(`Eroare Stripe: ${errorMessage}`, { status: 500 });
    }

    // Actualizează documentul utilizatorului în Firestore
    const userRef = adminDb.collection('users').doc(userId);
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await userRef.update({
      currentPlan: 'free',
      messagesLimit: PLANS.free.messagesLimit,
      messagesThisMonth: 0,
      resetDate: Timestamp.fromDate(resetDate),
      planStartDate: Timestamp.fromDate(now),
      stripeSubscriptionId: null,
      stripeCustomerId: null,
    });
    console.log(`[CANCEL_API] Firestore document for user ${userId} updated successfully.`);

    return NextResponse.json({ message: 'Abonament anulat cu succes.' }, { status: 200 });

  } catch (error: unknown) {
    console.error('[CANCEL_API] Unexpected error:', error);
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'auth/id-token-expired') {
        return new NextResponse('Sesiunea a expirat. Te rugăm să te re-autentifici.', { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Eroare internă de server necunoscută.';
    return new NextResponse(`Eroare internă de server: ${errorMessage}`, { status: 500 });
  }
}
