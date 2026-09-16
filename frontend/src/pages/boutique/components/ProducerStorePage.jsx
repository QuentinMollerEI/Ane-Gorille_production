import React from "react";
import { ArrowLeft, Building, MapPin, Award, Store, ShieldCheck, CheckCircle } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ProducerStorePage({
  producerId,
  producerProfile = {},
  products = [],
  onBack,
  onAddToCart,
  onSelectProduct,
}) {
  // Filtrage strict des produits appartenant uniquement à ce producteur
  const producerProducts = products.filter((p) => {
    const pProducerId = p.producerId || p.userId || p.ownerId;
    const isSameId = pProducerId && pProducerId === producerId;
    const isSameName =
      p.producerCompany &&
      producerProfile.companyName &&
      p.producerCompany.toLowerCase() === producerProfile.companyName.toLowerCase();
    
    const isVisible = !p.isHidden && p.status !== "hidden" && p.status !== "draft" && !p.isMasked;
    return (isSameId || isSameName) && isVisible;
  });

  const companyName =
    producerProfile.companyName ||
    producerProfile.displayName ||
    producerProfile.producerCompany ||
    "Exploitation Agricole Locale";

  const address = producerProfile.address || producerProfile.adresse || "Adresse certifiée au registre";
  const city = producerProfile.city || producerProfile.ville || "Commune locale";
  const postalCode = producerProfile.postalCode || producerProfile.codePostal || producerProfile.zipCode || "";
  const department = producerProfile.department || (postalCode ? postalCode.substring(0, 2) : "31");
  const description =
    producerProfile.description ||
    producerProfile.bio ||
    "Exploitant agricole partenaire engagé dans la distribution alimentaire en circuit court et la traçabilité sanitaire.";

  const isBio = Boolean(producerProfile.isBioCertified || producerProfile.isBio);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 text-xs">
      
      {/* BARRE DE RETOUR */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} />
          <span>Retour à la boutique générale</span>
        </button>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Vitrine Exploitant Partenaire</span>
        </span>
      </div>

      {/* EN-TÊTE ET PRÉSENTATION DU PRODUCTEUR */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl shrink-0">
              <Store size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Producteur Référencé
                </span>
                {isBio && (
                  <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Award size={12} />
                    <span>Certifié Bio (EGAlim)</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-gray-900">{companyName}</h1>
              <p className="text-gray-600 font-bold flex items-center gap-1.5 mt-1">
                <MapPin size={14} className="text-emerald-700 shrink-0" />
                <span>{address} {postalCode} {city} (Dépt: {department})</span>
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-1 sm:text-right w-full sm:w-auto">
            <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">
              Engagement Traçabilité
            </span>
            <p className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 sm:justify-end">
              <CheckCircle size={14} className="text-emerald-600" />
              <span>Récoltes en direct de la ferme</span>
            </p>
          </div>
        </div>

        {/* DESCRIPTION ET PRÉSENTATION DE L'EXPLOITATION */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
          <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Building size={14} className="text-emerald-700" />
            <span>À propos de l'exploitation</span>
          </h3>
          <p className="text-gray-600 font-medium leading-relaxed">{description}</p>
        </div>
      </div>

      {/* CATALOGUE EXCLUSIF DU PRODUCTEUR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Store size={18} className="text-emerald-700" />
            <span>Catalogue complet des récoltes ({producerProducts.length})</span>
          </h2>
        </div>

        {producerProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {producerProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-2">
            <p className="font-bold text-gray-700">Aucune récolte actuellement disponible pour cet exploitant.</p>
            <p className="text-gray-400">Revenez ultérieurement pour découvrir ses prochains arrivages.</p>
          </div>
        )}
      </div>
    </div>
  );
}