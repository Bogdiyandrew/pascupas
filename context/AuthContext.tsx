'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onIdTokenChanged, // Corect: Folosim onIdTokenChanged pentru a reacționa la reîmprospătarea token-ului
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { initializeChatCrypto, clearChatCrypto } from '@/lib/cryptoChat';
// Asigură-te că acest fișier există și exportă tipurile necesare
import { FirebaseUser, PLANS, canSendMessage, getMessagesRemaining } from '@/types/subscription';

interface AuthContextType {
  user: User | null;
  userDoc: FirebaseUser | null;
  loading: boolean;
  cryptoReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Funcții pentru gestionarea planurilor și a mesajelor
  canSendMessage: () => boolean;
  getMessagesRemaining: () => number;
  getCurrentPlan: () => string;
  incrementMessagesUsed: () => Promise<void>;
  checkAndResetMonth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cryptoReady, setCryptoReady] = useState(false);

  // Funcție pentru a inițializa un utilizator nou în Firestore cu planul gratuit
  const initializeNewUser = async (firebaseUser: User): Promise<FirebaseUser> => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const newUserDoc: FirebaseUser = {
      email: firebaseUser.email || '',
      createdAt: Timestamp.fromDate(now),
      currentPlan: 'free',
      messagesThisMonth: 0,
      messagesLimit: 15, // Limita pentru planul gratuit
      resetDate: Timestamp.fromDate(nextMonth),
      planStartDate: Timestamp.fromDate(now)
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
    console.log('✅ Utilizator nou inițializat cu planul gratuit (15 mesaje/lună)');
    return newUserDoc;
  };
  
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setCryptoReady(false);
    
    try {
      // Autentificarea va declanșa automat listener-ul onIdTokenChanged,
      // care va gestiona inițializarea criptării și încărcarea datelor utilizatorului.
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Autentificare cu succes. Se așteaptă listener-ul onIdTokenChanged...');
    } catch (error) {
      console.error('Eroare la autentificare:', error);
      setCryptoReady(false);
      setLoading(false); // Oprește încărcarea în caz de eroare
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Curățarea cheii de criptare la logout...');
      clearChatCrypto();
      setCryptoReady(false);
      
      await signOut(auth);
      setUser(null);
      setUserDoc(null);
      console.log('Logout complet.');
    } catch (error) {
      console.error('Eroare la logout:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Un utilizator este autentificat sau token-ul a fost reîmprospătat
        setUser(firebaseUser);

        try {
          console.log('🔄 Utilizator detectat sau token reîmprospătat. Re-inițializez criptarea...');
          await initializeChatCrypto(firebaseUser);
          setCryptoReady(true);
          console.log('✅ Criptarea a fost re-inițializată cu succes.');

          // Încarcă sau creează documentul utilizatorului
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let userData: FirebaseUser;
          
          if (userDocSnap.exists()) {
            userData = userDocSnap.data() as FirebaseUser;
            console.log('📄 Document utilizator încărcat din Firestore.');
          } else {
            console.log('👤 Se creează un document nou pentru utilizator...');
            userData = await initializeNewUser(firebaseUser);
          }
          
          // Verifică și resetează contorul lunar de mesaje dacă este necesar
          const now = new Date();
          const resetDate = userData.resetDate.toDate();

          if (now >= resetDate) {
              console.log('🔄 Resetez mesajele pentru luna nouă...');
              const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
              const limit = PLANS[userData.currentPlan].messagesLimit;
              
              const updatedFields: Partial<FirebaseUser> = {
                  messagesThisMonth: 0,
                  messagesLimit: limit,
                  resetDate: Timestamp.fromDate(nextResetDate)
              };

              await updateDoc(userDocRef, updatedFields);
              // Actualizează userData cu noile valori
              userData = { ...userData, ...updatedFields } as FirebaseUser;
              console.log('✅ Mesaje resetate.');
          }
          
          setUserDoc(userData);
          
        } catch (error) {
          console.error('❌ Eroare la re-inițializarea criptării sau încărcarea datelor:', error);
          setCryptoReady(false);
          // O strategie de fallback, cum ar fi logout forțat, ar putea fi adăugată aici
        }
      } else {
        // Utilizatorul nu este autentificat
        clearChatCrypto();
        setCryptoReady(false);
        setUser(null);
        setUserDoc(null);
        console.log('🔒 Niciun utilizator autentificat.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const incrementMessagesUsed = async (): Promise<void> => {
    if (!user || !userDoc) return;
    const newCount = userDoc.messagesThisMonth + 1;
    await updateDoc(doc(db, 'users', user.uid), { messagesThisMonth: newCount });
    setUserDoc(prev => prev ? { ...prev, messagesThisMonth: newCount } : null);
    console.log(`📊 Mesaje folosite: ${newCount}/${userDoc.messagesLimit}`);
  };

  const canSendMessageCheck = (): boolean => {
    if (!userDoc) return false;
    return canSendMessage(userDoc.messagesThisMonth, userDoc.messagesLimit);
  };

  const getMessagesRemainingCount = (): number => {
    if (!userDoc) return 0;
    return getMessagesRemaining(userDoc.messagesThisMonth, userDoc.messagesLimit);
  };

  const getCurrentPlan = (): string => {
    return userDoc ? PLANS[userDoc.currentPlan].name : 'Gratuit';
  };

  return (
    <AuthContext.Provider value={{
      user,
      userDoc,
      loading,
      cryptoReady,
      signIn,
      logout,
      canSendMessage: canSendMessageCheck,
      getMessagesRemaining: getMessagesRemainingCount,
      getCurrentPlan,
      incrementMessagesUsed,
      checkAndResetMonth: async () => {}, // Logica este acum automată în useEffect
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