import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Trash2,
  ShieldCheck,
  Info,
  Calendar,
  Landmark,
  Receipt,
  ChevronRight,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../services/firestore.service.js";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";

/**
 * 🛒 COMPOSANT : CartContainer.jsx ("Zero-Saisie" - Spécialisé B2B / B2G)
 * Récupère automatiquement les données d'adresse, de SIRET et de profil
 * depuis Firestore pour permettre une validation de commande pro/publique en un seul clic.
 */
export default function CartContainer() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Saisie de l'engagement spécifique (Optionnel pour le B2G si un engagement annuel existe déjà)
  const [specificEngagement, setSpecificEngagement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  // 1. Charger le panier depuis LocalStorage au démarrage
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
  }, []);

  // 2. Charger les informations complètes du profil Firestore en temps réel pour le "Zero-Saisie"
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) {
        setProfileLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Erreur de récupération du profil utilisateur :", err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchUserProfile();
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
        return { ...item, quantityWanted: checkedQty };
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

  // Validation réglementaire et envoi de la commande "1-Clic"
  const handleZeroSaisieCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!userProfile) {
      alert(
        "⚠️ Vous devez être connecté pour valider un achat professionnel ou public.",
      );
      return;
    }

    // 1. Sécurité Légale de Modération : Le compte doit être préalablement validé par l'admin d'Âne & Gorille
    if (userProfile.status !== "APPROVED" && !userProfile.isValidated) {
      alert(
        "⚠️ Votre compte professionnel/public est en attente de modération administrative. Vous pourrez commander dès sa validation.",
      );
      return;
    }

    setIsSubmitting(true);
    setOrderStatus(null);

    // Détermination de l'engagement budgétaire (B2G uniquement)
    // S'ils ont saisi un numéro spécifique dans le panier, on l'utilise, sinon on prend l'engagement global pré-enregistré
    const finalEngagementNumber =
      userProfile.role === "client_public" || userProfile.isPublicSector
        ? specificEngagement.trim() ||
          userProfile.globalEngagementNumber ||
          null
        : null;

    if (
      (userProfile.role === "client_public" || userProfile.isPublicSector) &&
      !finalEngagementNumber
    ) {
      alert(
        "⚠️ Pour le secteur public, vous devez fournir soit un numéro d'engagement annuel dans votre profil, soit en saisir un spécifique pour cette commande.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const paymentMethod =
        userProfile.isPublicSector || userProfile.role === "client_public"
          ? "mandat_public"
          : "billie";
      const paymentResult = {
        stripePaymentIntentId: null,
        billieInvoiceReference:
          paymentMethod === "billie"
            ? `BILLIE-REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
            : null,
      };

      const checkoutData = {
        buyerProfile: paymentMethod === "mandat_public" ? "B2G" : "B2B",
        deliveryAddress:
          userProfile.deliveryAddress ||
          userProfile.address ||
          "Adresse par défaut de l'établissement",
        engagementNumber: finalEngagementNumber,
        siretBuyer: userProfile.siret || "12000000000001",
        billingName:
          userProfile.companyName ||
          userProfile.displayName ||
          "Acheteur Professionnel",
        billingEmail: userProfile.email || "compta-test@ane-et-gorille.fr",
      };

      // Création unifiée "Legal by Design"
      const result = await OrderDocumentGenerator.generateOrderDocuments(
        cartItems,
        user,
        checkoutData,
        paymentMethod,
        paymentResult,
      );

      handleClearCart();

      setOrderStatus({
        type: "success",
        message: `Félicitations ! Votre commande a été enregistrée en un clic. Vos documents de facturation (Factur-X pré-rempli) et vos ${totals.producers.length} bons de préparation maraîchers ont été générés en temps réel.`,
        orderId: result.orderId,
      });
    } catch (error) {
      console.error("Erreur lors de la validation :", error);
      setOrderStatus({
        type: "error",
        message:
          "Erreur technique lors de la validation automatique de la commande globale.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Chargement de votre panier sécurisé...
        </span>
      </div>
    );
  }

  // Si l'utilisateur n'a pas complété son profil (ex: pas de SIRET)
  const isProfileIncomplete = userProfile && !userProfile.siret;

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
        <ShoppingCart className="text-green-700" size={32} />
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Votre Panier "Zero-Saisie" (B2B / B2G)
          </h1>
          <p className="text-xs text-gray-500">
            Validation logistique immédiate sans saisie de coordonnées de
            facturation répétitives
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
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* SECTION DES PRODUITS (GAUCHE & MILIEU) */}
          <div className="lg:col-span-2 space-y-6">
            {Object.keys(itemsByProducer).map((producerId) => (
              <div
                key={producerId}
                className="bg-white border border-gray-250 rounded-2xl shadow-xs overflow-hidden"
              >
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
                            }
                            className="w-16 border border-gray-300 rounded-lg p-1.5 text-center text-xs font-bold focus:ring-1 focus:ring-green-500 bg-white"
                          />
                        </div>

                        <div className="text-right sm:min-w-[100px]">
                          <p className="text-xs text-gray-400 font-bold leading-none">
                            {itemHT.toFixed(2)} € HT
                          </p>
                          <p className="text-sm font-black text-green-700 mt-1">
                            {itemTTC.toFixed(2)} € TTC
                          </p>
                        </div>

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
          </div>

          {/* SECTION CHECKOUT EN 1 CLIC (DROITE) */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-250 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-gray-900 border-b border-gray-150 pb-3 text-sm flex items-center gap-1.5">
                <Receipt className="text-green-700" size={16} />
                Synthèse Financière
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
            </div>

            {/* TUNNEL EN 1 CLIC SÉCURISÉ */}
            <div className="bg-white border border-gray-250 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-gray-900 border-b border-gray-150 pb-3 text-sm flex items-center gap-1.5">
                <ShieldCheck className="text-green-700" size={16} />
                Validation "Zero-Saisie"
              </h3>

              {isProfileIncomplete ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 text-xs text-amber-900">
                  <div className="flex gap-2 items-start">
                    <AlertTriangle
                      className="text-amber-700 flex-shrink-0 mt-0.5"
                      size={16}
                    />
                    <div>
                      <strong className="font-bold">Profil incomplet</strong>
                      <p className="mt-1 font-medium leading-relaxed">
                        Pour commander en un clic, vous devez d'abord saisir vos
                        informations réglementaires (SIRET, Adresse de
                        livraison, etc.) dans votre profil.
                      </p>
                    </div>
                  </div>
                  <a
                    href="#profil"
                    onClick={() => (window.location.hash = "profil")}
                    className="block text-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-[10px] uppercase"
                  >
                    Compléter mon Profil
                  </a>
                </div>
              ) : userProfile ? (
                <div className="space-y-4 text-xs">
                  {/* Fiche récapitulative des données de profil lues par le panier */}
                  <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl space-y-3 text-gray-700">
                    <div className="flex items-center gap-2 text-green-800 font-bold border-b border-gray-200 pb-2">
                      <UserCheck size={16} />
                      <span>Profil Sécurisé & Validé</span>
                    </div>
                    <div className="space-y-1.5 font-medium text-[11px]">
                      <p>
                        <strong>Établissement :</strong>{" "}
                        {userProfile.companyName || "N/A"}
                      </p>
                      <p>
                        <strong>SIRET :</strong>{" "}
                        <span className="font-mono">{userProfile.siret}</span>
                      </p>
                      <p>
                        <strong>Adresse de Livraison :</strong>{" "}
                        {userProfile.deliveryAddress ||
                          userProfile.address ||
                          "N/A"}
                      </p>
                      <p>
                        <strong>Type de paiement :</strong>{" "}
                        {userProfile.role === "client_public" ||
                        userProfile.isPublicSector
                          ? "Mandat Administratif"
                          : "Paiement Billie à 30j"}
                      </p>

                      {/* Affichage de l'engagement global s'il existe */}
                      {(userProfile.role === "client_public" ||
                        userProfile.isPublicSector) &&
                        userProfile.globalEngagementNumber && (
                          <p className="text-purple-700">
                            <strong>Engagement Budgétaire Annuel :</strong>{" "}
                            <span className="font-mono">
                              {userProfile.globalEngagementNumber}
                            </span>
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Saisie d'un engagement budgétaire spécifique facultatif (Option double choix pour le public) */}
                  {(userProfile.role === "client_public" ||
                    userProfile.isPublicSector) && (
                    <div className="space-y-1.5 bg-purple-50 border border-purple-200 p-3.5 rounded-xl">
                      <label className="block text-[10px] font-black text-purple-800 uppercase tracking-wider">
                        Engagement Budgétaire Spécifique (Optionnel)
                      </label>
                      <input
                        type="text"
                        value={specificEngagement}
                        onChange={(e) => setSpecificEngagement(e.target.value)}
                        placeholder="Ex: ENG-CD-2026-X"
                        className="w-full border border-purple-300 rounded-lg p-2 text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500"
                      />
                      <p className="text-[9px] text-purple-600 leading-snug">
                        Saisissez un numéro ici pour cette commande spécifique,
                        sinon nous utiliserons votre engagement global annuel
                        pré-enregistré.
                      </p>
                    </div>
                  )}

                  {/* Bouton de validation rapide */}
                  <button
                    onClick={handleZeroSaisieCheckout}
                    disabled={isSubmitting || userProfile.status !== "APPROVED"}
                    className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow-md disabled:shadow-none transition-all cursor-pointer"
                  >
                    {isSubmitting
                      ? "Validation logistique..."
                      : "Valider ma commande en 1 Clic"}
                    <ChevronRight size={14} />
                  </button>

                  {userProfile.status !== "APPROVED" && (
                    <p className="text-[9px] text-center text-amber-600 font-semibold mt-1">
                      ⚠️ En attente de validation administrative avant de
                      pouvoir commander.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 font-medium">
                    Veuillez vous connecter pour valider la commande.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
