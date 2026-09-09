import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle2,
  Loader2,
  AlertCircle,
  PackageCheck,
  Plus,
  Minus,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { DocumentWorkflowService } from "../../../services/documentWorkflowService";

/**
 * 🛒 COMPOSANT : CartContainer.jsx (Le Grand Panier & Checkout B2B / B2G)
 * Responsabilité unique : Récapitulatif financier (HT/TVA/TTC), gestion des quantités par producteur,
 * et tunnel de validation avec pré-remplissage réactif depuis le profil utilisateur.
 */
export default function CartContainer({ onBackToShop }) {
  const { user } = useAuth();
  const { cart, removeFromCart, clearCart, addToCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refEngagement, setRefEngagement] = useState("");
  const [siretBuyer, setSiretBuyer] = useState("");
  const [codeService, setCodeService] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentChoice, setPaymentPreference] = useState("stripe"); // 'stripe' | 'sepa' | 'mandat'
  const [orderStatus, setOrderStatus] = useState(null);

  // Détection du rôle
  const rawRole = user?.role || "client_public";
  const isPublicSector = Boolean(
    rawRole === "client_public" || rawRole === "acheteur_public",
  );

  // 🔄 ÉCOUTE DU PROFIL ENSEMBLE AVEC PRÉ-REMPLISSAGE AUTOMATIQUE
  useEffect(() => {
    if (user) {
      setSiretBuyer(user.siret || user.siretNumber || "");
      setCodeService(user.codeService || "");
      setRefEngagement(user.refEngagement || user.defaultEngagement || "");
      setDeliveryAddress(
        user.address
          ? `${user.address}${user.zipCode ? `, ${user.zipCode}` : ""}${user.city ? ` ${user.city}` : ""}`
          : "",
      );
      setPaymentPreference(
        isPublicSector ? "mandat" : user.paymentPreference || "stripe",
      );
    }
  }, [user, isPublicSector]);

  const cartItems = Array.isArray(cart) ? cart : [];

  // Calculs financiers
  const totalHT = cartItems.reduce((sum, item) => {
    const qty = Number(item.quantity || item.qty || 1);
    const price = Number(item.priceHT ?? item.price ?? 0);
    return sum + price * qty;
  }, 0);

  const totalTVA = cartItems.reduce((sum, item) => {
    const qty = Number(item.quantity || item.qty || 1);
    const price = Number(item.priceHT ?? item.price ?? 0);
    const vat = Number(item.vatRate ?? item.vat ?? 5.5);
    return sum + price * (vat / 100) * qty;
  }, 0);

  const totalTTC = totalHT + totalTVA;
  const itemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || item.qty || 1),
    0,
  );

  // Soumission de la commande
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!user) {
      setOrderStatus({
        type: "error",
        message:
          "Vous devez être connecté à votre compte acheteur pour valider la commande.",
      });
      return;
    }

    if (isPublicSector && !refEngagement.trim()) {
      setOrderStatus({
        type: "error",
        message:
          "⚠️ Le numéro d'engagement budgétaire est obligatoire pour la facturation Chorus Pro.",
      });
      return;
    }

    setIsSubmitting(true);
    setOrderStatus(null);

    const paymentMethod = isPublicSector ? "mandat" : paymentChoice;
    const buyerInfo = {
      uid: user.uid,
      displayName:
        user.companyName || user.displayName || user.name || "Acheteur Pro",
      email: user.email,
      role: rawRole,
      siret: siretBuyer || "-",
      codeService: codeService || "-",
      refEngagement: refEngagement || "-",
    };

    const checkoutData = {
      companyName: user.companyName || user.displayName || "Acheteur Pro",
      siret: siretBuyer,
      codeService: codeService,
      refEngagement: refEngagement,
      deliveryAddress: deliveryAddress || "Adresse enregistrée du compte",
      paymentChoice: paymentChoice,
    };

    try {
      const orderId = await DocumentWorkflowService.createOrderAndBps(
        buyerInfo,
        cartItems,
        paymentMethod,
        checkoutData,
      );

      clearCart();
      setOrderStatus({
        type: "success",
        orderId: orderId || "CMD-2026-CONFIRMED",
        message: isPublicSector
          ? "Commande B2G enregistrée avec succès. Bon de commande émis sous mandat LME 30 jours."
          : paymentChoice === "sepa"
            ? "Prélèvement SEPA B2B enregistré ! La facture à échéance vous sera transmise."
            : "Paiement sécurisé validé ! Votre commande est transmise aux maraîchers.",
      });
    } catch (error) {
      console.error("Erreur de commande :", error);
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

  if (orderStatus?.type === "success") {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-3xl border border-gray-200 shadow-md text-center space-y-6 animate-fade-in my-8">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Commande Confirmée !
          </h2>
          <p className="text-xs font-bold text-emerald-800 bg-emerald-50 inline-block px-3 py-1 rounded-full uppercase tracking-wider">
            Réf : {orderStatus.orderId}
          </p>
          <p className="text-sm text-gray-600 max-w-md mx-auto pt-2 leading-relaxed">
            {orderStatus.message}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-center gap-4">
          <button
            type="button"
            onClick={onBackToShop}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            Retourner au Marché
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-white rounded-3xl border border-gray-200 shadow-sm text-center space-y-5 animate-fade-in my-8">
        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Votre Panier est Vide
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1">
            Découvrez nos produits locaux et ajoutez vos récoltes fraîches au
            panier.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Parcourir la Boutique</span>
        </button>
      </div>
    );
  }

  const validateButtonText = isSubmitting
    ? "Validation de la commande..."
    : isPublicSector
      ? "Valider par Mandat Administratif (30j Chorus)"
      : paymentChoice === "sepa"
        ? `Valider le Prélèvement SEPA (${totalTTC.toFixed(2)} € TTC)`
        : `Valider & Payer par Carte (${totalTTC.toFixed(2)} € TTC)`;

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all border border-gray-200"
        >
          <ArrowLeft size={16} />
          <span>Continuer mes achats</span>
        </button>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
          Grand Panier Actif ({itemCount} article{itemCount > 1 ? "s" : ""})
        </span>
      </div>

      {orderStatus?.type === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{orderStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLONNE GAUCHE : DÉTAIL DES ARTICLES (7/12) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShoppingBag className="text-emerald-600" size={20} />
                Récapitulatif des Récoltes
              </h2>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
                <span>Vider le panier</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100 space-y-4 pt-1">
              {cartItems.map((item) => {
                const qty = Number(item.quantity || item.qty || 1);
                const priceHT = Number(item.priceHT ?? item.price ?? 0);
                const vatRate = Number(item.vatRate ?? item.vat ?? 5.5);
                const itemTotalTTC = priceHT * (1 + vatRate / 100) * qty;

                return (
                  <div
                    key={item.id}
                    className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.imageUrl || item.image ? (
                          <img
                            src={item.imageUrl || item.image}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">🥕</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                          🏷️{" "}
                          {item.producer ||
                            item.producerName ||
                            "Producteur Local"}
                        </p>
                        <h4 className="font-bold text-sm text-gray-900 leading-snug">
                          {item.title || item.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                          {priceHT.toFixed(2)} € HT / {item.unit || "kg"} (TVA{" "}
                          {vatRate}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                      <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => addToCart(item, -1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 text-xs font-bold"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 font-bold text-xs text-gray-800">
                          {qty} {item.unit || "kg"}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(item, 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 text-xs font-bold"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-black text-emerald-800">
                          {itemTotalTTC.toFixed(2)} €
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase">
                          TTC
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer cet article"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs flex items-start gap-3 mt-6">
              <PackageCheck
                size={20}
                className="text-amber-700 shrink-0 mt-0.5"
              />
              <div>
                <p className="font-extrabold text-amber-900">
                  Conditionnement Consigné Zéro Déchet
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  Toutes vos livraisons sont préparées en caisses et cagettes
                  réutilisables consignées.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : CHECKOUT PRÉ-REMPLI (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleCheckoutSubmit}
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6"
          >
            <div className="border-b border-gray-150 pb-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                {isPublicSector ? (
                  <Building size={20} className="text-emerald-600" />
                ) : (
                  <CreditCard size={20} className="text-emerald-600" />
                )}
                <span>
                  {isPublicSector
                    ? "Règlement Mandat Public (B2G)"
                    : "Validation & Caisse B2B"}
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                {isPublicSector
                  ? "Facturation Chorus Pro à 30 jours (Loi LME)"
                  : "Paiement sécurisé via Stripe Connect / Prélèvement SEPA"}
              </p>
            </div>

            {/* Total Financier */}
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-gray-600">
                <span>Total Hors Taxes (HT) :</span>
                <span className="font-bold text-gray-800">
                  {totalHT.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA (5.5%) :</span>
                <span className="font-bold text-gray-800">
                  {totalTVA.toFixed(2)} €
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-black text-emerald-800">
                <span>Total Général TTC :</span>
                <span className="text-lg">{totalTTC.toFixed(2)} €</span>
              </div>
            </div>

            {/* MESSAGE D'INFORMATION PRÉ-REMPLISSAGE */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-1">
              <p className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                Coordonnées de Facturation & Livraison Utilisateur
              </p>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Les champs ci-dessous sont pré-remplis avec vos données de
                profil ({user?.companyName || user?.displayName || "Acheteur"}).
              </p>
            </div>

            {/* Champs Chorus Pro pour B2G */}
            {isPublicSector && (
              <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-150 text-xs">
                <div>
                  <label className="block font-extrabold text-emerald-900 uppercase tracking-wider mb-1">
                    N° d'Engagement Budgétaire * (Chorus Pro)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ENG-2026-8894"
                    value={refEngagement}
                    onChange={(e) => setRefEngagement(e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-0.5">
                      SIRET Acheteur
                    </label>
                    <input
                      type="text"
                      placeholder="N° SIRET"
                      value={siretBuyer}
                      onChange={(e) => setSiretBuyer(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-0.5">
                      Code Service
                    </label>
                    <input
                      type="text"
                      placeholder="Code Service"
                      value={codeService}
                      onChange={(e) => setCodeService(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Choix de paiement pour B2B */}
            {!isPublicSector && (
              <div className="space-y-2 text-xs">
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider">
                  Mode de Règlement B2B
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentPreference("stripe")}
                    className={`p-3 rounded-xl border text-center font-extrabold text-xs transition-all ${
                      paymentChoice === "stripe"
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    💳 Carte Bancaire
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPreference("sepa")}
                    className={`p-3 rounded-xl border text-center font-extrabold text-xs transition-all ${
                      paymentChoice === "sepa"
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    🏦 Prélèvement SEPA
                  </button>
                </div>
              </div>
            )}

            {/* Adresse de Livraison */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-gray-700 uppercase tracking-wider">
                Adresse de Livraison & Point de Dépôt *
              </label>
              <textarea
                rows="2"
                required
                placeholder="Saisissez l'adresse de livraison..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validation de la commande...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>{validateButtonText}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
