import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Info,
  CreditCard,
  Calendar,
  Landmark,
  Receipt,
  Sparkles,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext"; // Hypothèse d'auth existante
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator"; // Service unifié "Legal by Design"

export default function CartContainer() {
  const { user } = useAuth(); // Récupère le profil connecté (contient le rôle : particulier, professionnel, public)
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerProfile, setBuyerProfile] = useState("B2C"); // 'B2C' (Particulier), 'B2B' (Professionnel), 'B2G' (Secteur Public)
  const [siret, setSiret] = useState("");
  const [engagementNumber, setEngagementNumber] = useState(""); // Pour Chorus Pro (B2G)
  const [billieApproved, setBillieApproved] = useState(null); // null, 'loading', 'approved', 'rejected'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // { type: 'success' | 'error', message: string, orderId?: string }

  // Charger le panier depuis LocalStorage au démarrage
  useEffect(() => {
    const loadCart = () => {
      try {
        const storedCart = JSON.parse(
          localStorage.getItem("ane_et_gorille_cart") || "[]",
        );
        setCartItems(storedCart);
      } catch (err) {
        console.error("Erreur de lecture du panier local :", err);
      } finally {
        setLoading(false);
      }
    };

    loadCart();

    // Adapter le profil acheteur par défaut en fonction de l'utilisateur connecté s'il y en a un
    if (user) {
      if (
        user.role === "admin" ||
        user.role === "client_pro" ||
        user.companyName
      ) {
        setBuyerProfile("B2B");
        setSiret(user.siret || "");
      } else if (user.role === "client_public" || user.isPublicSector) {
        setBuyerProfile("B2G");
      } else {
        setBuyerProfile("B2C");
      }
    }
  }, [user]);

  // Supprimer un produit du panier
  const handleRemoveItem = (productId) => {
    const updated = cartItems.filter((item) => item.id !== productId);
    setCartItems(updated);
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updated));
  };

  // Mettre à jour la quantité d'un produit
  const handleUpdateQty = (productId, newQty, maxStock) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    const checkedQty = qty > maxStock ? maxStock : qty;

    const updated = cartItems.map((item) => {
      if (item.id === productId) {
        return { ...item, quantityWanted: checkedQty }; // Uniformisé avec 'quantityWanted' de OrderDocumentGenerator
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updated));
  };

  // Vider le panier
  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem("ane_et_gorille_cart");
  };

  // Calculer les totaux de TVA et HT de manière isolée par producteur (Conformité ACPR/Stripe Connect)
  const getCartTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    const producersMap = {};

    cartItems.forEach((item) => {
      const qty = parseInt(item.quantityWanted || item.qty || 1, 10);
      const priceHT = parseFloat(item.priceHT || 0);
      const vatRate = parseFloat(item.vatRate || 5.5);

      const itemHT = priceHT * qty;
      const itemVAT = itemHT * (vatRate / 100);
      const itemTTC = itemHT + itemVAT;

      totalHT += itemHT;
      totalTVA += itemVAT;
      totalTTC += itemTTC;

      // Groupement par producteur
      const pId = item.producerId || "ID_PRODUCTEUR_TEST";
      if (!producersMap[pId]) {
        producersMap[pId] = {
          producerId: pId,
          producerName: item.producerName || "Producteur local",
          totalHT: 0,
          totalTVA: 0,
          totalTTC: 0,
        };
      }
      producersMap[pId].totalHT += itemHT;
      producersMap[pId].totalTVA += itemVAT;
      producersMap[pId].totalTTC += itemTTC;
    });

    return {
      totalHT,
      totalTVA,
      totalTTC,
      producers: Object.values(producersMap),
    };
  };

  const totals = getCartTotals();

  // Grouper les articles pour l'affichage visuel par producteur
  const itemsByProducer = cartItems.reduce((acc, item) => {
    const pId = item.producerId || "ID_PRODUCTEUR_TEST";
    if (!acc[pId]) {
      acc[pId] = {
        producerName: item.producerName || "Producteur local",
        items: [],
      };
    }
    acc[pId].items.push({
      productId: item.id,
      title: item.title || item.name,
      priceHT: parseFloat(item.priceHT || 0),
      vatRate: parseFloat(item.vatRate || 5.5),
      qty: parseInt(item.quantityWanted || item.qty || 1, 10),
      unit: item.unit || "kg",
      image: item.image || "",
    });
    return acc;
  }, {});

  // Simulateur de scoring de solvabilité Billie (B2B)
  const handleVerifyBillie = () => {
    if (!siret || siret.trim().length < 9) {
      alert("Veuillez saisir un numéro de SIRET valide.");
      return;
    }
    setBillieApproved("loading");

    setTimeout(() => {
      // Règle de simulation : si le SIRET contient "999", refus, sinon accordé
      if (siret.includes("999")) {
        setBillieApproved("rejected");
      } else {
        setBillieApproved("approved");
      }
    }, 1500);
  };

  // Traitement et validation de la commande globale via OrderDocumentGenerator
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    setOrderStatus(null);

    // Contrôles de validation réglementaires par profil
    if (buyerProfile === "B2B" && (!siret || siret.trim().length < 9)) {
      alert(
        "Le numéro SIRET est obligatoire pour les achats professionnels (Billie B2B).",
      );
      setIsSubmitting(false);
      return;
    }

    if (
      buyerProfile === "B2G" &&
      (!engagementNumber || engagementNumber.trim() === "")
    ) {
      alert(
        "Le numéro d'engagement / bon de commande public est obligatoire pour la facturation Chorus Pro (B2G).",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // Préparation des métadonnées de paiement simulées pour les intégrations
      const paymentMethod =
        buyerProfile === "B2C"
          ? "stripe"
          : buyerProfile === "B2B"
            ? "billie"
            : "mandat_public";
      const paymentResult = {
        stripePaymentIntentId:
          buyerProfile === "B2C"
            ? `pi_test_${Math.random().toString(36).substr(2, 9)}`
            : null,
        billieInvoiceReference:
          buyerProfile === "B2B"
            ? `BILLIE-REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
            : null,
      };

      const checkoutData = {
        buyerProfile,
        deliveryAddress: "Livraison standard boutique de retrait",
        engagementNumber: buyerProfile === "B2G" ? engagementNumber : null,
        siretBuyer: buyerProfile === "B2B" ? siret : null,
        billingName: user?.displayName || user?.companyName || "Client local",
        billingEmail: user?.email || "client@ane-et-gorille.fr",
      };

      // Appel sécurisé au service de découpe de commande unifié "Legal by Design"
      const result = await OrderDocumentGenerator.generateOrderDocuments(
        cartItems,
        user,
        checkoutData,
        paymentMethod,
        paymentResult,
      );

      // Vider le panier
      handleClearCart();

      setOrderStatus({
        type: "success",
        message: `Félicitations ! Votre commande a été validée avec succès. Les documents légaux ont été générés et synchronisés.`,
        orderId: result.orderId,
      });
    } catch (error) {
      console.error("Erreur lors de la validation de la commande :", error);
      setOrderStatus({
        type: "error",
        message:
          "Erreur technique lors de la validation de la commande globale.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green"></div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
        <ShoppingCart className="text-green-700" size={32} />
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Votre Panier de Proximité
          </h1>
          <p className="text-xs text-gray-500">
            Regroupez vos commandes multi-producteurs et payez selon votre
            profil
          </p>
        </div>
      </div>

      {orderStatus ? (
        <div
          className={`p-8 rounded-3xl border text-center space-y-6 max-w-2xl mx-auto ${
            orderStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {orderStatus.type === "success" ? (
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-3xl">
              🎉
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-3xl">
              ⚠️
            </div>
          )}
          <div>
            <h2 className="text-xl font-extrabold">
              {orderStatus.type === "success"
                ? "Commande Validée !"
                : "Une erreur est survenue"}
            </h2>
            <p className="text-sm mt-2 leading-relaxed">
              {orderStatus.message}
            </p>
            {orderStatus.orderId && (
              <p className="text-xs font-mono bg-white border px-3 py-2 rounded-xl mt-4 inline-block text-gray-600">
                Réf Commande : {orderStatus.orderId}
              </p>
            )}
          </div>

          {orderStatus.type === "success" && (
            <div className="bg-white/80 border border-green-150 p-5 rounded-2xl text-left space-y-3 text-xs leading-relaxed text-gray-700">
              <p className="font-bold text-green-800 flex items-center gap-1.5 text-sm">
                <ShieldCheck size={16} /> Documents réglementaires générés :
              </p>
              <ul className="list-disc pl-5 space-y-1.5 font-medium text-gray-600">
                <li>
                  <strong>1x Bon de Commande Client :</strong> Récapitulatif
                  global avec ventilation de la TVA à{" "}
                  {user?.isPublicSector
                    ? "Chorus Pro B2G"
                    : "votre adresse e-mail"}
                  .
                </li>
                <li>
                  <strong>
                    {totals.producers.length}x Bons de Préparation :
                  </strong>{" "}
                  Distribués directement dans l'Espace Producteur de chaque
                  maraîcher pour la découpe logistique et la traçabilité de lot
                  (HACCP).
                </li>
              </ul>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => setOrderStatus(null)}
              className="bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Retourner à la boutique
            </button>
          </div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <ShoppingCart
            className="mx-auto text-gray-300 mb-4 stroke-1"
            size={48}
          />
          <p className="text-gray-500 font-bold text-lg">
            Votre panier est actuellement vide.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Parcourez notre boutique pour ajouter de bons produits de nos
            fermes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* SECTION DES PRODUITS (GAUCHE & MILIEU) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Boucle sur chaque Producteur (Multi-Producteur) */}
            {Object.keys(itemsByProducer).map((producerId) => (
              <div
                key={producerId}
                className="bg-white border border-gray-250 rounded-2xl shadow-xs overflow-hidden"
              >
                {/* En-tête du Producteur */}
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-150 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧑‍🌾</span>
                    <span className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">
                      {itemsByProducer[producerId].producerName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    Expédition directe
                  </span>
                </div>

                {/* Liste des articles de ce maraîcher */}
                <div className="divide-y divide-gray-150 px-6">
                  {itemsByProducer[producerId].items.map((item) => {
                    const itemHT =
                      Number(item.priceHT ?? 0) * Number(item.qty ?? 1);
                    const itemTTC =
                      itemHT * (1 + Number(item.vatRate ?? 5.5) / 100);

                    return (
                      <div
                        key={item.productId}
                        className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-400 font-medium">
                            Tarif : {Number(item.priceHT).toFixed(2)} € HT /{" "}
                            {item.unit || "kg"}
                            <span className="ml-1 text-[10px] text-green-700 font-bold">
                              ({item.vatRate}% TVA)
                            </span>
                          </p>
                        </div>

                        {/* Modificateur de quantité */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-400">
                            Quantité :
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              handleUpdateQty(
                                item.productId,
                                e.target.value,
                                999,
                              )
                            } // Fallback stock max à 999 si absent
                            className="w-16 border border-gray-300 rounded-lg p-1.5 text-center text-xs font-bold focus:ring-1 focus:ring-green-500 bg-white"
                          />
                        </div>

                        {/* Sous-totaux financiers légaux */}
                        <div className="text-right sm:min-w-[100px]">
                          <p className="text-xs text-gray-400 font-bold leading-none">
                            {itemHT.toFixed(2)} € HT
                          </p>
                          <p className="text-sm font-black text-green-700 mt-1">
                            {itemTTC.toFixed(2)} € TTC
                          </p>
                        </div>

                        {/* Bouton supprimer */}
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleClearCart}
                className="text-xs text-gray-500 hover:text-red-600 font-bold flex items-center gap-1 bg-white border border-gray-250 py-2 px-4 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Vider entièrement mon panier</span>
              </button>
            </div>
          </div>

          {/* SECTION CHECKOUT & TOTALS (DROITE) */}
          <div className="space-y-6">
            {/* RECAPITULATIF FINANCIER GLOBAL (Loi LME Transparence) */}
            <div className="bg-white border border-gray-250 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-gray-900 border-b border-gray-150 pb-3 text-sm flex items-center gap-1.5">
                <Receipt className="text-green-700" size={16} />
                Synthèse de Facturation
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-500 font-semibold">
                  <span>Total HT :</span>
                  <span>{totals.totalHT.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-500 font-semibold">
                  <span>Total TVA (incluse) :</span>
                  <span>{totals.totalTVA.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-800 font-black border-t border-dashed pt-3 text-sm">
                  <span>Montant Total TTC :</span>
                  <span className="text-green-700 text-lg">
                    {totals.totalTTC.toFixed(2)} €
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-150 space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Sécurisation légale (ACPR) :
                </p>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                  Notre plateforme utilise Stripe Connect pour garantir que les
                  fonds des producteurs sont séquestrés légalement et transférés
                  sans transiter par notre trésorerie.
                </p>
              </div>
            </div>

            {/* SÉLECTEUR DE PROFIL ET MODES DE PAIEMENT */}
            <form
              onSubmit={handleCheckout}
              className="bg-white border border-gray-250 rounded-2xl shadow-sm p-6 space-y-6"
            >
              <h3 className="font-extrabold text-gray-900 border-b border-gray-150 pb-3 text-sm flex items-center gap-1.5">
                <ShieldCheck className="text-green-700" size={16} />
                Mode de Règlement
              </h3>

              {/* Sélection du Profil */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Profil de l'Acheteur *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerProfile("B2C");
                      setBillieApproved(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[10px] transition-all cursor-pointer ${
                      buyerProfile === "B2C"
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-250 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    Particulier (B2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerProfile("B2B");
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[10px] transition-all cursor-pointer ${
                      buyerProfile === "B2B"
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-250 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    Professionnel (B2B)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerProfile("B2G");
                      setBillieApproved(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[10px] transition-all cursor-pointer ${
                      buyerProfile === "B2G"
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-250 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    Public (B2G)
                  </button>
                </div>
              </div>

              {/* CONFIGURATION CONDITIONNELLE SELON PROFIL */}

              {/* CAS 1 : PARTICULIER (B2C) */}
              {buyerProfile === "B2C" && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex gap-2 p-3 bg-blue-50 border border-blue-150 rounded-xl">
                    <CreditCard
                      className="text-blue-700 mt-0.5 flex-shrink-0"
                      size={16}
                    />
                    <p className="text-blue-900 leading-relaxed font-medium">
                      <strong>Paiement Comptant (Stripe) :</strong> Règlement
                      sécurisé par Carte Bancaire ou Apple Pay. Les fonds sont
                      directement divisés entre les maraîchers.
                    </p>
                  </div>

                  {/* Formulaire de paiement carte simulé pour la validation front */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2.5 font-medium">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Détails de paiement (Mode Test)
                    </span>
                    <div className="bg-white border rounded-lg p-2.5 flex items-center justify-between text-gray-400 font-mono text-xs">
                      <span>4242 •••• •••• 4242</span>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                        VISA TEST
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CAS 2 : PROFESSIONNEL (B2B) */}
              {buyerProfile === "B2B" && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex gap-2 p-3 bg-amber-50 border border-amber-150 rounded-xl">
                    <Calendar
                      className="text-amber-700 mt-0.5 flex-shrink-0"
                      size={16}
                    />
                    <p className="text-amber-900 leading-relaxed font-medium">
                      <strong>
                        Facturation différée à 30 jours (Billie) :
                      </strong>{" "}
                      Financement instantané pour le producteur, paiement décalé
                      pour vous sous réserve d'éligibilité.
                    </p>
                  </div>

                  {/* Saisie obligatoire du SIRET */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500">
                      Numéro de SIRET de l'établissement *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={siret}
                        onChange={(e) => {
                          setSiret(e.target.value);
                          setBillieApproved(null);
                        }}
                        placeholder="Ex: 84382039200012"
                        required={buyerProfile === "B2B"}
                        className="flex-1 border border-gray-300 rounded-xl p-2 text-xs focus:ring-1 focus:ring-green-500 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyBillie}
                        className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Vérifier
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Astuce Test : saisissez un SIRET contenant{" "}
                      <strong>"999"</strong> pour simuler un refus de crédit.
                    </p>
                  </div>

                  {/* Résultats de scoring Billie */}
                  {billieApproved === "loading" && (
                    <div className="flex items-center gap-2 text-gray-600 font-bold bg-gray-50 border p-3 rounded-xl">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                      <span>Scoring instantané Billie en cours...</span>
                    </div>
                  )}

                  {billieApproved === "approved" && (
                    <div className="flex items-start gap-2 text-green-800 bg-green-50 border border-green-200 p-3 rounded-xl font-medium leading-relaxed">
                      <ShieldCheck
                        className="flex-shrink-0 text-green-700 mt-0.5"
                        size={16}
                      />
                      <div>
                        <strong>Scoring Billie Approuvé !</strong>
                        <p className="text-[10px] text-green-600 mt-0.5">
                          Votre entreprise est éligible au paiement à 30 jours
                          (Loi LME).
                        </p>
                      </div>
                    </div>
                  )}

                  {billieApproved === "rejected" && (
                    <div className="flex items-start gap-2 text-red-800 bg-red-50 border border-red-200 p-3 rounded-xl font-medium leading-relaxed">
                      <Info
                        className="flex-shrink-0 text-red-700 mt-0.5"
                        size={16}
                      />
                      <div>
                        <strong>Crédit refusé par Billie</strong>
                        <p className="text-[10px] text-red-600 mt-0.5">
                          Scoring insuffisant ou SIRET non éligible. Veuillez
                          basculer sur le règlement comptant (Particulier/B2C).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CAS 3 : PUBLIC (B2G) */}
              {buyerProfile === "B2G" && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex gap-2 p-3 bg-purple-50 border border-purple-150 rounded-xl">
                    <Landmark
                      className="text-purple-700 mt-0.5 flex-shrink-0"
                      size={16}
                    />
                    <p className="text-purple-950 leading-relaxed font-medium">
                      <strong>Mandat Administratif (Chorus Pro) :</strong>{" "}
                      Commande validée sur engagement budgétaire. La facture
                      sera déposée au format Factur-X sous 30 jours
                      réglementaires.
                    </p>
                  </div>

                  {/* Saisie du Numéro d'engagement (Obligatoire pour Chorus Pro) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500">
                      Numéro d'Engagement / Bon de Commande Public *
                    </label>
                    <input
                      type="text"
                      value={engagementNumber}
                      onChange={(e) => setEngagementNumber(e.target.value)}
                      placeholder="Ex: ENG-2026-83492"
                      required={buyerProfile === "B2G"}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-green-500 bg-white font-mono"
                    />
                    <p className="text-[10px] text-gray-400">
                      Requis pour éviter les rejets administratifs automatiques
                      lors de la télétransmission.
                    </p>
                  </div>
                </div>
              )}

              {/* BOUTON DE SOUUMISSION FINALE */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (buyerProfile === "B2B" && billieApproved !== "approved")
                  }
                  className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow-md disabled:shadow-none transition-all cursor-pointer"
                >
                  {isSubmitting
                    ? "Traitement de la commande..."
                    : "Valider mon panier de proximité"}
                  <ChevronRight size={14} />
                </button>
                {buyerProfile === "B2B" && billieApproved !== "approved" && (
                  <p className="text-[9px] text-center text-amber-600 font-semibold mt-2">
                    ⚠️ Effectuez et validez le scoring Billie pour pouvoir
                    valider la commande.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
