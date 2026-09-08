import React, { useState } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { CheckoutService } from "../../../services/checkoutService";

/**
 * 🛒 COMPOSANT : CartContainer.jsx (v4 - Double-Sécurisation & Normalisation)
 *
 * Responsabilité unique (SRP) : Afficher le récapitulatif détaillé du panier,
 * calculer de manière conforme la TVA et les totaux (Loi LME/circuit court),
 * recueillir les métadonnées comptables (Chorus Pro B2G / Stripe B2B),
 * et normaliser défensivement le panier avant d'appeler le service Cloud Run v2.
 */
export default function CartContainer({
  cartItems = [],
  onClearCart,
  onRemoveItem,
  onUpdateQuantity,
}) {
  const auth = useAuth() || {};
  const { user = null, userProfile = null } = auth;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specificEngagement, setSpecificEngagement] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);

  // Détermination réglementaire du rôle de l'acheteur (B2G Public vs B2B/B2C Privé)
  const isPublicSector =
    userProfile?.isPublicSector ||
    userProfile?.buyerProfile === "B2G" ||
    userProfile?.role === "client_public" ||
    user?.role === "client_public";

  // Formulaire local pour informations d'engagement si l'acheteur n'a pas tout enregistré dans son profil
  const [billingInfo, setBillingInfo] = useState({
    siret: userProfile?.siret || user?.siret || "",
    codeService: userProfile?.codeService || user?.codeService || "",
    billingContact: userProfile?.billingContact || user?.email || "",
  });

  // --- CALCULS DES TOTAUX SÉCURISÉS (CONFORMATION FISCALE) ---
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

    safeCartItems.forEach((item) => {
      const qty = parseInt(item?.quantity || item?.qty || 0, 10);
      const priceHT = Number(item?.price || item?.priceHT || 0);
      const vatRate = Number(item?.vatRate || item?.vat || 5.5);
      const itemHT = priceHT * qty;
      const itemTVA = itemHT * (vatRate / 100);
      totalHT += itemHT;
      totalTVA += itemTVA;
    });

    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
    };
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();
  const totalArticles = Array.isArray(cartItems)
    ? cartItems.reduce(
        (acc, item) => acc + parseInt(item?.quantity || item?.qty || 0, 10),
        0,
      )
    : 0;

  // --- TRAITEMENT ET DIRECT-VALIDATION DE LA COMMANDE ---
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!user) {
      setOrderStatus({
        type: "error",
        message: "Vous devez être authentifié pour finaliser une commande.",
      });
      return;
    }

    if (isPublicSector) {
      // Validation de conformité Chorus Pro (14 chiffres requis pour SIRET)
      const cleanSiret = billingInfo.siret.replace(/\s/g, "");
      if (!/^\d{14}$/.test(cleanSiret)) {
        setOrderStatus({
          type: "error",
          message:
            "⚠️ Réglementation Chorus Pro : Un numéro de SIRET de 14 chiffres valide est obligatoire pour valider la facturation publique.",
        });
        return;
      }

      // Numéro d'engagement (Bon de commande public) obligatoire pour le mandat public
      if (!specificEngagement.trim()) {
        setOrderStatus({
          type: "error",
          message:
            "⚠️ Loi LME & Chorus Pro : Un numéro d'engagement budgétaire est obligatoire pour valider un paiement par mandat administratif.",
        });
        return;
      }
    }

    setIsSubmitting(true);
    setOrderStatus(null);

    try {
      // Étape 1 : Structuration des métadonnées de facturation acheteur
      const buyerInfo = {
        uid: user.uid,
        name:
          userProfile?.companyName ||
          userProfile?.displayName ||
          userProfile?.name ||
          user?.displayName ||
          "Acheteur Professionnel",
        role:
          userProfile?.role ||
          user?.role ||
          (isPublicSector ? "client_public" : "client_prive"),
        siret: isPublicSector ? billingInfo.siret.replace(/\s/g, "") : "-",
        codeService:
          isPublicSector && billingInfo.codeService
            ? billingInfo.codeService.trim()
            : "-",
        refEngagement: isPublicSector ? specificEngagement.trim() : "-",
        billingContact: billingInfo.billingContact.trim() || user.email || "-",
      };

      // 🛡️ Étape 2 : DOUBLE-SÉCURISATION & NORMALISATION DU PANIER (Anti-Crash Server)
      // Garantit que chaque item transmis possède absolument un identifiant "id", un prix sain,
      // un taux de TVA et un producteur valide. Résout l'erreur 5 NOT_FOUND: [500] en base.
      const mappedCartItems = cartItems.map((item) => {
        const finalId = item.id || item.productId || item._id;
        if (!finalId) {
          throw new Error(
            `Structure de panier corrompue : l'article "${item.title || item.name || "sans nom"}" ne comporte pas d'identifiant 'id' ou 'productId'.`,
          );
        }
        return {
          id: finalId,
          name: item.title || item.name || "Légume local",
          price: Number(item.price || item.priceHT || 0),
          quantity: parseInt(item.quantity || item.qty || 1, 10),
          vatRate: Number(item.vatRate || item.vat || 5.5),
          producerId: item.producerId || "PROD_INCONNU",
          producerName:
            item.producerName || item.producer || "Maraîcher partenaire",
        };
      });

      const paymentMethod = isPublicSector ? "mandat" : "stripe";

      // Étape 3 : Relais vers l'API d'initialisation transactionnelle d'Europe-West9 (Paris)
      const orderId = await CheckoutService.validateAndCreateOrder(
        buyerInfo,
        mappedCartItems,
        paymentMethod,
      );

      // Étape 4 : Succès total, nettoyage du panier local
      if (onClearCart) onClearCart();

      setOrderStatus({
        type: "success",
        message:
          "Votre commande a été traitée, enregistrée et scellée fiscalement avec succès.",
        orderId: orderId,
      });
    } catch (error) {
      console.error("Erreur lors de la validation du panier :", error);
      setOrderStatus({
        type: "error",
        message:
          error.message ||
          "Une erreur inconnue s'est produite lors de la validation du checkout.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1️⃣ État : Succès de commande (Affichage propre de l'état validé)
  if (orderStatus?.type === "success") {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white border border-gray-250 rounded-3xl shadow-md text-center space-y-6 my-10 animate-fade-in">
        <div className="inline-flex p-4 bg-emerald-50 text-emerald-700 rounded-full">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Commande Validée avec Succès !
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {orderStatus.message} Les stocks de vos maraîchers ont été réservés
            et vos justificatifs fiscaux ont été émis.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 text-left space-y-3">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Référence Commande
            </span>
            <span className="text-sm font-black text-emerald-800">
              #{orderStatus.orderId}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Règlement
            </span>
            <span className="text-xs font-bold text-gray-700 uppercase">
              {isPublicSector ? "Mandat Administratif (30j)" : "Stripe B2B"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Montant total engagé
            </span>
            <span className="text-base font-black text-gray-900">
              {totalTTC.toFixed(2)} €
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <a
            href="/pieces-comptables"
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <FileText size={16} /> Pièces comptables
          </a>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  // 2️⃣ État : Panier Vide
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-white border border-gray-200 rounded-3xl shadow-sm text-center space-y-4 my-10 animate-fade-in">
        <div className="inline-flex p-4 bg-gray-50 text-gray-400 rounded-full">
          <ShoppingBag size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Votre panier est vide
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Découvrez les récoltes maraîchères de notre coopérative locale et
          commencez à préparer vos approvisionnements en circuit court.
        </p>
      </div>
    );
  }

  // 3️⃣ Rendu principal du panier actif
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {orderStatus?.type === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span className="font-semibold">{orderStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE DE GAUCHE : Liste des articles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>🛒</span> Articles dans votre panier ({totalArticles})
              </h2>
              <button
                onClick={onClearCart}
                className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider"
              >
                Vider le panier
              </button>
            </div>

            <div className="divide-y divide-gray-150">
              {cartItems.map((item) => {
                const qty = parseInt(item?.quantity || item?.qty || 1, 10);
                const price = Number(item?.price || item?.priceHT || 0);
                const isBio = Boolean(item?.isBio || item?.bio || false);
                const itemId = item?.id || item?.productId || item?._id;

                return (
                  <div
                    key={itemId}
                    className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">
                          {item?.title || item?.name || "Légume local"}
                        </p>
                        {isBio && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-brand-gold text-brand-dark uppercase tracking-wider shadow-sm">
                            Bio
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium">
                        🌾{" "}
                        {item?.producerName ||
                          item?.producer ||
                          "Maraîcher partenaire"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Contrôle des quantités */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(itemId, qty - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-bold text-gray-600"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-sm text-gray-900">
                          {qty} {item?.unit || "kg"}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(itemId, qty + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-bold text-gray-600"
                        >
                          +
                        </button>
                      </div>

                      {/* Prix et Suppression */}
                      <div className="text-right min-w-[80px] font-semibold text-gray-950 text-sm">
                        {(price * qty).toFixed(2)} €
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(itemId)}
                        className="text-gray-400 hover:text-red-600 p-1.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SÉCURITÉ & INFORMATIONS DE FACTURATION CHORUS PRO */}
          {isPublicSector && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
                🔒 Informations de facturation obligatoires (Chorus Pro)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Numéro de SIRET Établissement *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 font-mono"
                    placeholder="14 chiffres requis"
                    value={billingInfo.siret}
                    onChange={(e) =>
                      setBillingInfo({ ...billingInfo, siret: e.target.value })
                    }
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Requis pour l'acheminement et la validation de la facture
                    par la DGFIP.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Code Service Chorus Pro (Optionnel)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="ex: CANTINE-CENTRALE"
                    value={billingInfo.codeService}
                    onChange={(e) =>
                      setBillingInfo({
                        ...billingInfo,
                        codeService: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Permet de diriger automatiquement la facture vers le bon
                    bureau de traitement.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Numéro d'Engagement / Bon de commande interne *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="ex: ENG-2026-089"
                    value={specificEngagement}
                    onChange={(e) => setSpecificEngagement(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Cette référence comptable est obligatoire pour permettre la
                    télétransmission vers l'ordonnateur public.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DE DROITE : Caisse et Récapitulatif */}
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-250 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={18} className="text-emerald-700" />
              Récapitulatif de la caisse
            </h2>

            <div className="space-y-3.5 text-sm border-b border-gray-200 pb-4">
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>Total HT</span>
                <span>{totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>TVA estimée (5.5%)</span>
                <span>{totalTVA.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-gray-900 font-black border-t border-dashed border-gray-200 pt-3 text-base">
                <span>Total TTC</span>
                <span>{totalTTC.toFixed(2)} €</span>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-2 text-[10px] text-emerald-800 bg-emerald-50/50 border border-emerald-150 p-3 rounded-xl leading-relaxed">
                <ShieldCheck
                  size={16}
                  className="text-emerald-700 flex-shrink-0 mt-0.5"
                />
                <span>
                  <strong>Certifié sécurisé</strong> : Vos stocks maraîchers
                  sont décrémentés et vos pièces justificatives de circuit court
                  sont émises de manière transactionnelle côté serveur (Paris).
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckoutSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    {isPublicSector
                      ? "Engager le Mandat Public"
                      : "Régler mes achats par Stripe"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
