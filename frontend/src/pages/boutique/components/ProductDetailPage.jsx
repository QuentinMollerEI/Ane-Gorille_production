import React, { useState } from "react";
import { X, ShoppingCart, Check, ShieldCheck, MapPin, Calendar, Truck, Minus, Plus } from "lucide-react";
import { useCart } from "../../../context/CartContext.jsx";

export default function ProductDetailPage({ product, onClose }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const priceHT = Number(product.priceHT) || 0;
  const vatRate = Number(product.vatRate) || (product.category === "artisanat" ? 20 : 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="w-full h-64 bg-slate-100 rounded-2xl overflow-hidden">
            <img
              src={product.imageUrl || product.image || "/placeholder.png"}
              alt={product.title || product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500";
              }}
            />
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                {product.category === "artisanat" ? "Artisanat Gorille" : "Maraîchage Âne"}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">{product.title || product.name}</h2>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                <MapPin size={14} className="text-emerald-600" />
                {product.producerName || "Producteur Partenaire"}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{priceHT.toFixed(2)} € HT</span>
                <span className="text-xs font-bold text-slate-500">/ {product.unit || "unité"}</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-700">
                Soit {priceTTC.toFixed(2)} € TTC (TVA {vatRate}%)
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <strong>Traçabilité HACCP :</strong> Lot N° {product.batchNumber || "L-2026-001"}
              </p>
              <p className="flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                <strong>DLC / DLUO :</strong> {product.expiryDate || "Garantie fraîcheur J+5"}
              </p>
            </div>

            {/* Sélecteur de Quantité & Validation */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="px-4 text-xs font-black text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2.5 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  isAdded ? "bg-emerald-600 text-white" : "bg-emerald-700 hover:bg-emerald-800 text-white"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} /> Ajouté au panier !
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} /> Ajouter {quantity} {product.unit || "unité"}s
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}