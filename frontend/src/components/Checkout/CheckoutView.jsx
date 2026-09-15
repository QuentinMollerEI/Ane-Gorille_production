import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth as firebaseAuth } from "../../config/firebase";
import CheckoutPaymentMethod from "./CheckoutPaymentMethod";
import { ShieldCheck, Loader2, ArrowLeft, Lock, CheckCircle2 } from "lucide-react";

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

  const handleSuccessCallback =
    onOrderSuccess ||
    onOrderValidated ||
    onConfirmOrder ||
    onCheckoutSuccess ||
    (() => {});

  const { user, profileData } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const userRole = profileData?.role || user?.role || "b2b";
  const isB2G = userRole === "acheteur_public" || userRole === "b2g";

  const [paymentMethod, setPaymentMethod] = useState(
    isB2G ? "chorus_mandate" : "stripe_card"
  );
  const [engagementRef, setEngagementRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    const savedEngagement =
      profileData?.refEngagement ||
      profileData?.defaultEngagement ||
      user?.refEngagement ||
      "";
    if (savedEngagement) setEngagementRef(savedEngagement);
  }, [profileData, user]);

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
        throw new Error("Votre panier est actuellement vide.");
      }

      if (finalTotalTTC <= 0) {
        throw new Error("Le montant total du panier doit être supérieur à 0 €.");
      }

      if (paymentMethod === "chorus_mandate") {
        if (!engagementRef.trim()) {
          throw new Error("Le N° d'Engagement Budgétaire est obligatoire pour les collectivités.");
        }
        await callBackendCheckout({ paymentMethod: "chorus_mandate", engagementRef });
        return;
      }

      if (paymentMethod === "bank_transfer") {
        await callBackendCheckout({ paymentMethod: "bank_transfer" });
        return;
      }

      if (paymentMethod === "stripe_card") {
        if (!stripe || !elements) {
          throw new Error("Le module Stripe est en cours d'initialisation. Veuillez patienter.");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Veuillez renseigner les coordonnées de votre carte bancaire.");
        }

        // 🎯 NORMALISATION ET EXTRACTION MULTI-PRODUCTEURS
        const producerIds = [
          ...new Set(
            cartList
              .map((item) => item.producerId || item.sellerId || item.userId || item.producerCompany)
              .filter(Boolean)
          ),
        ];

        const isMulti = producerIds.length > 1;
        let singleProducerId = null;
        let singleProducerStripeAccountId = null;

        if (!isMulti && producerIds.length === 1) {
          singleProducerId = String(producerIds[0]);
          const firstItem =
            cartList.find(
              (i) => (i.producerId || i.sellerId || i.userId) === singleProducerId
            ) || cartList[0] || {};
          singleProducerStripeAccountId =
            firstItem.producerStripeAccountId || firstItem.stripeAccountId || null;
        }

        console.log("🌿 [CHECKOUT STRIPE CONNECT] :", {
          producerIds,
          isMultiProducer: isMulti,
          singleProducerId,
          singleProducerStripeAccountId,
        });

        const amountInCents = Math.round(finalTotalTTC * 100);
        const feeInCents = Math.round(amountInCents * 0.18);

        const functionsInstance = getFunctions(firebaseAuth.app, "europe-west9");
        const createIntentFn = httpsCallable(functionsInstance, "createPaymentIntentServer");

        const intentRes = await createIntentFn({
          amount: amountInCents,
          currency: "eur",
          producerId: singleProducerId,
          producerStripeAccountId: singleProducerStripeAccountId,
          isMultiProducer: isMulti,
          applicationFeeAmount: feeInCents,
        });

        const clientSecret = intentRes.data?.clientSecret;
        if (!clientSecret) {
          throw new Error("Impossible de créer l'ordre de paiement auprès de Stripe.");
        }

        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: profileData?.companyName || user?.displayName || "Acheteur B2B",
              email: user?.email,
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
          });
        }
      }
    } catch (err) {
      console.error("[CHECKOUT ERROR] :", err);
      setErrorMessage(err.message || "Une erreur est survenue lors du paiement.");
    } finally {
      setLoading(false);
    }
  };

  const callBackendCheckout = async (extraOptions) => {
    const buyerProfile = profileData || user || {};
    
    // Normalisation des articles pour s'assurer que producerId est présent sur chaque ligne
    const normalizedCartItems = cartList.map((item) => ({
      ...item,
      producerId: item.producerId || item.sellerId || item.userId || "PRODUCER_UNKNOWN",
    }));

    const checkoutOptions = {
      refEngagement: engagementRef || "-",
      deliveryAddress: buyerProfile.address || "",
      paymentMethod: extraOptions.paymentMethod,
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
      setCompletedOrder({
        orderId: res.data.orderId,
        paymentMethod: extraOptions.paymentMethod,
        totalTTC: finalTotalTTC,
      });
    } else {
      throw new Error("La validation de la commande a échoué côté serveur.");
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
            N° de commande : <span className="font-mono font-bold text-emerald-800">{completedOrder.orderId}</span>
          </p>
        </div>
        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs space-y-1 text-emerald-900 font-medium">
          <p>Les bons de préparation ont été transmis aux maraîchers partenaires.</p>
          <p className="font-bold">Montant total : {completedOrder.totalTTC.toFixed(2)} € TTC</p>
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
      <button
        type="button"
        onClick={onBackToCart}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
      >
        <ArrowLeft size={14} className="stroke-[1.4]" />
        <span>Modifier le panier</span>
      </button>

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold text-xs">
            {errorMessage}
          </div>
        )}

        <CheckoutPaymentMethod
          userRole={userRole}
          selectedMethod={paymentMethod}
          onMethodChange={setPaymentMethod}
          engagementRef={engagementRef}
          onEngagementRefChange={setEngagementRef}
        />

        {paymentMethod === "stripe_card" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Lock size={13} className="text-emerald-700 stroke-[1.4]" />
                Coordonnées de la Carte Bancaire
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Cryptage 256 bits SSL</span>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Traitement de la transaction Stripe...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} className="stroke-[1.5]" />
              <span>
                {paymentMethod === "stripe_card"
                  ? "Payer maintenant"
                  : "Confirmer et Générer le Bon de Commande"}{" "}
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