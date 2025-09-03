import Link from 'next/link';
// import Header from '@/components/Header'; // <-- AM ȘTERS ACEASTĂ LINIE

const NotFoundPage = () => {
  return (
    <div className="bg-background text-text min-h-full flex flex-col">
      {/* <Header /> // <-- AM ȘTERS ACEASTĂ LINIE */}
      <main className="flex-grow flex items-center justify-center text-center px-4">
        <div className="container mx-auto max-w-xl">
          <h1 className="font-poppins font-extrabold text-6xl md:text-9xl text-primary mb-4">
            404
          </h1>
          <h2 className="font-poppins font-bold text-2xl md:text-4xl text-text mb-4">
            Oops! Pagina nu a fost găsită.
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Se pare că linkul pe care l-ai urmat este greșit sau pagina a fost mutată.
          </p>
          <Link 
            href="/" 
            className="bg-primary text-white font-bold px-8 py-4 rounded-lg shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105 inline-block"
          >
            Înapoi la pagina principală
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
