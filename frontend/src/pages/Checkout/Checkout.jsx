import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckoutOrchestrator } from "../../services/CheckoutOrchestrator";
import CheckoutDeliverySelector from "../../components/checkout/CheckoutDeliverySelector";
import {
  CreditCard,
  Building,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  FileText,
  Loader2,
  Truck,
} from "lucide-react";

/**
 * 🛒 COMPOSANT CENTRAL : Checkout.jsx
 * Page/Module de validation de commande B2B & B2G.
 *
 * SÉCURITÉ : Les calculs financiers (TVA dynamique + Frais de port) 
 * sont le reflet exact de la logique backend (CheckoutOrchestrator.js)
 * pour éviter toute désynchronisation de facturation.
 */
export default function Checkout({ cartItems = [], clearCart, onCheckoutSuccess }) {
  const { user, userProfile } = useAuth();

  // Profil fusionné de l'acheteur connecté
  const profile = userProfile || user || {};
  const isPublicSector =
    profile.role === "acheteur_public" ||
    profile.role === "client_public" ||
    profile.buyerProfile === "B2G";

  // États locaux du formulaire
  const [paymentMethod, setPaymentMethod] = useState(
    isPublicSector ? "mandat_public" : "stripe_b2b"
  );

  const [billingInfo, setBillingInfo] = useState({
    siret: profile.siret || profile.numSiret || "",
    codeService: profile.codeService || profile.codeChorus || "Service Général",
    refEngagement: profile.refEngagement || profile.defaultEngagement || "",
    billingContact: profile.email || profile.billingContact || "",
    deliveryAddress:
      profile.address ||
      profile.adresse ||
      profile.deliveryAddress ||
      "Adresse d'exploitation",
  });

  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: sessionStorage.getItem("selectedDeliveryDate") || "",
    deliveryWindow: "Matin (06h00 - 08h00)",
    instructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null);

  // =========================================================================
  // MOTEUR DE CALCULS FINANCIERS (Strictement aligné sur le Backend)
  // =========================================================================
  let totalProductsHT = 0;
  let vatProductsTotal = 0;

  cartItems.forEach((item) => {
    const priceHT = Number(item.priceHT ?? item.price ?? 0);
    const qty = Number(item.quantity || 1);
    const vatRate = Number(item.vatRate ?? 5.5) / 100; // TVA Dynamique

    const lineHT = priceHT * qty;
    totalProductsHT += lineHT;
    vatProductsTotal += lineHT * vatRate;
  });

  // Logique des frais de port dégressifs
  const calculateDeliveryFee = (amountHT) => {
    if (amountHT >= 300) return 0;
    if (amountHT >= 150) return 8;
    return 15;
  };

  const deliveryFeeHT = calculateDeliveryFee(totalProductsHT);
  const vatDelivery = deliveryFeeHT * 0.20; // TVA Transport (20%)

  const totalHT = totalProductsHT + deliveryFeeHT;
  const totalVAT = vatProductsTotal + vatDelivery;
  const totalTTC = totalHT + totalVAT;

  // =========================================================================
  // VALIDATIONS SÉMANTIQUES
  // =========================================================================
  const validateForm = () => {
    if (!deliveryDetails?.selectedDate) {
      throw new Error("Veuillez sélectionner une date de livraison souhaitée dans le calendrier.");
    }

    if (paymentMethod === "mandat_public" || isPublicSector) {
      const cleanSiret = (billingInfo.siret || "").replace(/\s/g, "");
      if (!cleanSiret || cleanSiret.length !== 14) {
        throw new Error("Un SIRET public valide (14 chiffres) est obligatoire pour Chorus Pro.");
      }
      if (!billingInfo.refEngagement || billingInfo.refEngagement.trim() === "" || billingInfo.refEngagement === "-") {
        throw new Error("Le secteur public Chorus Pro exige un N° d'Engagement Budgétaire valide.");
      }
    }

    if (!billingInfo.deliveryAddress || billingInfo.deliveryAddress.trim().length < 5) {
      throw new Error("Veuillez renseigner une adresse de livraison complète dans votre profil.");
    }
  };

  // =========================================================================
  // SOUMISSION AU BACKEND
  // =========================================================================
  const handleCheckoutSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      validateForm();

      const buyerProfileObj = {
        uid: profile.uid || profile.id || "USER_ID",
        companyName: profile.companyName || profile.displayName || "Acheteur Client",
        displayName: profile.displayName || profile.companyName || "Acheteur Client",
        role: profile.role || (isPublicSector ? "acheteur_public" : "client_pro"),
        siret: billingInfo.siret.replace(/\s/g, ""),
        codeService: billingInfo.codeService,
        address: billingInfo.deliveryAddress,
        email: profile.email || billingInfo.billingContact,
      };

      const checkoutOptions = {
        paymentMethod: paymentMethod,
        selectedDate: deliveryDetails.selectedDate,
        deliveryDetails: {
          selectedDate: deliveryDetails.selectedDate,
          deliveryWindow: deliveryDetails.deliveryWindow || "Matin (06h00 - 08h00)",
          instructions: deliveryDetails.instructions || "",
        },
        deliveryAddress: billingInfo.deliveryAddress,
        refEngagement: billingInfo.refEngagement || "-",
      };

      // Appel à l'Orchestrateur
      const result = await CheckoutOrchestrator.processCheckout(
        buyerProfileObj,
        cartItems,
        checkoutOptions
      );

      if (result.success) {
        sessionStorage.removeItem("selectedDeliveryDate");
        setSuccessOrderId(result.orderId);
        
        // VIDAGE DU PANIER UNIQUEMENT EN CAS DE SUCCÈS ABSOLU
        if (typeof clearCart === "function") {
          clearCart();
        }
        
        if (typeof onCheckoutSuccess === "function") {
          onCheckoutSuccess(result.orderId);
        }
      } else {
        throw new Error("Échec inattendu lors de la validation de commande.");
      }
    } catch (err) {
      console.error("[Checkout] Erreur lors de la validation :", err);
      setError(err.message || "Une erreur est survenue lors de la validation.");
    } finally {
      setLoading(false);
    }
  };

  // --- VUE SUCCESS ---
  if (successOrderId) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 space-y-6 text-center max-w-2xl mx-auto my-8 text-xs font-sans text-emerald-900 animate-fade-in shadow-sm">
        <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-emerald-950">Commande Validée avec Succès !</h2>
          <p className="text-xs text-emerald-800 font-medium">
            Votre commande a été scellée. Les bons de préparation ont été transmis aux maraîchers partenaires.
          </p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 text-left space-y-2 font-mono text-[11px] shadow-xs">
          <div className="flex justify-between border-b border-emerald-100 pb-1.5">
            <span className="font-bold text-slate-500">Référence Commande :</span>
            <span className="font-extrabold text-emerald-950">#{successOrderId}</span>
          </div>
          <div className="flex justify-between border-b border-emerald-100 pb-1.5">
            <span className="font-bold text-slate-500">Date de Livraison Souhaitée :</span>
            <span className="font-extrabold text-emerald-950">{deliveryDetails.selectedDate}</span>
          </div>
          <div className="flex justify-between border-b border-emerald-100 pb-1.5">
            <span className="font-bold text-slate-500">Mode de Règlement :</span>
            <span className="font-extrabold text-emerald-950">
              {paymentMethod === "mandat_public" ? "Mandat Administratif Chorus Pro (30j)" : paymentMethod === "virement_b2b" ? "Virement Bancaire (LME 30j)" : "Carte Bancaire / SEPA (Stripe)"}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="font-bold text-slate-500">Montant Total Engagé :</span>
            <span className="font-black text-emerald-800 text-sm">{totalTTC.toFixed(2)} € TTC</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer shadow-md"
        >
          Retourner au Tableau de Bord
        </button>
      </div>
    );
  }

  // --- VUE FORMULAIRE DE CHECKOUT ---
  return (
    <form onSubmit={handleCheckoutSubmit} className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-xs font-sans text-slate-800">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-sm">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ShoppingBag className="text-emerald-700" size={24} />
          Validation & Finalisation de Commande
        </h1>
        <p className="text-xs text-slate-500">
          Vérifiez vos articles, sélectionnez votre date de livraison et confirmez le règlement.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold flex items-center gap-2 text-xs">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <CheckoutDeliverySelector onDeliveryChange={(details) => setDeliveryDetails(details)} />

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wider border-b border-slate-150 pb-2.5">
              <CreditCard className="text-emerald-700" size={16} />
              Mode de Règlement B2B / B2G
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!isPublicSector && (
                <label
                  onClick={() => setPaymentMethod("stripe_b2b")}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    paymentMethod === "stripe_b2b" ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <CreditCard size={15} className="text-emerald-700" /> Carte / SEPA
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "stripe_b2b"}
                      onChange={() => setPaymentMethod("stripe_b2b")}
                      className="text-emerald-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Paiement sécurisé immédiatement scellé.</p>
                </label>
              )}

              {!isPublicSector && (
                <label
                  onClick={() => setPaymentMethod("virement_b2b")}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    paymentMethod === "virement_b2b" ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <Building size={15} className="text-blue-700" /> Virement (30j)
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "virement_b2b"}
                      onChange={() => setPaymentMethod("virement_b2b")}
                      className="text-emerald-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Règlement différé sur Bon de Commande.</p>
                </label>
              )}

              {(isPublicSector || paymentMethod === "mandat_public") && (
                <label
                  onClick={() => setPaymentMethod("mandat_public")}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-2 sm:col-span-2 ${
                    paymentMethod === "mandat_public" ? "border-blue-600 bg-blue-50/50 text-blue-950 shadow-xs" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <FileText size={15} className="text-blue-700" /> Mandat Chorus Pro (30j)
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "mandat_public"}
                      onChange={() => setPaymentMethod("mandat_public")}
                      className="text-blue-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Télétransmission automatique via Chorus Pro.</p>
                </label>
              )}
            </div>

            {(isPublicSector || paymentMethod === "mandat_public") && (
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <span className="font-bold text-blue-900 text-[11px] uppercase tracking-wider block">
                  Identifiants Requis Chorus Pro (B2G)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-[10px]">SIRET Public (14 chiffres) *</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={billingInfo.siret}
                      onChange={(e) => setBillingInfo({ ...billingInfo, siret: e.target.value })}
                      placeholder="Ex: 21310555400018"
                      className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-[10px]">N° Engagement Budgétaire *</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={billingInfo.refEngagement}
                      onChange={(e) => setBillingInfo({ ...billingInfo, refEngagement: e.target.value })}
                      placeholder="Ex: ENG-2026-908"
                      className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : RÉSUMÉ FINANCIER DÉTAILLÉ */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-150 pb-2.5 flex items-center justify-between">
            <span>Résumé ({cartItems.length})</span>
            <span className="font-mono text-emerald-800 text-sm font-black">{totalTTC.toFixed(2)} € TTC</span>
          </h3>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1 space-y-2">
            {cartItems.map((item, idx) => {
              const pHT = Number(item.priceHT ?? item.price ?? 0);
              const qty = Number(item.quantity || 1);
              return (
                <div key={idx} className="pt-2 flex justify-between items-center text-[11px]">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{item.title || item.name}</p>
                    <p className="text-slate-400 text-[10px]">
                      {qty}x {pHT.toFixed(2)} € HT ({item.producerName || "Maraîcher"})
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-900 font-mono">{(pHT * qty).toFixed(2)} €</span>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs font-bold">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total Produits HT :</span>
              <span className="font-mono">{totalProductsHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Frais de Port HT {deliveryFeeHT === 0 ? "(Offert)" : ""} :</span>
              <span className="font-mono">{deliveryFeeHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px] pt-1">
              <span>TVA Produits :</span>
              <span className="font-mono">{vatProductsTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px]">
              <span>TVA Livraison (20%) :</span>
              <span className="font-mono">{vatDelivery.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
              <span>Total Général TTC :</span>
              <span className="font-mono text-emerald-800">{totalTTC.toFixed(2)} €</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-emerald-700" /> Date de Livraison :
            </span>
            <strong className="font-extrabold font-mono">
              {deliveryDetails.selectedDate || "Non sélectionnée"}
            </strong>
          </div>

          <button
            type="submit"
            disabled={loading || cartItems.length === 0 || !deliveryDetails.selectedDate}
            className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Validation sécurisée...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>
                  {isPublicSector ? "Valider le Mandat Public (30j)" : "Confirmer et Payer"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}