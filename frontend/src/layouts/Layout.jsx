import React from 'react';
import Navbar from '../components/Navbar'; // Chemin corrigé
import Footer from '../components/Footer'; // Chemin corrigé

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-light text-brand-dark">
      {/* Barre de navigation publique */}
      <Navbar />

      {/* Contenu principal de la page */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Pied de page collant ou poussé par le contenu */}
      <Footer />
    </div>
  );
}
