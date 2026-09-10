import React from "react";
import {
  Scale,
  ShieldCheck,
  FileText,
  BookOpen,
  ThermometerSnowflake,
  Lock,
} from "lucide-react";

/**
 * 📜 COMPOSANT : AdminLegalLexicon.jsx
 * Responsabilité unique : Registre et lexique du cadre juridique & réglementaire de la marketplace.
 */
export default function AdminLegalLexicon() {
  const legalItems = [
    {
      title: "Code Monétaire et Financier (Art. L521-2)",
      category: "Finance & Séquestre PSP",
      description:
        "Gestion des flux financiers sous agent PSP agréé (Stripe Connect). Encaissement pour compte de tiers avec cantonnement des fonds et distribution automatique (82% Maraîcher / 18% Hub).",
      icon: ShieldCheck,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Loi LME (Art. L441-10)",
      category: "Délais de Paiement B2B / B2G",
      description:
        "Règlement obligatoire à 30 jours maximum pour les achats de produits alimentaires périssables et les mandats administratifs du secteur public.",
      icon: Scale,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      title: "Réforme Facturation 2026 (Norme EN 16931)",
      category: "Factur-X & Chorus Pro",
      description:
        "Génération automatique de pièces comptables dématérialisées au format hybride Factur-X (XML + PDF) et télétransmission B2G via la plateforme Chorus Pro.",
      icon: FileText,
      color: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      title: "Loi EGAlim & AGEC",
      category: "Approvisionnement Durable & Bio",
      description:
        "Suivi des objectifs de 50% de produits durables et sous-signes de qualité (dont 20% Bio) en restauration collective public-privé.",
      icon: BookOpen,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Règlement CE n°852/2004 (HACCP)",
      category: "Sécurité Alimentaire & Chaîne du Froid",
      description:
        "Obligation de relevé de température lors du ramassage et de la livraison frigorifique (maintien strict entre +2°C et +6°C).",
      icon: ThermometerSnowflake,
      color: "text-cyan-700 bg-cyan-50 border-cyan-200",
    },
    {
      title: "Règlement RGPD & Souveraineté",
      category: "Protection des Données",
      description:
        "Hébergement souverain des bases de données et fonctions d'authentification sur des serveurs sécurisés situés en France (Cloud GCP europe-west9 / Paris).",
      icon: Lock,
      color: "text-rose-700 bg-rose-50 border-rose-200",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100">
            <Scale size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Registre Legal & Conformité Hub
            </h2>
            <p className="text-gray-500 font-semibold mt-0.5">
              Cadre juridique, obligations fiscales et réglementaires appliquées
              à la plateforme.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {legalItems.map((item, idx) => {
          const IconCmp = item.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${item.color}`}
                  >
                    {item.category}
                  </span>
                  <IconCmp size={18} className="text-gray-400" />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
