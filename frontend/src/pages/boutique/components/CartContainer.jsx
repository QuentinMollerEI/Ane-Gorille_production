import React from "react";
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Package,
  Minus,
  Plus,
} from "lucide-react";
import CheckoutView from "../../../components/Checkout/CheckoutView";

export default function CartContainer({
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onBackToShop,
}) {
  // 🌿 REGROUPEMENT DYNAMIQUE ET VENTILATION DE LA TVA PAR PRODUCTEUR
  const itemsByProducer = cart.reduce((acc, item) => {
    const pId = item.producerId || item.producerCompany || "PROD_INCONNU";
    if (!acc[pId]) {
      acc[pId] = {
        producerId: item.producerId || "",
        producerName:
          item.producerCompany || item.producerName || "Exploitation Locale",
        producerCity: item.producerCity || "",
        producerDepartment: item.producerDepartment || "",
        items: [],
        subTotalHT: 0,
        subTotalTVA: 0,
        subTotalTTC: 0,
      };
    }

    const qty = Number(item.quantity || 1);
    const priceHT = Number(item.priceHT ?? item.price ?? 0);
    // Taux de TVA propre au produit/producteur (ex: 5.5%, 0% Art. 293 B, 20%, etc.)
    const vatRate = Number(item.vatRate ?? item.vat ?? 5.5) / 100;

    const lineHT = priceHT * qty;
    const lineTVA = lineHT * vatRate;
    const lineTTC = lineHT + lineTVA;

    acc[pId].items.push({
      ...item,
      lineHT,
      lineTVA,
      lineTTC,
      vatRatePercent: vatRate * 100,
    });

    acc[pId].subTotalHT += lineHT;
    acc[pId].subTotalTVA += lineTVA;
    acc[pId].subTotalTTC += lineTTC;

    return acc;
  }, {});

  const producerGroups = Object.values(itemsByProducer);
  const producerCount = producerGroups.length;

  // CUMUL GÉNÉRAL DU PANIER (Ventilé)
  const grandTotalHT = producerGroups.reduce((sum, p) => sum + p.subTotalHT, 0);
  const grandTotalTVA = producerGroups.reduce((sum, p) => sum + p.subTotalTVA, 0);
  const grandTotalTTC = grandTotalHT + grandTotalTVA;

  if (cart.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
        <Package size={48} className="mx-auto text-gray-300" />
        <h3 className="text-lg font-bold text-gray-800">
          Votre panier est actuellement vide
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Explorez notre catalogue pour vous approvisionner directement auprès
          des maraîchers.
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
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12 text-xs">
      {/* En-tête de navigation du panier */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <ShoppingCart size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Votre Panier d'Approvisionnement
            </h2>
            <p className="text-xs text-gray-500 font-semibold">
              {producerCount > 1
                ? `Commande multi-producteurs (${producerCount} sous-commandes distinctes)`
                : "Commande auprès d'une exploitation locale"}
            </p>
          </div>
        </div>
        <button
          onClick={onBackToShop}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Continuer vos achats</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNE GAUCHE : RÉCAPITULATIF PAR PRODUCTEUR */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-150 pb-3">
            <h3 className="font-extrabold text-gray-900 text-sm">
              Articles Sélectionnés ({cart.length})
            </h3>
            <button
              onClick={onClearCart}
              className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Vider le panier</span>
            </button>
          </div>

          {/* BLOCS DÉCOUPÉS ET VENTILÉS PAR PRODUCTEUR / FERME */}
          <div className="space-y-6">
            {producerGroups.map((group, index) => (
              <div
                key={group.producerId || index}
                className="p-4 bg-gray-50/60 border border-gray-200 rounded-2xl space-y-3"
              >
                {/* En-tête du producteur */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-gray-900 text-xs">
                        {group.producerName}
                      </h4>
                      {group.producerCity && (
                        <p className="text-[10px] text-gray-500 font-semibold">
                          {group.producerCity}{" "}
                          {group.producerDepartment
                            ? `(${group.producerDepartment})`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                    Sous-commande #{index + 1}
                  </span>
                </div>

                {/* Produits du producteur */}
                <div className="divide-y divide-gray-100 space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="pt-2 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 flex-1">
                        <p className="font-bold text-gray-900 text-xs">
                          {item.title || item.name}
                        </p>
                        <p className="text-emerald-800 font-semibold text-[10px]">
                          {Number(item.priceHT ?? item.price ?? 0).toFixed(2)}{" "}
                          € HT / {item.unit || "kg"}
                          <span className="text-gray-400 ml-1.5 font-normal">
                            (TVA{" "}
                            {item.vatRatePercent === 0
                              ? "0% - Art. 293 B"
                              : `${item.vatRatePercent}%`}
                            )
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2.5 py-0.5 font-extrabold text-gray-900 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="text-right min-w-[65px]">
                          <p className="font-black text-gray-900 text-xs">
                            {item.lineHT.toFixed(2)} € HT
                          </p>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux de la sous-commande */}
                <div className="pt-2 border-t border-gray-200/80 text-[11px] font-bold space-y-1 bg-white/70 p-2.5 rounded-xl">
                  <div className="flex justify-between text-gray-700">
                    <span>Sous-total HT ({group.producerName}) :</span>
                    <span>{group.subTotalHT.toFixed(2)} € HT</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[10px]">
                    <span>TVA collectée :</span>
                    <span>{group.subTotalTVA.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-black pt-0.5 border-t border-gray-100">
                    <span>Sous-total TTC :</span>
                    <span>{group.subTotalTTC.toFixed(2)} € TTC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL GÉNÉRAL DU PANIER VENTILÉ */}
          <div className="pt-4 border border-emerald-200 space-y-1.5 text-xs font-bold bg-emerald-50/60 p-4 rounded-2xl">
            <div className="flex justify-between text-gray-700">
              <span>Total Général HT :</span>
              <span>{grandTotalHT.toFixed(2)} € HT</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total TVA Collectée (ventilée) :</span>
              <span>{grandTotalTVA.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-base font-black text-emerald-950 pt-2 border-t border-emerald-200/80">
              <span>Total Général TTC à Régler :</span>
              <span className="text-emerald-800">
                {grandTotalTTC.toFixed(2)} € TTC
              </span>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : MODULE DE CHECKOUT ET PAIEMENT SÉCURISÉ */}
        <div className="lg:col-span-5 space-y-5">
          <CheckoutView
            cartItems={cart}
            clearCart={onClearCart}
            onCheckoutSuccess={onBackToShop}
          />
        </div>
      </div>
    </div>
  );
}