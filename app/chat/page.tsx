'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase'; 
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  getDoc
} from 'firebase/firestore';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

// --- Tipuri de date ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: Timestamp;
}

// --- Componente Iconițe ---
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Salut! Sunt gata să te ascult. Cu ce-ți pot fi de ajutor?' }
  ]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Efecte (Hooks) ---

  // Protejarea paginii și încărcarea conversațiilor
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchConversations();
      }
    }
  }, [user, authLoading, router]);

  // Scroll automat la ultimul mesaj
  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  // --- Funcții de Bază ---

  const fetchConversations = async () => {
    if (!user) return;
    const q = query(collection(db, "conversations"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const convos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      createdAt: doc.data().createdAt
    }));
    setConversations(convos);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([{ role: 'assistant', content: 'Salut! Sunt gata să te ascult. Cu ce-ți pot fi de ajutor?' }]);
  };

  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    const docRef = doc(db, "conversations", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setMessages(docSnap.data().messages);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('A apărut o eroare. Te rog, încearcă din nou.');

      const data = await response.json();
      const aiMessage: Message = { role: 'assistant', content: data.response };
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      // --- Logica de Salvare în Firestore ---
      if (activeConversationId) {
        // Actualizează conversația existentă
        const docRef = doc(db, "conversations", activeConversationId);
        await setDoc(docRef, { messages: finalMessages }, { merge: true });
      } else {
        // Creează o conversație nouă
        const newConversationData = {
          userId: user.uid,
          title: userMessage.content.substring(0, 40) + '...',
          messages: finalMessages,
          createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, "conversations"), newConversationData);
        
        // **CORECTAT**: Actualizăm starea locală pentru un UI instantaneu
        const newConversationForState: Conversation = {
          id: docRef.id,
          title: newConversationData.title,
          createdAt: newConversationData.createdAt
        };
        setConversations(prevConvos => [newConversationForState, ...prevConvos]);
        setActiveConversationId(docRef.id);
      }

    } catch (err: unknown) {
        if (err instanceof Error) { setError(err.message); } 
        else { setError('A apărut o eroare necunoscută.'); }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-screen">Se încarcă...</div>;
  }

  return (
    <>
      <Header />
      <div className="flex h-[calc(100vh-88px)]">
        {/* --- Bara Laterală (Sidebar) --- */}
        <aside className="w-1/4 bg-background border-r border-gray-200 p-6 flex flex-col">
          <button onClick={startNewConversation} className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold p-3 rounded-lg hover:bg-opacity-90 transition-colors mb-8">
            <PlusIcon />
            Conversație Nouă
          </button>
          
          <div className="flex-grow overflow-y-auto">
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><HistoryIcon /> Istoric</h2>
            <div className="space-y-2">
              {conversations.map(convo => (
                <p 
                  key={convo.id} 
                  onClick={() => selectConversation(convo.id)}
                  className={`p-2 rounded-lg cursor-pointer text-sm truncate ${activeConversationId === convo.id ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-gray-200'}`}
                >
                  {convo.title}
                </p>
              ))}
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
