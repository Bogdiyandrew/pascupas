'use client';

import { useState } from 'react';
import Link from 'next/link';
// Vom crea acest modal în pasul următor
// import AuthModal from './AuthModal'; 

// --- Componente Iconițe ---
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


// --- Componenta Modală Placeholder ---
// O vom dezvolta complet mai târziu
const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <CloseIcon />
        </button>
        <h2 className="font-poppins font-bold text-2xl text-center mb-6 text-text">Bun venit!</h2>
        <p className="text-center text-gray-600">Formularul de autentificare va apărea aici.</p>
      </div>
    </div>
  );
};


export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Simulare stare logare - vom înlocui cu Firebase Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  const handleLogout = () => {
    // Aici va veni logica de logout din Firebase
    setIsLoggedIn(false);
  };

  return (
    <>
      <header className="py-6 px-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="font-poppins font-bold text-2xl text-text">
            PascuPas<span className="text-primary">.online</span>
          </Link>
          <nav className="flex items-center space-x-4">
            {isLoggedIn ? (
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
