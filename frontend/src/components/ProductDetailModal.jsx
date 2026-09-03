import React from 'react';
import { X, ShieldCheck, HeartPulse, Award, Leaf, Truck } from 'lucide-react';

export default function ProductDetailModal({ product, onClose }) {
  if (!product) return null;

  // Calcul du taux de TVA et du prix TTC selon le régime fiscal du producteur
  const vatRate = product.vatRate || 5.5;
  const priceHT = product.priceHT || 0;
  const taxMultiplier = 1 + (vatRate / 100);
  const priceTTC = priceHT * taxMultiplier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">

        {/* En-tête du Modal */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">
              {"Fiche de Traçabilité Officielle"}
            </span>
            <h2 className="text-xl font-bold text-brand-dark mt-1">{product.title}</h2>
            <p className="text-xs text-brand-green font-medium mt-0.5">{"Par : "}{product.producer}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors border border-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps de la fiche produit */}
        <div className="p-6 space-y-6 flex-grow">

          {/* Section 1 : Tarification & Fiscalité (Transparence) */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-150">
            <div>
              <p className="text-xs text-gray-500 font-medium">{"Prix unitaire (HT)"}</p>
              <p className="text-xl font-extrabold text-brand-green">
                {priceHT.toFixed(2)}{" € "}
                <span className="text-xs font-normal text-gray-400">{"/ kg"}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{"Prix final payé (TTC)"}</p>
              <p className="text-xl font-extrabold text-brand-green">
                {priceTTC.toFixed(2)}{" € "}
                <span className="text-xs font-normal text-gray-400">{"/ kg"}</span>
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                {product.isBio
                  ? "TVA exonérée (Régime Franchise 293 B)"
                  : `Inclut la TVA réduite de ${vatRate}%`}
              </p>
            </div>
          </div>

          {/* Section 2 : Indicateurs Légaux de Traçabilité */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">{"Garanties & Certifications"}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {/* Certification Bio / EGAlim */}
              <div className="flex items-start p-3 border border-emerald-100 bg-emerald-50/30 rounded-xl">
                <Leaf className="text-emerald-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h5 className="text-xs font-bold text-emerald-800">{"Conformité EGAlim"}</h5>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    {product.isBio
                      ? "Produit certifié Agriculture Biologique. Entre dans le quota obligatoire des 20% d'approvisionnement en restauration collective."
                      : "Produit issu d'une exploitation de proximité à faible empreinte carbone favorisant les circuits courts."}
                  </p>
                </div>
              </div>

              {/* Traçabilité Sanitaire HACCP */}
              <div className="flex items-start p-3 border border-blue-100 bg-blue-50/30 rounded-xl">
                <HeartPulse className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h5 className="text-xs font-bold text-blue-800">{"Sécurité HACCP"}</h5>
                  <p className="text-[11px] text-blue-700 mt-1">
                    <strong>{"N° de Lot : "}</strong> {product.batchNumber || "LOT-GEN-01"}<br />
                    <strong>{"Date de récolte : "}</strong> {product.harvestDate || "En cours de récolte"}<br />
                    <strong>{"Chaîne du froid : "}</strong> {"Conservé dans le respect des températures réglementaires."}
                  </p>
                </div>
              </div>

              {/* Responsabilité Élargie (Loi AGEC) */}
              <div className="flex items-start p-3 border border-amber-100 bg-amber-50/30 rounded-xl">
                <Award className="text-amber-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h5 className="text-xs font-bold text-amber-800">{"Loi AGEC & Emballages"}</h5>
                  <p className="text-[11px] text-amber-700 mt-1">
                    <strong>{"IDU Producteur : "}</strong> {product.iduAdeme || "Non applicable"}<br />
                    <strong>{"Conditionnement : "}</strong> {"Emballage réutilisable ou vrac consigné pour éliminer le plastique à usage unique."}
                  </p>
                </div>
              </div>

              {/* Distance de Transport */}
              <div className="flex items-start p-3 border border-gray-150 bg-gray-50/50 rounded-xl">
                <Truck className="text-brand-green mr-3 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h5 className="text-xs font-bold text-gray-700">{"Bilan Carbone"}</h5>
                  <p className="text-[11px] text-gray-600 mt-1">
                    <strong>{"Distance d'acheminement : "}</strong> {product.distanceKm || "0"}{" km."}<br />
                    {"Logistique optimisée en direct du producteur pour un impact environnemental minimal."}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Pied de page du Modal */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-between">
          <span className="text-[11px] text-gray-400 flex items-center">
            <ShieldCheck size={14} className="mr-1.5 text-brand-green" />
            {"Vérifié conforme par Âne et Gorille"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-green text-white text-xs font-bold rounded-lg hover:bg-opacity-95 transition-all shadow-sm"
          >
            {"Fermer l'aperçu"}
          </button>
        </div>

      </div>
    </div>
  );
}
