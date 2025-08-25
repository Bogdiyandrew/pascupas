'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { PLANS, PlanType } from '@/types/subscription';
import { loadStripe } from '@stripe/stripe-js';

// Asigură-te că cheia publică Stripe este disponibilă
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Iconițe (rămân neschimbate)
const CrownIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.5 7L12 6l3.5 4L19 3v18H5V3z" /></svg> );
const CheckIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> );
const ArrowLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> );
const CreditCardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> );
const SuccessIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);
const ErrorIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>);

interface PlanCardProps {
  planType: PlanType;
  isCurrentPlan: boolean;
  onUpgrade: (plan: PlanType) => void;
  isPopular?: boolean;
  isUpgrading: boolean;
}

function PlanCard({ planType, isCurrentPlan, onUpgrade, isPopular, isUpgrading }: PlanCardProps) {
  const plan = PLANS[planType];
  const isPremium = planType !== 'free';
  const isAnnual = planType === 'premium_annual';
  
  return (
    <div className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all hover:shadow-lg ${
      isPopular 
        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg scale-105' 
        : isCurrentPlan 
        ? 'border-green-400 bg-green-50' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
            🔥 CEA MAI BUNĂ OFERTĂ
          </div>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            PLANUL CURENT
          </span>
        </div>
      )}

      <div className="text-center pt-2 flex-grow">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isPremium && <CrownIcon />}
          <h3 className={`text-xl font-bold ${isPremium ? 'text-yellow-700' : 'text-gray-700'}`}>
            {plan.name}
          </h3>
        </div>

        <div className="mb-4">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold text-gray-700">Gratuit</span>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-lg text-gray-600">RON</span>
              <span className="text-sm text-gray-500">
                /{isAnnual ? 'an' : 'lună'}
              </span>
            </div>
          )}
          
          {isAnnual && (
            <p className="text-sm text-green-600 font-medium mt-1">
              💰 Economisești 71 RON pe an!
            </p>
          )}
        </div>

        <ul className="space-y-3 mb-6 text-left">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="text-green-500 mt-0.5">
                <CheckIcon />
              </div>
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <button
          onClick={() => onUpgrade(planType)}
          disabled={isCurrentPlan || isUpgrading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isCurrentPlan || isUpgrading
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : isPremium
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 shadow-md'
              : 'bg-gray-800 text-white hover:bg-gray-900'
          }`}
        >
          {isUpgrading ? 'Procesare...' : isCurrentPlan 
            ? 'Planul curent' 
            : planType === 'free' 
            ? 'Schimbă la Gratuit' 
            : 'Upgrade acum'
          }
        </button>
      </div>
    </div>
  );
}

// Extragem logica client într-o componentă separată
function PlansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userDoc, loading } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [stripeMessage, setStripeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      setStripeMessage('Plata a fost procesată cu succes! Planul tău va fi actualizat în curând.');
    } else if (canceled) {
      setStripeMessage('Plata a fost anulată. Te poți abona oricând dorești.');
    }
  }, [searchParams]);

  const handleUpgrade = async (planType: PlanType) => {
    if (!user || !userDoc || planType === 'free' || isUpgrading) return;
    
    setIsUpgrading(true);
    setStripeMessage(null);
    
    try {
      const res = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planType,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const { url } = await res.json();
      
      if (url) {
        router.push(url);
      } else {
        throw new Error('Nu s-a putut obține URL-ul de checkout.');
      }

    } catch (error) {
      console.error('Eroare la crearea sesiunii de plată:', error);
      setStripeMessage('A apărut o eroare la procesarea plății. Te rog încearcă din nou.');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading || !user || !userDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPlan = userDoc.currentPlan;
  const remaining = userDoc.messagesLimit === -1 ? -1 : userDoc.messagesLimit - userDoc.messagesThisMonth;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon />
            <span>Înapoi</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planuri & Tarife</h1>
            <p className="text-gray-600 mt-1">Alege planul potrivit pentru nevoile tale</p>
          </div>
        </div>

        {/* Mesaje de status de la Stripe */}
        {stripeMessage && (
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
              stripeMessage.includes('succes') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {stripeMessage.includes('succes') ? <SuccessIcon /> : <ErrorIcon />}
            <span className="text-sm font-medium">{stripeMessage}</span>
          </div>
        )}

        {/* Current Plan Status */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CreditCardIcon />
            <h2 className="text-xl font-semibold text-gray-900">Statusul planului curent</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Planul curent</h3>
              <p className="text-lg font-bold text-gray-900">{PLANS[currentPlan].name}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Mesaje utilizate</h3>
              <p className="text-lg font-bold text-gray-900">
                {userDoc.messagesThisMonth} / {userDoc.messagesLimit === -1 ? '∞' : userDoc.messagesLimit}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Mesaje rămase</h3>
              <p className={`text-lg font-bold ${remaining <= 3 && remaining !== -1 ? 'text-red-600' : 'text-green-600'}`}>
                {remaining === -1 ? 'Nelimitate' : remaining}
              </p>
            </div>
          </div>

          {currentPlan === 'free' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progres utilizare</span>
                <span>{Math.round((userDoc.messagesThisMonth / userDoc.messagesLimit) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (userDoc.messagesThisMonth / userDoc.messagesLimit) > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((userDoc.messagesThisMonth / userDoc.messagesLimit) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Alege planul potrivit pentru tine
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Upgrade pentru mesaje nelimitate și funcții premium
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-4">
            <PlanCard
              planType="free"
              isCurrentPlan={currentPlan === 'free'}
              onUpgrade={handleUpgrade}
              isUpgrading={isUpgrading}
            />
            
            <PlanCard
              planType="premium_monthly"
              isCurrentPlan={currentPlan === 'premium_monthly'}
              onUpgrade={handleUpgrade}
              isUpgrading={isUpgrading}
            />
            
            <PlanCard
              planType="premium_annual"
              isCurrentPlan={currentPlan === 'premium_annual'}
              onUpgrade={handleUpgrade}
              isPopular={true}
              isUpgrading={isUpgrading}
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Întrebări frecvente</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Când se resetează mesajele?</h4>
              <p className="text-gray-600">Mesajele se resetează automat în prima zi a fiecărei luni.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Pot schimba planul oricând?</h4>
              <p className="text-gray-600">Da, poți schimba planul oricând. Modificările intră în vigoare la următorul ciclu de facturare.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Ce înseamnă mesaje nelimitate?</h4>
              <p className="text-gray-600">Cu planul Premium poți trimite oricâte mesaje dorești, fără restricții lunare.</p>
            </div>
          </div>
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}

const getMessagesRemaining = (used: number, limit: number) => {
  if (limit === -1) return -1;
  return Math.max(0, limit - used);
};
