// lib/cryptoChat.ts

/**
 * Cheia AES-GCM este stocată în localStorage pentru a persista între sesiuni.
 * Într-o aplicație reală, aceasta ar trebui derivată dintr-o parolă sau gestionată
 * printr-un serviciu specializat (KMS) pentru a nu fi expusă direct.
 */
const KEY_STORAGE_NAME = 'chat-encryption-key';

/**
 * Generează o cheie AES-GCM de 256 de biți și o exportă în format JWK.
 * @returns {Promise<JsonWebKey>} Cheia generată.
 */
async function generateKey(): Promise<JsonWebKey> {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // Permite exportul cheii
    ['encrypt', 'decrypt']
  );
  return window.crypto.subtle.exportKey('jwk', key);
}

/**
 * Preia cheia din localStorage sau generează una nouă dacă nu există.
 * @returns {Promise<JsonWebKey>} Cheia de criptare.
 */
async function getEncryptionKey(): Promise<JsonWebKey> {
  const storedKey = localStorage.getItem(KEY_STORAGE_NAME);
  if (storedKey) {
    return JSON.parse(storedKey);
  }
  const newKey = await generateKey();
  localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify(newKey));
  return newKey;
}

/**
 * Importă o cheie JWK pentru a fi utilizată de Web Crypto API.
 * @param {JsonWebKey} jwk - Cheia în format JSON Web Key.
 * @returns {Promise<CryptoKey>} Obiectul CryptoKey.
 */
async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptează un text folosind AES-GCM.
 * Generează un Initialization Vector (IV) nou pentru fiecare criptare.
 * @param {string} plaintext - Textul de criptat.
 * @returns {Promise<{ciphertext: string, iv: string}>} Obiect cu textul criptat și IV-ul, ambele în format Base64.
 */
export async function encryptText(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const jwk = await getEncryptionKey();
  const key = await importKey(jwk);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV de 96 biți este standard pentru GCM
  const encodedText = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedText
  );

  // Convertim ArrayBuffer în string Base64 pentru stocare
  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  const ivString = btoa(String.fromCharCode(...iv));

  return { ciphertext, iv: ivString };
}

/**
 * Decriptează un text folosind AES-GCM.
 * @param {string} ciphertext - Textul criptat (Base64).
 * @param {string} iv - Initialization Vector-ul (Base64) folosit la criptare.
 * @returns {Promise<string>} Textul decriptat.
 */
export async function decryptText(ciphertext: string, iv: string): Promise<string> {
  try {
    const jwk = await getEncryptionKey();
    const key = await importKey(jwk);
    
    // Convertim stringurile Base64 înapoi în Uint8Array
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "Mesaj corupt sau cheie invalidă.";
  }
}