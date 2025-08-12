'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// --- Configurare Firebase (înlocuiește cu datele tale) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inițializare Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Tipuri de date ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// --- Componente Iconițe (SVG-uri pentru performanță) ---
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 4h4m5 5H5a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v10a2 2 0 01-2 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;


// --- Componentele Paginilor ---

const Header = () => (
  <header className="py-6 px-4">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="font-poppins font-bold text-2xl text-text">PascuPas<span className="text-primary">.online</span></h1>
      <a href="#chat-demo" className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors">Începe Acum</a>
    </div>
  </header>
);

const HeroSection = () => (
  <section className="text-center py-20 px-4">
    <div className="container mx-auto max-w-3xl">
      <h2 className="font-poppins font-extrabold text-4xl md:text-6xl text-text leading-tight mb-4">
        Psiholog AI în limba română – <span className="text-primary">Ascultă, Înțelege, Ghidează</span>
      </h2>
      <p className="text-lg md:text-xl text-gray-600 mb-8">
        Discret. 24/7. Gata să te ajute când nu ai cu cine vorbi.
      </p>
      <a href="#chat-demo" className="bg-primary text-white font-bold px-8 py-4 rounded-lg shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105 inline-block">
        Începe conversația gratuit
      </a>
    </div>
  </section>
);

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
        <div className="grid md:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center p-6 bg-background rounded-xl">
              <div className="flex justify-center mb-4">{benefit.icon}</div>
              <h3 className="font-poppins font-bold text-xl mb-2 text-text">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ChatDemo = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Salut! Sunt aici să te ascult. Ce ai pe suflet astăzi?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageLimit = 5; // 1 mesaj de la AI + 2 perechi user/AI

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || messages.length >= messageLimit) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('A apărut o eroare. Te rog, încearcă din nou.');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Te rog, introdu o adresă de email validă.');
      return;
    }
    setError('');
    
    try {
        // Salvează email-ul în Firestore
        await addDoc(collection(db, "subscribers"), { email: email, createdAt: new Date() });
        // Salvează conversația
        await addDoc(collection(db, "conversations"), { user_email: email, history: messages, createdAt: new Date() });
        
        setIsEmailSubmitted(true);
    } catch (err) {
        console.error("Error writing document: ", err);
        setError('Nu am putut salva datele. Te rog, încearcă mai târziu.');
    }
  };

  return (
    <section id="chat-demo" className="py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div ref={chatContainerRef} className="h-96 p-6 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-text rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-gray-200 text-text rounded-2xl p-3 rounded-bl-none">
                    <span className="animate-pulse">...</span>
                 </div>
               </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-100 border-t">
            {messages.length >= messageLimit ? (
              isEmailSubmitted ? (
                <div className="text-center p-4 bg-accent-green/10 rounded-lg">
                  <h4 className="font-bold text-accent-green">Mulțumim!</h4>
                  <p className="text-gray-700">Te vom anunța când lansăm versiunea completă.</p>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <p className="text-center font-medium text-text">Ai atins limita de mesaje gratuite. Lasă-ne email-ul tău pentru a continua discuția și pentru a te anunța de lansare!</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adresa.ta@email.com"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button type="submit" className="w-full bg-accent-green text-white font-bold p-3 rounded-lg hover:bg-opacity-90 transition-colors">
                    Trimite și Continuă
                  </button>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Scrie mesajul tău aici..."
                  className="w-full p-3 border rounded-full focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
                <button type="submit" className="bg-primary p-3 rounded-full text-white hover:bg-opacity-90 transition-colors disabled:bg-gray-400" disabled={isLoading || !input.trim()}>
                  <SendIcon />
                </button>
              </form>
            )}
            {error && ! (messages.length >= messageLimit) && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

const SocialProofSection = () => (
    <section className="py-20 bg-white px-4">
        <div className="container mx-auto text-center max-w-2xl">
            <h3 className="font-poppins font-bold text-3xl text-text mb-4">Mii de conversații au început deja</h3>
            <p className="text-gray-600 text-lg">
                "Am fost surprins de cât de naturală a fost conversația. Chiar m-a ajutat să-mi pun ordine în gânduri într-un moment dificil." – un utilizator anonim.
            </p>
        </div>
    </section>
);

const Footer = () => (
  <footer className="py-10 px-4 text-center text-gray-500 text-sm">
    <div className="container mx-auto">
      <p className="font-bold mb-2">Disclaimer Legal</p>
      <p className="max-w-2xl mx-auto mb-4">
        Acest serviciu este un instrument de suport emoțional și nu înlocuiește terapia medicală sau consultul unui specialist licențiat. Pentru probleme grave de sănătate mintală, vă rugăm să consultați un medic sau un psihoterapeut.
      </p>
      <div className="space-x-4">
        <a href="#" className="hover:text-primary">Politică de Confidențialitate</a>
        <span>|</span>
        <a href="#" className="hover:text-primary">Contact</a>
      </div>
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
        <ChatDemo />
        <SocialProofSection />
      </main>
      <Footer />
    </div>
  );
}
