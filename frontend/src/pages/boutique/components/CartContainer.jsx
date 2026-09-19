import React, { useMemo } from "react";
import { 
  ShoppingCart, 
  Trash2, 
  ArrowLeft, 
  Package, 
  Minus, 
  Plus, 
  Truck, 
  Percent, 
  CheckCircle2, 
  Store, 
  Layers,
} from "lucide-react";
import CheckoutView from "../../../components/Checkout/CheckoutView";
import { calculateDeliveryFee } from "../../../services/CheckoutOrchestrator";

/**
 * 🌾 COMPOSANT : CartContainer.jsx
 * Panier d'approvisionnement B2B / B2G.
 * - Commande unique 1 producteur : Présentation classique sans découpage ni message spécifique.
 * - Commande multi-producteurs : Découpage explicite par sous-commandes et message logistique.
 * - Tarification dégressive B2B (15€ HT / 8€ HT / Franco dès 300€ HT) et double ventilation de TVA (5.5% et 20%).
 */
export default function CartContainer({
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onBackToShop,
}) {
  // 1. Regroupement par Producteur / Fournisseur
  const subOrdersGrouped = useMemo(() => {
    const map = {};

    cart.forEach((item) => {
      const pId = item.producerId || item.producer || item.producerUid || item.supplierId || item.userId || "PROD_LOCAL";
      const pName = item.producerCompany || item.producerName || item.producer || item.supplierName || "Exploitation Locale";
      
      if (!map[pId]) {
        map[pId] = {
          producerId: pId,
          producerName: pName,
          producerCity: item.producerCity || item.city || "Local",
          items: [],
          subtotalHT: 0,
        };
      }

      const pHT = Number(item.priceHT ?? item.price ?? 0);
      const qty = Number(item.quantity ?? item.qty ?? 1);
      const lineHT = pHT * qty;

      map[pId].items.push({
        ...item,
        priceHT: pHT,
        quantity: qty,
        lineHT: lineHT,
      });

      map[pId].subtotalHT += lineHT;
    });

    return Object.values(map);
  }, [cart]);

  const isMultiProducer = subOrdersGrouped.length > 1;

  // 2. Calcul des totaux généraux consolidés
  const globalSubtotalHT = useMemo(() => {
    return subOrdersGrouped.reduce((sum, group) => sum + group.subtotalHT, 0);
  }, [subOrdersGrouped]);

  // 3. Calcul des frais de livraison B2B dégressifs
  const deliveryFeeHT = typeof calculateDeliveryFee === "function"
    ? calculateDeliveryFee(globalSubtotalHT)
    : globalSubtotalHT >= 300 ? 0 : globalSubtotalHT >= 150 ? 8 : 15;

  // 4. Calculs de TVA (TVA 5.5% Alimentation + TVA 20% Transport en Régime Réel)
  const foodVAT = globalSubtotalHT * 0.055;
  const deliveryFeeVAT = deliveryFeeHT * 0.20;
  const totalTTC = globalSubtotalHT + foodVAT + deliveryFeeHT + deliveryFeeVAT;

  // 5. Progression vers le Franco de port (300 € HT)
  const remainingForFreeShipping = Math.max(0, 300 - globalSubtotalHT);
  const progressPercent = Math.min(100, (globalSubtotalHT / 300) * 100);

  if (cart.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
        <Package size={48} className="mx-auto text-gray-300" />
        <h3 className="text-lg font-bold text-gray-800">Votre panier est actuellement vide</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Explorez notre catalogue pour vous approvisionner directement auprès des maraîchers.
        </p>
        <button
          onClick={onBackToShop}
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors inline-block cursor-pointer shadow-sm"
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
            <h2 className="text-xl font-black text-gray-900">Votre Panier d'Approvisionnement</h2>
            <p className="text-xs text-gray-500 font-semibold">
              {isMultiProducer ? (
                <>Commande groupée divisée en <strong className="text-emerald-800 font-bold">{subOrdersGrouped.length} sous-commandes producteurs</strong></>
              ) : (
                <>Commande directe auprès de <strong className="text-emerald-800 font-bold">{subOrdersGrouped[0]?.producerName || "Exploitation Locale"}</strong></>
              )}
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
        {/* COLONNE GAUCHE : DÉTAIL DU PANIER / SOUS-COMMANDES */}
        <div className="lg:col-span-7 space-y-5">
          {/* 🚚 BARRE DE PROGRESSION INCITATIVE VERS LE FRANCO DE PORT */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between font-extrabold text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-900">
                <Truck size={16} className="text-emerald-700" />
                {globalSubtotalHT >= 300 ? (
                  <span className="text-emerald-800 font-black flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Livraison OFFERTE (Franco de port atteint) !
                  </span>
                ) : (
                  <span>
                    Plus que <strong className="text-emerald-950 font-mono">{remainingForFreeShipping.toFixed(2)} € HT</strong> pour la livraison OFFERTE !
                  </span>
                )}
              </span>
              <span className="text-emerald-800 font-mono text-[10px]">{progressPercent.toFixed(0)}%</span>
            </div>

            {/* Jauge visuelle */}
            <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Repères des paliers */}
            <div className="flex justify-between text-[9px] font-bold text-gray-500 pt-0.5">
              <span>Standard (&lt;150€ HT = 15€)</span>
              <span>Incitatif (150€-299€ = 8€)</span>
              <span className="text-emerald-800 font-black">Franco (≥300€ = 0€)</span>
            </div>
          </div>

          {/* MESSAGE D'INFORMATION SPÉCIFIQUE MULTI-PRODUCTEURS (Affiché UNIQUEMENT si multi-producteurs) */}
          {isMultiProducer && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 text-blue-900 flex items-start gap-2.5">
              <Layers size={18} className="text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <span className="font-extrabold block">
                  Organisation Logistique : {subOrdersGrouped.length} Sous-Commandes Distinctes
                </span>
                <p className="text-blue-800 font-medium">
                  Votre panier réunit les récoltes de <strong>{subOrdersGrouped.length} maraîchers différents</strong>.
                  Chaque producteur recevra son bon de préparation dédié. La livraison est consolidée en un seul passage.
                </p>
              </div>
            </div>
          )}

          {/* BLOCS PRODUITS / SOUS-COMMANDES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Store size={16} className="text-emerald-700" />
                <span>
                  {isMultiProducer 
                    ? `Sous-Commandes par Fournisseur (${subOrdersGrouped.length})` 
                    : `Produits Sélectionnés (${cart.length})`}
                </span>
              </h3>
              <button
                onClick={onClearCart}
                className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Vider le panier</span>
              </button>
            </div>

            {/* BOUCLE DE RENDU DYNAMIQUE DES GROUPES PRODUCTEURS */}
            {subOrdersGrouped.map((group, groupIdx) => {
              const groupFoodVAT = group.subtotalHT * 0.055;
              const groupTotalTTC = group.subtotalHT + groupFoodVAT;

              return (
                <div 
                  key={group.producerId} 
                  className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                >
                  {/* En-tête du groupe */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 gap-2">
                    <div className="flex items-center gap-2.5">
                      {isMultiProducer && (
                        <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-extrabold text-xs">
                          #{groupIdx + 1}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-gray-900 text-sm">{group.producerName}</h4>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                            {isMultiProducer ? `Sous-Commande #${groupIdx + 1}` : "Vente Directe Producteur"}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold">
                          Provenance des récoltes : {group.producerCity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right bg-emerald-50/60 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-extrabold uppercase block">Sous-Total Récolte</span>
                      <span className="font-black text-emerald-900 text-xs font-mono">
                        {group.subtotalHT.toFixed(2)} € HT
                      </span>
                    </div>
                  </div>

                  {/* Liste des articles de cette sous-commande */}
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-extrabold text-gray-900 text-xs">{item.title || item.name}</h5>
                            {item.isBio && (
                              <span className="bg-amber-100 text-amber-900 font-black text-[8px] px-1.5 py-0.5 rounded uppercase">
                                BIO
                              </span>
                            )}
                          </div>
                          <p className="text-emerald-800 font-bold text-[11px] font-mono">
                            {item.priceHT.toFixed(2)} € HT / {item.unit || "kg"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="px-3 py-1 font-extrabold text-gray-900 text-xs font-mono">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <p className="font-black text-gray-900 text-xs font-mono">{item.lineHT.toFixed(2)} € HT</p>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Retirer ce produit"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pied de sous-commande */}
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-600 bg-gray-50/50 p-2.5 rounded-xl">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Percent size={11} />
                      <span>TVA Alimentation (5.5%) : <strong className="font-mono text-gray-800">{groupFoodVAT.toFixed(2)} €</strong></span>
                    </span>
                    <span className="text-emerald-900 font-mono font-black">
                      Total Récolte : {groupTotalTTC.toFixed(2)} € TTC
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RÉCAPITULATIF CONSOLIDÉ DES PRIX & LIVRAISON */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h4 className="font-extrabold text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200 pb-2">
              Synthèse Financière Consolidée
            </h4>

            <div className="space-y-2 text-xs font-semibold text-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">
                  {isMultiProducer 
                    ? `Total Produits HT (${subOrdersGrouped.length} sous-commandes)` 
                    : `Sous-total Produits HT`}
                </span>
                <span className="font-black text-gray-900 font-mono">{globalSubtotalHT.toFixed(2)} € HT</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-gray-500">
                  <Truck size={13} className="text-emerald-700" />
                  <span>Frais de Livraison B2B</span>
                </span>
                <span className="font-black font-mono">
                  {deliveryFeeHT === 0 ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                      Offerts (Franco)
                    </span>
                  ) : (
                    <span className="text-gray-900">{deliveryFeeHT.toFixed(2)} € HT</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1 text-gray-400">
                  <Percent size={11} />
                  <span>TVA Alimentation (5.5%)</span>
                </span>
                <span className="font-bold text-gray-600 font-mono">{foodVAT.toFixed(2)} €</span>
              </div>

              {deliveryFeeHT > 0 && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1 text-gray-400">
                    <Percent size={11} />
                    <span>TVA Prestation Transport (20%)</span>
                  </span>
                  <span className="font-bold text-gray-600 font-mono">{deliveryFeeVAT.toFixed(2)} €</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="font-black text-gray-900">Total Général TTC</span>
                <span className="font-black text-emerald-800 text-lg font-mono">{totalTTC.toFixed(2)} € TTC</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : MODULE DE PAIEMENT SÉCURISÉ & LOGISTIQUE */}
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
