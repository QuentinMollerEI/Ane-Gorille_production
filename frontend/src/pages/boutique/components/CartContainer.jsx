import React, { useState } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Landmark,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PaymentWorkflowService } from "../../../services/paymentWorkflowService.js";

export default function CartContainer({
  cartItems = [],
  onClearCart,
  onRemoveItem,
  onUpdateQuantity,
}) {
  // 🛡️ SÉCURITÉ ANTI-CRASH : On s'assure que useAuth ne fait pas planter la page si le contexte est absent
  const auth = useAuth() || {};
  const { user = null, userProfile = null } = auth;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specificEngagement, setSpecificEngagement] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);

  const isPublicSector =
    userProfile?.isPublicSector ||
    userProfile?.buyerProfile === "B2G" ||
    userProfile?.role === "client_public";

  // --- CALCULS SÉCURISÉS ---
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

    safeCartItems.forEach((item) => {
      // Nettoyage rigoureux des données pour éviter les NaN (Not a Number) qui créent un écran blanc
      const qty = parseInt(item?.quantity || item?.qty || 0, 10);
      const priceHT = Number(item?.priceHT || item?.price || 0);
      const vatRate = Number(item?.vatRate || item?.vat || 5.5);

      const itemHT = priceHT * qty;
      const itemTVA = itemHT * (vatRate / 100);

      totalHT += itemHT;
      totalTVA += itemTVA;
    });

    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
    };
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();
  const totalArticles = Array.isArray(cartItems)
    ? cartItems.reduce(
        (acc, item) => acc + parseInt(item?.quantity || item?.qty || 0, 10),
        0,
      )
    : 0;

  // --- TRAITEMENT DE LA COMMANDE ---
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!user) {
      setOrderStatus({
        type: "error",
        message: "Vous devez être authentifié pour finaliser une commande.",
      });
      return;
    }

    if (isPublicSector && !specificEngagement.trim()) {
      setOrderStatus({
        type: "error",
        message:
          "⚠️ Numéro d'engagement budgétaire obligatoire pour le portail Chorus Pro de l'État.",
      });
      return;
    }

    setIsSubmitting(true);
    setOrderStatus(null);

    try {
      // Appel au service (ajoutez un fallback si le service n'est pas encore bien importé)
      if (!PaymentWorkflowService || !PaymentWorkflowService.processCheckout) {
        throw new Error("Service de paiement temporairement indisponible.");
      }

      const result = await PaymentWorkflowService.processCheckout(
        user.uid,
        cartItems,
        {
          specificEngagement: isPublicSector ? specificEngagement.trim() : null,
          deliveryAddress:
            userProfile?.deliveryAddress ||
            userProfile?.address ||
            "Point de distribution central",
        },
      );

      if (onClearCart) onClearCart();

      setOrderStatus({
        type: "success",
        message: result.message || "Commande validée.",
        orderId: result.orderId || "REF-EN-ATTENTE",
      });
    } catch (error) {
      console.error("Échec du checkout :", error);
      setOrderStatus({
        type: "error",
        message: error.message || "Une erreur technique est survenue.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1️⃣ État : Succès de commande
  if (orderStatus?.type === "success") {
    return (
      <div className="max-w-xl mx-auto bg-white border border-green-200 rounded-3xl p-8 text-center space-y-6 shadow-sm my-10 animate-fade-in">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
          <CheckCircle2 size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900">
            Commande validée avec succès !
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Référence enregistrée :{" "}
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-bold">
              #{orderStatus.orderId}
            </span>
          </p>
        </div>
        <div className="p-4 bg-green-50/50 border border-green-150 rounded-2xl text-xs text-green-800 leading-relaxed text-left font-medium">
          {orderStatus.message}
        </div>
      </div>
    );
  }

  // 2️⃣ État : Panier Vide
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 max-w-2xl mx-auto my-6">
        <ShoppingBag
          className="mx-auto text-gray-300 mb-4 stroke-1"
          size={48}
        />
        <p className="text-gray-500 font-extrabold text-sm">
          Votre panier professionnel est vide.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Ajoutez des produits de notre boutique pour commencer.
        </p>
      </div>
    );
  }

  // 3️⃣ État : Panier avec produits
  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
      {/* 🛒 GAUCHE : Articles */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-green-700" size={22} />
            Votre Panier ({totalArticles}{" "}
            {totalArticles > 1 ? "articles" : "article"})
          </h2>
          <button
            onClick={onClearCart}
            className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-150 transition-colors"
          >
            Vider le panier
          </button>
        </div>

        <div className="space-y-3">
          {cartItems.map((item) => {
            const qty = parseInt(item?.quantity || item?.qty || 0, 10);
            const price = Number(item?.priceHT || item?.price || 0);
            const isBio = Boolean(item?.isBio || item?.bio || false);

            return (
              <div
                key={item.id || Math.random()}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-gray-900">
                      {item?.title || item?.name || "Légume local"}
                    </h3>
                    {isBio && (
                      <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        Bio
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    🌾 {item?.producer || "Maraîcher partenaire"}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQuantity(item.id, Math.max(1, qty - 1))
                      }
                      className="px-3 py-1 text-sm font-black text-gray-500 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-gray-800 w-8 text-center">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, qty + 1)}
                      className="px-3 py-1 text-sm font-black text-gray-500 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <p className="text-xs text-gray-400 font-semibold uppercase leading-none">
                      Total HT
                    </p>
                    <p className="text-sm font-black text-gray-800 mt-1">
                      {(price * qty).toFixed(2)} €
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 border border-gray-200 text-gray-400 hover:text-red-600 rounded-xl bg-white hover:bg-red-50/20"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 💳 DROITE : Caisse et Validation */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-xs">
        <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
          <CreditCard size={16} className="text-green-700" /> Synthèse
        </h3>

        <div className="text-xs space-y-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-150">
          <div className="flex justify-between text-gray-500 font-semibold">
            <span>Total HT :</span>
            <span>{totalHT.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-gray-500 font-semibold">
            <span>TVA :</span>
            <span>{totalTVA.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-gray-900 font-black border-t border-dashed border-gray-200 pt-2.5 text-sm">
            <span>Total TTC :</span>
            <span className="text-green-700">{totalTTC.toFixed(2)} €</span>
          </div>
        </div>

        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          {orderStatus?.type === "error" && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-[10px] font-bold flex items-start gap-1.5 leading-relaxed">
              <AlertCircle
                size={14}
                className="flex-shrink-0 mt-0.5 text-red-600"
              />
              <span>{orderStatus.message}</span>
            </div>
          )}

          {isPublicSector && (
            <div className="space-y-3 p-4 border border-blue-150 bg-blue-50/40 rounded-2xl">
              <div className="flex gap-2">
                <Landmark
                  size={18}
                  className="text-blue-700 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h4 className="text-xs font-black text-blue-900 uppercase">
                    Mandat Chorus Pro
                  </h4>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  N° d'engagement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ENG-2026-9024"
                  value={specificEngagement}
                  onChange={(e) => setSpecificEngagement(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Traitement...</span>
              </>
            ) : (
              <>
                <span className="mt-0.5">Valider ma commande</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="flex justify-center items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-wider border-t border-gray-100 pt-3">
          <ShieldCheck size={14} className="text-green-600" /> Transactions
          certifiées
        </div>
      </div>
    </div>
  );
}
