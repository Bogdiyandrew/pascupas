'use client';

import { useState, FormEvent, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M43.611,20.083H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#34A853" d="M43.611,20.083H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C42.012,35.853,44,30.221,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FBBC05" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#EA4335" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="none" d="M48,24c0,13.255-10.745,24-24,24S0,37.255,0,24S10.745,0,24,0S48,10.745,48,24z"/>
    </svg>
);

export default function AuthModal({ isOpen, onClose, initialView }: { isOpen: boolean, onClose: () => void, initialView: 'login' | 'register' }) {
  const [isLoginView, setIsLoginView] = useState(initialView === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const auth = getAuth(app);
  const { signIn, sendPasswordReset } = useAuth();
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    if (isOpen) {
      setIsLoginView(initialView === 'login');
      setError('');
      setResetMessage('');
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleAuthAction = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    try {
      if (isLoginView) {
        await signIn(email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        setError(getFirebaseErrorMessage((err as { code: string }).code));
      } else {
        setError('A apărut o eroare necunoscută.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setResetMessage('');
    try {
        await signInWithPopup(auth, googleProvider);
        onClose();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        setError(getFirebaseErrorMessage((err as { code: string }).code));
      } else {
        setError('A apărut o eroare necunoscută.');
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Te rugăm să introduci adresa de email în câmpul de mai sus.');
      return;
    }
    setError('');
    setResetMessage('');

    try {
      await sendPasswordReset(email);
      setResetMessage('Verifică-ți emailul! Am trimis un link pentru resetarea parolei.');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        setError(getFirebaseErrorMessage((err as { code: string }).code));
      } else {
        setError('A apărut o eroare la resetarea parolei.');
      }
    }
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Adresa de email nu este validă.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email sau parolă incorectă. Verifică datele sau resetează parola.';
      case 'auth/email-already-in-use':
        return 'Există deja un cont cu această adresă de email.';
      case 'auth/weak-password':
        return 'Parola trebuie să aibă cel puțin 6 caractere.';
      default:
        return 'A apărut o eroare. Vă rugăm să încercați din nou.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <CloseIcon />
        </button>
        
        <h2 className="font-poppins font-bold text-2xl text-center mb-2 text-text">
          {isLoginView ? 'Bun venit înapoi!' : 'Creează un cont nou'}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isLoginView ? 'Conectează-te pentru a continua.' : 'Este rapid și gratuit.'}
        </p>

        <form onSubmit={handleAuthAction} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adresa.ta@email.com"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary transition-shadow"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parola ta"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary transition-shadow"
            required
          />
          
          {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
          {resetMessage && <p className="text-green-600 text-sm text-center pt-2">{resetMessage}</p>}
          
          {isLoginView && (
            <div className="text-right -mt-2">
              <button 
                  type="button" 
                  onClick={handlePasswordReset} 
                  className="text-sm text-primary hover:underline font-medium"
              >
                  Mi-am uitat parola
              </button>
            </div>
          )}

          <button type="submit" className="w-full bg-primary text-white font-bold p-3 rounded-lg hover:bg-opacity-90 transition-colors">
            {isLoginView ? 'Conectare' : 'Înregistrare'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">SAU</span>
          </div>
        </div>

        <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 border p-3 rounded-lg hover:bg-gray-100 transition-colors">
          <GoogleIcon />
          <span className="font-bold text-text">Continuă cu Google</span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isLoginView ? 'Nu ai cont?' : 'Ai deja un cont?'}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setResetMessage(''); }} className="font-bold text-primary hover:underline ml-1">
            {isLoginView ? 'Înregistrează-te' : 'Conectează-te'}
          </button>
        </p>
      </div>
    </div>
  );
}