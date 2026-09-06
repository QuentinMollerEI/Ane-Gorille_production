import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firestore.service";
import {
  Building,
  CreditCard,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";

export default function BuyerBillingSettings() {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    companyName: "",
    siret: "",
    codeService: "",
    defaultEngagement: "",
    billingContact: "",
    preferredPayment: "stripe", // 'stripe' | 'mandat'
  });

  // Charger les informations réelles depuis Firestore au montage du composant
  useEffect(() => {
    if (!user?.uid) return;

    async function loadBillingProfile() {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setBillingInfo({
            companyName: data.companyName || data.displayName || "",
            siret: data.siret || "",
            codeService: data.codeService || "",
            defaultEngagement: data.defaultEngagement || "",
            billingContact: data.billingContact || user.email || "",
            preferredPayment: data.preferredPayment || "stripe",
          });
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données de facturation :",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadBillingProfile();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setIsSubmitting(true);
    setIsSaved(false);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        companyName: billingInfo.companyName,
        siret: billingInfo.siret,
        codeService: billingInfo.codeService,
        defaultEngagement: billingInfo.defaultEngagement,
        billingContact: billingInfo.billingContact,
        preferredPayment: billingInfo.preferredPayment,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la facturation :", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
        Chargement des paramètres de facturation...
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Building size={18} className="text-emerald-600" />
          3. Identification Institutionnelle (Chorus Pro & Règlements)
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6 animate-fade-in">
          {isSaved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-semibold flex items-center gap-2 animate-fade-in">
              <ShieldCheck size={16} /> Vos paramètres de facturation ont été
              enregistrés avec succès.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Raison sociale */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Raison Sociale / Entité *
              </label>
              <input
                type="text"
                required
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.companyName}
                onChange={(e) =>
                  setBillingInfo({
                    ...billingInfo,
                    companyName: e.target.value,
                  })
                }
              />
            </div>

            {/* SIRET */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Numéro de SIRET Acheteur *
              </label>
              <input
                type="text"
                required
                maxLength="14"
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.siret}
                onChange={(e) =>
                  setBillingInfo({ ...billingInfo, siret: e.target.value })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Sert de validation unique pour le routage Chorus Pro / Factur-X.
              </p>
            </div>

            {/* Code Service */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Code Service Chorus Pro (Optionnel)
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.codeService}
                onChange={(e) =>
                  setBillingInfo({
                    ...billingInfo,
                    codeService: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Obligatoire pour les ministères et grands établissements de
                santé.
              </p>
            </div>

            {/* Numéro Engagement par défaut */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                N° d'Engagement Public (Par défaut)
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.defaultEngagement}
                onChange={(e) =>
                  setBillingInfo({
                    ...billingInfo,
                    defaultEngagement: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Numéro du marché public ou bon de commande interne.
              </p>
            </div>

            {/* Contact Facturation */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                E-mail Référent Comptabilité
              </label>
              <input
                type="email"
                required
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.billingContact}
                onChange={(e) =>
                  setBillingInfo({
                    ...billingInfo,
                    billingContact: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Destinataire des factures de commission et des relances.
              </p>
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              Mode de Règlement Préféré
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/50 transition">
                <input
                  type="radio"
                  name="preferredPayment"
                  checked={billingInfo.preferredPayment === "stripe"}
                  onChange={() =>
                    setBillingInfo({
                      ...billingInfo,
                      preferredPayment: "stripe",
                    })
                  }
                  className="mt-1 text-emerald-600 focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <CreditCard size={16} className="text-gray-500" /> Carte
                    bancaire (Stripe B2B)
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Débit immédiat après validation ou prélèvement SEPA
                    automatisé.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/50 transition">
                <input
                  type="radio"
                  name="preferredPayment"
                  checked={billingInfo.preferredPayment === "mandat"}
                  onChange={() =>
                    setBillingInfo({
                      ...billingInfo,
                      preferredPayment: "mandat",
                    })
                  }
                  className="mt-1 text-emerald-600 focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Building size={16} className="text-gray-500" /> Virement
                    par Mandat Administratif (LME 30j)
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Dédié aux administrations publiques et hôpitaux. Échéance
                    légale de 30 jours.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Enregistrement..." : "Enregistrer les options"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
