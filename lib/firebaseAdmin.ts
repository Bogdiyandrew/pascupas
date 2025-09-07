// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Initializează Admin SDK folosind cheia de cont de serviciu din variabila de mediu
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!))
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth(); // Adaugă această linie

export { adminDb, adminAuth }; // Exportă adminAuth