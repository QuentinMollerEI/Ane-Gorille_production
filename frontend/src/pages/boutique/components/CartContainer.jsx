/**
 * 🛒 VUE UNIFIÉE DE CHECKOUT : CheckoutView.jsx
 * Emplacement : frontend/src/pages/Checkout/components/CheckoutView.jsx
 */
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "../../../context/AuthContext";
import { CheckoutOrchestrator } from "../../../services/CheckoutOrchestrator";
import { TaxAndFeeCalculator } from "../../../utils/TaxAndFeeCalculator";
import { calculateDeliveryWindow } from "../../../utils/deliveryCalendar";
import {
  CreditCard,
  Building,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  FileText,
  Truck,
  CheckCircle2,
  Calendar,
  Lock,
} from "lucide-react";

// Initialisation sécurisée de Stripe
const rawStripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = (typeof rawStripeKey === "string" && rawStripeKey.trim().length > 0)
  ? loadStripe(rawStripeKey.trim())
  : null;

/**
 * 🚚 SÉLECTEUR DE LIVRAISON CONFORME AUX RÈGLES MÉTIERS LOGISTIQUES ÂNE & GORILLE
 */
function IntegratedDeliverySelector({ onDeliveryChange }) {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    // Calcul dynamique des 11 jours livrables autorisés selon la date/heure actuelle
    const windowData = calculateDeliveryWindow(new Date());
    const dates = windowData.availableDates || [];
    setAvailableDates(dates);

    if (dates.length > 0) {
      const defaultDateStr = dates[0].toISOString().split("T")[0];
      setSelectedDate(defaultDateStr);
      if (onDeliveryChange) {
        onDeliveryChange({
          selectedDate: defaultDateStr,
          deliveryWindow: "Matin (06h00 - 08h00)",
          instructions: ""
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateSelect = (e) => {
    const val = e.target.value;
    setSelectedDate(val);
    if (onDeliveryChange) {
      onDeliveryChange({
        selectedDate: val,
        deliveryWindow: "Matin (06h00 - 08h00)",
        instructions
      });
    }
  };

  const handleInstructionsChange = (e) => {
    const val = e.target.value;
    setInstructions(val);
    if (onDeliveryChange) {
      onDeliveryChange({
        selectedDate,
        deliveryWindow: "Matin (06h00 - 08h00)",
        instructions: val
      });
    }
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
        <Truck size={16} className="text-emerald-700" />
        <span>Planification Logistique & Tournée de Livraison</span>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar size={13} /> Date de livraison souhaitée *
          </label>
          <select 
            value={selectedDate} 
            onChange={handleDateSelect}
            className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {availableDates.map((d, i) => (
              <option key={i} value={d.toISOString().split("T")[0]}>
                {d.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">Instructions pour le livreur (Optionnel)</label>
          <textarea
            value={instructions}
            onChange={handleInstructionsChange}
            placeholder="Ex: Code portail 1234, livrer au niveau du quai B..."
            className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 resize-none h-20 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 💳 FORMULAIRE STRIPE SÉCURISÉ (Sous-composant)
 */
function StripeCardForm({ cartItems, totals, deliveryDetails, onCheckoutSuccess, buyerProfile, refEngagement }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);

  const { totalProductsHT, vatProductsTotal, deliveryFeeHT, vatDelivery, grandTotalTTC } = totals;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setCardError(null);

    try {
      // 1. Appel de l'orchestrateur (qui devrait générer un PaymentIntent côté serveur puis confirmer ici)
      // Pour l'instant, on simule l'orchestration directe telle que définie dans votre structure :
      const checkoutOptions = {
        paymentMethod: "stripe_card",
        refEngagement: refEngagement || "-",
        deliveryAddress: buyerProfile.address || "Adresse d'exploitation",
        deliveryDetails,
      };

      const result = await CheckoutOrchestrator.processCheckout(buyerProfile, cartItems, checkoutOptions);
      
      if (result.success && onCheckoutSuccess) {
        onCheckoutSuccess(result.orderId);
      }
    } catch (err) {
      setCardError(err.message || "Une erreur est survenue lors du paiement.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Récapitulatif Financier Certifié */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-sans text-slate-700">
        <div className="flex justify-between items-center text-slate-600">
          <span>Sous-total Produits HT :</span>
          <span className="font-mono font-bold">{totalProductsHT?.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>TVA Alimentaire (5.5%) :</span>
          <span className="font-mono font-bold">{vatProductsTotal?.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
          <span>Frais de Port B2B (Dégressifs) :</span>
          <span className="font-mono font-bold text-amber-900">{deliveryFeeHT === 0 ? "Offert" : `${deliveryFeeHT?.toFixed(2)} €`}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>TVA Transport (20.0%) :</span>
          <span className="font-mono font-bold">{vatDelivery?.toFixed(2)} €</span>
        </div>

        <div className="flex justify-between items-center text-slate-900 font-black text-sm pt-2 border-t border-slate-300">
          <span>Montant Total à Régler TTC :</span>
          <span className="font-mono text-emerald-700 text-base">{grandTotalTTC?.toFixed(2)} € TTC</span>
        </div>
      </div>

      {/* Saisie de Carte Sécurisée */}
      <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          <Lock size={13} className="text-emerald-700" />
          Coordonnées de Carte Bancaire (SSL)
        </label>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#0f172a",
                  fontFamily: "sans-serif",
                  "::placeholder": { color: "#94a3b8" },
                },
                invalid: { color: "#dc2626" },
              },
            }}
            onChange={(e) => setCardError(e.error ? e.error.message : null)}
          />
        </div>
      </div>

      {cardError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs">
          ⚠️ {cardError}
        </div>
      )}

      {/* Bouton de Paiement avec le Prix VRAI (Grand Total TTC) */}
      <button
        type="submit"
        disabled={isProcessing || !stripe || cartItems.length === 0}
        className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
      >
        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
        <span>
          {isProcessing
            ? "Traitement sécurisé en cours..."
            : `Payer Maintenant par Carte (${grandTotalTTC?.toFixed(2)} € TTC)`}
        </span>
      </button>
    </form>
  );
}

/**
 * 🛒 VUE PRINCIPALE DE CHECKOUT : CheckoutView
 */
export default function CheckoutView({ cartItems = [], clearCart, onCheckoutSuccess }) {
  const { user, userProfile } = useAuth();
  const profile = userProfile || user || {};

  const isPublicBuyer =
    profile.role === "acheteur_public" ||
    profile.role === "client_public" ||
    profile.buyerProfile === "B2G";

  const [paymentMethod, setPaymentMethod] = useState(isPublicBuyer ? "mandat_public" : "stripe_card");
  const [refEngagement, setRefEngagement] = useState(profile.refEngagement || profile.defaultEngagement || "");
  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: "",
    deliveryWindow: "Matin (06h00 - 08h00)",
    instructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null);

  // Totaux financiers
  const totals = TaxAndFeeCalculator.calculateTotals ? TaxAndFeeCalculator.calculateTotals(cartItems) : { grandTotalTTC: 0 };
  const displayTotalTTC = totals.grandTotalTTC ? totals.grandTotalTTC.toFixed(2) : totals.totalTTC?.toFixed(2) || "0.00";

  const handleDirectCheckout = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setError(null);

    if (!deliveryDetails?.selectedDate) {
      setError("Veuillez sélectionner une date de livraison valide dans le calendrier.");
      return;
    }

    if (paymentMethod === "mandat_public" && (!refEngagement || refEngagement.trim() === "")) {
      setError("Le numéro d'engagement budgétaire est obligatoire pour Chorus Pro (B2G).");
      return;
    }

    setLoading(true);
    try {
      const checkoutOptions = {
        paymentMethod,
        refEngagement: refEngagement || "-",
        deliveryAddress: profile.address || "Adresse d'exploitation",
        deliveryDetails,
      };

      const result = await CheckoutOrchestrator.processCheckout(profile, cartItems, checkoutOptions);

      if (result.success) {
        setSuccessOrderId(result.orderId);
        if (clearCart) clearCart();
        if (onCheckoutSuccess) onCheckoutSuccess(result.orderId);
      }
    } catch (err) {
      console.error("[CheckoutView] Erreur checkout :", err);
      setError(err.message || "Erreur lors de la validation de votre commande.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDU SUCCÈS ---
  if (successOrderId) {
    return (
      <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 animate-fade-in">
        <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
        <h2 className="text-xl font-black text-emerald-950">Commande Validée avec Succès !</h2>
        <p className="text-xs text-emerald-800 font-medium">
          Référence : <strong>#{successOrderId}</strong> — Montant : <strong>{displayTotalTTC} € TTC</strong>
        </p>
        <p className="text-xs text-emerald-700">
          Livraison prévue le <strong>{deliveryDetails.selectedDate}</strong>.
        </p>
      </div>
    );
  }

  // --- RENDU PRINCIPAL ---
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-xs text-slate-800">
      <h2 className="text-base font-black text-slate-900 border-b border-slate-150 pb-3 flex items-center justify-between">
        <span>Validation & Règlement Logistique</span>
        <span className="font-mono text-emerald-700 text-sm font-black">{displayTotalTTC} € TTC</span>
      </h2>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Sélecteur de livraison logistique conforme */}
      <IntegratedDeliverySelector onDeliveryChange={(details) => setDeliveryDetails(details)} />

      {/* 2. Mode de paiement */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
          Mode de Règlement ({displayTotalTTC} € TTC)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isPublicBuyer && (
            <label
              onClick={() => setPaymentMethod("stripe_card")}
              className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-1 ${
                paymentMethod === "stripe_card"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs font-bold"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <CreditCard size={15} className="text-emerald-700" /> Carte Bancaire
                </span>
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={paymentMethod === "stripe_card"}
                  onChange={() => setPaymentMethod("stripe_card")}
                  className="text-emerald-600"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-normal">
                Règlement sécurisé immédiat ({displayTotalTTC} € TTC)
              </p>
            </label>
          )}

          {!isPublicBuyer && (
            <label
              onClick={() => setPaymentMethod("virement_b2b")}
              className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-1 ${
                paymentMethod === "virement_b2b"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs font-bold"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Building size={15} className="text-blue-700" /> Virement B2B (30j)
                </span>
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={paymentMethod === "virement_b2b"}
                  onChange={() => setPaymentMethod("virement_b2b")}
                  className="text-emerald-600"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-normal">
                Facture acquittable sous 30 jours (LME)
              </p>
            </label>
          )}

          {(isPublicBuyer || paymentMethod === "mandat_public") && (
            <label
              onClick={() => setPaymentMethod("mandat_public")}
              className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-1 sm:col-span-2 ${
                paymentMethod === "mandat_public"
                  ? "border-blue-600 bg-blue-50 text-blue-950 shadow-xs font-bold"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <FileText size={15} className="text-blue-700" /> Mandat Chorus Pro (B2G)
                </span>
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={paymentMethod === "mandat_public"}
                  onChange={() => setPaymentMethod("mandat_public")}
                  className="text-blue-600"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-normal">
                Télétransmission automatique via Chorus Pro
              </p>
            </label>
          )}
        </div>

        {/* Champs spécifiques Chorus Pro */}
        {(isPublicBuyer || paymentMethod === "mandat_public") && (
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
            <span className="font-bold text-blue-900 text-[11px] uppercase tracking-wider block">
              Identifiants Requis Chorus Pro (B2G)
            </span>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 text-[10px]">N° Engagement Budgétaire *</label>
              <input
                type="text"
                maxLength={30}
                value={refEngagement}
                onChange={(e) => setRefEngagement(e.target.value)}
                placeholder="Ex: ENG-2026-908"
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* 3. Zone d'exécution du paiement */}
        <div className="pt-4 border-t border-slate-150">
          {paymentMethod === "stripe_card" ? (
            <Elements stripe={stripePromise}>
              <StripeCardForm 
                cartItems={cartItems} 
                totals={totals}
                deliveryDetails={deliveryDetails}
                buyerProfile={profile}
                refEngagement={refEngagement}
                onCheckoutSuccess={(orderId) => {
                  setSuccessOrderId(orderId);
                  if (clearCart) clearCart();
                  if (onCheckoutSuccess) onCheckoutSuccess(orderId);
                }} 
              />
            </Elements>
          ) : (
            <button
              onClick={handleDirectCheckout}
              disabled={loading || cartItems.length === 0}
              className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>
                {paymentMethod === "mandat_public" 
                  ? "Valider le Mandat Public (30j)" 
                  : "Confirmer la commande (Virement B2B)"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}