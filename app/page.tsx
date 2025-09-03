'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import AuthModal from '@/components/AuthModal';

// --- Componente Iconițe ---
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 4h4m5 5H5a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v10a2 2 0 01-2 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const HeroSection = () => {
    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [initialModalView, setInitialModalView] = useState<'login' | 'register'>('login');
  
    const handleStartConversationClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!user) {
        e.preventDefault();
        setInitialModalView('register');
        setIsAuthModalOpen(true);
      }
    };

    return (
        <>
        <section className="text-center py-20 px-4">
            <div className="container mx-auto max-w-3xl">
            <h2 className="font-poppins font-extrabold text-4xl md:text-6xl text-text leading-tight mb-4">
                Psiholog AI în limba română – <span className="text-primary">Ascultă, Înțelege, Ghidează</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
                Discret. 24/7. Gata să te ajute când nu ai cu cine vorbi.
            </p>
            <Link href="/chat" onClick={handleStartConversationClick} className="bg-primary text-white font-bold px-8 py-4 rounded-lg shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105 inline-block">
                Începe conversația gratuit
            </Link>
            </div>
        </section>
        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            initialView={initialModalView} 
        />
        </>
    );
};

const BenefitsSection = () => {
  const benefits = [
    { icon: <ClockIcon />, title: "Disponibil 24/7", description: "Oricând ai nevoie, fără programări." },
    { icon: <LockIcon />, title: "100% Confidențial", description: "Un spațiu sigur, doar pentru tine." },
    { icon: <HeartIcon />, title: "Empatie Garantată", description: "Răspunsuri calde și pline de înțelegere." },
    { icon: <BrainIcon />, title: "Sfaturi Practice", description: "Ghidare concretă pentru a merge mai departe." },
  ];

  return (
    <section className="py-20 bg-white px-4">
      <div className="container mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center p-8 bg-background rounded-xl border border-gray-200">
              <div className="flex justify-center mb-5">{benefit.icon}</div>
              <h3 className="font-poppins font-bold text-xl mb-2 text-text">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SocialProofSection = () => (
    <section className="py-20 bg-background px-4">
        <div className="container mx-auto text-center max-w-2xl p-8 bg-white rounded-xl border border-gray-200">
            <h3 className="font-poppins font-bold text-2xl md:text-3xl text-text mb-4">Mii de conversații au început deja</h3>
            <p className="text-gray-600 text-base md:text-lg italic">
                “Am fost surprins de cât de naturală a fost conversația. Chiar m-a ajutat să-mi pun ordine în gânduri într-un moment dificil.”
            </p>
            <p className="mt-4 text-gray-500">– Un utilizator anonim</p>
        </div>
    </section>
);

const Footer = () => (
  <footer className="py-10 px-4 text-center text-gray-500 text-sm border-t bg-white">
    <div className="container mx-auto">
      <p className="font-bold mb-2 text-gray-700">Disclaimer Legal</p>
      <p className="max-w-2xl mx-auto mb-4">
        Acest serviciu este un instrument de suport emoțional și nu înlocuiește terapia medicală sau consultul unui specialist licențiat. Pentru probleme grave de sănătate mintală, vă rugăm să consultați un medic sau un psihoterapeut.
      </p>
      <div className="space-x-4">
        <Link href="/politica-confidentialitate" className="hover:text-primary">Politică de Confidențialitate</Link>
        <span>|</span>
        <Link href="/termeni" className="hover:text-primary">Termeni și Condiții</Link>
      </div>
       <p className="mt-6 text-gray-400">&copy; {new Date().getFullYear()} PascuPas.online. Toate drepturile rezervate.</p>
    </div>
  </footer>
);

export default function HomePage() {
  return (
    <div className="bg-background text-text">
      <Header />
      <main>
        <HeroSection />
        <BenefitsSection />
        <SocialProofSection />
      </main>
      <Footer />
    </div>
  );
}