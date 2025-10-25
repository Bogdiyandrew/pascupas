'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PLANS } from '@/types/subscription';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';

// --- Iconițe Optimizate ---
const UserIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CreditCardIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const KeyIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1119 7z" /></svg>;
const LogoutIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const TrashIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const AlertIcon = ({ className = "h-8 w-8 text-red-500" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const SaveIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" /></svg>

function DeleteAccountModal({ onConfirm, onCancel, isLoading }: { onConfirm: (password: string) => void; onCancel: () => void; isLoading: boolean }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!password) {
            setError('Te rugăm să introduci parola.');
            return;
        }
        onConfirm(password);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center mb-4"><AlertIcon /></div>
                <h3 className="font-bold text-xl text-center text-gray-900">Ești absolut sigur?</h3>
                <p className="text-center text-gray-600 mt-2 text-sm">
                    Această acțiune este ireversibilă. Pentru a confirma, te rugăm să introduci parola contului tău.
                </p>
                <div className="mt-6">
                    <label htmlFor="password-confirm" className="sr-only">Parolă</label>
                    <input
                        id="password-confirm"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Introdu parola pentru a confirma"
                        className={`w-full p-3 border rounded-lg focus:ring-2 transition-colors ${error ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                    />
                    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button onClick={onCancel} className="w-full px-6 py-3 rounded-lg border bg-gray-100 hover:bg-gray-200 font-semibold text-gray-800 transition-colors">Anulează</button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || !password}
                        className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:bg-red-300 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? 'Se șterge...' : 'Șterge Contul'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Un component generic pentru carduri
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-2xl shadow-sm border p-6 md:p-8 transition-all hover:shadow-md hover:border-gray-300 ${className}`}>
        {children}
    </div>
);


export default function AccountPage() {
  const { user, userDoc, loading, logout, sendPasswordReset, updateUserProfile, reauthenticateUser } = useAuth();
  const router = useRouter();
  const [resetMessage, setResetMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState('');

  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (userDoc) {
      setName(userDoc.profileData?.name || '');
      setAge(userDoc.profileData?.age || '');
      setGender(userDoc.profileData?.gender || '');
      setLocation(userDoc.profileData?.location || '');
      setOccupation(userDoc.profileData?.occupation || '');
      setHobbies(userDoc.profileData?.hobbies || []);
      setRelationshipStatus(userDoc.profileData?.relationshipStatus || '');
    }
  }, [userDoc]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setErrorMessage('Adresa de email nu este disponibilă.');
      return;
    }
    try {
      await sendPasswordReset(user.email);
      setResetMessage('Un link pentru resetarea parolei a fost trimis la adresa ta de email.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('A apărut o eroare la trimiterea emailului.');
      setResetMessage('');
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !userDoc || isProfileSaving) return;

    setIsProfileSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    const newProfileData = { name, age, gender, location, occupation, hobbies, relationshipStatus };

    try {
      await updateUserProfile(newProfileData);
      setSaveMessage('Profilul a fost salvat cu succes!');
      setTimeout(() => setSaveMessage(''), 3000); 
    } catch {
      // eslint-disable-next-line no-console
      console.error('Eroare la salvarea profilului');
      setErrorMessage('A apărut o eroare la salvarea profilului.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async (password: string) => {
    if (!user) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
        await reauthenticateUser(password);
        
        const conversationsQuery = query(collection(db, 'conversations'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(conversationsQuery);
        const deletionPromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletionPromises);
        
        await deleteDoc(doc(db, 'users', user.uid));
        await deleteUser(user);
        
        router.push('/');
    } catch (error: unknown) {
        console.error("Eroare la ștergerea contului:", error);
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const err = error as { code?: string };
          if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            setDeleteError('Parola introdusă este incorectă.');
          } else {
            setDeleteError('A apărut o eroare la ștergerea contului.');
          }
        } else {
          setDeleteError('A apărut o eroare necunoscută.');
        }
        setIsDeleting(false);
    }
  };
  
  if (loading || !user || !userDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { currentPlan, messagesThisMonth, messagesLimit, resetDate } = userDoc;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contul Meu</h1>
          <p className="text-gray-500 mb-8">Gestionează-ți profilul, abonamentul și setările de securitate.</p>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Coloana din stânga */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3"><UserIcon /> Profilul Meu</h2>
                <form onSubmit={handleSaveProfile} className="grid md:grid-cols-2 gap-6">
                  {/* Câmpurile formularului */}
                  <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
                      <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-gray-300" />
                  </div>
                  <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Vârstă</label>
                      <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-gray-300" />
                  </div>
                  <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gen</label>
                      <input type="text" id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-gray-300" />
                  </div>
                  <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Locație</label>
                      <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-gray-300" />
                  </div>
                  <div className="md:col-span-2">
                      <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">Ocupație</label>
                      <input type="text" id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-gray-300" />
                  </div>
                   <div className="md:col-span-2">
                      <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700 mb-1">Hobby-uri (separate prin virgulă)</label>
                      <input type="text" id="hobbies" value={hobbies.join(', ')} onChange={(e) => setHobbies(e.target.value.split(',').map(h => h.trim()))} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-gray-300" />
                  </div>
                   <div className="md:col-span-2">
                      <label htmlFor="relationshipStatus" className="block text-sm font-medium text-gray-700 mb-1">Stare civilă</label>
                      <input type="text" id="relationshipStatus" value={relationshipStatus} onChange={(e) => setRelationshipStatus(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-gray-300" />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between pt-2">
                    <button type="submit" disabled={isProfileSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-colors cursor-pointer bg-primary hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed">
                      <SaveIcon />
                      {isProfileSaving ? 'Se salvează...' : 'Salvează Profilul'}
                    </button>
                    {saveMessage && <p className="text-green-600 text-sm font-medium">{saveMessage}</p>}
                    {errorMessage && <p className="text-red-600 text-sm font-medium">{errorMessage}</p>}
                  </div>
                </form>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-red-700 mb-4">Zonă de Pericol</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Aceste acțiuni sunt permanente. Te rugăm să fii precaut.</p>
                  <div className="flex flex-wrap gap-4">
                      <button onClick={logout} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer">
                          <LogoutIcon /> Deconectare
                      </button>
                      <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer">
                          <TrashIcon /> Șterge Contul
                      </button>
                  </div>
                   {deleteError && <p className="text-red-600 text-sm mt-2">{deleteError}</p>}
                </div>
              </Card>
            </div>

            {/* Coloana din dreapta */}
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3"><CreditCardIcon /> Abonament</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Planul curent</h3>
                    <p className="text-lg font-bold text-primary">{PLANS[currentPlan].name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Mesaje utilizate luna aceasta</h3>
                    <p className="text-lg font-bold text-gray-900">{messagesThisMonth} / {messagesLimit === -1 ? '∞' : messagesLimit}</p>
                  </div>
                   <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Data resetării mesajelor</h3>
                    <p className="text-lg font-bold text-gray-900">{resetDate.toDate().toLocaleDateString('ro-RO')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/planuri')} 
                  className="mt-6 w-full text-center px-5 py-2.5 rounded-lg font-semibold text-primary border-2 border-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                >
                  Gestionează Abonamentul
                </button>
              </Card>
              
              <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Securitate</h2>
                   <button onClick={handlePasswordReset} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer">
                      <KeyIcon /> Schimbă Parola
                   </button>
                  {resetMessage && <p className="text-sm text-green-600 mt-2 text-center">{resetMessage}</p>}
              </Card>
            </div>

          </div>
        </div>
      </div>
      {showDeleteModal && (
          <DeleteAccountModal 
            onConfirm={confirmDelete} 
            onCancel={() => { setShowDeleteModal(false); setDeleteError(''); }} 
            isLoading={isDeleting} 
          />
      )}
    </>
  );
}