'use client';

import { useState, useEffect } from 'react'; // Am adăugat useEffect
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { PLANS, PlanType } from '@/types/subscription';

// Iconițe (rămân neschimbate)
const CrownIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.5 7L12 6l3.5 4L19 3v18H5V3z" /></svg> );
const CheckIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> );
const ArrowLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> );
const CreditCardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> );

interface PlanCardProps {
  planType: PlanType;
  isCurrentPlan: boolean;
  onUpgrade: (plan: PlanType) => void;
  isPopular?: boolean;
}

function PlanCard({ planType, isCurrentPlan, onUpgrade, isPopular }: PlanCardProps) {
  const plan = PLANS[planType];
  const isPremium = planType !== 'free';
  const isAnnual = planType === 'premium_annual';
  
  return (
    <div className={`relative rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
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

      <div className="text-center pt-2">
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

        <button
          onClick={() => onUpgrade(planType)}
          disabled={isCurrentPlan}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isCurrentPlan
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : isPremium
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 shadow-md'
              : 'bg-gray-800 text-white hover:bg-gray-900'
          }`}
        >
          {isCurrentPlan 
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

export default function PlanuriPage() {
  const router = useRouter();
  const { user, userDoc, loading } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // --- MODIFICARE CHEIE: Adăugăm useEffect pentru a gestiona redirecționarea ---
  useEffect(() => {
    // Așteptăm să se termine încărcarea
    if (!loading) {
      // Dacă încărcarea s-a terminat și NU există un utilizator, redirecționăm
      if (!user) {
        console.log("Utilizator neautentificat. Redirecționare către pagina principală.");
        router.push('/');
      }
    }
  }, [user, loading, router]); // Dependințe pentru a rula efectul la schimbarea lor
  // --------------------------------------------------------------------------

  const handleUpgrade = async (planType: PlanType) => {
    if (!user || !userDoc) return;
    
    setIsUpgrading(true);
    
    try {
      if (planType === 'free') {
        alert('În curând vei putea schimba la planul gratuit.');
      } else {
        alert(`În curând vei putea face upgrade la ${PLANS[planType].name}. Integrarea cu plățile vine în curând!`);
      }
    } catch (error) {
      console.error('Eroare la schimbarea planului:', error);
      alert('A apărut o eroare. Te rog încearcă din nou.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // --- MODIFICARE: Afișăm starea de încărcare doar cât timp `loading` este true sau până la redirecționare ---
  if (loading || !user || !userDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  // --------------------------------------------------------------------------------

  const currentPlan = userDoc.currentPlan;
  const remaining = userDoc.messagesLimit === -1 ? -1 : userDoc.messagesLimit - userDoc.messagesThisMonth;

  return (
    <>
      <Header />
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
              />
              
              <PlanCard
                planType="premium_monthly"
                isCurrentPlan={currentPlan === 'premium_monthly'}
                onUpgrade={handleUpgrade}
              />
              
              <PlanCard
                planType="premium_annual"
                isCurrentPlan={currentPlan === 'premium_annual'}
                onUpgrade={handleUpgrade}
                isPopular={true}
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
      </div>
      {/* <Footer /> */}
    </>
  );
}