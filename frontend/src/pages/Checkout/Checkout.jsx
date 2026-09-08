import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckoutService } from "../../services/checkoutService";
import {
  CreditCard,
  Building,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/**
 * 🛒 COMPOSANT : Checkout.jsx (v3 - Orchestration Server-Side & Chorus Pro Public)
 *
 * Responsabilité unique (SRP) : Collecter les informations de facturation,
 * valider les exigences juridiques (SIRET, Chorus Pro) selon le mode de paiement,
 * et appeler le service de checkout unifié connecté aux Cloud Functions.
 */
export default function Checkout() {
  const { user } = useAuth();

  // Simulation de panier local (à remplacer par votre hook useCart() réel)
  const [cartItems, setCartItems] = useState([
    {
      id: "PROD-001",
      name: "Tomates Coeur de Boeuf Bio",
      price: 4.5,
      quantity: 10,
      producerId: "USR-PROD-01",
      producerName: "Ferme de la Rosée",
      vatRate: 5.5,
    },
    {
      id: "PROD-002",
      name: "Carottes Sables de Landes",
      price: 2.8,
      quantity: 15,
      producerId: "USR-PROD-01",
      producerName: "Ferme de la Rosée",
      vatRate: 5.5,
    },
    {
      id: "PROD-003",
      name: "Fraises Gariguette Pleine Terre",
      price: 6.9,
      quantity: 5,
      producerId: "USR-PROD-02",
      producerName: "Le Jardin d'Émile",
      vatRate: 5.5,
    },
  ]);

  const [paymentMethod, setPaymentMethod] = useState("mandat"); // 'stripe' | 'mandat'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null);

  // Formulaire d'identification comptable
  const [billingInfo, setBillingInfo] = useState({
    siret: user?.siret || "",
    codeService: user?.codeService || "",
    refEngagement: user?.refEngagement || "",
    billingContact: user?.email || "",
  });

  // Calcul du montant total du panier (TTC)
  const totalCartAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Validation sémantique du formulaire selon le cadre légal
  const validateForm = () => {
    if (paymentMethod === "mandat") {
      // 1. Validation réglementaire du SIRET (14 chiffres)
      const cleanSiret = billingInfo.siret.replace(/\s/g, "");
      if (!/^\d{14}$/.test(cleanSiret)) {
        throw new Error(
          "Réglementation Chorus Pro : Le numéro de SIRET de l'établissement public doit comporter exactement 14 chiffres.",
        );
      }

      // 2. Numéro d'engagement public / Bon de commande interne (Requis pour facturation publique)
      if (!billingInfo.refEngagement.trim()) {
        throw new Error(
          "Loi LME & Chorus Pro : Le numéro d'engagement (Bon de commande public) est obligatoire pour valider un règlement par mandat administratif.",
        );
      }
    }

    if (!billingInfo.billingContact.trim()) {
      throw new Error(
        "Veuillez renseigner un e-mail de contact pour l'envoi des pièces comptables.",
      );
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Étape A : Validation sémantique locale des obligations juridiques
      validateForm();

      // Étape B : Structuration du payload acheteur
      const buyerInfo = {
        uid: user?.uid || "TEST_BUYER_ID_LOCAL",
        name: user?.displayName || user?.name || "Établissement Public de Test",
        role:
          user?.role ||
          (paymentMethod === "mandat" ? "client_public" : "client_prive"),
        siret:
          paymentMethod === "mandat"
            ? billingInfo.siret.replace(/\s/g, "")
            : "-",
        codeService:
          paymentMethod === "mandat" && billingInfo.codeService
            ? billingInfo.codeService.trim()
            : "-",
        refEngagement:
          paymentMethod === "mandat" ? billingInfo.refEngagement.trim() : "-",
        billingContact: billingInfo.billingContact.trim(),
      };

      // Étape C : Appel de la Cloud Function via le CheckoutService unifié
      const orderId = await CheckoutService.validateAndCreateOrder(
        buyerInfo,
        cartItems,
        paymentMethod,
      );

      // Succès : Passage à la vue de confirmation
      setSuccessOrderId(orderId);
    } catch (err) {
      console.error("Échec de la validation de commande :", err);
      setError(
        err.message ||
          "Une erreur inconnue s'est produite lors de la validation.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- VUE SUCCESS : Commande Validée & Pièces Comptables Émises ---
  if (successOrderId) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white border border-gray-200 rounded-3xl shadow-sm text-center space-y-6 animate-fade-in my-10">
        <div className="inline-flex p-4 bg-emerald-50 text-emerald-700 rounded-full">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Commande Validée avec Succès !
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Votre commande a été traitée de manière sécurisée côté serveur. Vos
            stocks maraîchers ont été réservés et les documents de facturation
            ont été émis.
          </p>
        </div>

        {/* Détails Commande */}
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 text-left space-y-3">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Référence Commande
            </span>
            <span className="text-sm font-black text-emerald-800">
              {successOrderId}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Règlement choisi
            </span>
            <span className="text-xs font-bold text-gray-700 uppercase">
              {paymentMethod === "mandat"
                ? "Mandat Administratif (30j)"
                : "Stripe B2B"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Montant total engagé
            </span>
            <span className="text-base font-black text-gray-900">
              {totalCartAmount.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Actions de redirection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <a
            href="/pieces-comptables"
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <FileText size={16} /> Consulter mes pièces comptables
          </a>
          <a
            href="/boutique"
            className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Retourner à l'accueil <ArrowRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* En-tête principal */}
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <ShoppingBag size={28} />
          </span>
          Validation de votre Commande
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Finalisez vos achats en direct des maraîchers locaux de notre
          coopérative.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleCheckoutSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* COLONNE GAUCHE/CENTRE : Options de facturation et de paiement */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. SELECTION DU MODE DE PAIEMENT */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              1. Choix du mode de règlement
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option Mandat Administratif (B2G public) */}
              <label
                className={`flex items-start gap-3.5 p-4 border rounded-xl cursor-pointer transition ${
                  paymentMethod === "mandat"
                    ? "border-emerald-600 bg-emerald-50/10 shadow-sm"
                    : "border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "mandat"}
                  onChange={() => setPaymentMethod("mandat")}
                  className="mt-1 text-emerald-600 focus:ring-green-500 border-gray-300"
                />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Building size={16} className="text-gray-500" /> Mandat
                    Administratif (30j)
                  </span>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Réservé aux collectivités territoriales, cantines scolaires
                    et hôpitaux. Dématérialisation Chorus Pro obligatoire.
                  </p>
                </div>
              </label>

              {/* Option Carte Bancaire (Stripe B2B) */}
              <label
                className={`flex items-start gap-3.5 p-4 border rounded-xl cursor-pointer transition ${
                  paymentMethod === "stripe"
                    ? "border-emerald-600 bg-emerald-50/10 shadow-sm"
                    : "border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                  className="mt-1 text-emerald-600 focus:ring-green-500 border-gray-300"
                />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <CreditCard size={16} className="text-gray-500" /> Carte
                    Bancaire (Stripe B2B)
                  </span>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Débit immédiat après validation. Idéal pour les restaurants
                    privés, comités d'entreprise et associations.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 2. FORMULAIRE D'IDENTIFICATION COMPTABLE & CHORUS PRO */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              2. Informations obligatoires de facturation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* E-mail de contact facturation */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  E-mail Référent Comptabilité *
                </label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="exemple: compta@mairie-votreville.fr"
                  value={billingInfo.billingContact}
                  onChange={(e) =>
                    setBillingInfo({
                      ...billingInfo,
                      billingContact: e.target.value,
                    })
                  }
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Adresse e-mail à laquelle sera envoyée la notification de
                  dépôt et vos fiches de livraison.
                </p>
              </div>

              {/* SIRET (Conditionnel B2G Public) */}
              {paymentMethod === "mandat" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Numéro de SIRET Établissement *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 font-mono"
                      placeholder="14 chiffres requis"
                      value={billingInfo.siret}
                      onChange={(e) =>
                        setBillingInfo({
                          ...billingInfo,
                          siret: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Identification DGFIP requise pour valider le virement du
                      Trésor Public.
                    </p>
                  </div>

                  {/* Code de service */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Code Service Chorus Pro (Optionnel)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      placeholder="ex: CANTINE-CENTRALE"
                      value={billingInfo.codeService}
                      onChange={(e) =>
                        setBillingInfo({
                          ...billingInfo,
                          codeService: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Utile pour orienter automatiquement la facture vers le bon
                      service interne.
                    </p>
                  </div>

                  {/* N° Engagement Public */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Numéro d'Engagement / Bon de commande interne *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      placeholder="ex: BC-2026-908"
                      value={billingInfo.refEngagement}
                      onChange={(e) =>
                        setBillingInfo({
                          ...billingInfo,
                          refEngagement: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Mention légale obligatoire pour le rapprochement et le
                      paiement de la facture par la comptabilité publique.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Récapitulatif du Panier & Lancement de l'action */}
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-250 rounded-2xl p-6 shadow-sm sticky top-6 space-y-6">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={18} className="text-emerald-700" />
              Récapitulatif de votre Panier
            </h2>

            {/* Articles */}
            <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="py-3.5 flex justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-400">
                      Maraîcher : {item.producerName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 font-semibold text-gray-950">
                    <p>{(item.price * item.quantity).toFixed(2)} €</p>
                    <p className="text-[10px] text-gray-400">
                      Qté : {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="border-t border-gray-200 pt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>Régime TVA moyen</span>
                <span>5.5 %</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-gray-900 border-t border-dashed border-gray-200 pt-3">
                <span>Total TTC à engager</span>
                <span className="text-lg">{totalCartAmount.toFixed(2)} €</span>
              </div>
            </div>

            {/* Certification de confiance et bouton de validation */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-2 text-[10px] text-emerald-800 bg-emerald-50/50 border border-emerald-150 p-3 rounded-xl leading-relaxed">
                <ShieldCheck
                  size={16}
                  className="text-emerald-700 flex-shrink-0 mt-0.5"
                />
                <span>
                  <strong>Certifié sécurisé</strong> : L'ajustement de vos
                  stocks maraîchers et la génération fiscale de vos pièces
                  justificatives s'opèrent de manière transactionnelle côté
                  serveur.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    {paymentMethod === "mandat"
                      ? "Engager le Mandat Public (30j)"
                      : "Payer par Stripe B2B"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
