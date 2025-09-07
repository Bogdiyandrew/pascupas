import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { PlanType, PLANS } from '@/types/subscription';
import { adminDb } from '@/lib/firebaseAdmin'; 
import { Timestamp } from 'firebase-admin/firestore'; 
import { Resend } from 'resend'; // Importă Resend

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil', // <-- Aici a fost corectată versiunea
});

const resend = new Resend(process.env.RESEND_API_KEY); // Inițializează clientul Resend

// Funcție pentru a genera conținutul e-mailului de confirmare
async function sendConfirmationEmail(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email;
  
  if (!customerEmail) {
    console.error('Eroare: Nu se poate trimite e-mail de confirmare, lipsește adresa de e-mail.');
    return;
  }

  try {
    // Aici poți crea conținutul e-mailului
    const emailHtml = `
      <h1>Mulțumim pentru abonament!</h1>
      <p>Salut,</p>
      <p>Îți mulțumim că ai ales planul <b>${PLANS[session.metadata?.planId as PlanType].name}</b> de la PascuPas.online.</p>
      <p>Abonamentul tău este acum activ. Te poți bucura de toate funcționalitățile premium.</p>
      <p>Începe o conversație: <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat">Accesează chat-ul</a></p>
      <p>Cu drag,<br/>Echipa PascuPas</p>
    `;

    // Trimite e-mailul de confirmare
    await resend.emails.send({
      from: 'PascuPas <no-reply@pascupas.online>', // Adresă verificată în Resend
      to: customerEmail,
      subject: 'Confirmare abonament PascuPas.online',
      html: emailHtml,
    });

    console.log(`[EMAIL_SENT] E-mail de confirmare trimis către ${customerEmail}.`);

  } catch (error) {
    console.error('[EMAIL_SEND_ERROR] Eroare la trimiterea e-mailului:', error);
  }
}

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

      // APEL NOU: Trimite e-mailul de confirmare după ce plata este confirmată
      await sendConfirmationEmail(session);
      
      if (session.metadata?.userId && session.metadata?.planId) {
        const { userId, planId } = session.metadata;
        const subscriptionId = session.subscription as string;

        console.log(`[STRIPE_WEBHOOK] Tentativă de a actualiza planul pentru utilizatorul ${userId} la planul ${planId}.`);

        try {
          if (typeof userId === 'string' && typeof planId === 'string' && PLANS[planId as PlanType]) {
            const userRef = adminDb.collection('users').doc(userId);
            
            const userDoc = await userRef.get();
            if(userDoc.exists) {
              console.log('[STRIPE_WEBHOOK] Starea curentă a documentului Firestore:', userDoc.data());
            }

            const now = new Date();
            const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            
            await userRef.update({
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
