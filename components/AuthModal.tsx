'use client';

import { useState, FormEvent } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
  // Am eliminat 'FirebaseError' care nu este exportat
} from 'firebase/auth';
import { app } from '@/lib/firebase';

// --- Componente Iconițe ---
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.853 44 30.221 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>;


export default function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  if (!isOpen) return null;

  const handleAuthAction = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose(); // Închide modalul după succes
    } catch (err: unknown) { 
      // CORECTAT: Verificăm dacă eroarea are o proprietate 'code'
      if (typeof err === 'object' && err !== null && 'code' in err) {
        setError(getFirebaseErrorMessage((err as { code: string }).code));
      } else {
        setError('A apărut o eroare necunoscută.');
      }
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    try {
        await signInWithPopup(auth, googleProvider);
        onClose();
    } catch (err: unknown) {
        // CORECTAT: Verificăm dacă eroarea are o proprietate 'code'
        if (typeof err === 'object' && err !== null && 'code' in err) {
            setError(getFirebaseErrorMessage((err as { code: string }).code));
        } else {
            setError('A apărut o eroare la conectarea cu Google.');
        }
    }
  };

  // Funcție ajutătoare pentru a traduce codurile de eroare Firebase
  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Adresa de email nu este validă.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email sau parolă incorectă.';
      case 'auth/email-already-in-use':
        return 'Acest email este deja folosit.';
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
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
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
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-bold text-primary hover:underline ml-1">
            {isLoginView ? 'Înregistrează-te' : 'Conectează-te'}
          </button>
        </p>
      </div>
    </div>
  );
}
