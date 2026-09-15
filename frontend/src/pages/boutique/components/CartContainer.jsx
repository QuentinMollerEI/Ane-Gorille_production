import React from "react";
import { ShoppingCart, Trash2, ArrowLeft, Package, Store, Minus, Plus } from "lucide-react";
import CheckoutView from "../../../components/Checkout/CheckoutView";

export default function CartContainer({
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onBackToShop,
}) {
  // 🌿 REGROUPEMENT DYNAMIQUE DES ARTICLES PAR PRODUCTEUR / FERME
  const groupedCart = cart.reduce((acc, item) => {
    const producerKey = item.producerId || item.producerCompany || "PROD_INCONNU";
    if (!acc[producerKey]) {
      acc[producerKey] = {
        producerId: item.producerId || "",
        producerName: item.producerCompany || item.producerName || "Exploitation Locale",
        producerCity: item.producerCity || "",
        producerDepartment: item.producerDepartment || "",
        items: [],
        subTotalHT: 0,
      };
    }
    const priceHT = Number(item.priceHT ?? item.price ?? 0);
    const itemQty = Number(item.quantity || 1);
    acc[producerKey].items.push(item);
    acc[producerKey].subTotalHT += priceHT * itemQty;
    return acc;
  }, {});

  const totalHT = cart.reduce(
    (sum, item) => sum + Number(item.priceHT ?? item.price ?? 0) * Number(item.quantity || 1),
    0
  );
  const totalTVA = totalHT * 0.055;
  const totalTTC = totalHT + totalTVA;
  const producerCount = Object.keys(groupedCart).length;

  if (cart.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
        <Package size={48} className="mx-auto text-gray-300" />
        <h3 className="text-lg font-bold text-gray-800">Votre panier est actuellement vide</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Explorez notre catalogue de produits locaux pour vous approvisionner directement auprès des maraîchers.
        </p>
        <button
          onClick={onBackToShop}
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          Découvrir les produits
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs animate-fade-in">
      {/* 📦 COLONNE GAUCHE : RECAPITULATIF SÉPARÉ PAR PRODUCTEUR */}
      <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b border-gray-150 pb-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">
              Articles Sélectionnés ({cart.length})
            </h3>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {producerCount > 1
                ? `Commande multi-producteurs (${producerCount} sous-commandes distinctes)`
                : "Commande auprès d'une exploitation locale"}
            </p>
          </div>
          <button
            onClick={onClearCart}
            className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Vider le panier</span>
          </button>
        </div>

        {/* BLOCS DE SOUS-COMMANDES DÉCOUPÉS PAR FERME */}
        <div className="space-y-4">
          {Object.entries(groupedCart).map(([producerKey, group], index) => (
            <div
              key={producerKey}
              className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-3"
            >
              {/* En-tête du producteur */}
              <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-emerald-700 text-white rounded-full flex items-center justify-center font-black text-[10px]">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-black text-gray-900 text-xs flex items-center gap-1.5">
                      <Store size={14} className="text-emerald-700" />
                      <span>{group.producerName}</span>
                    </h4>
                    {group.producerCity && (
                      <p className="text-[10px] text-gray-500 font-medium">
                        {group.producerCity} {group.producerDepartment ? `(${group.producerDepartment})` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Sous-commande #{index + 1}
                </span>
              </div>

              {/* Produits de ce producteur */}
              <div className="divide-y divide-gray-200/60 space-y-2">
                {group.items.map((item) => {
                  const pHT = Number(item.priceHT ?? item.price ?? 0);
                  const itemTotalHT = pHT * item.quantity;
                  return (
                    <div key={item.id} className="pt-2 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <h5 className="font-bold text-gray-900 text-xs">{item.title || item.name}</h5>
                        <p className="text-emerald-800 font-bold text-[11px]">
                          {pHT.toFixed(2)} € HT / {item.unit || "kg"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 font-black cursor-pointer"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-2.5 py-0.5 font-extrabold text-gray-900 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 font-black cursor-pointer"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <div className="text-right min-w-[65px]">
                          <p className="font-black text-gray-900 text-xs">{itemTotalHT.toFixed(2)} € HT</p>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sous-total de cette ferme */}
              <div className="pt-2 border-t border-gray-200/80 flex justify-between items-center text-xs font-bold text-gray-700">
                <span>Sous-total HT ({group.producerName}) :</span>
                <span className="text-emerald-900 font-black">{group.subTotalHT.toFixed(2)} € HT</span>
              </div>
            </div>
          ))}
        </div>

        {/* Détail financier global */}
        <div className="pt-4 border-t border-gray-200 space-y-1.5 text-xs font-bold">
          <div className="flex justify-between text-gray-600">
            <span>Total Général HT ({producerCount} sous-commandes) :</span>
            <span>{totalHT.toFixed(2)} € HT</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>TVA Alimentaire Réduite (5.5 %) :</span>
            <span>{totalTVA.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-150">
            <span>Total Général TTC à Régler :</span>
            <span className="text-emerald-800 text-base">{totalTTC.toFixed(2)} € TTC</span>
          </div>
        </div>
      </div>

      {/* 💳 COLONNE DROITE : MODULE DE PAIEMENT STRIPE & LOGISTIQUE */}
      <div className="lg:col-span-5 space-y-5">
        <CheckoutView
          cart={cart}
          cartItems={cart}
          items={cart}
          totalTTC={totalTTC}
          totalAmount={totalTTC}
          clearCart={onClearCart}
          onClearCart={onClearCart}
          onBackToCart={onBackToShop}
          onCheckoutSuccess={onBackToShop}
        />
      </div>
    </div>
  );
}