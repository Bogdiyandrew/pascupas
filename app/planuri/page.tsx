'use client';

import { useState, useEffect, Suspense, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { PLANS, PlanType } from '../../types/subscription';

// --- Iconițe Optimizate ---
const CrownIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckIcon = ({ className = "h-5 w-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const ArrowLeftIcon = ({ className = "h-5 w-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const SuccessIcon = ({ className = "h-16 w-16 text-green-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const AlertIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChevronDownIcon = ({ className = "h-5 w-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

interface PlanCardProps {
  planType: PlanType;
  isCurrentPlan: boolean;
  onUpgrade: (plan: PlanType) => void;
  isPopular?: boolean;
  isUpgrading: boolean;
  onCancel?: () => void;
  isCanceling: boolean;
}

function PlanCard({ planType, isCurrentPlan, onUpgrade, isPopular, isUpgrading, onCancel, isCanceling }: PlanCardProps) {
  const plan = PLANS[planType];
  const isPremium = planType !== 'free';
  const isAnnual = planType === 'premium_annual';

  const cardClasses = isPopular 
    ? "border-primary bg-primary/5 ring-2 ring-primary" 
    : "border-gray-200 bg-white";

  const buttonClasses = isPopular
    ? "bg-primary text-white hover:bg-opacity-90"
    : "bg-gray-800 text-white hover:bg-gray-900";

  return (
    <div className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${cardClasses}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
            🔥 CEA MAI POPULARĂ ALEGERE
          </div>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">PLAN ACTIV</span>
        </div>
      )}

      <div className="text-center pt-4 flex-grow">
        <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
        
        <div className="my-6">
          {plan.price === 0 ? (
            <span className="text-5xl font-extrabold text-gray-900">Gratuit</span>
          ) : (
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
              <div>
                <span className="text-lg font-semibold text-gray-600">RON</span>
                <span className="text-sm text-gray-500">/{isAnnual ? 'an' : 'lună'}</span>
              </div>
            </div>
          )}
          {isAnnual && <p className="text-sm text-green-600 font-semibold mt-2">✨ Economisești echivalentul a 2 luni!</p>}
        </div>

        <ul className="space-y-4 mb-8 text-left">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className={`rounded-full p-1 ${isPopular ? 'bg-primary/20 text-primary' : 'bg-green-100 text-green-600'}`}>
                <CheckIcon className="h-4 w-4" />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        {isCurrentPlan && isPremium ? (
          <button
            onClick={onCancel}
            disabled={isCanceling}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {isCanceling ? 'Anulare în curs...' : 'Anulează Abonamentul'}
          </button>
        ) : (
          <button
            onClick={() => onUpgrade(planType)}
            disabled={isCurrentPlan || isUpgrading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed ${buttonClasses}`}
          >
            {isUpgrading ? 'Procesare...' : isCurrentPlan ? 'Planul Tău Curent' : 'Alege Acest Plan'}
          </button>
        )}
      </div>
    </div>
  );
}

const FAQItem = ({ question, children }: { question: string; children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-4 cursor-pointer">
                <span className="font-semibold text-gray-800">{question}</span>
                <ChevronDownIcon className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40' : 'max-h-0'}`}>
                <div className="pb-4 text-gray-600 text-sm">
                    {children}
                </div>
            </div>
        </div>
    );
};

function PlansPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userDoc, loading } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [stripeMessage, setStripeMessage] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      setShowSuccessModal(true);
      const timer = setTimeout(() => router.push('/chat'), 3000);
      return () => clearTimeout(timer);
    } else if (canceled) {
      setStripeMessage('Plata a fost anulată. Te poți abona oricând dorești.');
    }
  }, [searchParams, router]);

  const handleUpgrade = async (planType: PlanType) => {
    if (!user || !userDoc || planType === 'free' || isUpgrading) return;
    setIsUpgrading(true);
    setStripeMessage(null);
    setCancelMessage(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ planId: planType, userId: user.uid, userEmail: user.email }),
      });
      const { url, error } = await res.json();
      if (res.ok && url) {
        router.push(url);
      } else {
        throw new Error(error || 'Nu s-a putut obține URL-ul de checkout.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Eroare la crearea sesiunii de plată.';
      setStripeMessage(`A apărut o eroare: ${errorMessage}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !userDoc || !userDoc.stripeSubscriptionId || isCanceling) return;
    setIsCanceling(true);
    setCancelMessage(null);
    setStripeMessage(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ stripeSubscriptionId: userDoc.stripeSubscriptionId, userId: user.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        setCancelMessage('Abonamentul tău a fost anulat cu succes.');
        window.location.reload();
      } else {
        throw new Error(data.message || 'Eroare la anularea abonamentului.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută.';
      setCancelMessage(`A apărut o eroare: ${errorMessage}`);
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading || !user || !userDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm text-center transform scale-95 animate-scaleIn">
          <SuccessIcon />
          <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Plată reușită!</h2>
          <p className="text-gray-600 mb-6">Abonamentul tău este acum activ. Vei fi redirecționat către chat.</p>
          <div className="flex justify-center items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            <p className="text-sm text-gray-500">Redirecționare...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = userDoc.currentPlan as PlanType;
  
  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4 cursor-pointer">
                <ArrowLeftIcon />
                <span>Înapoi la cont</span>
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Planuri create pentru tine</h1>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Deblochează potențialul maxim al conversațiilor tale cu un plan premium.</p>
        </div>

        {(stripeMessage || cancelMessage) && (
          <div className="max-w-2xl mx-auto flex items-center gap-3 p-4 rounded-lg mb-8 bg-red-50 border border-red-200 text-red-800">
            <AlertIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{stripeMessage || cancelMessage}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto pt-4">
          <PlanCard
            planType="free"
            isCurrentPlan={currentPlan === 'free'}
            onUpgrade={handleUpgrade}
            isUpgrading={isUpgrading}
            isCanceling={isCanceling}
          />
          <PlanCard
            planType="premium_monthly"
            isCurrentPlan={currentPlan === 'premium_monthly'}
            onUpgrade={handleUpgrade}
            isUpgrading={isUpgrading}
            onCancel={handleCancelSubscription}
            isCanceling={isCanceling}
          />
          <PlanCard
            planType="premium_annual"
            isCurrentPlan={currentPlan === 'premium_annual'}
            onUpgrade={handleUpgrade}
            isPopular
            isUpgrading={isUpgrading}
            onCancel={handleCancelSubscription}
            isCanceling={isCanceling}
          />
        </div>

        <div className="max-w-2xl mx-auto mt-20">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Întrebări Frecvente</h3>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <FAQItem question="Când se resetează limita de mesaje gratuite?">
              <p>Limita de 15 mesaje pentru planul gratuit se resetează automat în prima zi a fiecărei luni calendaristice.</p>
            </FAQItem>
            <FAQItem question="Pot anula abonamentul oricând?">
              <p>Da, poți anula abonamentul premium în orice moment din pagina "Contul Meu". Vei avea acces la beneficiile premium până la finalul perioadei de facturare curente.</p>
            </FAQItem>
            <FAQItem question="Ce se întâmplă dacă fac upgrade la mijlocul lunii?">
                <p>Vei plăti suma proporțional, iar beneficiile planului superior, precum mesajele nelimitate, vor fi activate imediat.</p>
            </FAQItem>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <PlansPageClient />
    </Suspense>
  );
}
