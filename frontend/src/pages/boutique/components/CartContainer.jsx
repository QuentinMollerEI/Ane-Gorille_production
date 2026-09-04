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

// =========================================================================
// 🛡️ CORRECTIF DE SÉCURITÉ DE PERSISTANCE DU PANIER (MONKEY-PATCH LOCALSTORAGE)
// Empêche toute fuite de panier entre différents utilisateurs et synchronise en temps réel.
// =========================================================================
if (typeof window !== "undefined" && !window.localStorage_cart_patched) {
  window.localStorage_cart_patched = true;

  const originalGetItem = localStorage.getItem;
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  const getTargetKey = () => {
    const uid = window.current_user_uid;
    return uid ? `ane_et_gorille_cart_${uid}` : "ane_et_gorille_cart_anonymous";
  };

  localStorage.getItem = function (key) {
    if (key === "ane_et_gorille_cart") {
      return originalGetItem.call(localStorage, getTargetKey());
    }
    return originalGetItem.call(localStorage, key);
  };

  localStorage.setItem = function (key, value) {
    if (key === "ane_et_gorille_cart") {
      const res = originalSetItem.call(localStorage, getTargetKey(), value);
      window.dispatchEvent(new Event("cart-updated"));
      return res;
    }
    return originalSetItem.call(localStorage, key, value);
  };

  localStorage.removeItem = function (key) {
    if (key === "ane_et_gorille_cart") {
      const res = originalRemoveItem.call(localStorage, getTargetKey());
      window.dispatchEvent(new Event("cart-updated"));
      return res;
    }
    return originalRemoveItem.call(localStorage, key);
  };
}

/**
 * 🛒 COMPOSANT : CartContainer.jsx ("Zero-Saisie" - Spécialisé B2B / B2G) - v10
 * Récupère automatiquement les données d'adresse, de SIRET et de profil
 * depuis Firestore pour permettre une validation de commande pro/publique en un seul clic.
 * Intègre un correctif d'étanchéité inter-utilisateur de LocalStorage et gère robustement les formats d'IDs.
 * IMPORTS RÉSOLUS : Conforme à src/pages/boutique/components/CartContainer.jsx (3 niveaux)
 */
export default function CartContainer() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [specificEngagement, setSpecificEngagement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  // Synchronisation globale du UID de l'utilisateur pour le monkey-patch LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.current_user_uid = user?.uid || null;
      window.dispatchEvent(new Event("cart-updated")); // Forcer l'actualisation globale
    }
  }, [user]);

  // 1. Charger le panier depuis LocalStorage (via redirection sécurisée)
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

  useEffect(() => {
    loadCart();

    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [user]);

  // 2. Charger les informations du profil
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) {
        setProfileLoading(false);
        setUserProfile(null);
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

  const handleRemoveItem = (productId) => {
    const updated = cartItems.filter((item) => {
      const id = item.productId || item.id;
      return id !== productId;
    });
    setCartItems(updated);
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updated));
  };

  const handleUpdateQty = (productId, newQty, maxStock) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    const checkedQty = qty > maxStock ? maxStock : qty;

    const updated = cartItems.map((item) => {
      const id = item.productId || item.id;
      if (id === productId) {
        return {
          ...item,
          qty: checkedQty,
          quantityWanted: checkedQty,
        };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updated));
  };

  const handleClearCart = () => {
    try {
      // 1. Vider l'état React local
      setCartItems([]);

      // 2. Nettoyage de sécurité multi-couches physique du LocalStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes("cart")) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => {
          try {
            window.localStorage.constructor.prototype.removeItem.call(
              localStorage,
              key,
            );
          } catch (err) {
            localStorage.removeItem(key);
          }
        });

        localStorage.removeItem("ane_et_gorille_cart");
        localStorage.removeItem("ane_et_gorille_cart_anonymous");
        if (user?.uid) {
          localStorage.removeItem(`ane_et_gorille_cart_${user.uid}`);
        }
      }

      // 3. Informer les widgets flottants d'une mise à jour de session
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.error("Erreur technique lors du vidage sécurisé du panier :", e);
    }
  };

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

  const itemsByProducer = cartItems.reduce((acc, item) => {
    const pId = item.producerId || "ID_PRODUCTEUR_TEST";
    if (!acc[pId]) {
      acc[pId] = {
        producerName: item.producerName || "Producteur local",
        items: [],
      };
    }
    acc[pId].items.push({
      productId: item.productId || item.id,
      title: item.title || item.name || "Produit local",
      priceHT: parseFloat(item.priceHT || 0),
      vatRate: parseFloat(item.vatRate || 5.5),
      qty: parseInt(item.quantityWanted || item.qty || 1, 10),
      unit: item.unit || "kg",
      image: item.image || "",
    });
    return acc;
  }, {});

  const handleZeroSaisieCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!userProfile) {
      alert(
        "⚠️ Vous devez être connecté pour valider un achat professionnel ou public.",
      );
      return;
    }

    /*
    if (userProfile.status !== 'APPROVED' && !userProfile.isValidated) {
      alert("⚠️ Votre compte professionnel/public est en attente de modération administrative...");
      return;
    }
    */

    setIsSubmitting(true);
    setOrderStatus(null);

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
                          <label
                            htmlFor={`qty-${item.productId}`}
                            className="text-xs font-semibold text-gray-400"
                          >
                            Quantité :
                          </label>
                          <input
                            type="number"
                            id={`qty-${item.productId}`}
                            name={`qty-${item.productId}`}
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
                    Compléter mon profil
                  </a>
                </div>
              ) : (
                <form onSubmit={handleZeroSaisieCheckout} className="space-y-4">
                  {(userProfile.role === "client_public" ||
                    userProfile.isPublicSector) && (
                    <div className="space-y-1">
                      <label
                        htmlFor="specificEngagement"
                        className="text-xs font-bold text-gray-600 flex items-center gap-1"
                      >
                        <Receipt size={14} className="text-gray-400" />
                        Engagement Budgétaire (B2G) :
                      </label>
                      <input
                        type="text"
                        id="specificEngagement"
                        name="specificEngagement"
                        placeholder={
                          userProfile.globalEngagementNumber ||
                          "Saisir un n° d'engagement spécifique"
                        }
                        value={specificEngagement}
                        onChange={(e) => setSpecificEngagement(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-green-500 bg-white"
                      />
                      <p className="text-[10px] text-gray-400 font-medium italic mt-0.5">
                        {userProfile.globalEngagementNumber
                          ? "Laisse vide pour utiliser le numéro enregistré dans votre profil."
                          : "Requis pour la facturation Chorus Pro."}
                      </p>
                    </div>
                  )}

                  <div className="p-3.5 bg-green-50 border border-green-150 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-green-950 font-extrabold">
                      <Calendar className="text-green-700" size={15} />
                      Facturation Différée Pro
                    </div>
                    <p className="text-[10px] text-green-900/80 font-medium leading-relaxed">
                      {userProfile.role === "client_public" ||
                      userProfile.isPublicSector
                        ? "Paiement à 30 jours fin de mois par Mandat Administratif (Chorus Pro)."
                        : "Paiement à 30 jours sécurisé garanti par notre partenaire financier Billie."}
                    </p>
                  </div>

                  <button
                    type="submit"
                    id="zero-saisie-submit"
                    name="zero-saisie-submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Validation en cours...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} />
                        <span>Valider ma commande en un clic</span>
                      </>
                    )}
                  </button>

                  <p className="text-[9px] text-gray-400 text-center leading-relaxed">
                    En validant, vous acceptez les CGV de la plateforme. Vos
                    Bons de Commande et fiches de traçabilité HACCP sont édités
                    automatiquement.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
