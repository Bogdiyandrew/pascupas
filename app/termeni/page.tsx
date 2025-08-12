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
        Acești termeni reglementează utilizarea platformei <strong>PascuPas.online</strong>.
        Prin accesarea și utilizarea site-ului, ești de acord să respecți acești termeni.
      </p>

      <h2 className="text-xl font-semibold mb-2">1. Scopul platformei</h2>
      <p className="mb-4">
        <strong>PascuPas.online</strong> oferă un serviciu de conversație cu un asistent virtual
        bazat pe inteligență artificială, pentru suport emoțional și discuții generale.
        Serviciul <b>nu înlocuiește consilierea unui psiholog sau intervenția medicală</b>.
      </p>

      <h2 className="text-xl font-semibold mb-2">2. Reguli de utilizare</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Nu trimite conținut ilegal, abuziv sau ofensator</li>
        <li>Nu încerca să compromiți securitatea platformei</li>
        <li>Nu utiliza platforma pentru spam sau publicitate neautorizată</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">3. Păstrarea și ștergerea datelor</h2>
      <p className="mb-4">
        Conversațiile sunt stocate în contul tău <strong>până la ștergerea lor de către utilizator</strong>
        sau până la închiderea contului. Platforma nu aplică o perioadă de ștergere automată.
        Poți șterge individual sau integral conversațiile din aplicație.
      </p>

      <h2 className="text-xl font-semibold mb-2">4. Limitarea răspunderii</h2>
      <p className="mb-4">
        Răspunsurile generate de AI au scop informativ și conversațional. Nu garantăm acuratețea,
        completitudinea sau aplicabilitatea acestora în situații reale. Utilizezi informațiile pe propria răspundere.
      </p>

      <h2 className="text-xl font-semibold mb-2">5. Modificări ale serviciului</h2>
      <p className="mb-4">
        Putem modifica sau întrerupe temporar sau permanent platforma sau anumite funcționalități fără notificare prealabilă.
      </p>

      <h2 className="text-xl font-semibold mb-2">6. Proprietatea intelectuală</h2>
      <p className="mb-4">
        Conținutul platformei, inclusiv designul și codul sursă, aparține <strong>PascuPas.online</strong>
        și este protejat de legislația privind drepturile de autor.
      </p>

      <h2 className="text-xl font-semibold mb-2">7. Legea aplicabilă</h2>
      <p className="mb-4">
        Acești termeni sunt guvernați de legislația din România și Uniunea Europeană.
        Orice litigiu va fi soluționat de instanțele competente din România.
      </p>

      <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
      <p className="mb-4">
        Întrebări? Scrie-ne la{" "}
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
