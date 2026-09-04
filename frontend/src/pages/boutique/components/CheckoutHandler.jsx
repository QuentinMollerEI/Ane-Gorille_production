import React, { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  Landmark,
  Calendar,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";

/**
 * 💼 COMPOSANT : CheckoutHandler.jsx (v9 - Unifié B2C / B2B / B2G) - Version Propre
 * Gère de façon fluide et instantanée le tunnel de commande des professionnels (Billie)
 * et des établissements publics (Mandat administratif / Chorus Pro).
 *
 * CORRECTIF : Vise le nettoyage complet et redondant du panier lors d'une commande réussie.
 * CHEMIN D'IMPORTATION : Conforme à src/pages/boutique/components/CheckoutHandler.jsx (3 niveaux)
 */
export default function CheckoutHandler({
  cartItems,
  totals,
  buyerProfile, // 'B2C', 'B2B' ou 'B2G'
  siret,
  engagementNumber,
  onBackToCart,
  onOrderSuccess,
}) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // 🧹 NETTOYAGE MASTER WILDCARD MULTI-COUCHES
  const clearCartRedundantly = () => {
    try {
      // 1. Mutation en-place de l'array
      if (Array.isArray(cartItems)) {
        cartItems.splice(0, cartItems.length);
      }

      // 2. Nettoyage physique du LocalStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("ane_et_gorille_cart")) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => {
          try {
            window.localStorage.constructor.prototype.removeItem.call(
              localStorage,
              key,
            );
          } catch (err) {
            localStorage.removeItem(key);
          }
        });

        localStorage.removeItem("ane_et_gorille_cart");
        localStorage.removeItem("ane_et_gorille_cart_anonymous");
        if (user?.uid) {
          localStorage.removeItem(`ane_et_gorille_cart_${user.uid}`);
        }
      }
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.error("Erreur technique de nettoyage du panier :", e);
    }
  };

  // 💳 1. Simulation d'un paiement Stripe (B2C)
  const handleStripePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockStripeResult = {
        stripePaymentIntentId: `pi_test_${Math.random().toString(36).substr(2, 9)}`,
      };

      const checkoutData = {
        buyerProfile: "B2C",
        deliveryAddress: "12 Rue des Maraîchers, 44000 Nantes",
        billingName: user?.displayName || "Quentin Moller",
        billingEmail: user?.email || "quentin.moller@ane-et-gorille.fr",
      };

      const result = await OrderDocumentGenerator.generateOrderDocuments(
        cartItems,
        user,
        checkoutData,
        "stripe",
        mockStripeResult,
      );

      clearCartRedundantly();
      onOrderSuccess(result);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Le paiement par carte bancaire a échoué. Veuillez réessayer.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 🏢 2. Traitement d'un paiement à 30 jours validé par Billie (B2B)
  const handleBilliePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockBillieResult = {
        billieInvoiceReference: `inv_billie_${Math.random().toString(36).substr(2, 9)}`,
      };

      const checkoutData = {
        buyerProfile: "B2B",
        siretBuyer: siret,
        deliveryAddress: "Épicerie de la Gare, 44000 Nantes",
        billingName: user?.displayName || "Quentin Moller EI",
        billingEmail: user?.email || "quentin.moller@ane-et-gorille.fr",
      };

      const result = await OrderDocumentGenerator.generateOrderDocuments(
        cartItems,
        user,
        checkoutData,
        "billie",
        mockBillieResult,
      );

      clearCartRedundantly();
      onOrderSuccess(result);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "La demande de paiement différé Billie a été refusée ou a expiré.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 🏛️ 3. Traitement du Mandat Administratif (B2G - Chorus Pro)
  const handlePublicSectorOrder = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    if (!engagementNumber || engagementNumber.trim() === "") {
      setErrorMessage(
        "Le numéro d'engagement budgétaire est obligatoire pour valider une commande publique Chorus Pro.",
      );
      setIsProcessing(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const checkoutData = {
        buyerProfile: "B2G",
        engagementNumber: engagementNumber,
        siretBuyer: siret || "12000000000001",
        deliveryAddress: "Cantine Municipale Scolaire, 44000 Nantes",
        billingName: "Mairie de Nantes - Service Restauration Scolaire",
        billingEmail: "comptabilite@nantes.fr",
      };

      const result = await OrderDocumentGenerator.generateOrderDocuments(
        cartItems,
        user,
        checkoutData,
        "mandat_public",
      );

      clearCartRedundantly();
      onOrderSuccess(result);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Une erreur est survenue lors de l'enregistrement de votre engagement Chorus Pro.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-250 rounded-2xl shadow-sm p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 border-b border-gray-150 pb-4">
        <button
          onClick={onBackToCart}
          className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1.5 hover:bg-gray-50 rounded-lg"
          title="Retourner au panier"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-md font-extrabold text-gray-900">
            Finalisation de la commande
          </h2>
          <p className="text-[10px] text-gray-400">
            Tunnel de paiement sécurisé localisé (France)
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs flex gap-2 items-start animate-shake">
          <AlertCircle
            className="text-red-700 flex-shrink-0 mt-0.5"
            size={14}
          />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl flex justify-between items-center text-xs">
        <div>
          <span className="font-bold text-gray-500">
            Montant total de la commande :
          </span>
          <p className="text-[10px] text-gray-400">
            TVA comprise et ventilée par producteur
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-green-700">
            {totals.totalTTC.toFixed(2)} €
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {buyerProfile === "B2C" && (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={12} /> Formulaire sécurisé Stripe Connect
              </span>

              <div className="space-y-2.5">
                <div className="bg-white border border-gray-300 rounded-lg p-2.5 flex items-center justify-between text-xs text-gray-600">
                  <span className="font-mono">4242 4242 4242 4242</span>
                  <span className="font-bold text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    VISA TEST
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-400 font-mono">
                    12 / 28
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-400 font-mono">
                    ***
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStripePayment}
              disabled={isProcessing}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isProcessing
                ? "Traitement de la transaction..."
                : "Procéder au paiement de test"}
              <Lock size={14} />
            </button>
          </div>
        )}

        {buyerProfile === "B2B" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5 text-xs text-amber-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <Calendar size={14} /> Paiement à 30 jours sécurisé par Billie
              </p>
              <p className="font-medium leading-relaxed">
                En validant cette commande, Billie va garantir le paiement
                immédiat pour les {totals.producers?.length || 1} maraîchers.
                Votre facture de <strong>{totals.totalTTC.toFixed(2)} €</strong>{" "}
                sera à régler sous 30 jours conformément à la loi LME, après
                service fait.
              </p>
              <div className="text-[10px] font-semibold text-amber-700 bg-white border border-amber-150 p-2.5 rounded-lg font-mono">
                SIRET Éligible : {siret}
              </div>
            </div>

            <button
              onClick={handleBilliePayment}
              disabled={isProcessing}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isProcessing
                ? "Validation Billie en cours..."
                : "Confirmer la commande différée (Prête à récolter)"}
              <ShieldCheck size={14} />
            </button>
          </div>
        )}

        {buyerProfile === "B2G" && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2.5 text-xs text-purple-950 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-purple-800">
                <Landmark size={14} /> Facturation Administrative (Chorus Pro)
              </p>
              <p className="font-medium leading-relaxed">
                Aucun paiement requis aujourd'hui. Nous transmettrons la facture
                dématérialisée au format
                <strong> Factur-X</strong> sur la plateforme Chorus Pro dès que
                la livraison aura été effectuée.
              </p>
              <div className="space-y-1.5 font-medium">
                <span className="text-[10px] text-purple-700 uppercase font-bold">
                  Justificatifs administratifs :
                </span>
                <ul className="list-disc pl-4 space-y-1 text-purple-900 text-[10px]">
                  <li>
                    N° Engagement Budgétaire :{" "}
                    <strong className="font-mono">{engagementNumber}</strong>
                  </li>
                  <li>
                    SIRET Public Émetteur :{" "}
                    <strong className="font-mono">
                      {siret || "12000000000001"}
                    </strong>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={handlePublicSectorOrder}
              disabled={isProcessing}
              className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isProcessing
                ? "Enregistrement de l'engagement..."
                : "Valider l'engagement Chorus Pro (Prête à récolter)"}
              <CheckCircle2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="text-center border-t border-gray-100 pt-4">
        <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
          Toutes nos transactions respectent les obligations de la Loi LME, de
          l'ACPR et de la réglementation EGAlim sur la traçabilité des circuits
          courts.
        </p>
      </div>
    </div>
  );
}
