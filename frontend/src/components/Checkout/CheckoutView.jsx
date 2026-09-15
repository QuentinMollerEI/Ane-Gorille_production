import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth as firebaseAuth } from "../../config/firebase";
import CheckoutDeliverySelector from "./CheckoutDeliverySelector";
import {
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Lock,
  CheckCircle2,
  CreditCard,
  Landmark,
  Building2,
  AlertCircle,
} from "lucide-react";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_sample_key"
);

function CheckoutForm(props) {
  const {
    cart = [],
    cartItems = [],
    items = [],
    totalTTC = 0,
    totalAmount = 0,
    total = 0,
    clearCart,
    onClearCart,
    onBackToCart,
    onOrderSuccess,
    onOrderValidated,
    onConfirmOrder,
    onCheckoutSuccess,
  } = props;

  const rawCart = cartItems.length ? cartItems : items.length ? items : cart;
  const cartList = Array.isArray(rawCart) ? rawCart : rawCart.items || [];

  // 1. Calcul du montant HT global
  const computedTotalHT = cartList.reduce((sum, item) => {
    const priceHT = Number(item.priceHT ?? item.price ?? item.unitPrice ?? 0);
    const qty = Number(item.quantity || 1);
    return sum + priceHT * qty;
  }, 0);

  // 2. Calcul du montant TTC global
  const computedTotalTTC = cartList.reduce((sum, item) => {
    const priceHT = Number(item.priceHT ?? item.price ?? item.unitPrice ?? 0);
    const vatRate = Number(item.vatRate ?? item.vat ?? 5.5) / 100;
    const qty = Number(item.quantity || 1);
    return sum + priceHT * (1 + vatRate) * qty;
  }, 0);

  const finalTotalTTC =
    Number(totalTTC) > 0
      ? Number(totalTTC)
      : Number(totalAmount) > 0
      ? Number(totalAmount)
      : Number(total) > 0
      ? Number(total)
      : computedTotalTTC;

  const finalTotalHT = computedTotalHT;

  const handleSuccessCallback =
    onOrderSuccess ||
    onOrderValidated ||
    onConfirmOrder ||
    onCheckoutSuccess ||
    (() => {});

  const { user, profileData } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const buyerProfile = profileData || user || {};
  const userRole = buyerProfile.role || "acheteur_prive";
  const isB2G = userRole === "acheteur_public" || userRole === "client_public" || buyerProfile.buyerProfile === "B2G";

  const savedIban =
    buyerProfile.iban ||
    buyerProfile.sepaIban ||
    buyerProfile.billingIban ||
    buyerProfile.rib ||
    "";

  const [paymentMethod, setPaymentMethod] = useState(
    isB2G ? "chorus_mandate" : "stripe_card"
  );
  const [engagementRef, setEngagementRef] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    const savedEngagement =
      buyerProfile.refEngagement ||
      buyerProfile.defaultEngagement ||
      "";
    if (savedEngagement) setEngagementRef(savedEngagement);
  }, [buyerProfile]);

  const formatMaskedIban = (ibanStr) => {
    if (!ibanStr) return "Compte bancaire professionnel (Profil vérifié)";
    const cleaned = String(ibanStr).replace(/\s+/g, "").toUpperCase();
    if (cleaned.length < 8) return cleaned;
    return `${cleaned.slice(0, 4)} •••• •••• •••• •••• ${cleaned.slice(-4)}`;
  };

  const handleEmptyCart = () => {
    if (typeof clearCart === "function") clearCart();
    if (typeof onClearCart === "function") onClearCart();
  };

  const handleCloseSuccessScreen = () => {
    handleEmptyCart();
    if (completedOrder) {
      handleSuccessCallback(completedOrder);
    }
    if (typeof onBackToCart === "function") {
      onBackToCart();
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!cartList || cartList.length === 0) {
        throw new Error("Votre panier d'approvisionnement est vide.");
      }

      if (finalTotalTTC <= 0) {
        throw new Error("Le montant total du panier doit être supérieur à 0,00 €.");
      }

      // VÉRIFICATION BLOQUANTE DU CALENDRIER
      if (!deliveryDetails?.selectedDate) {
        throw new Error("Veuillez sélectionner une date de livraison via le calendrier avant de valider.");
      }

      const functionsInstance = getFunctions(firebaseAuth.app, "europe-west9");

      // 🏢 1. SECTEUR PUBLIC : Chorus Pro (B2G)
      if (paymentMethod === "chorus_mandate") {
        if (!engagementRef.trim()) {
          throw new Error("Le N° d'Engagement Budgétaire est obligatoire pour les collectivités publiques (Chorus Pro).");
        }
        await callBackendCheckout({ paymentMethod: "chorus_mandate", engagementRef, deliveryDetails });
        return;
      }

      // 💳 2. CARTE BANCAIRE IMMÉDIATE (B2B)
      if (paymentMethod === "stripe_card") {
        if (!stripe || !elements) {
          throw new Error("Le module de paiement sécurisé Stripe est en cours de chargement.");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Veuillez renseigner les coordonnées de votre carte bancaire.");
        }

        const producerIds = [
          ...new Set(
            cartList
              .map((item) => item.producerId || item.sellerId || item.userId)
              .filter(Boolean)
          ),
        ];

        const isMulti = producerIds.length > 1;
        let singleProducerId = null;
        let singleProducerStripeAccountId = null;

        if (!isMulti && producerIds.length === 1) {
          singleProducerId = String(producerIds);
          const firstItem =
            cartList.find(
              (i) => (i.producerId || i.sellerId || i.userId) === singleProducerId
            ) || {};
          singleProducerStripeAccountId =
            firstItem.producerStripeAccountId || firstItem.stripeAccountId || null;
        }

        const amountTTCInCents = Math.round(finalTotalTTC * 100);
        const amountHTInCents = Math.round(finalTotalHT * 100);
        const feeInCents = Math.round(amountHTInCents * 0.18);

        const createIntentFn = httpsCallable(functionsInstance, "createPaymentIntentServer");
        const intentRes = await createIntentFn({
          amount: amountTTCInCents,
          applicationFeeAmount: feeInCents,
          producerId: singleProducerId,
          producerStripeAccountId: singleProducerStripeAccountId,
          isMultiProducer: isMulti,
        });

        const clientSecret = intentRes.data?.clientSecret;
        if (!clientSecret) {
          throw new Error("Impossible d'initialiser l'intention de paiement CB auprès du serveur.");
        }

        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: buyerProfile.companyName || buyerProfile.displayName || "Acheteur B2B",
              email: buyerProfile.email,
            },
          },
        });

        if (paymentResult.error) {
          throw new Error(paymentResult.error.message);
        }

        if (
          paymentResult.paymentIntent.status === "succeeded" ||
          paymentResult.paymentIntent.status === "requires_capture"
        ) {
          await callBackendCheckout({
            paymentMethod: "stripe_card",
            paymentIntentId: paymentResult.paymentIntent.id,
            deliveryDetails,
          });
        }
        return;
      }

      // 🏛️ 3. PRÉLÈVEMENT SEPA À 30 JOURS (B2B)
      if (paymentMethod === "sepa_30d") {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        await callBackendCheckout({
          paymentMethod: "sepa_30d",
          stripePaymentMethodId: buyerProfile.stripePaymentMethodId || "pm_sepa_profile_saved",
          sepaDueDate: dueDate.toISOString(),
          sepaStatus: "SCHEDULED_30D",
          deliveryDetails,
        });
        return;
      }
    } catch (err) {
      console.error("[CHECKOUT ERROR] :", err);
      setErrorMessage(err.message || "Une erreur est survenue lors de la validation de la commande.");
    } finally {
      setLoading(false);
    }
  };

  const callBackendCheckout = async (extraOptions) => {
    const normalizedCartItems = cartList.map((item) => ({
      ...item,
      producerId: item.producerId || item.sellerId || item.userId || "PRODUCER_UNKNOWN",
    }));

    const checkoutOptions = {
      refEngagement: engagementRef || "-",
      deliveryAddress: buyerProfile.address || "",
      paymentMethod: extraOptions.paymentMethod,
      deliveryDetails: extraOptions.deliveryDetails || deliveryDetails,
      ...extraOptions,
    };

    const functionsInstance = getFunctions(firebaseAuth.app, "europe-west9");
    const processCheckout = httpsCallable(functionsInstance, "processCheckoutServer");

    const res = await processCheckout({
      buyerProfile,
      cartItems: normalizedCartItems,
      checkoutOptions,
    });

    if (res.data?.success) {
      const createdOrderId = res.data.orderId;

      const uniqueProducers = [...new Set(normalizedCartItems.map((i) => i.producerId).filter(Boolean))];
      if (uniqueProducers.length > 1 && extraOptions.paymentMethod === "stripe_card") {
        try {
          const dispatchTransfersFn = httpsCallable(functionsInstance, "dispatchMultiProducerTransfersServer");
          await dispatchTransfersFn({ orderId: createdOrderId });
        } catch (dispatchErr) {
          console.error("⚠️ [STRIPE CONNECT] Ventilation multi-producteurs différée :", dispatchErr);
        }
      }

      setCompletedOrder({
        orderId: createdOrderId,
        paymentMethod: extraOptions.paymentMethod,
        totalTTC: finalTotalTTC,
      });
    } else {
      throw new Error("Le serveur a refusé la validation de la commande.");
    }
  };

  if (completedOrder) {
    return (
      <div className="bg-white border border-emerald-200 rounded-3xl p-8 text-center space-y-5 animate-fade-in shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900">Commande Validée avec Succès !</h2>
          <p className="text-xs text-gray-500">
            Référence unique : <span className="font-mono font-bold text-emerald-800">{completedOrder.orderId}</span>
          </p>
        </div>
        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs space-y-1 text-emerald-900 font-medium">
          {completedOrder.paymentMethod === "sepa_30d" ? (
            <p>Le mandat SEPA est enregistré. Le prélèvement automatique s'effectuera à l'échéance des 30 jours.</p>
          ) : completedOrder.paymentMethod === "chorus_mandate" ? (
            <p>Le bon de commande public a été enregistré pour télétransmission Chorus Pro.</p>
          ) : (
            <p>Les bons de préparation ont été immédiatement transmis aux maraîchers partenaires.</p>
          )}
          <p className="font-bold text-sm">Montant Total : {completedOrder.totalTTC.toFixed(2)} € TTC</p>
        </div>
        <button
          type="button"
          onClick={handleCloseSuccessScreen}
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
        >
          Retourner à la boutique
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in text-xs pb-12">

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. PLANIFICATION LOGISTIQUE (SÉLECTEUR DE CALENDRIER) */}
        <CheckoutDeliverySelector onDeliveryChange={(details) => setDeliveryDetails(details)} />

        {/* 2. SÉLECTEUR DE MODE DE RÈGLEMENT */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
          <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">
            Mode de Règlement
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {!isB2G && (
              <>
                <label
                  onClick={() => setPaymentMethod("stripe_card")}
                  className={`p-3.5 border rounded-xl cursor-pointer transition flex items-center justify-between ${
                    paymentMethod === "stripe_card"
                      ? "border-emerald-600 bg-emerald-50/50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentChoice"
                      checked={paymentMethod === "stripe_card"}
                      onChange={() => setPaymentMethod("stripe_card")}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">
                        <CreditCard size={15} className="text-emerald-700" />
                        <span>Carte Bancaire (Paiement Immédiat)</span>
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Règlement instantané et sécurisé par carte B2B.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("sepa_30d")}
                  className={`p-3.5 border rounded-xl cursor-pointer transition flex items-center justify-between ${
                    paymentMethod === "sepa_30d"
                      ? "border-emerald-600 bg-emerald-50/50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentChoice"
                      checked={paymentMethod === "sepa_30d"}
                      onChange={() => setPaymentMethod("sepa_30d")}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Landmark size={15} className="text-emerald-700" />
                        <span>Prélèvement SEPA (Échéance 30 Jours)</span>
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Prélèvement automatique à J+30 sur votre compte d'entreprise.
                      </p>
                    </div>
                  </div>
                </label>
              </>
            )}

            {isB2G && (
              <label
                onClick={() => setPaymentMethod("chorus_mandate")}
                className="p-3.5 border border-blue-300 bg-blue-50/50 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Building2 size={16} className="text-blue-700" />
                  <div>
                    <p className="font-bold text-blue-950">Mandat Administratif (Chorus Pro B2G)</p>
                    <p className="text-[10px] text-blue-700">Facturation publique dématérialisée sous 30 jours.</p>
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* FORMULAIRE CARTE BANCAIRE */}
        {paymentMethod === "stripe_card" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Lock size={13} className="text-emerald-700" />
                Coordonnées de la Carte Bancaire
              </label>
              <span className="text-[10px] text-gray-400 font-medium">SSL 256 bits</span>
            </div>
            <div className="p-3 bg-gray-50/70 border border-gray-200/80 rounded-xl">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "13px",
                      color: "#111827",
                      "::placeholder": { color: "#9CA3AF" },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* RÉCAPITULATIF MANDAT SEPA */}
        {paymentMethod === "sepa_30d" && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-2xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-black text-emerald-950">
                  Mandat de Prélèvement SEPA B2B (Profil Vérifié)
                </p>
                <p className="font-mono text-xs font-bold text-emerald-900 tracking-wider mt-0.5">
                  {formatMaskedIban(savedIban)}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-emerald-800 font-medium pt-1.5 border-t border-emerald-200/60">
              En validant la commande, le prélèvement s'effectuera automatiquement à l'échéance des 30 jours sur le compte enregistré dans votre profil administratif.
            </p>
          </div>
        )}

        {/* CHAMP ENGAGEMENT CHORUS PRO (B2G) */}
        {paymentMethod === "chorus_mandate" && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold text-blue-900">
              N° d'Engagement Budgétaire (Obligatoire Chorus Pro) *
            </label>
            <input
              type="text"
              value={engagementRef}
              onChange={(e) => setEngagementRef(e.target.value)}
              className="w-full p-2.5 border border-blue-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: ENG-2026-908"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Traitement sécurisé de la transaction...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>
                {paymentMethod === "stripe_card"
                  ? "Payer Maintenant par Carte"
                  : paymentMethod === "sepa_30d"
                  ? "Valider la Commande SEPA (Échéance 30j)"
                  : "Confirmer la Commande Publique Chorus Pro"}{" "}
                ({finalTotalTTC.toFixed(2)} € TTC)
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutView(props) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}