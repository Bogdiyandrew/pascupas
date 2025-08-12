// /pages/politica-confidentialitate.tsx
import React from "react";
import Link from "next/link";

export default function PoliticaConfidentialitate() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Politica de confidențialitate</h1>
      <p className="mb-4 text-sm text-gray-600">
        Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
      </p>

      <p className="mb-6">
        Această politică explică modul în care colectăm, folosim și protejăm datele tale personale
        atunci când folosești platforma <strong>PascuPas.online</strong>. Te rugăm să citești
        cu atenție acest document pentru a înțelege practicile noastre.
      </p>

      <h2 className="text-xl font-semibold mb-2">1. Cine suntem</h2>
      <p className="mb-4">
        Platforma <strong>PascuPas.online</strong> este administrată de [Numele firmei / persoanei],
        cu sediul în [Adresa completă]. Email de contact:{" "}
        <a href="mailto:contact@pascupas.online" className="text-blue-600 underline">
          contact@pascupas.online
        </a>.
      </p>

      <h2 className="text-xl font-semibold mb-2">2. Ce date colectăm</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Mesajele pe care le trimiți în chat</li>
        <li>Adresa de email (dacă este furnizată la autentificare)</li>
        <li>Date tehnice precum adresa IP și tipul de browser (pentru securitate)</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">3. Cum folosim datele</h2>
      <p className="mb-2">Folosim datele colectate exclusiv pentru:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Oferirea funcționalității de chat și salvarea istoricului conversațiilor</li>
        <li>Îmbunătățirea experienței pe platformă</li>
        <li>Securitatea și prevenirea abuzurilor</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">4. Păstrarea datelor</h2>
      <p className="mb-4">
        Conversațiile purtate în cadrul platformei sunt salvate în contul tău și sunt păstrate{" "}
        <strong>până la ștergerea lor de către utilizator</strong> sau până la închiderea contului.
        Poți șterge oricând conversațiile individual sau integral, folosind funcțiile din aplicație.
        Datele sunt protejate prin criptare și reguli stricte de acces, fiind vizibile doar din contul propriu.
      </p>

      <h2 className="text-xl font-semibold mb-2">5. Cui transmitem datele</h2>
      <p className="mb-2">Datele tale pot fi procesate de:</p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>OpenAI</strong> – pentru procesarea răspunsurilor AI</li>
        <li><strong>Google Firebase</strong> – pentru stocare și autentificare</li>
      </ul>
      <p className="mb-4">
        Nu vindem și nu partajăm datele tale cu terți în scopuri de marketing.
      </p>

      <h2 className="text-xl font-semibold mb-2">6. Temeiul legal și consimțământul</h2>
      <p className="mb-4">
        Pentru conținutul conversațiilor (care poate include informații despre sănătatea ta mentală),
        ne bazăm pe <strong>consimțământul tău explicit</strong>. Poți retrage consimțământul oricând
        prin ștergerea conversațiilor sau închiderea contului.
      </p>

      <h2 className="text-xl font-semibold mb-2">7. Drepturile tale</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Dreptul de acces la date</li>
        <li>Dreptul de rectificare</li>
        <li>Dreptul de ștergere (“dreptul de a fi uitat”)</li>
        <li>Dreptul de restricționare a prelucrării</li>
        <li>Dreptul de portabilitate a datelor</li>
        <li>Dreptul de a-ți retrage consimțământul</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
      <p className="mb-4">
        Pentru solicitări legate de datele tale, ne poți scrie la{" "}
        <a href="mailto:contact@pascupas.online" className="text-blue-600 underline">
          contact@pascupas.online
        </a>.
      </p>

      <p className="mt-8 text-sm text-gray-500">
        <Link href="/" className="text-blue-600 underline">Înapoi la pagina principală</Link>
      </p>
    </div>
  );
}
