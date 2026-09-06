import React from "react";
import { Link } from "react-router-dom";
import { Leaf, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <div
      className="relative bg-cover bg-center min-h-[500px] md:min-h-[600px] flex items-center justify-center text-white overflow-hidden"
      style={{ backgroundImage: "url('/hero-bg.png')" }}
    >
      {/* Overlay sombre de protection visuelle et de contraste */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-brand-dark/75 to-brand-green/60 mix-blend-multiply" />

      {/* Contenu textuel et visuel au premier plan */}
      <div className="relative max-w-5xl mx-auto px-6 text-center space-y-6 py-12">
        {/* Badge d'engagement générique de proximité */}
        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
          <Leaf className="text-brand-gold" size={14} />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-gold">
            Circuits Courts de Proximité — Direct Producteurs
          </span>
        </div>

        {/* Titre principal */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
          L'Énergie Alimentaire <br />
          <span className="text-brand-gold">
            Directement dans votre Assiette
          </span>
        </h1>

        {/* Description sans localisation spécifique */}
        <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-250 leading-relaxed font-medium">
          La plateforme de confiance qui connecte directement les producteurs
          locaux avec les établissements publics, les cantines scolaires et les
          particuliers. Une alimentation saine, traçable et de proximité.
        </p>

        {/* Indicateurs de conformité légale */}
        <div className="flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300 pt-2">
          <span className="flex items-center bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
            <ShieldCheck size={14} className="mr-1.5 text-brand-gold" />{" "}
            Conforme Loi EGAlim
          </span>
          <span className="flex items-center bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
            <ShieldCheck size={14} className="mr-1.5 text-brand-gold" /> Zéro
            Plastique (AGEC)
          </span>
          <span className="flex items-center bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
            <ShieldCheck size={14} className="mr-1.5 text-brand-gold" />{" "}
            Traçabilité HACCP
          </span>
        </div>

        {/* Actions principales (CTA) */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl border border-white/30 backdrop-blur-sm transition-all flex items-center justify-center"
          >
            Rejoindre la Plateforme
          </Link>
        </div>
      </div>
    </div>
  );
}
