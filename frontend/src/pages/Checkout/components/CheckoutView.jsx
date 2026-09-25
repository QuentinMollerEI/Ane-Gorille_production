import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCart } from "../../../context/CartContext.jsx";
import { CheckoutOrchestrator } from "../../../services/CheckoutOrchestrator.js";
import { calculateDeliveryWindow, formatFrenchDate, formatDateToYYYYMMDD } from "../../../utils/deliveryCalendar.js";
import StripeCardForm from "./StripeCardForm.jsx";
import {
  CreditCard,
  Building,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle,
  ArrowLeft,
  MessageSquare
} from "lucide-react";

const STRIPE_PUBLIC_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  "pk_test_51U8lI6FwCZFYiUy9OrRt5UfuQCErym9RzhRPhuRMH1SLXUBkzB4Z6pmcyEkybR0CLlsU1pZj4oQYqiBlk1nS5UKN00t4ofu3EJ";

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY.trim());

export default function CheckoutView({ onBackToCart, onCheckoutSuccess }) {
  const { user, profile } = useAuth();
  const { cartItems, grandTotalTTC, clearCart } = useCart();

  const isPublicSector = profile?.role === "acheteur_public" || profile?.buyerRole === "acheteur_public";
  const { availableDates } = calculateDeliveryWindow(new Date());

  const [paymentMethod, setPaymentMethod] = useState(isPublicSector ? "mandat_public" : "stripe_card");
  const [refEngagement, setRefEngagement] = useState("");
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    return availableDates.length > 0 ? formatDateToYYYYMMDD(availableDates) : formatDateToYYYYMMDD(new Date());
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderComplete, setOrderComplete] = useState(null);

  const handleCheckoutSubmit = async (stripeData = null) => {
    setErrorMsg("");

    if (isPublicSector && (!refEngagement || refEngagement.trim() === "")) {
      setErrorMsg("Le numéro d'engagement budgétaire est obligatoire pour les collectivités publiques (Chorus Pro).");
      return;
    }

    setIsSubmitting(true);

    try {
      const buyerProfile = {
        uid: user?.uid,
        displayName: profile?.companyName || user?.displayName || "Acheteur Client",
        companyName: profile?.companyName || "Entreprise Client",
        role: profile?.role || "acheteur_prive",
        siret: profile?.siret || "-",
        address: profile?.address || "Adresse d'exploitation"
      };

      const checkoutOptions = {
        paymentMethod,
        refEngagement,
        deliveryDate: selectedDateStr,
        deliveryInstructions,
        stripeData
      };

      const result = await CheckoutOrchestrator.processCheckout(buyerProfile, cartItems, checkoutOptions);

      if (result.success) {
        clearCart();
        setOrderComplete(result);
        if (onCheckoutSuccess) onCheckoutSuccess(result);
      }
    } catch (err) {
      console.error("Erreur checkout :", err);
      setErrorMsg(err.message || "Une erreur est survenue lors de la validation de la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white border border-slate-200 rounded-3xl shadow-md text-center space-y-6 my-12">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Commande Confirmée !</h2>
        <p className="text-sm text-slate-600">
          Votre commande <strong className="text-slate-900">N° {orderComplete.orderId}</strong> a été transmise aux producteurs.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs uppercase cursor-pointer"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {onBackToCart && (
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-600 hover:text-emerald-700 cursor-pointer uppercase"
        >
          <ArrowLeft size={16} /> Retour au panier
        </button>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" size={24} />
          Validation & Règlement de la Commande B2B / B2G
        </h2>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Building size={16} className="text-emerald-600" />
              Informations Acheteur ({profile?.role || "acheteur_prive"})
            </h3>
            <p className="text-slate-600">
              <strong>Raison Sociale :</strong> {profile?.companyName || "Entreprise Client"} | <strong>SIRET :</strong> {profile?.siret || "-"}
            </p>
          </div>

          {isPublicSector && (
            <div className="space-y-2 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <label className="block text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} />
                Numéro d'Engagement Budgétaire (Chorus Pro) *
              </label>
              <input
                type="text"
                value={refEngagement}
                onChange={(e) => setRefEngagement(e.target.value)}
                placeholder="Ex: ENG-2026-9901"
                required
                className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Calendar size={14} className="text-emerald-600" />
              Sélectionnez la Date de Livraison
            </label>
            <select
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {availableDates.map((dateObj) => {
                const isoStr = formatDateToYYYYMMDD(dateObj);
                return (
                  <option key={isoStr} value={isoStr}>
                    {formatFrenchDate(dateObj)} (Livraison matin)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <MessageSquare size={14} className="text-emerald-600" />
              Consignes / Instructions de Livraison
            </label>
            <textarea
              rows={2}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="Ex: Code quai 4412, créneau strict 9h-11h, température dirigée..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <CreditCard size={14} className="text-emerald-600" />
              Mode de Règlement
            </label>

            {isPublicSector ? (
              <div className="p-4 border-2 border-emerald-600 bg-emerald-50 rounded-2xl text-xs font-bold text-emerald-900">
                Mandat Administratif Public (Facturation Chorus Pro)
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe_card")}
                  className={`p-4 rounded-2xl border-2 text-left text-xs cursor-pointer transition-all ${
                    paymentMethod === "stripe_card"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <p className="font-bold">Carte Bancaire (Stripe Test)</p>
                  <p className="text-[10px] text-slate-500 mt-1">Paiement sécurisé par carte interactive</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("deferred_30_days")}
                  className={`p-4 rounded-2xl border-2 text-left text-xs cursor-pointer transition-all ${
                    paymentMethod === "deferred_30_days"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <p className="font-bold">Virement 30 Jours</p>
                  <p className="text-[10px] text-slate-500 mt-1">Accord LME (Bon de commande différé)</p>
                </button>
              </div>
            )}
          </div>

          {paymentMethod === "stripe_card" && !isPublicSector ? (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                totals={{ grandTotalTTC }}
                isProcessing={isSubmitting}
                onSubmitOrder={handleCheckoutSubmit}
              />
            </Elements>
          ) : (
            <button
              type="button"
              onClick={() => handleCheckoutSubmit(null)}
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
            >
              {isSubmitting ? "Validation..." : `Confirmer le Bon de Commande (${Number(grandTotalTTC || 22.85).toFixed(2)} € TTC)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}