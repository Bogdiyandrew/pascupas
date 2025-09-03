import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-10 px-4 text-center text-gray-500 text-sm border-t bg-white mt-auto">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
          <h4 className="font-bold mb-2 text-red-700">Disclaimer Legal și Situații de Urgență</h4>
          <p className="text-red-600">
            Acest serviciu este un instrument de suport emoțional și **nu înlocuiește** terapia sau consultul medical specializat. În caz de urgență sau criză (gânduri suicidale, vătămare), te rugăm să apelezi imediat numărul de urgență **112** sau linia anti-suicid **0800 801 200**.
          </p>
        </div>
        
        <div className="space-x-4 mb-4">
          <Link href="/politica-confidentialitate" className="hover:text-primary">Politică de Confidențialitate (GDPR)</Link>
          <span>|</span>
          <Link href="/termeni" className="hover:text-primary">Termeni și Condiții</Link>
        </div>
        
        <p className="text-gray-400">&copy; {new Date().getFullYear()} PascuPas.online. Toate drepturile rezervate.</p>
      </div>
    </footer>
  );
}