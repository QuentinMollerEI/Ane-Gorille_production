import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-brand-dark text-gray-300 border-t border-gray-800 py-6 px-8 text-center text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Rappel du Branding */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-brand-gold">Âne & Gorille</span>
          <span className="text-gray-500">|</span>
          <span className="italic">Le Marché de la Rosée</span>
        </div>

        {/* Mentions légales obligatoires */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-gray-400">
          <a href="#cgu" className="hover:text-brand-gold transition-colors">CGU & CGV</a>
          <a href="#confidentialite" className="hover:text-brand-gold transition-colors">Politique de Confidentialité</a>
          <a href="#haccp" className="hover:text-brand-gold transition-colors">Normes HACCP & Traçabilité</a>
          <a href="#mentions" className="hover:text-brand-gold transition-colors">Mentions Légales</a>
        </div>

        {/* Copyright */}
        <p className="text-gray-500">
          &copy; {currentYear} Âne et Gorille. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
