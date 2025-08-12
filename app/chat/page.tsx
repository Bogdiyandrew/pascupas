'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react'; // Am adăugat useCallback
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
  getDoc,
  deleteDoc,
  updateDoc
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
const OptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Salut! Sunt gata să te ascult. Cu ce-ți pot fi de ajutor?' }]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Funcții de Bază ---

  // CORECTAT: Am împachetat funcția în useCallback pentru a preveni re-crearea ei la fiecare randare
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const q = query(collection(db, "conversations"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const convos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      createdAt: doc.data().createdAt
    }));
    setConversations(convos);
  }, [user]); // Dependența este `user`

  // --- Efecte (Hooks) ---

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchConversations();
      }
    }
  }, [user, authLoading, router, fetchConversations]); // CORECTAT: Am adăugat fetchConversations la dependențe

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([{ role: 'assistant', content: 'Salut! Sunt gata să te ascult. Cu ce-ți pot fi de ajutor?' }]);
  };

  const selectConversation = async (id: string) => {
    if (editingConversationId === id) return;
    setActiveConversationId(id);
    const docRef = doc(db, "conversations", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setMessages(docSnap.data().messages);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const docRef = doc(db, "conversations", id);
    await updateDoc(docRef, { title: newTitle });
    setConversations(convos => convos.map(c => c.id === id ? { ...c, title: newTitle } : c));
    setEditingConversationId(null);
  };
  
  const handleDelete = async () => {
    if (!conversationToDelete) return;
    await deleteDoc(doc(db, "conversations", conversationToDelete.id));
    setConversations(convos => convos.filter(c => c.id !== conversationToDelete.id));
    if (activeConversationId === conversationToDelete.id) {
      startNewConversation();
    }
    setConversationToDelete(null);
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

      if (activeConversationId) {
        const docRef = doc(db, "conversations", activeConversationId);
        await setDoc(docRef, { messages: finalMessages }, { merge: true });
      } else {
        const newTitle = userMessage.content.substring(0, 40) + '...';
        const newConversationData = {
          userId: user.uid,
          title: newTitle,
          messages: finalMessages,
          createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, "conversations"), newConversationData);
        
        const newConversationForState: Conversation = {
          id: docRef.id,
          title: newTitle,
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
          
          <div className="flex-grow overflow-y-auto pr-2">
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><HistoryIcon /> Istoric</h2>
            <div className="space-y-2">
              {conversations.map(convo => (
                <ConversationItem 
                  key={convo.id}
                  convo={convo}
                  isActive={activeConversationId === convo.id}
                  isEditing={editingConversationId === convo.id}
                  onSelect={() => selectConversation(convo.id)}
                  onStartEdit={() => { setEditingConversationId(convo.id); setEditingTitle(convo.title); }}
                  onCancelEdit={() => setEditingConversationId(null)}
                  onSaveEdit={(newTitle) => handleRename(convo.id, newTitle)}
                  onDelete={() => setConversationToDelete(convo)}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* --- Zona Principală de Chat --- */}
        <main className="w-3/4 flex flex-col bg-white">
          {/* ... conținutul chat-ului rămâne la fel ... */}
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
      
      {/* --- Modal de Confirmare Ștergere --- */}
      {conversationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="font-bold text-lg text-center">Ești sigur?</h3>
            {/* CORECTAT: Am înlocuit ghilimelele drepte cu cele curbate */}
            <p className="text-center text-gray-600 mt-2">Vrei să ștergi definitiv conversația “{conversationToDelete.title}”?</p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => setConversationToDelete(null)} className="px-6 py-2 rounded-lg border">Anulează</button>
              <button onClick={handleDelete} className="px-6 py-2 rounded-lg bg-red-500 text-white">Șterge</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Tipuri pentru proprietățile componentei ConversationItem ---
interface ConversationItemProps {
  convo: Conversation;
  isActive: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (newTitle: string) => void;
  onDelete: () => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
}

// --- Componentă separată pentru un item din istoric ---
const ConversationItem = ({ convo, isActive, isEditing, onSelect, onStartEdit, onSaveEdit, onDelete, editingTitle, setEditingTitle }: ConversationItemProps) => {
  const [optionsVisible, setOptionsVisible] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptionsVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTitleSave = () => {
    onSaveEdit(editingTitle);
  };

  return (
    <div 
      onClick={onSelect}
      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${isActive ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-gray-200'}`}
    >
      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
          className="w-full bg-transparent outline-none ring-1 ring-primary rounded px-1"
          autoFocus
        />
      ) : (
        <p className="truncate">{convo.title}</p>
      )}
      
      {!isEditing && (
        <div className="relative" ref={optionsRef}>
          <button onClick={(e) => { e.stopPropagation(); setOptionsVisible(!optionsVisible); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-300">
            <OptionsIcon />
          </button>
          {optionsVisible && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-lg z-10">
              <button onClick={(e) => { e.stopPropagation(); onStartEdit(); setOptionsVisible(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"><EditIcon /> Redenumește</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); setOptionsVisible(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600 flex items-center"><DeleteIcon /> Șterge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
