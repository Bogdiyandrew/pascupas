// types/subscription.ts
import { Timestamp } from 'firebase/firestore';

export type PlanType = 'free' | 'premium_monthly' | 'premium_annual';

// Tipul pentru documentul user din Firebase
export interface FirebaseUser {
  email: string;
  createdAt: Timestamp;
  
  // Planuri și utilizare - MODIFICAT pentru mesaje
  currentPlan: PlanType;
  messagesThisMonth: number;  // SCHIMBAT: mesaje în loc de conversații
  messagesLimit: number;      // SCHIMBAT: limita de mesaje
  resetDate: Timestamp;
  planStartDate: Timestamp;
  stripeSubscriptionId?: string | null; // Adăugat pentru a rezolva eroarea
  stripeCustomerId?: string | null;     // Adăugat pentru a rezolva eroarea
}

export const PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    messagesLimit: 15,  // SCHIMBAT: 15 mesaje pe lună
    features: ['15 mesaje pe lună', 'Criptare securizată']
  },
  premium_monthly: {
    name: 'Premium Lunar', 
    price: 35,
    messagesLimit: -1, // unlimited
    features: ['Mesaje nelimitate', 'Criptare securizată', 'Suport prioritar']
  },
  premium_annual: {
    name: 'Premium Anual',
    price: 349, 
    messagesLimit: -1, // unlimited
    features: ['Mesaje nelimitate', 'Criptare securizată', 'Suport prioritar', 'Economisești 2 luni']
  }
};

// Funcții helper - MODIFICATE pentru mesaje
export function canSendMessage(messagesUsed: number, limit: number): boolean {
  if (limit === -1) return true; // unlimited
  return messagesUsed < limit;
}

export function getMessagesRemaining(messagesUsed: number, limit: number): number {
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - messagesUsed);
}

export function isPlanType(plan: any): plan is PlanType {
    return typeof plan === 'string' && Object.keys(PLANS).includes(plan);
}