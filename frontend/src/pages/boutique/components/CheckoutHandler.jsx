import React, { useState } from "react";
import {
  ShieldCheck,
  Landmark,
  Calendar,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";

/**
 * 💼 COMPOSANT : CheckoutHandler.jsx (v2 - Spécialisé B2B / B2G)
 * Gère de façon fluide et instantanée le tunnel de commande des professionnels (Billie)
 * et des établissements publics (Mandat administratif / Chorus Pro).
 *
 * NOTE : Comme convenu, ce flux court-circuite l'attente de paiement (Stripe) :
 * les commandes et sous-commandes de préparation maraîchères sont créées IMMÉDIATEMENT
 * pour que la récolte démarre sans attendre, le paiement se faisant après livraison (service fait).
 */
export default function CheckoutHandler({
  cartItems,
  totals,
  buyerProfile, // 'B2B' ou 'B2G'
  siret,
  engagementNumber,
  onBackToCart,
  onOrderSuccess,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // 🏢 1. Traitement d'un paiement à 30 jours validé par Billie (B2B)
  const handleBilliePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Simulation de la validation du score de crédit de l'entreprise via Billie
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockBillieResult = {
        billieInvoiceReference: `inv_billie_${Math.random().toString(36).substr(2, 9)}`,
      };

      const checkoutData = {
        buyerProfile: "B2B",
        siretBuyer: siret,
        deliveryAddress: "Épicerie de la Gare, 44000 Nantes",
        billingName: "Quentin Moller EI",
        billingEmail: "quentin.moller@ane-et-gorille.fr",
      };

      // Création instantanée de la commande et des bons de préparation ("A_PREPARER") dans Firestore
      const result = await OrderDocumentGenerator.generateOrderDocuments(
        cartItems,
        null,
        checkoutData,
        "billie",
        mockBillieResult,
      );

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

  // 🏛️ 2. Traitement du Mandat Administratif (B2G - Chorus Pro)
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
      // Simulation d'enregistrement de l'engagement budgétaire public
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const checkoutData = {
        buyerProfile: "B2G",
        engagementNumber: engagementNumber,
        siretBuyer: siret || "12000000000001", // SIRET d'un établissement public par défaut si vide
        deliveryAddress: "Cantine Municipale Scolaire, 44000 Nantes",
        billingName: "Mairie de Nantes - Service Restauration Scolaire",
        billingEmail: "comptabilite@nantes.fr",
      };

      // Création instantanée de la commande et des bons de préparation ("A_PREPARER") dans Firestore
      const result = await OrderDocumentGenerator.generateOrderDocuments(
        cartItems,
        null,
        checkoutData,
        "mandat_public",
      );

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
    <div className="bg-white border border-gray-250 rounded-2xl shadow-sm p-6 max-w-xl mx-auto space-y-6">
      {/* En-tête du module */}
      <div className="flex items-center gap-2 border-b border-gray-150 pb-4">
        <button
          onClick={onBackToCart}
          className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-md font-extrabold text-gray-900">
            Finalisation de la commande (B2B / B2G)
          </h2>
          <p className="text-[10px] text-gray-400">
            Tunnel de validation d'achat professionnel et public
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs flex gap-2 items-start">
          <AlertCircle
            className="text-red-700 flex-shrink-0 mt-0.5"
            size={14}
          />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Détail financier */}
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

      {/* Aiguillage visuel selon le profil professionnel ou public */}
      <div className="space-y-4">
        {/* 🏢 PROFILE B2B (Entreprises & Restaurants) */}
        {buyerProfile === "B2B" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5 text-xs text-amber-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <Calendar size={14} /> Paiement à 30 jours sécurisé par Billie
              </p>
              <p className="font-medium">
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
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200 text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing
                ? "Validation Billie en cours..."
                : "Confirmer la commande différée (Prête à récolter)"}
              <ShieldCheck size={12} />
            </button>
          </div>
        )}

        {/* 🏛️ PROFILE B2G (Écoles, Communes & Établissements Publics) */}
        {buyerProfile === "B2G" && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2.5 text-xs text-purple-950 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-purple-800">
                <Landmark size={14} /> Facturation Administrative (Chorus Pro)
              </p>
              <p className="font-medium">
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
              className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-200 text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing
                ? "Enregistrement de l'engagement..."
                : "Valider l'engagement Chorus Pro (Prête à récolter)"}
              <CheckCircle2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="text-center border-t border-gray-100 pt-4">
        <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
          Toutes nos transactions professionnelles respectent les obligations de
          la Loi LME, de l'ACPR et de la réglementation EGAlim sur la
          traçabilité des circuits courts.
        </p>
      </div>
    </div>
  );
}
