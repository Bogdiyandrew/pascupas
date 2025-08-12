'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { db } from '../../lib/firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import Header from '@/components/Header';

// --- Tipuri de date ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// --- Componente Iconițe ---
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Salut! Sunt gata să te ascult. Cu ce-ți pot fi de ajutor?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('A apărut o eroare. Te rog, încearcă din nou.');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // TODO: Salvează conversația în Firestore pentru utilizatorul logat
      
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('A apărut o eroare necunoscută.');
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex h-[calc(100vh-88px)]">
        {/* --- Bara Laterală (Sidebar) --- */}
        <aside className="w-1/4 bg-background border-r border-gray-200 p-6 flex flex-col">
          <button className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold p-3 rounded-lg hover:bg-opacity-90 transition-colors mb-8">
            <PlusIcon />
            Conversație Nouă
          </button>
          
          <div className="flex-grow overflow-y-auto">
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><HistoryIcon /> Istoric</h2>
            {/* Placeholder pentru istoric */}
            <div className="space-y-2">
              <p className="p-2 rounded-lg hover:bg-gray-200 cursor-pointer text-sm truncate">O discuție despre anxietate...</p>
              <p className="p-2 rounded-lg hover:bg-gray-200 cursor-pointer text-sm truncate">Planuri de viitor și frici...</p>
            </div>

            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mt-8 mb-4 flex items-center gap-2"><StarIcon /> Favorite</h2>
            {/* Placeholder pentru favorite */}
            <div className="space-y-2">
               <p className="p-2 rounded-lg hover:bg-gray-200 cursor-pointer text-sm truncate">Tehnica de respirație 4-7-8</p>
            </div>
          </div>
        </aside>

        {/* --- Zona Principală de Chat --- */}
        <main className="w-3/4 flex flex-col bg-white">
          <div ref={chatContainerRef} className="flex-grow p-6 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-text rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-gray-200 text-text rounded-2xl p-4 rounded-bl-none">
                    <span className="animate-pulse">Gândesc un răspuns...</span>
                 </div>
               </div>
            )}
          </div>
          
          <div className="p-6 bg-white border-t">
            <form onSubmit={handleSubmit} className="flex items-center space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrie mesajul tău aici..."
                className="w-full p-4 border rounded-full focus:ring-2 focus:ring-primary transition-shadow"
                disabled={isLoading}
              />
              <button type="submit" className="bg-primary p-4 rounded-full text-white hover:bg-opacity-90 transition-colors disabled:bg-gray-400" disabled={isLoading || !input.trim()}>
                <SendIcon />
              </button>
            </form>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
        </main>
      </div>
    </>
  );
}
