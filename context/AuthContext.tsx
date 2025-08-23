'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onIdTokenChanged,
  User 
} from 'firebase/auth';
// MODIFICARE: Importăm onSnapshot pentru a asculta modificări în timp real
import { doc, getDoc, setDoc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { initializeChatCrypto, clearChatCrypto } from '@/lib/cryptoChat';
import { FirebaseUser, PLANS, canSendMessage, getMessagesRemaining } from '@/types/subscription';

interface AuthContextType {
  user: User | null;
  userDoc: FirebaseUser | null;
  loading: boolean;
  cryptoReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  canSendMessage: () => boolean;
  getMessagesRemaining: () => number;
  getCurrentPlan: () => string;
  incrementMessagesUsed: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cryptoReady, setCryptoReady] = useState(false);

  const initializeNewUser = async (firebaseUser: User): Promise<FirebaseUser> => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const newUserDoc: FirebaseUser = {
      email: firebaseUser.email || '',
      createdAt: Timestamp.fromDate(now),
      currentPlan: 'free',
      messagesThisMonth: 0,
      messagesLimit: PLANS.free.messagesLimit,
      resetDate: Timestamp.fromDate(nextMonth),
      planStartDate: Timestamp.fromDate(now)
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
    console.log('✅ Utilizator nou inițializat cu planul gratuit.');
    return newUserDoc;
  };
  
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onIdTokenChanged(auth, async (firebaseUser) => {
      // Dacă există un listener activ de la un user anterior, îl oprim
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }

      if (firebaseUser) {
        setLoading(true);
        setUser(firebaseUser);
        
        try {
          await initializeChatCrypto(firebaseUser);
          setCryptoReady(true);
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // --- MODIFICARE CHEIE: Implementăm listener-ul onSnapshot ---
          unsubscribeFromFirestore = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              let userData = docSnap.data() as FirebaseUser;
              console.log('📄 Document utilizator (re)încărcat în timp real.');
              
              const expectedLimit = PLANS[userData.currentPlan]?.messagesLimit ?? PLANS.free.messagesLimit;
              let needsUpdate = false;
              const updates: Partial<FirebaseUser> = {};

              // --- LOGICA DE AUTO-CORECTIE ---
              if (userData.messagesLimit !== expectedLimit) {
                updates.messagesLimit = expectedLimit;
                needsUpdate = true;
                console.log(`🔧 Limita de mesaje nu corespunde planului. Se actualizează la: ${expectedLimit}`);
              }

              // Verificăm și resetăm luna, dacă este cazul
              const now = new Date();
              if (now >= userData.resetDate.toDate()) {
                  updates.messagesThisMonth = 0;
                  updates.resetDate = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
                  needsUpdate = true;
                  console.log('🔄 Resetez mesajele pentru luna nouă...');
              }

              if (needsUpdate) {
                // Actualizăm documentul, iar onSnapshot va prelua automat modificarea
                await updateDoc(userDocRef, updates);
              } else {
                // Dacă nu e nevoie de update, setăm direct starea
                setUserDoc(userData);
              }

            } else {
              const newUserData = await initializeNewUser(firebaseUser);
              setUserDoc(newUserData);
            }
            setLoading(false);
          });

        } catch (error) {
          console.error('❌ Eroare la inițializarea utilizatorului:', error);
          setCryptoReady(false);
          setLoading(false);
        }
      } else {
        // Când nu există utilizator, curățăm tot
        clearChatCrypto();
        setCryptoReady(false);
        setUser(null);
        setUserDoc(null);
        setLoading(false);
      }
    });

    // Funcția de curățare la demontarea componentei
    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, []);

  const incrementMessagesUsed = async (): Promise<void> => {
    if (!user || !userDoc) return;
    const newCount = userDoc.messagesThisMonth + 1;
    await updateDoc(doc(db, 'users', user.uid), { messagesThisMonth: newCount });
    // Nu mai este nevoie să actualizăm starea locală, onSnapshot se ocupă
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
      incrementMessagesUsed
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