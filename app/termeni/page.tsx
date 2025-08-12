// /pages/termeni.tsx

import React from "react";
import Link from "next/link";

export default function TermeniConditii() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Termeni și condiții</h1>
      <p className="mb-4 text-sm text-gray-600">
        Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
      </p>

      <p className="mb-6">
        Acești termeni și condiții reglementează utilizarea platformei{" "}
        <strong>PascuPas.online</strong>. Prin accesarea și utilizarea site-ului, 
        ești de acord să respecți acești termeni.
      </p>

      <h2 className="text-xl font-semibold mb-2">1. Scopul platformei</h2>
      <p className="mb-4">
        <strong>PascuPas.online</strong> oferă un serviciu de conversație cu un 
        asistent virtual bazat pe inteligență artificială, pentru suport emoțional 
        și discuții generale. Acest serviciu <b>nu înlocuiește consilierea unui psiholog 
        sau intervenția medicală specializată</b>.
      </p>

      <h2 className="text-xl font-semibold mb-2">2. Reguli de utilizare</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Nu utiliza platforma pentru a trimite conținut ilegal, abuziv sau ofensator</li>
        <li>Nu încerca să compromiți securitatea platformei</li>
        <li>Nu utiliza platforma pentru spam sau publicitate neautorizată</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">3. Limitarea răspunderii</h2>
      <p className="mb-4">
        Răspunsurile generate de AI au scop informativ și conversațional. 
        Nu garantăm acuratețea, completitudinea sau aplicabilitatea acestora în situații reale. 
        Utilizarea informațiilor furnizate se face pe propria răspundere.
      </p>

      <h2 className="text-xl font-semibold mb-2">4. Modificări ale serviciului</h2>
      <p className="mb-4">
        Putem modifica sau întrerupe temporar sau permanent platforma sau anumite 
        funcționalități fără notificare prealabilă.
      </p>

      <h2 className="text-xl font-semibold mb-2">5. Proprietatea intelectuală</h2>
      <p className="mb-4">
        Conținutul platformei, inclusiv designul și codul sursă, aparține 
        <strong> PascuPas.online</strong> și este protejat de legislația în vigoare privind 
        drepturile de autor.
      </p>

      <h2 className="text-xl font-semibold mb-2">6. Legea aplicabilă</h2>
      <p className="mb-4">
        Acești termeni sunt guvernați de legislația din România și Uniunea Europeană. 
        Orice litigiu va fi soluționat de instanțele competente din România.
      </p>

      <h2 className="text-xl font-semibold mb-2">7. Contact</h2>
      <p className="mb-4">
        Pentru întrebări legate de acești termeni, ne poți contacta la{" "}
        <a href="mailto:contact@pascupas.online" className="text-blue-600 underline">
          contact@pascupas.online
        </a>
        .
      </p>

      <p className="mt-8 text-sm text-gray-500">
        <Link href="/" className="text-blue-600 underline">
          Înapoi la pagina principală
        </Link>
      </p>
    </div>
  );
}
