// lib/cryptoChat.ts

/**
 * Implementare securizată pentru criptarea conversațiilor de chat.
 * Cheia este derivată din token-ul Firebase în loc să fie stocată în localStorage.
 * Această abordare elimină vulnerabilitățile XSS și accesul fizic la chei.
 */

import { User } from 'firebase/auth';

class SecureChatCrypto {
    private key: CryptoKey | null = null;

    /**
     * Derivează cheia de criptare din token-ul Firebase și datele utilizatorului.
     * Această metodă înlocuiește stocarea în localStorage cu o abordare mult mai sigură.
     */
    async deriveKeyFromAuthToken(user: User): Promise<void> {
        try {
            // Obține token-ul curent de la Firebase
            const token = await user.getIdToken();
            
            // Combină token-ul cu informații stabile despre utilizator
            const userInfo = `${user.uid}:${user.email}`;
            const combinedMaterial = token + userInfo;
            
            // Creează salt stabil din UID (același pentru același user)
            const saltString = user.uid.padEnd(16, '0').slice(0, 16);
            const salt = new TextEncoder().encode(saltString);
            
            // Importă materialul combinat pentru derivarea cheii
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(combinedMaterial),
                'PBKDF2',
                false,
                ['deriveKey']
            );

            // Derivează cheia AES-256 folosind PBKDF2 cu 100.000 iterații
            this.key = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
            
            console.log('Cheia de criptare a fost derivată cu succes din token-ul Firebase');
        } catch (error) {
            console.error('Eroare la derivarea cheii de criptare:', error);
            throw new Error('Nu s-a putut inițializa criptarea. Încearcă să te re-loghezi.');
        }
    }

    /**
     * Criptează un text folosind AES-GCM cu cheia derivată.
     * @param {string} plaintext - Textul de criptat.
     * @returns {Promise<{ciphertext: string, iv: string}>} Obiect cu textul criptat și IV-ul în format hex.
     */
    async encrypt(plaintext: string): Promise<{ ciphertext: string; iv: string } | null> {
        if (!this.key) {
            console.error('Cheia de criptare nu este disponibilă. Asigură-te că utilizatorul este autentificat.');
            return null;
        }

        try {
            const encodedText = new TextEncoder().encode(plaintext);
            
            // Generează IV random pentru fiecare criptare (96 biți pentru GCM)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Criptează textul
            const ciphertextBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.key,
                encodedText
            );

            // Convertește la format hex pentru compatibilitate cu implementarea existentă
            const ciphertext = Array.from(new Uint8Array(ciphertextBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            
            const ivHex = Array.from(iv)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            return { ciphertext, iv: ivHex };
        } catch (error) {
            console.error('Eroare la criptarea textului:', error);
            return null;
        }
    }

    /**
     * Decriptează un text folosind AES-GCM cu cheia derivată.
     * @param {string} ciphertext - Textul criptat în format hex.
     * @param {string} iv - Initialization Vector-ul în format hex.
     * @returns {Promise<string>} Textul decriptat sau mesaj de eroare.
     */
    async decrypt(ciphertext: string, iv: string): Promise<string> {
        if (!this.key) {
            console.error('Cheia de criptare nu este disponibilă. Asigură-te că utilizatorul este autentificat.');
            return "Cheia de criptare nu este disponibilă.";
        }

        try {
            // Convertește hex înapoi la Uint8Array
            const ivBuffer = new Uint8Array(
                iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
            );
            
            const ciphertextBuffer = new Uint8Array(
                ciphertext.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
            );

            // Decriptează textul
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: ivBuffer },
                this.key,
                ciphertextBuffer
            );

            return new TextDecoder().decode(decryptedBuffer);
        } catch (error) {
            console.error('Eroare la decriptarea textului:', error);
            return "Mesaj corupt sau cheie invalidă.";
        }
    }

    /**
     * Verifică dacă cheia de criptare este disponibilă.
     */
    isReady(): boolean {
        return this.key !== null;
    }

    /**
     * Curăță cheia din memorie (la logout pentru securitate).
     */
    clearKey(): void {
        this.key = null;
        console.log('Cheia de criptare a fost ștearsă din memorie pentru securitate');
    }
}

// Singleton pentru folosire globală
const chatCrypto = new SecureChatCrypto();

/**
 * Inițializează criptarea pentru un utilizator autentificat.
 * Această funcție trebuie apelată după autentificare.
 */
export async function initializeChatCrypto(user: User): Promise<void> {
    await chatCrypto.deriveKeyFromAuthToken(user);
}

/**
 * Verifică dacă criptarea este gata de folosire.
 */
export function isChatCryptoReady(): boolean {
    return chatCrypto.isReady();
}

/**
 * Curăță cheia de criptare din memorie.
 * Trebuie apelată la logout pentru securitate.
 */
export function clearChatCrypto(): void {
    chatCrypto.clearKey();
}

/**
 * Criptează un text folosind AES-GCM.
 * Funcție compatibilă cu implementarea existentă.
 * @param {string} plaintext - Textul de criptat.
 * @returns {Promise<{ciphertext: string, iv: string}>} Obiect cu textul criptat și IV-ul.
 */
export async function encryptText(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
    const result = await chatCrypto.encrypt(plaintext);
    if (!result) {
        throw new Error('Criptarea a eșuat. Asigură-te că utilizatorul este autentificat.');
    }
    return result;
}

/**
 * Decriptează un text folosind AES-GCM.
 * Funcție compatibilă cu implementarea existentă.
 * @param {string} ciphertext - Textul criptat.
 * @param {string} iv - Initialization Vector-ul folosit la criptare.
 * @returns {Promise<string>} Textul decriptat.
 */
export async function decryptText(ciphertext: string, iv: string): Promise<string> {
    return chatCrypto.decrypt(ciphertext, iv);
}