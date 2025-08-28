// types/subscription.ts
import { Timestamp } from 'firebase/firestore';

export type PlanType = 'free' | 'premium_monthly' | 'premium_annual';

export interface FirebaseUser {
  email: string;
  createdAt: Timestamp;
  currentPlan: PlanType;
  messagesThisMonth: number;
  messagesLimit: number;
  resetDate: Timestamp;
  planStartDate: Timestamp;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  profileData: {
    name?: string;
    age?: string;
    gender?: string;
    location?: string;
    occupation?: string;
    hobbies?: string[];
    relationshipStatus?: string;
  };
}

export const PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    messagesLimit: 15,
    features: ['15 mesaje pe lună', 'Criptare securizată']
  },
  premium_monthly: {
    name: 'Premium Lunar', 
    price: 35,
    messagesLimit: -1,
    features: ['Mesaje nelimitate', 'Criptare securizată', 'Suport prioritar']
  },
  premium_annual: {
    name: 'Premium Anual',
    price: 349, 
    messagesLimit: -1,
    features: ['Mesaje nelimitate', 'Criptare securizată', 'Suport prioritar', 'Economisești 2 luni']
  }
};

export function canSendMessage(messagesUsed: number, limit: number): boolean {
  if (limit === -1) return true;
  return messagesUsed < limit;
}

export function getMessagesRemaining(messagesUsed: number, limit: number): number {
  if (limit === -1) return -1;
  return Math.max(0, limit - messagesUsed);
}

export function isPlanType(plan: any): plan is PlanType {
    return typeof plan === 'string' && Object.keys(PLANS).includes(plan);
}