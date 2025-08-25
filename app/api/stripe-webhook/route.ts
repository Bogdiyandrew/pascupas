import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { PlanType, PLANS } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  if (!signature) {
    return new NextResponse('Semnătură webhook lipsă', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`❌ Eroare de validare a semnăturii Stripe:`, err.message);
    return new NextResponse(`Eroare de Webhook: ${err.message}`, { status: 400 });
  }

  // Aici procesăm evenimentul Stripe
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId as PlanType;
      const customerEmail = session.customer_email;

      if (!userId || !planId || !customerEmail) {
        console.error('❌ Date lipsă în metadata Stripe:', session);
        return new NextResponse('Date incomplete în metadata.', { status: 400 });
      }

      // Verificăm dacă planul este valid
      if (!PLANS[planId]) {
        console.error('❌ Plan invalid:', planId);
        return new NextResponse('Planul specificat nu există.', { status: 400 });
      }

      try {
        const userDocRef = doc(db, 'users', userId);
        const newResetDate = new Date();
        newResetDate.setMonth(newResetDate.getMonth() + 1);

        // Actualizăm documentul utilizatorului în Firestore
        await updateDoc(userDocRef, {
          currentPlan: planId,
          messagesLimit: PLANS[planId].messagesLimit,
          messagesThisMonth: 0,
          resetDate: newResetDate,
          planStartDate: new Date(),
        });
        console.log(`✅ Planul utilizatorului ${userId} a fost actualizat la ${planId}.`);

      } catch (firestoreError) {
        console.error('❌ Eroare la actualizarea Firestore:', firestoreError);
        return new NextResponse('Eroare internă de server.', { status: 500 });
      }

      break;
    default:
      console.log(`Eveniment Stripe ne-gestionat: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
