'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { encryptText, decryptText } from '@/lib/cryptoChat'; // <-- 1. IMPORTĂM HELPER-UL

/* ===================== Tipuri ===================== */
// <-- 2. INTERFAȚA MODIFICATĂ
interface Message {
  role: 'user' | 'assistant';
  content: string;     // Textul în clar, decriptat, pentru afișare în UI
  contentEnc?: string; // ciphertext (base64)
  iv?: string;         // iv (base64)
}
interface Conversation {
  id: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ===================== Iconițe (Neschimbate) ===================== */
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
);
const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const OptionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
);

/* ===================== Sugestii start (Neschimbate) ===================== */
const startSuggestions = [
  'Vreau să vorbesc despre stres',
  'Mă simt trist/ă',
  'Am nevoie de un sfat',
  'Nu pot dormi bine',
  'Mă simt anxios/anxioasă',
];

/* ===================== Consent Modal (Neschimbat) ===================== */
function ConsentModal({ onAccept, onDecline, noStore, setNoStore }: { onAccept: () => void; onDecline: () => void; noStore: boolean; setNoStore: (v: boolean) => void; }) {
    // ... (codul pentru modalul de consimțământ rămâne identic)
    const [agree, setAgree] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
        >
            <h2 id="consent-title" className="text-xl font-semibold mb-3">Înainte să începem</h2>
            <p className="text-sm text-gray-700 mb-3">Pentru a-ți răspunde, acest chat procesează mesajele tale cu ajutorul inteligenței artificiale. Informațiile sunt folosite doar pentru funcționarea serviciului și pot fi șterse la cerere. Serviciul <b>nu înlocuiește</b> consilierea unui psiholog.</p>
            <p className="text-xs text-gray-600 mb-3">În urgență, sună la <b>112</b> sau la <a href="tel:0374456420" className="underline">DepreHUB 0374 456 420</a>. Detalii: <a href="/politica-confidentialitate" className="underline">Politica de confidențialitate</a> •{' '}<a href="/termeni" className="underline">Termeni și condiții</a>.</p>
            <label className="flex items-start gap-2 text-sm text-gray-800 mb-2">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={noStore} onChange={(e) => { setNoStore(e.target.checked); localStorage.setItem('noStore', e.target.checked ? 'true' : 'false'); }} />
            <span><b>Mod privat</b>: nu salva conversațiile mele. <span className="text-gray-500">Nu voi avea istoric sau reluare.</span></span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-800 mb-4">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span><b>Confirm că sunt de acord</b> cu prelucrarea mesajelor mele pentru a putea folosi chatul.</span>
            </label>
            <div className="flex justify-end gap-3">
            <button onClick={onDecline} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Refuz</button>
            <button onClick={() => agree && onAccept()} disabled={!agree} className={`px-4 py-2 rounded-lg text-white ${agree ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>Accept și continui</button>
            </div>
        </div>
        </div>
    );
}

/* ===================== Pagina Chat ===================== */
export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [hasConsented, setHasConsented] = useState(false);
  const [noStore, setNoStore] = useState(false);

  // Starea inițială are doar `content`
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Salut! Sunt aici să te ascult. Cu ce te pot ajuta?' },
  ]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem('gdprConsent');
    if (consent === 'true') setHasConsented(true);
    const ns = localStorage.getItem('noStore');
    if (ns === 'true') setNoStore(true);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user || noStore) return;
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const convos = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Conversation, 'id'>),
    }));
    setConversations(convos);
  }, [user, noStore]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/');
      else fetchConversations();
    }
  }, [user, authLoading, router, fetchConversations]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([{ role: 'assistant', content: 'Salut! Sunt aici să te ascult. Cu ce te pot ajuta?' }]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // <-- 3. FUNCȚIA DE SELECTARE MODIFICATĂ (PENTRU DECRIPTARE)
  const selectConversation = async (id: string) => {
    if (editingConversationId === id) return;
    setActiveConversationId(id);
    if (noStore) return;

    setIsLoading(true);
    const docRef = doc(db, 'conversations', id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const fetchedMessages = (snap.data().messages || []) as Message[];
      
      const decryptedMessages = await Promise.all(
        fetchedMessages.map(async (msg) => {
          if (msg.contentEnc && msg.iv) {
            try {
              const decryptedContent = await decryptText(msg.contentEnc, msg.iv);
              return { ...msg, content: decryptedContent };
            } catch (e) {
              console.error("Failed to decrypt a message:", e);
              return { ...msg, content: "[Mesaj indescifrabil]" };
            }
          }
          return msg; // Pentru mesajele vechi, necriptate
        })
      );
      setMessages(decryptedMessages);
    }
    setIsLoading(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  
  const handleRename = async (id: string, newTitle: string) => {
      // ... (neschimbat)
  };

  const handleDelete = async () => {
      // ... (neschimbat)
  };

  // <-- 4. FUNCȚIA DE TRIMITERE MODIFICATĂ (PENTRU CRIPTARE)
  async function sendMessage(text: string) {
    if (!text.trim() || isLoading || !user) return;
    if (!hasConsented) {
      setError('Trebuie să accepți termenii pentru a continua.');
      return;
    }

    const userMessage: Message = { role: 'user', content: text };
    const currentDisplayMessages = [...messages, userMessage];

    // Actualizăm UI-ul imediat cu mesajul în clar
    setMessages([...currentDisplayMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Trimitem la API mesajele în clar
        body: JSON.stringify({
          messages: currentDisplayMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error('A apărut o eroare la server. Încearcă din nou.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        // Actualizăm UI-ul pe măsură ce primim stream-ul
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: aiText };
          return copy;
        });
      }

      if (!noStore) {
        // CRIPTAREA se întâmplă aici, înainte de salvare
        const { ciphertext: userCiphertext, iv: userIv } = await encryptText(userMessage.content);
        const { ciphertext: assistantCiphertext, iv: assistantIv } = await encryptText(aiText);

        // Pregătim obiectele pentru stocare (fără câmpul 'content')
        const finalUserMessageToStore = { role: 'user', contentEnc: userCiphertext, iv: userIv };
        const finalAssistantMessageToStore = { role: 'assistant', contentEnc: assistantCiphertext, iv: assistantIv };

        // Preluăm mesajele anterioare, deja criptate și stocate
        const previousMessagesToStore = messages
            .filter(msg => msg.contentEnc && msg.iv)
            .map(msg => ({ role: msg.role, contentEnc: msg.contentEnc, iv: msg.iv }));

        const finalMessagesToStore = [
          ...previousMessagesToStore,
          finalUserMessageToStore,
          finalAssistantMessageToStore,
        ];

        const now = Timestamp.now();

        if (activeConversationId) {
          const docRef = doc(db, 'conversations', activeConversationId);
          await updateDoc(docRef, { messages: finalMessagesToStore, updatedAt: now });
        } else {
          const newTitle = userMessage.content.substring(0, 40) + '…';
          const data = {
            userId: user.uid,
            title: newTitle,
            messages: finalMessagesToStore,
            createdAt: now,
            updatedAt: now,
          };
          const docRef = await addDoc(collection(db, 'conversations'), data);
          setActiveConversationId(docRef.id);
          await fetchConversations(); // Reîmprospătăm lista
        }
        
        // Actualizăm starea locală cu datele criptate pentru a fi consistente
        setMessages([...messages, 
            { ...userMessage, contentEnc: userCiphertext, iv: userIv}, 
            { role: 'assistant', content: aiText, contentEnc: assistantCiphertext, iv: assistantIv }
        ]);

      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare necunoscută.');
    } finally {
      setIsLoading(false);
    }
  }


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };
  const handleSuggestionClick = async (text: string) => {
    await sendMessage(text);
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-screen">Se încarcă...</div>;
  }

  if (!hasConsented) {
    return (
      <>
        <Header />
        <ConsentModal
          onAccept={() => {
            setHasConsented(true);
            localStorage.setItem('gdprConsent', 'true');
          }}
          onDecline={() => router.push('/')}
          noStore={noStore}
          setNoStore={setNoStore}
        />
      </>
    );
  }

  /* ===================== UI principal (Neschimbat) ===================== */
  return (
    <>
      <Header />
      <div className="flex h-[calc(100vh-88px)] relative overflow-hidden">
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>}
        <aside
          className={`absolute top-0 left-0 h-full w-3/4 max-w-xs md:w-1/4 md:relative transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out bg-background border-r border-gray-200 p-6 flex flex-col z-30`}
        >
          {/* ... (conținutul sidebar-ului rămâne la fel) */}
          <button onClick={startNewConversation} className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold p-3 rounded-lg hover:bg-opacity-90 transition-colors mb-4">
            <PlusIcon />
            Conversație Nouă
          </button>
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={noStore} onChange={(e) => { setNoStore(e.target.checked); localStorage.setItem('noStore', e.target.checked ? 'true' : 'false'); if (e.target.checked) setConversations([]); }} />
              <span>Mod privat (nu salva conversațiile)</span>
            </label>
            <p className="text-[11px] text-gray-500 mt-1">Nu înlocuiește un psiholog. În criză, sună la 112.</p>
          </div>
          <div className="flex-grow overflow-y-auto pr-2">
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <HistoryIcon /> Istoric
            </h2>
            {!noStore ? (
              <div className="space-y-2">
                {conversations.map((convo) => (
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
            ) : (
              <div className="text-xs text-gray-500">Istoricul este dezactivat în mod privat.</div>
            )}
          </div>
        </aside>
        
        <main className="w-full md:w-3/4 flex flex-col bg-white">
          <div className="p-4 border-b md:hidden flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 mr-2">
              <MenuIcon />
            </button>
            <h2 className="font-bold text-lg">Chat</h2>
          </div>

          <div ref={chatContainerRef} className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto">
            {/* <-- 5. Afișarea funcționează la fel, citind din `msg.content` */}
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-lg md:max-w-xl p-3 md:p-4 rounded-2xl prose prose-sm ${
                    msg.role === 'user' ? 'bg-primary text-white rounded-br-none prose-invert' : 'bg-gray-200 text-text rounded-bl-none'
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {/* ... (restul UI-ului principal rămâne la fel) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {startSuggestions.map((s, i) => (
                  <button key={i} onClick={() => handleSuggestionClick(s)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 border">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-text rounded-2xl p-4 rounded-bl-none">
                  <span className="animate-pulse">AI scrie…</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 bg-white border-t">
            <form id="chatForm" onSubmit={handleSubmit} className="flex items-center space-x-2 md:space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrie mesajul tău aici..."
                className="w-full p-3 md:p-4 border rounded-full bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-primary transition-shadow"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-primary p-3 md:p-4 rounded-full text-white hover:bg-opacity-90 transition-colors disabled:bg-gray-400"
                disabled={isLoading || !input.trim()}
                aria-label="Trimite mesaj"
              >
                <SendIcon />
              </button>
            </form>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
        </main>
      </div>
      
      {/* ... (modalul de ștergere rămâne la fel) */}
      {conversationToDelete && !noStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg text-center">Ești sigur?</h3>
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

/* ===================== ConversationItem (Neschimbat) ===================== */
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
function ConversationItem({ convo, isActive, isEditing, onSelect, onStartEdit, onSaveEdit, onDelete, editingTitle, setEditingTitle }: ConversationItemProps) {
    // ... (codul pentru ConversationItem rămâne identic)
    const [optionsVisible, setOptionsVisible] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
          setOptionsVisible(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    const handleTitleSave = () => onSaveEdit(editingTitle);
  
    return (
      <div
        onClick={onSelect}
        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${
          isActive ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-gray-200'
        }`}
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOptionsVisible(!optionsVisible);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-300"
              aria-label="Opțiuni conversație"
            >
              <OptionsIcon />
            </button>
  
            {optionsVisible && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-lg z-10">
                <button onClick={(e) => { e.stopPropagation(); onStartEdit(); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center">
                  <EditIcon /> Redenumește
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600 flex items-center">
                  <DeleteIcon /> Șterge
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
}