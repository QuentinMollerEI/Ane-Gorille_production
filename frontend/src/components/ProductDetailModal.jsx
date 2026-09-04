import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  Loader2,
  Check,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Clipboard,
  Compass,
  Info,
  AlertTriangle,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firestore.service.js";

export default function ProductDetailModal({ product, allProducts, onClose }) {
  if (!product) return null;

  const [quantityWanted, setQuantityWanted] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addStatus, setAddStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // Calcul du TTC
  const priceHT = Number(product.priceHT ?? 0);
  const vatRate = Number(product.vatRate ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);

  // Filtrer "les autres cartes produits du même producteur"
  const otherProductsOfProducer = allProducts
    .filter((p) => p.producerId === product.producerId && p.id !== product.id)
    .slice(0, 3); // Limité à 3 pour la propreté visuelle

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setAddStatus(null);

    const qty = parseInt(quantityWanted, 10);

    // Validation
    if (isNaN(qty) || qty <= 0) {
      setAddStatus({
        type: "error",
        message: "Veuillez entrer une quantité valide supérieure à 0.",
      });
      setIsAdding(false);
      return;
    }

    if (qty > product.stock) {
      setAddStatus({
        type: "error",
        message: `Stock insuffisant. Quantité disponible : ${product.stock} ${product.unit}.`,
      });
      setIsAdding(false);
      return;
    }

    try {
      // Déduction et synchronisation instantanée du stock dans Firestore !
      const newStock = product.stock - qty;
      const productRef = doc(db, "products", product.id);

      await updateDoc(productRef, {
        stock: newStock,
      });

      // Simulation de panier en LocalStorage (pour anticiper le workflow Panier -> Stripe -> Livraison)
      const currentCart = JSON.parse(
        localStorage.getItem("ane_et_gorille_cart") || "[]",
      );
      const cartItem = {
        productId: product.id,
        title: product.title,
        priceHT: product.priceHT,
        vatRate: product.vatRate,
        qty,
        unit: product.unit,
        producerName: product.producer,
        producerId: product.producerId,
      };

      // Ajouter ou fusionner dans le panier
      const existingItemIndex = currentCart.findIndex(
        (item) => item.productId === product.id,
      );
      if (existingItemIndex > -1) {
        currentCart[existingItemIndex].qty += qty;
      } else {
        currentCart.push(cartItem);
      }
      localStorage.setItem("ane_et_gorille_cart", JSON.stringify(currentCart));

      setAddStatus({
        type: "success",
        message: `Ajouté avec succès ! ${qty} ${product.unit} déduits du stock. Panier enrichi pour le futur workflow d\'achat.`,
      });

      // Déclenche une mise à jour locale de la fiche
      product.stock = newStock;
    } catch (error) {
      console.error("Erreur de mise à jour du stock:", error);
      setAddStatus({
        type: "error",
        message: "Erreur technique lors de la réservation du stock.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[80vh] border border-gray-100">
        {/* Bouton de Fermeture flottant */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-700 hover:text-black p-2 rounded-full border border-gray-100 shadow-md transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* COLONNE GAUCHE : IMAGE & AUTRES PRODUITS */}
        <div className="w-full md:w-5/12 bg-gray-50 flex flex-col border-r border-gray-100 max-h-[40vh] md:max-h-full overflow-y-auto">
          <div className="relative h-60 w-full flex-shrink-0 flex items-center justify-center bg-gray-100 border-b border-gray-200">
            {product.image ? (
              <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Aucun visuel fourni
              </span>
            )}
            {product.isBio && (
              <span className="absolute bottom-4 left-4 bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full border border-amber-300 shadow-md uppercase">
                🥦 Bio AB
              </span>
            )}
          </div>

          {/* Autres cartes produits du producteur */}
          <div className="p-5 flex-grow space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Du même producteur
            </h4>
            {otherProductsOfProducer.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Aucun autre produit en ligne pour ce producteur.
              </p>
            ) : (
              <div className="space-y-3">
                {otherProductsOfProducer.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setAddStatus(null);
                      setQuantityWanted(1);
                      // On remplace le produit affiché
                      Object.assign(product, p);
                    }}
                    className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-250 hover:border-brand-green/50 cursor-pointer hover:shadow-xs transition-all"
                  >
                    <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-300 font-bold">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {p.title}
                      </p>
                      <p className="text-[10px] font-black text-green-700">
                        {(p.priceHT * (1 + p.vatRate / 100)).toFixed(2)} € /{" "}
                        {p.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : DESCRIPTION & COMMANDE */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between h-full">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                🧑‍🌾 {product.producer}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug mt-1">
                {product.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                  <MapPin size={10} className="mr-1 text-red-500" />
                  Dépt: {product.department} ({product.origin})
                </span>
                <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                  <Compass size={10} className="mr-1" />
                  Local : {product.distanceKm} km
                </span>
              </div>
            </div>

            {/* Description du produit */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Description du produit
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {product.description}
              </p>
            </div>

            {/* Traçabilité HACCP */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 font-bold block">
                  N° de Lot (HACCP) :
                </span>
                <span className="font-mono font-semibold text-gray-800">
                  {product.batchNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">
                  Date de récolte :
                </span>
                <span className="font-semibold text-gray-800">
                  {product.harvestDate}
                </span>
              </div>
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="text-gray-400 font-bold block">
                  Identifiant Unique ADEME :
                </span>
                <span className="font-mono text-gray-800">
                  {product.iduAdeme}
                </span>
              </div>
            </div>
          </div>

          {/* ZONE COMMANDE ET AJOUT AU PANIER */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
            {/* Prix Double */}
            <div className="flex justify-between items-end bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                  Tarif HT
                </p>
                <span className="text-sm font-bold text-gray-500">
                  {priceHT.toFixed(2)} €
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-green-700 font-black uppercase">
                  Tarif TTC ({vatRate}%)
                </p>
                <span className="text-2xl font-black text-green-700">
                  {priceTTC.toFixed(2)} €{" "}
                  <span className="text-xs font-normal text-gray-500">
                    / {product.unit}
                  </span>
                </span>
              </div>
            </div>

            {/* Formulaire de saisie de quantité et bouton d\'ajout */}
            {product.stock > 0 ? (
              <form
                onSubmit={handleAddToCart}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantityWanted((prev) => Math.max(1, prev - 1))
                    }
                    className="px-3.5 py-3 hover:bg-gray-100 text-gray-500 text-sm font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantityWanted}
                    onChange={(e) =>
                      setQuantityWanted(
                        Math.min(
                          product.stock,
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        ),
                      )
                    }
                    className="w-14 text-center border-0 focus:ring-0 text-sm font-bold text-gray-800 p-0"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setQuantityWanted((prev) =>
                        Math.min(product.stock, prev + 1),
                      )
                    }
                    className="px-3.5 py-3 hover:bg-gray-100 text-gray-500 text-sm font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer text-sm"
                >
                  {isAdding ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShoppingCart size={16} />
                  )}
                  <span>
                    {isAdding ? "Réservation..." : "Ajouter au panier"}
                  </span>
                </button>
              </form>
            ) : (
              <div className="bg-red-50 text-red-800 border border-red-150 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span>
                  Ce produit est actuellement victime de son succès et en
                  rupture de stock.
                </span>
              </div>
            )}

            {/* Statut d\'ajout au panier */}
            {addStatus && (
              <div
                className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium border ${
                  addStatus.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200 shadow-sm"
                    : "bg-red-50 text-red-800 border-red-200 shadow-sm"
                }`}
              >
                {addStatus.type === "success" ? (
                  <Check
                    className="mt-0.5 flex-shrink-0 text-green-600 bg-green-100 p-0.5 rounded-full"
                    size={16}
                  />
                ) : (
                  <AlertTriangle className="mt-0.5 flex-shrink-0" size={16} />
                )}
                <div className="flex-1">
                  <p>{addStatus.message}</p>
                  {addStatus.type === "success" && (
                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-green-600" />
                      Anticipation légale B2B/B2G : reversement séquestre
                      (Stripe Connect) & facturation Chorus Pro 30 jours (Loi
                      LME) prévus lors du paiement final.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
