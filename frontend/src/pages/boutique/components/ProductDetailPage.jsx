import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  ShieldCheck,
  PackageCheck,
  Check,
  Plus,
  Minus,
  Store,
  Camera,
  ChevronRight,
} from "lucide-react";
import ProductCard from "./ProductCard";

/**
 * 🥕 COMPOSANT : ProductDetailPage.jsx (Fiche Produit Plein Écran)
 * Responsabilité unique : Afficher la fiche détaillée d'un produit en plein écran,
 * gérer l'ajout au panier avec notification et retour automatique vers la boutique,
 * et présenter la gamme complète du même producteur.
 */
export default function ProductDetailPage({
  product,
  allProducts = [],
  onBack,
  onAddToCart,
  onSelectProduct,
}) {
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setImgError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product?.id]);

  if (!product) return null;

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);
  const stock = Number(product?.stock ?? product?.quantity ?? 0);
  const isAvailable = Boolean(product?.isAvailable ?? stock > 0);
  const isBio = Boolean(product?.isBio ?? product?.bio ?? false);

  const title = product?.title ?? product?.name ?? "Produit local frais";
  const producer =
    product?.producer ?? product?.producerName ?? "Producteur Local";
  const unit = product?.unit ?? "kg";
  const origin = product?.origin || product?.department || "Dépt. Local";
  const harvestLocation = product?.harvestLocation || origin;
  const harvestDate = product?.harvestDate || "Récolte du jour";
  const batchNumber = product?.batchNumber || "LOT-STD-2026";
  const category = product?.category || "Légumes";

  const imageUrl =
    product?.imageUrl || product?.image || product?.photo || null;

  // Produits du même producteur
  const producerProducts = (allProducts || []).filter((p) => {
    if (p.id === product.id) return false;
    const sameProducer =
      (p.producer &&
        producer &&
        p.producer.toLowerCase().trim() === producer.toLowerCase().trim()) ||
      (p.producerId &&
        product.producerId &&
        p.producerId === product.producerId);
    return sameProducer;
  });

  const handleIncrement = () => {
    if (quantity < stock) setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAdd = () => {
    if (!isAvailable) return;
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
    setAddedToast(true);
    // Notification visuelle et retour automatique vers le marché
    setTimeout(() => {
      setAddedToast(false);
      if (onBack) onBack();
    }, 600);
  };

  const totalPriceTTC = priceTTC * quantity;

  // Variables de style épurées (Clean Code sans expressions JSX complexes)
  const stockBadgeClass = isAvailable
    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
    : "bg-red-100 text-red-800 border border-red-200";

  const statusBadgeClass = isAvailable ? "bg-emerald-600" : "bg-red-500";

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16 animate-fade-in">
      {/* BARRE DE NAVIGATION EN-TÊTE */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all border border-gray-200"
          >
            <ArrowLeft size={16} />
            <span>Retour à la boutique</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span>Boutique</span>
            <ChevronRight size={12} />
            <span>{category}</span>
            <ChevronRight size={12} />
            <span className="text-gray-800 font-bold">{producer}</span>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-10">
        {/* TOAST NOTIFICATION D'AJOUT AU PANIER */}
        {addedToast && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-600 animate-bounce">
            <Check size={20} className="text-amber-400" />
            <div>
              <p className="font-bold text-sm">
                {quantity} x {title} ajouté(s) au panier !
              </p>
              <p className="text-[11px] text-emerald-200">
                Prêt pour la commande en circuit court.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* VISUEL GRAND FORMAT */}
          <div className="lg:col-span-5 bg-gray-100 relative min-h-[380px] lg:min-h-[480px] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200">
            {imageUrl && !imgError ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-3">
                <Camera size={56} className="text-gray-300 stroke-[1.2]" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Produit Frais de l'Exploitation
                </span>
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {isBio && (
                <span className="px-3.5 py-1 bg-amber-400 text-gray-900 font-black text-xs rounded-full uppercase tracking-wider shadow-md border border-amber-300">
                  🌱 AB / Bio
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4 z-10">
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-md text-white ${statusBadgeClass}`}
              >
                {isAvailable ? "EN STOCK" : "ÉPUISÉ"}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md">
                <MapPin size={14} className="text-red-400" />
                <span>{harvestLocation}</span>
              </span>
            </div>
          </div>

          {/* INFORMATIONS & ACHAT */}
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Store size={15} />
                  <span className="uppercase tracking-wider">{producer}</span>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Réf: {batchNumber}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                {title}
              </h1>

              {/* BLOC FINANCIER */}
              <div className="bg-emerald-50/40 border border-emerald-150 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    PRIX HT : {priceHT.toFixed(2)} €
                  </p>
                  <p className="text-3xl font-black text-emerald-800 tracking-tight">
                    {priceTTC.toFixed(2)} €{" "}
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      TTC ({vatRate}%) / {unit}
                    </span>
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span
                    className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${stockBadgeClass}`}
                  >
                    {isAvailable ? `Stock Dispo : ${stock} ${unit}` : "Épuisé"}
                  </span>
                </div>
              </div>

              {/* QUANTITÉ ET ACHAT */}
              {isAvailable && (
                <div className="pt-2 space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Sélectionner la Quantité :
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex items-center border-2 border-emerald-600 rounded-2xl bg-white overflow-hidden shadow-sm shrink-0">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={quantity <= 1}
                        className="px-3.5 py-3 text-emerald-800 hover:bg-emerald-50 disabled:opacity-30 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-5 font-black text-base text-gray-900 min-w-[3rem] text-center">
                        {quantity}{" "}
                        <span className="text-xs font-semibold text-gray-500">
                          {unit}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={quantity >= stock}
                        className="px-3.5 py-3 text-emerald-800 hover:bg-emerald-50 disabled:opacity-30 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdd}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-[0.99]"
                    >
                      <ShoppingCart size={18} />
                      <span>
                        Ajouter au Panier ({totalPriceTTC.toFixed(2)} € TTC)
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TRAÇABILITÉ & CONSIGNES */}
              <div className="border-t border-gray-150 pt-5 space-y-3">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-600" />
                  Traçabilité Sanitaire & Origine Locale
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Département / Origine
                    </p>
                    <p className="font-bold text-gray-800 mt-0.5">{origin}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Date de Récolte
                    </p>
                    <p className="font-bold text-gray-800 mt-0.5">
                      {harvestDate}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs flex items-start gap-3">
                  <PackageCheck
                    size={20}
                    className="text-amber-700 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-extrabold text-amber-900">
                      Conditionnement Consigné Zéro Déchet
                    </p>
                    <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                      Livré directement en caisses et cagettes réutilisables
                      consignées. Aucun emballage plastique jetable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GAMME DU MÊME PRODUCTEUR */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 lg:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-150 pb-4 gap-2">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Store size={22} />
                </span>
                Tous les produits de : {producer}
              </h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Découvrez l'ensemble de la récolte fraîche disponible en direct
                de cette exploitation locale.
              </p>
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0 self-start sm:self-auto">
              {producerProducts.length} autre(s) produit(s) en rayon
            </span>
          </div>

          {producerProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {producerProducts.map((otherProd) => (
                <ProductCard
                  key={otherProd.id}
                  product={otherProd}
                  onOpenDetails={(p) => {
                    if (onSelectProduct) {
                      onSelectProduct(p);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 bg-gray-50 rounded-2xl text-center text-gray-400 italic border border-gray-150 text-xs">
              🌾 C'est le seul produit actuellement disponible pour cet
              exploitant dans la boutique.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
