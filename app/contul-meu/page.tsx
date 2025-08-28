'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { getMessagesRemaining, PLANS } from '@/types/subscription';
import { collection, query, where, getDocs, deleteDoc, doc, deleteField, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';

// --- Iconițe ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1119 7z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

function DeleteAccountModal({ onConfirm, onCancel, isLoading }: { onConfirm: () => void; onCancel: () => void; isLoading: boolean }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm mx-4">
                <div className="flex justify-center mb-4"><AlertIcon /></div>
                <h3 className="font-bold text-lg text-center">Ești sigur?</h3>
                <p className="text-center text-gray-600 mt-2 text-sm">Această acțiune este ireversibilă. Toate conversațiile și datele tale vor fi șterse definitiv.</p>
                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={onCancel} className="px-6 py-2 rounded-lg border">Anulează</button>
                    <button onClick={onConfirm} disabled={isLoading} className={`px-6 py-2 rounded-lg text-white ${isLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>
                        {isLoading ? 'Șterge...' : 'Șterge Contul'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AccountPage() {
  const { user, userDoc, loading, logout, sendPasswordReset, updateUserProfile } = useAuth();
  const router = useRouter();
  const [resetMessage, setResetMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stările locale pentru câmpurile de profil
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState('');

  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Setează stările locale cu datele utilizatorului la încărcarea paginii
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

  // Protejăm ruta: dacă nu există utilizator după încărcare, redirecționăm
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

    const newProfileData = {
      name,
      age,
      gender,
      location,
      occupation,
      hobbies,
      relationshipStatus,
    };

    try {
      await updateUserProfile(newProfileData);
      setSaveMessage('Profilul a fost salvat cu succes!');
    } catch (error) {
      console.error('Eroare la salvarea profilului:', error);
      setErrorMessage('A apărut o eroare la salvarea profilului.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleManageSubscription = () => {
    router.push('/planuri');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
        // 1. Șterge toate conversațiile asociate cu utilizatorul
        const conversationsQuery = query(collection(db, 'conversations'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(conversationsQuery);
        const deletionPromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletionPromises);

        // 2. Șterge documentul utilizatorului din Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await deleteDoc(userDocRef);

        // 3. Șterge utilizatorul din Firebase Auth
        await deleteUser(user);

        // 4. Redirecționează utilizatorul după ștergere
        router.push('/');
    } catch (error) {
        console.error("Eroare la ștergerea contului:", error);
        setErrorMessage('A apărut o eroare la ștergerea contului. Te rog încearcă din nou.');
        setIsDeleting(false);
        setShowDeleteModal(false);
    }
  };

  // Stare de încărcare generală
  if (loading || !user || !userDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { email } = user;
  const { currentPlan, messagesThisMonth, messagesLimit, resetDate } = userDoc;
  const remainingMessages = getMessagesRemaining(messagesThisMonth, messagesLimit);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Contul Meu</h1>
          
          {/* Card Detalii Cont */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2"><UserIcon /> Detalii Cont</h2>
            <div className="text-sm">
              <p className="text-gray-500">Adresă de email</p>
              <p className="font-medium text-gray-800">{email}</p>
            </div>
          </div>
          
          {/* NOU: Card pentru profilul utilizatorului */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">Profilul Meu</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nume</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">Vârstă</label>
                <input
                  type="number"
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gen</label>
                <input
                  type="text"
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Locație</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">Ocupație</label>
                <input
                  type="text"
                  id="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700">Hobby-uri (separate prin virgulă)</label>
                <input
                  type="text"
                  id="hobbies"
                  value={hobbies.join(', ')}
                  onChange={(e) => setHobbies(e.target.value.split(',').map(h => h.trim()))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="relationshipStatus" className="block text-sm font-medium text-gray-700">Stare civilă</label>
                <input
                  type="text"
                  id="relationshipStatus"
                  value={relationshipStatus}
                  onChange={(e) => setRelationshipStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              {saveMessage && <p className="text-green-600 text-sm mt-2">{saveMessage}</p>}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isProfileSaving}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    isProfileSaving ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90'
                  }`}
                >
                  {isProfileSaving ? 'Se salvează...' : 'Salvează Profilul'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Card Status Abonament */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
             <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCardIcon /> Status Abonament</h2>
             <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Planul curent</h3>
                <p className="text-lg font-bold text-gray-900">{PLANS[currentPlan].name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Mesaje utilizate</h3>
                <p className="text-lg font-bold text-gray-900">{messagesThisMonth} / {messagesLimit === -1 ? '∞' : messagesLimit}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Se resetează la</h3>
                <p className="text-lg font-bold text-gray-900">{resetDate.toDate().toLocaleDateString('ro-RO')}</p>
              </div>
            </div>
          </div>

          {/* Card Acțiuni Cont */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acțiuni</h2>
            <div className="space-y-4">
              <button 
                onClick={handleManageSubscription} 
                className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCardIcon /> Gestionează Abonamentul
              </button>
              <button onClick={handlePasswordReset} className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100">
                <KeyIcon /> Schimbă Parola
              </button>
              {resetMessage && <p className="text-sm text-green-600">{resetMessage}</p>}
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            </div>
          </div>

          {/* Zonă de Pericol */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-4">Zonă de Pericol</h2>
            <div className="space-y-4">
               <button onClick={logout} className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-red-600 hover:bg-red-50">
                  <LogoutIcon /> Deconectare
              </button>
               <button onClick={handleDeleteAccount} className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm text-red-600 hover:bg-red-50">
                  <TrashIcon /> Șterge Contul
              </button>
            </div>
          </div>

        </div>
      </div>
      {showDeleteModal && (
          <DeleteAccountModal onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} isLoading={isDeleting} />
      )}
    </>
  );
}
