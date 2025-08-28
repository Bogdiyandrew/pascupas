'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onIdTokenChanged,
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, updateDoc, Timestamp, onSnapshot, DocumentReference } from 'firebase/firestore';
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
  sendPasswordReset: (email: string) => Promise<void>;
  
  canSendMessage: () => boolean;
  getMessagesRemaining: () => number;
  getCurrentPlan: () => string;
  incrementMessagesUsed: () => Promise<void>;
  updateUserProfile: (profileData: Partial<FirebaseUser['profileData']>) => Promise<void>;
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
      planStartDate: Timestamp.fromDate(now),
      profileData: {}
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
    return newUserDoc;
  };
  
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Eroare la trimiterea emailului de resetare:", error);
      throw error;
    }
  };

  const updateUserProfile = async (newProfileData: Partial<FirebaseUser['profileData']>): Promise<void> => {
    if (!user) return;
    try {
      const userRef: DocumentReference = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profileData: {
          ...(userDoc?.profileData || {}),
          ...newProfileData
        }
      });
    } catch (error) {
      console.error('❌ Eroare la actualizarea profilului:', error);
    }
};

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onIdTokenChanged(auth, async (firebaseUser) => {
      if (unsubscribeFromFirestore) unsubscribeFromFirestore();

      if (firebaseUser) {
        setLoading(true);
        setUser(firebaseUser);
        
        try {
          await initializeChatCrypto(firebaseUser);
          setCryptoReady(true);
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          unsubscribeFromFirestore = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              let userData = docSnap.data() as FirebaseUser;
              const expectedLimit = PLANS[userData.currentPlan]?.messagesLimit ?? PLANS.free.messagesLimit;
              let needsUpdate = false;
              const updates: Partial<FirebaseUser> = {};

              if (userData.messagesLimit !== expectedLimit) {
                updates.messagesLimit = expectedLimit;
                needsUpdate = true;
              }

              const now = new Date();
              if (now >= userData.resetDate.toDate()) {
                  updates.messagesThisMonth = 0;
                  updates.resetDate = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
                  needsUpdate = true;
              }

              if (needsUpdate) {
                await updateDoc(userDocRef, updates);
              } else {
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
        clearChatCrypto();
        setCryptoReady(false);
        setUser(null);
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) unsubscribeFromFirestore();
    };
  }, []);

  const incrementMessagesUsed = async (): Promise<void> => {
    if (!user || !userDoc) return;
    const newCount = userDoc.messagesThisMonth + 1;
    await updateDoc(doc(db, 'users', user.uid), { messagesThisMonth: newCount });
  };

  const canSendMessageCheck = (): boolean => {
    return userDoc ? canSendMessage(userDoc.messagesThisMonth, userDoc.messagesLimit) : false;
  };

  const getMessagesRemainingCount = (): number => {
    return userDoc ? getMessagesRemaining(userDoc.messagesThisMonth, userDoc.messagesLimit) : 0;
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
      sendPasswordReset,
      canSendMessage: canSendMessageCheck,
      getMessagesRemaining: getMessagesRemainingCount,
      getCurrentPlan,
      incrementMessagesUsed,
      updateUserProfile // Aici se expune noua funcție
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