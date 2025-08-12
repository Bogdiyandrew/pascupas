'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Importăm aplicația Firebase inițializată

// Obținem serviciul de autentificare
const auth = getAuth(app);

// Definim tipul pentru valorile din context
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Creăm contextul cu o valoare default
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Creăm provider-ul care va înveli aplicația
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged este un listener care verifică în timp real starea de autentificare
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Curățăm listener-ul la demontarea componentei pentru a evita memory leaks
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  // Afișăm copiii doar după ce am verificat starea de autentificare
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Creăm un custom hook pentru a folosi contextul mai ușor în alte componente
export const useAuth = () => {
  return useContext(AuthContext);
};
