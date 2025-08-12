'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext'; // Importăm hook-ul nostru
import AuthModal from './AuthModal'; // Importăm modalul funcțional

export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth(); // Obținem utilizatorul curent din context
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Starea se va actualiza automat datorită listener-ului din AuthContext
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  return (
    <>
      <header className="py-6 px-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="font-poppins font-bold text-2xl text-text">
            PascuPas<span className="text-primary">.online</span>
          </Link>
          <nav className="flex items-center space-x-4">
            {user ? ( // Verificăm dacă există un utilizator
              <>
                <Link href="/chat" className="font-bold text-text hover:text-primary transition-colors">Conversații</Link>
                <button onClick={handleLogout} className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors">Deconectare</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsAuthModalOpen(true)} className="font-bold text-text hover:text-primary transition-colors">Conectare</button>
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors">Înregistrare</button>
              </>
            )}
          </nav>
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
