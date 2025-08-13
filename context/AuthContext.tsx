'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { initializeChatCrypto, clearChatCrypto, isChatCryptoReady } from '@/lib/cryptoChat';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  cryptoReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cryptoReady, setCryptoReady] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setCryptoReady(false);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Inițializează criptarea securizată după autentificare
      console.log('Inițializez criptarea securizată...');
      await initializeChatCrypto(result.user);
      setCryptoReady(true);
      
      setUser(result.user);
      console.log('Autentificare și criptare completate cu succes');
    } catch (error) {
      console.error('Eroare la autentificare sau inițializarea criptării:', error);
      setCryptoReady(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Curăță cheia de criptare din memorie pentru securitate
      console.log('Curățarea cheii de criptare...');
      clearChatCrypto();
      setCryptoReady(false);
      
      await signOut(auth);
      setUser(null);
      console.log('Logout complet - cheia de criptare a fost ștearsă');
    } catch (error) {
      console.error('Eroare la logout:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Re-inițializează criptarea la refresh de pagină sau re-autentificare
          console.log('Re-inițializez criptarea pentru utilizatorul existent...');
          await initializeChatCrypto(user);
          setCryptoReady(true);
          console.log('Criptarea a fost re-inițializată cu succes');
        } catch (error) {
          console.error('Eroare la re-inițializarea criptării:', error);
          setCryptoReady(false);
          // În cazul unei erori de criptare, utilizatorul poate încerca să se re-logheze
        }
        setUser(user);
      } else {
        // Utilizatorul nu este autentificat
        clearChatCrypto();
        setCryptoReady(false);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Verificare periodică a stării criptării (opțional)
  useEffect(() => {
    if (user && !cryptoReady) {
      // Verifică din nou dacă criptarea este gata
      const checkCrypto = () => {
        if (isChatCryptoReady()) {
          setCryptoReady(true);
        }
      };
      
      const interval = setInterval(checkCrypto, 1000);
      return () => clearInterval(interval);
    }
  }, [user, cryptoReady]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      cryptoReady,
      signIn,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};