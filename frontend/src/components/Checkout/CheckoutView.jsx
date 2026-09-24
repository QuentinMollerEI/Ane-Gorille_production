import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "../../context/AuthContext";
import { CheckoutOrchestrator } from "../../services/CheckoutOrchestrator";
import { TaxAndFeeCalculator } from "../../utils/TaxAndFeeCalculator";
import { calculateDeliveryWindow } from "../../utils/deliveryCalendar";
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
  Info
} from "lucide-react";

// Initialisation sécurisée de Stripe (Évite l'erreur 'IntegrationError: You used an empty string')
const rawStripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = (typeof rawStripeKey === "string" && rawStripeKey.trim().length > 0)
  ? loadStripe(rawStripeKey.trim())
  : null;

/**
 * 🚚 SÉLECTEUR DE LIVRAISON CONFORME AUX RÈGLES MÉTIERS LOGISTIQUES ÂNE & GORILLE
 * 1. Jours fermés (Aucune collecte ni livraison) : Jeudi (4), Samedi (6), Dimanche (0)
 * 2. Jours ouverts : Lundi (1), Mardi (2), Mercredi (3), Vendredi (5)
 * 3. Cut-off à 12h00 pour la préparation maraîchère (Avant 12h: J+1, Après 12h: J+2)
 * 4. Plage d'ouverture : 11 jours livrables autorisés à compter de la commande
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
  }, []);

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
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
        <Truck size={16} className="text-emerald-700" />
        <span>Planification Logistique & Tournée de Livraison</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
            <Calendar size={12} className="text-emerald-600" /> Date de Livraison Souhaitée (11 Jours Livrables) *
          </label>
          <select
            value={selectedDate}
            onChange={handleDateSelect}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="" disabled>-- Choisissez une date de livraison valide --</option>
            {availableDates.map((dateObj, idx) => {
              const dateStr = dateObj.toISOString().split("T")[0];
              const formattedLabel = dateObj.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              });
              const capitalizedLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);
              return (
                <option key={idx} value={dateStr}>
                  {capitalizedLabel}
                </option>
              );
            })}
          </select>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            * Seuls les jours ouverts (Lundi, Mardi, Mercredi, Vendredi) sont proposés (Hors Jeudi, Samedi, Dimanche & selon Cut-off 12h00).
          </p>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
            <Info size={12} className="text-emerald-600" /> Consignes pour le chauffeur (Code d'accès, quai, etc.)
          </label>
          <input
            type="text"
            maxLength={150}
            value={instructions}
            onChange={handleInstructionsChange}
            placeholder="Ex: Entrée quai de déchargement au fond de la cour"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 💳 FORMULAIRE CARTE STRIPE DÉDIÉ
 */
function CardFormInner({ isProcessing, onSubmitOrder, totals, cartItems }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);

  const displayTotalTTC = totals.grandTotalTTC ? totals.grandTotalTTC.toFixed(2) : "0.00";
  const displayProductsHT = totals.itemsTotalHT ? totals.itemsTotalHT.toFixed(2) : "0.00";
  const displayProductsVAT = totals.itemsVAT ? totals.itemsVAT.toFixed(2) : "0.00";
  const displayShippingHT = totals.shippingFeeHT === 0 ? "0.00 (FRANCO)" : (totals.shippingFeeHT ? totals.shippingFeeHT.toFixed(2) + " €" : "15.00 €");
  const displayShippingVAT = totals.shippingVAT ? totals.shippingVAT.toFixed(2) : "3.00";

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setCardError(null);

    if (!stripe || !elements) {
      setCardError("Le module de paiement Stripe est en cours d'initialisation.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError("Veuillez renseigner les coordonnées de votre carte bancaire.");
      return;
    }

    if (onSubmitOrder) {
      onSubmitOrder({ stripe, elements, cardElement });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Récapitulatif Financier Certifié */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-sans text-slate-700">
        <div className="flex justify-between items-center text-slate-600">
          <span>Sous-total Produits HT :</span>
          <span className="font-mono font-bold">{displayProductsHT} €</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>TVA Alimentaire (5.5%) :</span>
          <span className="font-mono font-bold">{displayProductsVAT} €</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
          <span>Frais de Port B2B (Dégressifs) :</span>
          <span className="font-mono font-bold text-amber-900">{displayShippingHT}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>TVA Transport (20.0%) :</span>
          <span className="font-mono font-bold">{displayShippingVAT} €</span>
        </div>

        <div className="flex justify-between items-center text-slate-900 font-black text-sm pt-2 border-t border-slate-300">
          <span>Montant Total à Régler TTC :</span>
          <span className="font-mono text-emerald-700 text-base">{displayTotalTTC} € TTC</span>
        </div>
      </div>

      {/* Saisie de Carte Sécurisée */}
      <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          <Lock size={13} className="text-emerald-700" />
          Coordonnées de Carte Bancaire (Paiement Sécurisé SSL)
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
        {isProcessing ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <ShieldCheck size={16} />
        )}
        <span>
          {isProcessing
            ? "Traitement sécurisé en cours..."
            : `Payer Maintenant par Carte (${displayTotalTTC} € TTC)`}
        </span>
      </button>
    </form>
  );
}

/**
 * 🛒 VUE UNIFIÉE DE CHECKOUT : CheckoutView.jsx
 */
export default function CheckoutView({ cartItems = [], clearCart, onCheckoutSuccess }) {
  const { user, userProfile } = useAuth();
  const profile = userProfile || user || {};

  const isPublicBuyer =
    profile.role === "acheteur_public" ||
    profile.role === "client_public" ||
    profile.buyerProfile === "B2G";

  const [paymentMethod, setPaymentMethod] = useState(
    isPublicBuyer ? "mandat_public" : "stripe_card"
  );

  const [refEngagement, setRefEngagement] = useState(
    profile.refEngagement || profile.defaultEngagement || ""
  );

  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: "",
    deliveryWindow: "Matin (06h00 - 08h00)",
    instructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null);

  // Totaux financiers
  const totals = TaxAndFeeCalculator.computeOrderTotals(cartItems);
  const grandTotalTTC = totals.grandTotalTTC ? totals.grandTotalTTC.toFixed(2) : "0.00";

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

  if (successOrderId) {
    return (
      <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 animate-fade-in">
        <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
        <h2 className="text-xl font-black text-emerald-950">Commande Validée avec Succès !</h2>
        <p className="text-xs text-emerald-800 font-medium">
          Référence : <strong>#{successOrderId}</strong> — Montant : <strong>{grandTotalTTC} € TTC</strong>
        </p>
        <p className="text-xs text-emerald-700">
          Livraison prévue le <strong>{deliveryDetails.selectedDate}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-xs text-slate-800">
      <h2 className="text-base font-black text-slate-900 border-b border-slate-150 pb-3 flex items-center justify-between">
        <span>Validation & Règlement Logistique</span>
        <span className="font-mono text-emerald-700 text-sm font-black">{grandTotalTTC} € TTC</span>
      </h2>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Sélecteur de livraison logistique conforme */}
      <IntegratedDeliverySelector
        onDeliveryChange={(details) => setDeliveryDetails(details)}
      />

      {/* 2. Mode de paiement */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
          Mode de Règlement Réglé ({grandTotalTTC} € TTC)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isPublicBuyer && (
            <label
              onClick={() => setPaymentMethod("stripe_card")}
              className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-1 ${
                paymentMethod === "stripe_card"
                  ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs font-bold"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
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
                Règlement sécurisé immédiat ({grandTotalTTC} € TTC)
              </p>
            </label>
          )}

          {!isPublicBuyer && (
            <label
              onClick={() => setPaymentMethod("virement_b2b")}
              className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-1 ${
                paymentMethod === "virement_b2b"
                  ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs font-bold"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
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
              className="p-3.5 border border-blue-600 bg-blue-50/50 rounded-xl cursor-pointer sm:col-span-2 space-y-1 font-bold"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5 text-blue-950">
                  <FileText size={15} className="text-blue-700" /> Mandat Administratif Chorus Pro (B2G)
                </span>
                <input type="radio" checked readOnly className="text-blue-600" />
              </div>
              <p className="text-[10px] text-blue-800 font-normal">
                Télétransmission automatique sur le portail Chorus Pro de l'État
              </p>
            </label>
          )}
        </div>
      </div>

      {/* 3. Engagement Chorus Pro B2G */}
      {(isPublicBuyer || paymentMethod === "mandat_public") && (
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
          <label className="block text-[11px] font-bold text-blue-950 uppercase tracking-wider">
            N° d'Engagement Budgétaire (Obligatoire Chorus Pro) *
          </label>
          <input
            type="text"
            value={refEngagement}
            onChange={(e) => setRefEngagement(e.target.value)}
            placeholder="Ex: ENG-2026-908"
            className="w-full p-2.5 border border-blue-300 rounded-lg bg-white font-mono text-xs font-bold"
          />
        </div>
      )}

      {/* 4. Formulaire Carte Bancaire ou Bouton Direct */}
      {paymentMethod === "stripe_card" ? (
        !stripePromise ? (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
              <AlertTriangle className="text-amber-600 shrink-0" size={16} />
              <span>Clé Publique Stripe Manquante</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Le module de paiement Stripe nécessite une clé d'API publique valide.
            </p>
            <div className="p-2.5 bg-white/80 border border-amber-200 rounded-xl font-mono text-[10px] text-amber-900 space-y-1">
              <p>📍 <strong>Fichier :</strong> <code>frontend/.env</code></p>
              <p>🔑 <strong>Variable :</strong> <code>VITE_STRIPE_PUBLIC_KEY=pk_test_...</code></p>
            </div>
            <p className="text-[10px] text-amber-700 italic">
              💡 N'oubliez pas de redémarrer votre terminal Vite (<code>npm run dev</code>) après avoir renseigné la clé.
            </p>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <CardFormInner
              cartItems={cartItems}
              isProcessing={loading}
              onSubmitOrder={handleDirectCheckout}
              totals={totals}
            />
          </Elements>
        )
      ) : (
        <button
          onClick={handleDirectCheckout}
          disabled={loading || cartItems.length === 0}
          className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ShieldCheck size={16} />
          )}
          <span>
            {isPublicBuyer
              ? `Valider le Mandat Public Chorus Pro (${grandTotalTTC} € TTC)`
              : `Confirmer la Commande par Virement (${grandTotalTTC} € TTC)`}
          </span>
        </button>
      )}
    </div>
  );
}
