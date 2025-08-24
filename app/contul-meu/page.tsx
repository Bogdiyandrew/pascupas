'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';

// --- Iconițe ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1119 7z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default function AccountPage() {
  const { user, userDoc, loading, logout, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [resetMessage, setResetMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Protejăm ruta: dacă nu există utilizator după încărcare, redirecționăm
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setErrorMessage('Adresa de email nu este disponibilă.');
      return;
    }
    try {
      await sendPasswordReset(user.email);
      setResetMessage('Un link pentru resetarea parolei a fost trimis la adresa ta de email.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('A apărut o eroare la trimiterea emailului.');
      setResetMessage('');
    }
  };

  const handleManageSubscription = () => {
    // Aici va veni logica de redirectare către portalul de plăți (ex: Stripe)
    alert('Funcționalitatea de gestionare a abonamentului va fi disponibilă în curând!');
  };

  // Stare de încărcare generală
  if (loading || !user || !userDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { email } = user;
  const { currentPlan, messagesThisMonth, messagesLimit, resetDate } = userDoc;
  const remainingMessages = getMessagesRemaining(messagesThisMonth, messagesLimit);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Contul Meu</h1>
          
          {/* Card Detalii Cont */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2"><UserIcon /> Detalii Cont</h2>
            <div className="text-sm">
              <p className="text-gray-500">Adresă de email</p>
              <p className="font-medium text-gray-800">{email}</p>
            </div>
          </div>
          
          {/* Card Status Abonament */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
             <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCardIcon /> Status Abonament</h2>
             <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Planul curent</h3>
                <p className="text-lg font-bold text-gray-900">{PLANS[currentPlan].name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Mesaje utilizate</h3>
                <p className="text-lg font-bold text-gray-900">{messagesThisMonth} / {messagesLimit === -1 ? '∞' : messagesLimit}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Se resetează la</h3>
                <p className="text-lg font-bold text-gray-900">{resetDate.toDate().toLocaleDateString('ro-RO')}</p>
              </div>
            </div>
          </div>

          {/* Card Acțiuni Cont */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acțiuni</h2>
            <div className="space-y-4">
              <button 
                onClick={handleManageSubscription} 
                disabled={currentPlan === 'free'} 
                className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCardIcon /> Gestionează Abonamentul
              </button>
              <button onClick={handlePasswordReset} className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100">
                <KeyIcon /> Schimbă Parola
              </button>
              {resetMessage && <p className="text-sm text-green-600">{resetMessage}</p>}
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            </div>
          </div>

          {/* Zonă de Pericol */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-4">Zonă de Pericol</h2>
            <div className="space-y-4">
               <button onClick={logout} className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-red-600 hover:bg-red-50">
                  <LogoutIcon /> Deconectare
              </button>
               <button disabled className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
                  <TrashIcon /> Șterge Contul (în curând)
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// Funcție ajutătoare refolosită din /planuri
const getMessagesRemaining = (used: number, limit: number) => {
  if (limit === -1) return -1;
  return Math.max(0, limit - used);
};

// Obiect PLANS refolosit din /planuri pentru afișarea numelui
const PLANS = {
  free: { name: 'Gratuit' },
  premium_monthly: { name: 'Premium Lunar' },
  premium_annual: { name: 'Premium Anual' },
};
