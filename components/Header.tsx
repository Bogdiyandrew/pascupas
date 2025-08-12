'use client';

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


export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Stare pentru meniul mobil
  const { user } = useAuth();
  const auth = getAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false); // Închide meniul după logout
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  const handleChatLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
    setIsMenuOpen(false); // Închide meniul la click
  };
  
  const openAuthModal = () => {
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  }

  return (
    <>
      <header className="py-6 px-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="font-poppins font-bold text-2xl text-text" onClick={() => setIsMenuOpen(false)}>
            PascuPas<span className="text-primary">.online</span>
          </Link>

          {/* Navigare Desktop */}
          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/chat" className="font-bold text-text hover:text-primary transition-colors">Conversații</Link>
                <button onClick={handleLogout} className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors">Deconectare</button>
              </>
            ) : (
              <>
                <button onClick={openAuthModal} className="font-bold text-text hover:text-primary transition-colors">Conectare</button>
                <button onClick={openAuthModal} className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors">Înregistrare</button>
              </>
            )}
          </nav>

          {/* Buton Meniu Mobil */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text">
                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        
        {/* Meniu Mobil Dropdown */}
        {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-md shadow-lg">
                <nav className="container mx-auto flex flex-col items-center space-y-4 py-6">
                    {user ? (
                      <>
                        <Link href="/chat" onClick={handleChatLinkClick} className="font-bold text-text hover:text-primary transition-colors text-lg">Conversații</Link>
                        <button onClick={handleLogout} className="bg-primary text-white w-full max-w-xs px-5 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors text-lg">Deconectare</button>
                      </>
                    ) : (
                      <>
                        <button onClick={openAuthModal} className="font-bold text-text hover:text-primary transition-colors text-lg">Conectare</button>
                        <button onClick={openAuthModal} className="bg-primary text-white w-full max-w-xs px-5 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors text-lg">Înregistrare</button>
                      </>
                    )}
                </nav>
            </div>
        )}
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}