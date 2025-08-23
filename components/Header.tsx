'use client'; // <-- MODIFICAREA CHEIE

import { useState } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import { useRouter } from 'next/navigation';

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CreditCardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialModalView, setInitialModalView] = useState<'login' | 'register'>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userDoc, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };
  
  const openLoginModal = () => {
    setInitialModalView('login');
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  }

  const openRegisterModal = () => {
    setInitialModalView('register');
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  }

  const shouldHighlightPlanuri = userDoc?.currentPlan === 'free' && 
    userDoc?.messagesLimit > 0 && 
    (userDoc.messagesLimit - userDoc.messagesThisMonth) <= 5;

  return (
    <>
      <header className="py-6 px-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="font-poppins font-bold text-2xl text-text" onClick={() => setIsMenuOpen(false)}>
            PascuPas<span className="text-primary">.online</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/chat" className="font-bold text-text hover:text-primary transition-colors">
                  Conversații
                </Link>
                <Link 
                  href="/planuri" 
                  className={`flex items-center gap-1 font-bold transition-colors ${
                    shouldHighlightPlanuri 
                      ? 'text-orange-600 hover:text-orange-700' 
                      : 'text-text hover:text-primary'
                  }`}
                >
                  <CreditCardIcon />
                  Planuri
                  {shouldHighlightPlanuri && (
                    <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                      !
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout} className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors">
                  Deconectare
                </button>
              </>
            ) : (
              <>
                <button onClick={openLoginModal} className="font-bold text-text hover:text-primary transition-colors">
                  Conectare
                </button>
                <button onClick={openRegisterModal} className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors">
                  Înregistrare
                </button>
              </>
            )}
          </nav>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text">
                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        
        {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-md shadow-lg">
                <nav className="container mx-auto flex flex-col items-center space-y-4 py-6">
                    {user ? (
                      <>
                        <Link href="/chat" onClick={() => setIsMenuOpen(false)} className="font-bold text-text hover:text-primary transition-colors text-lg">
                          Conversații
                        </Link>
                        <Link 
                          href="/planuri" 
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-2 font-bold transition-colors text-lg ${
                            shouldHighlightPlanuri 
                              ? 'text-orange-600 hover:text-orange-700' 
                              : 'text-text hover:text-primary'
                          }`}
                        >
                          <CreditCardIcon />
                          Planuri
                          {shouldHighlightPlanuri && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                              Upgrade
                            </span>
                          )}
                        </Link>
                        <button onClick={handleLogout} className="bg-primary text-white w-full max-w-xs px-5 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors text-lg">
                          Deconectare
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={openLoginModal} className="font-bold text-text hover:text-primary transition-colors text-lg">
                          Conectare
                        </button>
                        <button onClick={openRegisterModal} className="bg-primary text-white w-full max-w-xs px-5 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors text-lg">
                          Înregistrare
                        </button>
                      </>
                    )}
                </nav>
            </div>
        )}
      </header>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        initialView={initialModalView} 
      />
    </>
  );
}