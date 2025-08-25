import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { PlanType, PLANS } from '@/types/subscription';
import { Timestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('Semnătura Stripe lipsește din header.');
    return new NextResponse('Lipsă semnătură Stripe.', { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Variabila de mediu STRIPE_WEBHOOK_SECRET nu este setată.');
    return new NextResponse('Cheie secretă de webhook nu este configurată.', { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error(`[STRIPE_WEBHOOK_ERROR] Verificare semnătură eșuată:`, error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }
    console.error(`[STRIPE_WEBHOOK_ERROR] O eroare necunoscută a apărut la verificarea semnăturii.`);
    return new NextResponse(`Webhook Error: A apărut o eroare necunoscută.`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[STRIPE_WEBHOOK] Eveniment checkout.session.completed primit.');

      if (session.metadata?.userId && session.metadata?.planId) {
        const { userId, planId } = session.metadata;
        const subscriptionId = session.subscription as string;

        console.log(`[STRIPE_WEBHOOK] Tentativă de a actualiza planul pentru utilizatorul ${userId} la planul ${planId}.`);

        try {
          if (typeof userId === 'string' && typeof planId === 'string' && PLANS[planId as PlanType]) {
            const userRef = doc(db, 'users', userId);
            
            const userDoc = await getDoc(userRef);
            if(userDoc.exists()) {
              console.log('[STRIPE_WEBHOOK] Starea curentă a documentului Firestore:', userDoc.data());
            }

            const now = new Date();
            const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            
            await updateDoc(userRef, {
              currentPlan: planId as PlanType,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: session.customer as string,
              messagesLimit: PLANS[planId as PlanType].messagesLimit,
              messagesThisMonth: 0,
              resetDate: Timestamp.fromDate(resetDate),
              planStartDate: Timestamp.fromDate(now),
            });
            console.log(`[STRIPE_WEBHOOK] Plan actualizat cu succes pentru utilizatorul ${userId}.`);
          } else {
            console.error('[STRIPE_WEBHOOK] userId sau planId din metadata sunt invalide sau planul nu există în PLANS.');
          }
        } catch (error: unknown) {
          console.error('[STRIPE_WEBHOOK_UPDATE_ERROR] Eroare la actualizarea documentului Firestore:', error);
          if (error instanceof Error) {
            return new NextResponse(`Eroare la actualizarea bazei de date: ${error.message}`, { status: 500 });
          }
          return new NextResponse(`Eroare la actualizarea bazei de date`, { status: 500 });
        }
      } else {
        console.error('[STRIPE_WEBHOOK] Metadata-ul sesiunei de checkout lipsește (userId sau planId).');
      }
      break;
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[STRIPE_WEBHOOK] Eveniment ${event.type} primit.`);
        break;
    }
    default:
      console.log(`[STRIPE_WEBHOOK] Tip de eveniment neașteptat: ${event.type}.`);
  }

  return new NextResponse('Procesare webhook reușită.', { status: 200 });
}