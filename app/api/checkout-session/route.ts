import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { PlanType, PLANS } from '@/types/subscription';
import { Timestamp } from 'firebase/firestore';

// Inițializează Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Important: În Next.js App Router, body-parser este dezactivat implicit
// pentru rutele API, ceea ce e necesar pentru Stripe Webhooks. Nu e nevoie
// de `export const config = { api: { bodyParser: false }}`.

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  // Obține corpul brut al cererii
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
    // Construiește evenimentul Stripe pentru a verifica autenticitatea
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error: any) {
    console.error(`[STRIPE_WEBHOOK_ERROR] Verificare semnătură eșuată:`, error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Aici procesăm evenimentele de webhook
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[STRIPE_WEBHOOK] Eveniment checkout.session.completed primit.');

      if (session.metadata?.userId && session.metadata?.planId) {
        const { userId, planId } = session.metadata;
        const subscriptionId = session.subscription as string;

        console.log(`[STRIPE_WEBHOOK] Tentativă de a actualiza planul pentru utilizatorul ${userId} la planul ${planId}.`);

        try {
          // Asigură-te că userId este un string valid pentru referința documentului
          if (typeof userId === 'string' && typeof planId === 'string' && PLANS[planId as PlanType]) {
            const userRef = doc(db, 'users', userId);
            
            // Loghează starea curentă a utilizatorului înainte de a-l actualiza
            const userDoc = await getDoc(userRef);
            if(userDoc.exists()) {
              console.log('[STRIPE_WEBHOOK] Starea curentă a documentului Firestore:', userDoc.data());
            }

            const now = new Date();
            const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            
            // Actualizează documentul utilizatorului în Firestore
            await updateDoc(userRef, {
              currentPlan: planId as PlanType, // Cheia corectă pentru `FirebaseUser`
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: session.customer as string,
              messagesLimit: PLANS[planId as PlanType].messagesLimit,
              messagesThisMonth: 0,
              resetDate: Timestamp.fromDate(resetDate), // Folosim Timestamp din Firestore
              planStartDate: Timestamp.fromDate(now),
            });
            console.log(`[STRIPE_WEBHOOK] Plan actualizat cu succes pentru utilizatorul ${userId}.`);
          } else {
            console.error('[STRIPE_WEBHOOK] userId sau planId din metadata sunt invalide sau planul nu există în PLANS.');
          }
        } catch (error) {
          console.error('[STRIPE_WEBHOOK_UPDATE_ERROR] Eroare la actualizarea documentului Firestore:', error);
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
        // Aici poți adăuga logica pentru a anula planul sau a ajusta datele de facturare
        // Recomand să folosești evenimentele de facturare Stripe pentru a gestiona cu precizie
        // statusul abonamentului
        break;
    }
    default:
      console.log(`[STRIPE_WEBHOOK] Tip de eveniment neașteptat: ${event.type}.`);
  }

  return new NextResponse('Procesare webhook reușită.', { status: 200 });
}
