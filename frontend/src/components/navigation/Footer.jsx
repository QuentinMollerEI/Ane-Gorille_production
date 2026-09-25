import React from 'react';

/**
 * 🦶 COMPOSANT : Footer.jsx
 * Emplacement : src/components/Footer.jsx
 * Pied de page officiel Âne & Gorille avec branding, mentions légales et copyright.
 */
export default function Footer({ className = "" }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-slate-900 text-gray-300 border-t border-slate-800 py-4 px-6 text-center text-xs w-full shadow-md ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Rappel du Branding */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="font-bold text-amber-400">Âne &amp; Gorille</span>
          <span className="text-gray-500">|</span>
          <span className="italic text-gray-400">Le Marché de la Rosée</span>
        </div>

        {/* Mentions légales obligatoires */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-gray-400 text-[11px]">
          <a href="#cgu" className="hover:text-amber-400 transition-colors">CGU &amp; CGV</a>
          <a href="#confidentialite" className="hover:text-amber-400 transition-colors">Politique de Confidentialité</a>
          <a href="#haccp" className="hover:text-amber-400 transition-colors">Normes HACCP &amp; Traçabilité</a>
          <a href="#mentions" className="hover:text-amber-400 transition-colors">Mentions Légales</a>
        </div>

        {/* Copyright */}
        <p className="text-gray-500 text-[11px] shrink-0">
          &copy; {currentYear} Âne et Gorille. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
