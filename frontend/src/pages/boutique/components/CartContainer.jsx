import React, { useState } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Receipt,
  Landmark,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { PaymentWorkflowService } from "../../../services/paymentWorkflowService.js";

/**
 * 🛒 COMPOSANT : CartContainer.jsx (v2 - Version Production Sécurisée)
 * Responsabilité unique : Gérer l'affichage du panier acheteur (B2B/B2G),
 * la saisie de l'engagement budgétaire pour le secteur public, et la soumission
 * sécurisée de la transaction au service d'orchestration unifié.
 */
export default function CartContainer({
  cartItems = [],
  onClearCart,
  onRemoveItem,
  onUpdateQuantity,
}) {
  const { user, userProfile } = useAuth(); // Récupération du profil et de son rôle (B2B / B2G)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specificEngagement, setSpecificEngagement] = useState("");
  const [orderStatus, setOrderStatus] = useState(null); // { type: 'success' | 'error', message: string, orderId?: string }

  // Détermination du rôle acheteur (Public B2G ou Privé B2B)
  const isPublicSector =
    userProfile?.isPublicSector ||
    userProfile?.buyerProfile === "B2G" ||
    userProfile?.role === "client_public";

  // --- CALCULS COMPTABLES FLUIDES ET SÉCURISÉS ---
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;

    cartItems.forEach((item) => {
      const qty = Number(item.quantity || item.qty || 0);
      const priceHT = Number(item.priceHT || item.price || 0);
      const vatRate = Number(item.vatRate || item.vat || 5.5);

      const itemHT = priceHT * qty;
      const itemTVA = itemHT * (vatRate / 100);

      totalHT += itemHT;
      totalTVA += itemTVA;
    });

    const totalTTC = totalHT + totalTVA;

    return {
      totalHT,
      totalTVA,
      totalTTC,
    };
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();

  // --- TRAITEMENT DU PASSAGE EN CAISSE SÉCURISÉ ---
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!user) {
      setOrderStatus({
        type: "error",
        message:
          "Vous devez être authentifié pour finaliser une commande professionnelle.",
      });
      return;
    }

    // Contrainte légale B2G : L'engagement budgétaire est obligatoire pour le secteur public (Chorus Pro)
    if (isPublicSector && !specificEngagement.trim()) {
      setOrderStatus({
        type: "error",
        message:
          "⚠️ Numéro d'engagement budgétaire obligatoire. Sans cette mention légale, la facture sera rejetée par le portail Chorus Pro de l'État.",
      });
      return;
    }

    setIsSubmitting(true);
    setOrderStatus(null);

    try {
      // 🚀 APPEL TECHNIQUE SÉCURISÉ CÔTÉ SERVEUR (B2B / B2G)
      // Délègue la validation, la transaction d'écriture et la division Stripe Connect
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

      // Si validation sans encombre :
      if (onClearCart) onClearCart(); // On vide le panier localement

      setOrderStatus({
        type: "success",
        message: result.message,
        orderId: result.orderId,
      });
    } catch (error) {
      console.error("Échec du checkout automatisé :", error);
      setOrderStatus({
        type: "error",
        message:
          error.message ||
          "Une erreur technique est survenue lors de la validation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu de l'état de succès de commande (Expérience rassurante)
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
        <p className="text-[10px] text-gray-400">
          Votre commande a été envoyée en direct dans les hangars de nos
          maraîchers. Vous pouvez suivre l'avancement de la récolte en temps
          réel sur l'onglet <strong>Suivi des commandes</strong>.
        </p>
      </div>
    );
  }

  // Rendu du panier vide
  if (cartItems.length === 0) {
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
          Ajoutez des fruits et légumes bio locaux de notre boutique pour
          commencer votre commande.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
      {/* 🛒 COLONNE GAUCHE : Récapitulatif des articles */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-green-700" size={22} />
            Votre Panier (
            {cartItems.reduce(
              (acc, item) => acc + Number(item.quantity || item.qty || 0),
              0,
            )}{" "}
            articles)
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
            const qty = Number(item.quantity || item.qty || 0);
            const price = Number(item.priceHT || item.price || 0);
            const isBio = Boolean(item.isBio || item.bio || false);

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-300 transition-colors shadow-xs"
              >
                {/* Libellé produit */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-gray-900">
                      {item.title || item.name || "Légume local"}
                    </h3>
                    {isBio && (
                      <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        Bio
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    🌾 {item.producer || "Maraîcher local"}
                  </p>
                </div>

                {/* Sélecteur de quantité & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQuantity(item.id, Math.max(1, qty - 1))
                      }
                      className="px-3 py-1 text-sm font-black text-gray-500 hover:bg-gray-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-gray-800 w-8 text-center">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, qty + 1)}
                      className="px-3 py-1 text-sm font-black text-gray-500 hover:bg-gray-100 cursor-pointer"
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
                    className="p-2 border border-gray-200 text-gray-400 hover:text-red-600 rounded-xl bg-white hover:bg-red-50/20 transition-colors cursor-pointer"
                    title="Supprimer du panier"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 💳 COLONNE DROITE : Caisse légale et synthèse */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-xs">
        <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
          <CreditCard size={16} className="text-green-700" />
          Synthèse de votre commande
        </h3>

        {/* Détails financiers */}
        <div className="text-xs space-y-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-150">
          <div className="flex justify-between text-gray-500 font-semibold">
            <span>Total HT :</span>
            <span>{totalHT.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-gray-500 font-semibold">
            <span>TVA cumulée (5.5%) :</span>
            <span>{totalTVA.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-gray-900 font-black border-t border-dashed border-gray-200 pt-2.5 text-sm">
            <span>Montant Total TTC :</span>
            <span className="text-green-700">{totalTTC.toFixed(2)} €</span>
          </div>
        </div>

        {/* Formulaire de validation */}
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          {/* Notifications temporaires */}
          {orderStatus?.type === "error" && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-[10px] font-bold flex items-start gap-1.5 leading-relaxed">
              <AlertCircle
                size={14}
                className="flex-shrink-0 mt-0.5 text-red-600"
              />
              <span>{orderStatus.message}</span>
            </div>
          )}

          {/* Scénario d'aiguillage A : SECTEUR PUBLIC (B2G) */}
          {isPublicSector ? (
            <div className="space-y-3 p-4 border border-blue-150 bg-blue-50/40 rounded-2xl">
              <div className="flex gap-2">
                <Landmark
                  size={18}
                  className="text-blue-700 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h4 className="text-xs font-black text-blue-900 uppercase">
                    Mandat Public - Chorus Pro
                  </h4>
                  <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                    Facturation électronique automatisée à destination de votre
                    comptabilité publique (échéance légale LME à 30 jours).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  N° d'engagement budgétaire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ENG-2026-9024"
                  value={specificEngagement}
                  onChange={(e) => setSpecificEngagement(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 font-semibold"
                />
                <span className="text-[9px] text-gray-400 mt-1 block leading-tight font-medium">
                  Mention administrative légale indispensable pour la
                  télétransmission de votre facture Factur-X.
                </span>
              </div>
            </div>
          ) : (
            /* Scénario d'aiguillage B : SECTEUR PRIVÉ (B2B) */
            <div className="space-y-3 p-4 border border-gray-200 bg-gray-50/50 rounded-2xl">
              <div className="flex gap-2">
                <ShieldCheck
                  size={18}
                  className="text-green-700 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase">
                    Facturation Billie B2B
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">
                    Règlement à 30 jours garanti. Le montant sera versé de façon
                    sécurisée sur le séquestre Stripe Connect des maraîchers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bouton de validation final */}
          <button
            type="submit"
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Orchestration sécurisée...</span>
              </>
            ) : (
              <>
                <span>Valider ma commande</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="flex justify-center items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-wider border-t border-gray-100 pt-3">
          <ShieldCheck size={14} className="text-green-600" />
          <span>Transactions certifiées & RGPD</span>
        </div>
      </div>
    </div>
  );
}
