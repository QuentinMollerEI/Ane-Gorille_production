import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  ShoppingCart,
  Trash2,
  Lock,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

/**
 * 🛒 COMPOSANT : CartContainer.jsx
 * Emplacement : src/pages/Boutique/components/CartContainer.jsx
 */
export default function CartContainer({
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onBackToShop,
}) {
  const auth = useAuth() || {};
  const { user, userProfile } = auth;
  const [dbProfile, setDbProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Écoute temps réel du profil dans Firestore
  const uid = user?.uid || userProfile?.uid || userProfile?.id;
  useEffect(() => {
    if (!uid) return;
    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) setDbProfile(snap.data());
      },
      (err) => console.error("Erreur écoute profil panier:", err),
    );
    return () => unsub();
  }, [uid]);

  const p = dbProfile || userProfile || user || {};

  // Extraction multi-clés de l'adresse de livraison
  const deliveryAddress =
    p.address ||
    p.adresse ||
    p.deliveryAddress ||
    p.adresseLivraison ||
    p.street ||
    "";
  const deliveryZipCode =
    p.zipCode || p.codePostal || p.postalCode || p.deliveryZipCode || "";
  const deliveryCity = p.city || p.ville || p.deliveryCity || "";
  const hasValidDeliveryAddress = Boolean(
    deliveryAddress.trim() && deliveryCity.trim(),
  );

  // Identification de facturation
  const companyName =
    p.companyName ||
    p.raisonSociale ||
    p.nomEntreprise ||
    p.organisation ||
    p.displayName ||
    "Organisme Client";
  const siret = p.siret || p.numSiret || p.siren || "Non renseigné";
  const chorusCode = p.chorusCodeService || p.codeChorus || "Service Général";
  const isPublicBuyer =
    p.role === "client_public" ||
    p.role === "acheteur_public" ||
    user?.role === "client_public";

  // Calculs financiers
  const totalHT = cart.reduce((sum, item) => {
    const pHT = Number(item.priceHT ?? item.price ?? 0);
    return sum + pHT * item.quantity;
  }, 0);

  const totalTVA = totalHT * 0.055;
  const totalTTC = totalHT + totalTVA;

  // Validation de la commande et écriture Firestore
  const handleCheckout = async () => {
    if (!hasValidDeliveryAddress) {
      alert(
        "⚠️ Impossible de valider : Vous devez renseigner votre adresse de livraison dans l'onglet 'Mon Profil' au préalable.",
      );
      return;
    }

    if (!uid) {
      alert(
        "⚠️ Erreur d'authentification : Impossible de vous identifier. Veuillez vous reconnecter.",
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Créer la commande principale dans 'orders'
      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: uid,
        clientId: uid,
        userId: uid,
        buyerEmail: user?.email || p.email || "",
        buyerName: companyName,
        deliveryAddress: `${deliveryAddress}, ${deliveryZipCode} ${deliveryCity}`,
        siret: siret,
        items: cart,
        totalHT: totalHT,
        totalTVA: totalTVA,
        totalTTC: totalTTC,
        totalAmount: totalTTC,
        status: "A_PREPARER",
        paymentMethod: isPublicBuyer ? "mandat" : "stripe",
        createdAt: serverTimestamp(),
      });

      // 2. Créer les sous-commandes 'sub_orders' groupées par producteur
      const producerGroups = {};
      cart.forEach((item) => {
        const prodId =
          item.producerId || item.userId || item.ownerId || "prod_default";
        if (!producerGroups[prodId]) producerGroups[prodId] = [];
        producerGroups[prodId].push(item);
      });

      for (const [prodId, itemsList] of Object.entries(producerGroups)) {
        await addDoc(collection(db, "sub_orders"), {
          parentOrderId: orderRef.id,
          orderId: orderRef.id,
          buyerId: uid,
          producerId: prodId,
          producerName:
            itemsList[0]?.producerCompany ||
            itemsList[0]?.producerName ||
            "Maraîcher Partner",
          items: itemsList,
          status: "A_PREPARER",
          createdAt: serverTimestamp(),
        });
      }

      // 3. Décrémenter les stocks dans Firestore
      for (const item of cart) {
        if (item.id) {
          const productRef = doc(db, "products", item.id);
          const currentStock = Number(item.stock ?? 0);
          const newStock = Math.max(0, currentStock - item.quantity);
          await updateDoc(productRef, {
            stock: newStock,
            ...(newStock === 0 ? { isHidden: true, status: "hidden" } : {}),
          }).catch((e) =>
            console.warn("Mise à jour stock produit ignorée :", e),
          );
        }
      }

      alert(
        "✅ Commande enregistrée avec succès ! Le bon de commande scellé a été transmis aux maraîchers.",
      );
      onClearCart();
      onBackToShop();
    } catch (err) {
      console.error("Erreur lors de la validation de la commande :", err);
      alert(
        `⚠️ Erreur lors de l'enregistrement de la commande : ${err.message || "Permissions insuffisantes"}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12 text-xs">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <ShoppingCart size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Votre Panier d'Approvisionnement
            </h2>
            <p className="text-xs text-gray-500 font-semibold">
              Vérification des produits localement sourcés et validation du
              protocole de livraison
            </p>
          </div>
        </div>

        <button
          onClick={onBackToShop}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Continuer vos achats</span>
        </button>
      </div>

      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="font-extrabold text-gray-900 text-sm">
                Produits Sélectionnés ({cart.length})
              </h3>
              <button
                onClick={onClearCart}
                className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Vider le panier</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100 space-y-3">
              {cart.map((item) => {
                const pHT = Number(item.priceHT ?? item.price ?? 0);
                const itemTotalHT = pHT * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="pt-3 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <h4 className="font-black text-gray-900 text-xs">
                        {item.title || item.name}
                      </h4>
                      <p className="text-gray-500 text-[11px]">
                        Ferme:{" "}
                        <span className="font-bold text-gray-700">
                          {item.producerCompany || "Exploitation Locale"}
                        </span>
                      </p>
                      <p className="text-emerald-800 font-bold text-[11px]">
                        {pHT.toFixed(2)} € HT / {item.unit || "kg"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity - 1)
                          }
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-extrabold text-gray-900 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="font-black text-gray-900 text-xs">
                          {itemTotalHT.toFixed(2)} € HT
                        </p>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <MapPin size={16} className="text-emerald-700" />
                  Adresse de Livraison
                </h3>
                <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 border border-emerald-300">
                  <CheckCircle size={11} />
                  Adresse Certifiée (Profil)
                </span>
              </div>

              {hasValidDeliveryAddress ? (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5">
                  <p className="font-extrabold text-gray-900 text-xs">
                    {deliveryAddress}
                  </p>
                  <p className="text-gray-700 font-bold">
                    {deliveryZipCode} {deliveryCity}
                  </p>
                  <p className="text-[10px] text-gray-500 italic pt-1 border-t border-emerald-100">
                    📍 Adresse de livraison certifiée extraite de votre profil
                    (non modifiable au panier pour la conformité du périmètre
                    kilométrique).
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-amber-950">
                  <div className="flex items-center gap-2 font-black text-amber-900">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Adresse de livraison non renseignée</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Veuillez enregistrer votre adresse exacte dans l'onglet{" "}
                    <strong>Mon Profil</strong> pour débloquer la validation de
                    votre commande.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2 text-xs uppercase tracking-wider border-b border-gray-150 pb-3">
                <Building size={16} className="text-blue-700" />
                Entité & Identifiants de Facturation
              </h3>

              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-1 text-[11px]">
                <p className="font-extrabold text-gray-900">{companyName}</p>
                <p className="text-gray-600 font-mono">SIRET: {siret}</p>
                {isPublicBuyer && (
                  <p className="text-blue-900 font-extrabold">
                    Code Service Chorus Pro: {chorusCode}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider border-b border-gray-150 pb-3">
                Récapitulatif de la Commande
              </h3>

              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between text-gray-600">
                  <span>Total Sous-Commandes HT :</span>
                  <span>{totalHT.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TVA Réduite Alimentaire (5.5%) :</span>
                  <span>{totalTVA.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Général TTC :</span>
                  <span className="text-emerald-800">
                    {totalTTC.toFixed(2)} €
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!hasValidDeliveryAddress || submitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Enregistrement en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>
                      {isPublicBuyer
                        ? "Valider la Commande (Mandat 30j)"
                        : "Procéder au Paiement Sécurisé"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
          <ShoppingCart size={48} className="mx-auto text-gray-300" />
          <h3 className="text-lg font-bold text-gray-800">
            Votre panier est actuellement vide
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Explorez notre catalogue de produits locaux pour vous approvisionner
            directement auprès des maraîchers.
          </p>
          <button
            onClick={onBackToShop}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors inline-block cursor-pointer"
          >
            Découvrir les produits
          </button>
        </div>
      )}
    </div>
  );
}
