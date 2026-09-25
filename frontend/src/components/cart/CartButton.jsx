import React from "react";
import { ShoppingCart, FileText } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CartButton({ onClick }) {
  const { itemsCount, grandTotalTTC } = useCart();
  const { profile } = useAuth();

  const isPublicSector = profile?.role === "acheteur_public" || profile?.buyerRole === "acheteur_public";

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
    >
      {isPublicSector ? <FileText size={18} /> : <ShoppingCart size={18} />}
      <span className="hidden sm:inline">
        {isPublicSector ? "Bon de Commande" : "Mon Panier"}
      </span>
      <span className="bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-black">
        {itemsCount}
      </span>
      {grandTotalTTC > 0 && (
        <span className="ml-1 text-[11px] font-extrabold text-emerald-100 hidden md:inline">
          ({grandTotalTTC.toFixed(2)} €)
        </span>
      )}
    </button>
  );
}