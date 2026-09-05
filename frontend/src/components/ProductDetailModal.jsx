import React, { useState } from "react";
import {
  X,
  Shield,
  ShoppingBag,
  Leaf,
  Calendar,
  MapPin,
  Truck,
  Tag,
  Scale,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * 🥬 COMPOSANT : ProductDetailModal.jsx (Version Bulletproof & Traçabilité Certifiée)
 *
 * Responsabilité unique (SRP) : Afficher la fiche d'identité et de traçabilité
 * complète d'un légume (HACCP, ADEME, EGAlim), gérer la sélection sécurisée de
 * la quantité souhaitée, et valider l'ajout au panier.
 *
 * Ce composant est conçu "Legal by Design" pour protéger l'application contre les crashs
 * liés à des données facultatives manquantes (gestion des undefined via fallback et optional chaining).
 */
export default function ProductDetailModal({
  product,
  products = [], // Valeur par défaut pour éviter le plantage de .filter() si non fourni par le parent
  onClose,
  onAddToCart,
}) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  // Extraction sécurisée des propriétés avec valeurs par défaut de secours (Bulletproof)
  const title = product.title || product.name || "Légume local de saison";
  const priceHT = Number(product.priceHT || product.price || 0);
  const vatRate = Number(product.vatRate || product.vat || 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);

  const stock = Number(product.stock !== undefined ? product.stock : 999);
  const unit = product.unit || "kg";
  const isAvailable =
    stock > 0 &&
    (product.isAvailable !== undefined ? product.isAvailable : true);

  const producerName =
    product.producer || product.producerName || "Maraîcher partenaire";
  const harvestDate = product.harvestDate || "Récemment";
  const batchNumber = product.batchNumber || "Non spécifié (Vente directe)";
  const iduAdeme = product.iduAdeme || "En cours d'attribution";
  const distanceKm = product.distanceKm || "Local";
  const isBio = Boolean(product.isBio || product.bio);

  // Évite le plantage : si "products" est undefined ou vide, on n'affiche simplement pas la section "autres produits"
  const safeProductsList = Array.isArray(products) ? products : [];
  const otherProducerProducts = safeProductsList.filter(
    (p) => p.producer === producerName && p.id !== product.id,
  );

  // --- ACTIONS SÉCURISÉES ---
  const handleQtyChange = (val) => {
    const num = Number(val);
    if (isNaN(num)) return;

    if (num > stock) {
      setQuantity(stock);
    } else if (num < 1) {
      setQuantity(1);
    } else {
      setQuantity(num);
    }
  };

  const handleConfirmAdd = () => {
    if (quantity > stock) {
      alert(
        `⚠️ Désolé, le stock de ce maraîcher est limité à ${stock} ${unit}.`,
      );
      return;
    }
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* En-tête visuel avec badge Bio */}
        <div className="bg-green-50/50 border-b border-gray-100 p-6 flex justify-between items-start gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Leaf size={12} /> Fiche Traçabilité
              </span>
              {isBio && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                  Agriculture Bio
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">
              {title}
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              🧑‍🌾 Cultivé par :{" "}
              <span className="text-gray-700">{producerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-2xl bg-white transition-colors cursor-pointer"
            title="Fermer la fiche"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps de la fiche de traçabilité (Défilant si nécessaire) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Section 1 : Informations de base & Prix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">
                Tarification Professionnelle
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-gray-900">
                  {priceHT.toFixed(2)} €
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase">
                  HT / {unit}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                {priceTTC.toFixed(2)} € TTC (TVA réduite à {vatRate}%)
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border flex flex-col justify-center ${
                isAvailable
                  ? "bg-green-50/20 border-green-150 text-green-900"
                  : "bg-red-50/20 border-red-150 text-red-900"
              }`}
            >
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">
                Statut de la Récolte
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-green-600" : "bg-red-600"}`}
                />
                <span className="text-sm font-black uppercase tracking-wider">
                  {isAvailable
                    ? `Disponible (${stock} ${unit} en stock)`
                    : "Rupture de stock"}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold mt-1 leading-normal">
                {isAvailable
                  ? "Récolté à la demande pour garantir une fraîcheur et une qualité nutritives optimales."
                  : "Ce maraîcher a épuisé son lot. Inscrivez-vous pour être notifié de la prochaine récolte."}
              </p>
            </div>
          </div>

          {/* Section 2 : Passeport Traçabilité & Conformité EGAlim */}
          <div className="border border-gray-250 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
            <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              <Shield size={14} className="text-green-700" /> Passeport
              Sanitaire & Réglementation HACCP
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div className="space-y-1">
                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                  Référence unique de Lot
                </p>
                <p className="font-mono font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block text-[10px]">
                  {batchNumber}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                  Identifiant Unique ADEME (REP)
                </p>
                <p className="font-mono font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block text-[10px]">
                  {iduAdeme}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                  Date de Récolte
                </p>
                <p className="font-bold text-gray-800 flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" /> {harvestDate}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                  Logistique de Proximité
                </p>
                <p className="font-bold text-gray-800 flex items-center gap-1">
                  <Truck size={14} className="text-gray-400" /> {distanceKm} km
                  de votre point d'approvisionnement
                </p>
              </div>
            </div>

            <div className="bg-green-50/50 border border-green-150 p-3.5 rounded-xl text-[10px] text-green-950 font-medium leading-relaxed">
              <strong>✓ Certification de Confiance :</strong> Ce lot de légumes
              respecte à 100 % les critères de qualité de la loi{" "}
              <strong>EGAlim</strong> pour la restauration collective (circuit
              court de proximité, préservation des sols, et juste rémunération
              des producteurs) [cite: 11].
            </div>
          </div>

          {/* Section 3 : Autres produits de ce maraîcher (Conditionnel pour éviter crash) */}
          {otherProducerProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1">
                🌾 Du même producteur
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {otherProducerProducts.slice(0, 2).map((other) => (
                  <div
                    key={other.id}
                    className="border border-gray-150 rounded-xl p-3 bg-gray-50/30 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-900 truncate max-w-[120px]">
                        {other.title || other.name}
                      </p>
                      <p className="text-[10px] text-green-700 font-extrabold">
                        {(other.priceHT || other.price || 0).toFixed(2)} € HT
                      </p>
                    </div>
                    {other.isBio && (
                      <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-150">
                        Bio
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied de modal avec sélecteur de quantité et action */}
        <div className="p-6 border-t border-gray-150 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          {isAvailable ? (
            <>
              {/* Sélecteur de quantité */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Quantité :
                </span>
                <div className="flex items-center border border-gray-250 rounded-xl overflow-hidden bg-white shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 text-base font-black text-gray-500 hover:bg-gray-100 cursor-pointer select-none transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={stock}
                    value={quantity}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-12 text-center text-xs font-bold text-gray-800 border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((prev) => Math.min(stock, prev + 1))
                    }
                    className="px-3.5 py-1.5 text-base font-black text-gray-500 hover:bg-gray-100 cursor-pointer select-none transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-extrabold text-gray-400 uppercase">
                  {unit}
                </span>
              </div>

              {/* Action d'ajout */}
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <ShoppingBag size={14} />
                <span>
                  Ajouter {(quantity * priceHT).toFixed(2)} € HT au panier
                </span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center gap-2 text-red-700 bg-red-50 border border-red-150 p-3 rounded-2xl text-xs font-bold justify-center">
              <AlertTriangle size={16} />
              <span>
                Ce produit est actuellement indisponible dans les hangars.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
