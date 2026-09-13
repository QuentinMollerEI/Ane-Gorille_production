import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { checkGeoFence } from "../../../services/logisticsService";
import { User, Save, Loader2, CheckCircle2, AlertTriangle, MapPin } from "lucide-react";

/**
 * 🔒 COMPOSANT HARMONISÉ : GeneralInfoForm.jsx
 * Saisie des coordonnées de base, contrôle GeoFence (50 km / Saint-Rémy-sur-Avre)
 * en temps réel (onBlur) + à la soumission, et calcul dynamique de isProfileCompleted.
 */
export default function GeneralInfoForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // 🎯 Statut du contrôle GeoFence temps réel : "idle" | "checking" | "valid" | "invalid"
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoMessage, setGeoMessage] = useState(null);

  const [formData, setFormData] = useState({
    displayName: "",
    companyName: "",
    siret: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    billingSameAsAddress: true,
    billingAddress: "",
    billingPostalCode: "",
    billingCity: "",
  });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function loadUserData() {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            displayName: data.displayName || "",
            companyName: data.companyName || "",
            siret: data.siret || "",
            phone: data.phone || "",
            address: data.address || "",
            postalCode: data.postalCode || "",
            city: data.city || "",
            billingSameAsAddress: data.billingSameAsAddress ?? true,
            billingAddress: data.billingAddress || "",
            billingPostalCode: data.billingPostalCode || "",
            billingCity: data.billingCity || "",
          });
          // Si une adresse existait déjà, on la considère valide jusqu'à modification
          if (data.postalCode && data.city) {
            setGeoStatus("valid");
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des informations générales :",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Toute modification du code postal ou de la ville invalide le contrôle précédent
    if (name === "postalCode" || name === "city") {
      setGeoStatus("idle");
      setGeoMessage(null);
      setErrorMessage(null);
    }
  };

  // 🎯 Contrôle GeoFence en temps réel, déclenché à la perte de focus
  const runGeoCheck = async (nextFormData) => {
    const postalCode = nextFormData.postalCode.trim();
    const city = nextFormData.city.trim();

    // On attend d'avoir les deux champs avant de vérifier
    if (!postalCode || !city) {
      setGeoStatus("idle");
      setGeoMessage(null);
      return;
    }

    setGeoStatus("checking");
    setGeoMessage(null);

    try {
      const geoResult = await checkGeoFence(postalCode, city, 50);

      if (geoResult && geoResult.isEligible === false) {
        setGeoStatus("invalid");
        setGeoMessage(
          geoResult.message ||
            "Cette adresse se situe au-delà du périmètre de livraison/collecte autorisé (50 km autour de Saint-Rémy-sur-Avre).",
        );
      } else {
        setGeoStatus("valid");
        setGeoMessage(null);
      }
    } catch (error) {
      console.error("Erreur lors du contrôle GeoFence :", error);
      setGeoStatus("idle");
      setGeoMessage(
        "Impossible de vérifier la zone de livraison pour le moment. Le contrôle sera refait à l'enregistrement.",
      );
    }
  };

  const handleAddressBlur = () => {
    runGeoCheck(formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid || isSubmitting || geoStatus === "checking") return;

    setIsSaved(false);
    setErrorMessage(null);

    try {
      // 🎯 0. Contrôle GeoFence obligatoire avant tout enregistrement
      // (garde-fou final, même si le contrôle onBlur a déjà été fait)
      setGeoStatus("checking");
      const geoResult = await checkGeoFence(
        formData.postalCode.trim(),
        formData.city.trim(),
        50,
      );

      if (geoResult && geoResult.isEligible === false) {
        setGeoStatus("invalid");
        const message =
          geoResult.message ||
          "Cette adresse se situe au-delà du périmètre de livraison/collecte autorisé (50 km autour de Saint-Rémy-sur-Avre). Veuillez saisir une adresse valide.";
        setGeoMessage(message);
        setErrorMessage(message);
        return;
      }

      setGeoStatus("valid");
      setGeoMessage(null);
      setIsSubmitting(true);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      // 🎯 1. Vérification des coordonnées de base
      const hasBaseInfo = Boolean(
        formData.displayName.trim() &&
        formData.companyName.trim() &&
        formData.siret.trim() &&
        formData.phone.trim() &&
        formData.address.trim() &&
        formData.postalCode.trim() &&
        formData.city.trim(),
      );

      // 🎯 1bis. Vérification de l'adresse de facturation (si distincte)
      const hasBillingInfo = formData.billingSameAsAddress
        ? true
        : Boolean(
            formData.billingAddress.trim() &&
            formData.billingPostalCode.trim() &&
            formData.billingCity.trim(),
          );

      // 🎯 2. Vérification des spécificités selon le rôle
      const userRole = currentData.role || "acheteur_prive";
      let isRoleComplete = false;

      if (userRole === "acheteur_public") {
        isRoleComplete = Boolean(currentData.siret?.trim());
      } else if (userRole === "acheteur_prive" || userRole === "acheteur") {
        isRoleComplete = Boolean(
          currentData.sepaMandateActive || currentData.iban,
        );
      } else if (userRole === "producteur") {
        isRoleComplete = Boolean(
          currentData.stripeConnectCompleted || currentData.stripeAccountId,
        );
      } else if (userRole === "livreur") {
        isRoleComplete = Boolean(
          currentData.immatriculation?.trim() &&
          currentData.permisValide === true,
        );
      } else if (userRole === "admin") {
        isRoleComplete = true;
      }

      const isComplete = hasBaseInfo && hasBillingInfo && isRoleComplete;

      // 🎯 3. Sauvegarde Firestore avec écriture du statut
      await updateDoc(userRef, {
        displayName: formData.displayName.trim(),
        companyName: formData.companyName.trim(),
        siret: formData.siret.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim(),
        city: formData.city.trim(),
        billingSameAsAddress: formData.billingSameAsAddress,
        billingAddress: formData.billingSameAsAddress
          ? formData.address.trim()
          : formData.billingAddress.trim(),
        billingPostalCode: formData.billingSameAsAddress
          ? formData.postalCode.trim()
          : formData.billingPostalCode.trim(),
        billingCity: formData.billingSameAsAddress
          ? formData.city.trim()
          : formData.billingCity.trim(),
        isProfileCompleted: isComplete,
        updatedAt: new Date().toISOString(),
      });

      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des coordonnées :", error);
      setErrorMessage("Impossible de sauvegarder les coordonnées générales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-700" size={20} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <User size={16} className="text-emerald-700" />
          Coordonnées Générales de l'Établissement / Entité
        </h3>
        {isSaved && (
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle2 size={14} /> Enregistré !
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Nom du Référent / Contact *
            </label>
            <input
              type="text"
              name="displayName"
              required
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Nom Prénom"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Raison Sociale / Entité *
            </label>
            <input
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Nom de l'entreprise / Exploitation"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Numéro de SIRET *
            </label>
            <input
              type="text"
              name="siret"
              required
              maxLength="14"
              value={formData.siret}
              onChange={handleChange}
              placeholder="14 chiffres sans espaces"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Téléphone de Contact *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="06 00 00 00 00"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-2xl border transition-colors ${
            geoStatus === "invalid"
              ? "bg-red-50/50 border-red-200"
              : geoStatus === "valid"
              ? "bg-emerald-50/40 border-emerald-100"
              : "bg-gray-50/60 border-gray-100"
          }`}
        >
          <div className="sm:col-span-2">
            <label className="block font-bold text-gray-700 mb-1">
              Adresse Physique (Livraison / Collecte) *
            </label>
            <div className="relative">
              <MapPin
                className={`absolute left-3 top-2.5 ${
                  geoStatus === "invalid" ? "text-red-500" : "text-emerald-600"
                }`}
                size={16}
              />
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                onBlur={handleAddressBlur}
                placeholder="Numéro et nom de rue"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Code Postal *
            </label>
            <input
              type="text"
              name="postalCode"
              required
              maxLength="5"
              value={formData.postalCode}
              onChange={handleChange}
              onBlur={handleAddressBlur}
              placeholder="31000"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-bold text-gray-700 mb-1">Ville *</label>
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              onBlur={handleAddressBlur}
              placeholder="Toulouse"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* 🎯 Feedback GeoFence temps réel */}
          <div className="sm:col-span-3">
            {geoStatus === "checking" && (
              <p className="flex items-center gap-1.5 text-gray-500 font-bold">
                <Loader2 size={13} className="animate-spin" />
                Vérification de la zone de livraison...
              </p>
            )}
            {geoStatus === "valid" && (
              <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 size={13} />
                Adresse dans le périmètre de livraison (50 km).
              </p>
            )}
            {geoStatus === "invalid" && (
              <p className="flex items-center gap-1.5 text-red-600 font-bold">
                <AlertTriangle size={13} className="shrink-0" />
                {geoMessage}
              </p>
            )}
            {geoStatus === "idle" && (
              <p className="text-[11px] text-gray-400 font-medium">
                Cette adresse doit se situer à moins de 50 km de Saint-Rémy-sur-Avre.
              </p>
            )}
          </div>
        </div>

        {/* --- Adresse de facturation --- */}
        <div className="pt-2 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-2">
              <MapPin size={14} className="text-emerald-700" />
              Adresse de Facturation
            </h4>
            <label className="flex items-center gap-2 font-bold text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                name="billingSameAsAddress"
                checked={formData.billingSameAsAddress}
                onChange={handleChange}
                className="w-4 h-4 accent-emerald-700 cursor-pointer"
              />
              Identique à l'adresse physique
            </label>
          </div>

          {!formData.billingSameAsAddress && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">
                    Adresse de Facturation *
                  </label>
                  <input
                    type="text"
                    name="billingAddress"
                    required={!formData.billingSameAsAddress}
                    value={formData.billingAddress}
                    onChange={handleChange}
                    placeholder="Numéro et nom de rue"
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Code Postal *
                  </label>
                  <input
                    type="text"
                    name="billingPostalCode"
                    required={!formData.billingSameAsAddress}
                    maxLength="5"
                    value={formData.billingPostalCode}
                    onChange={handleChange}
                    placeholder="31000"
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  name="billingCity"
                  required={!formData.billingSameAsAddress}
                  value={formData.billingCity}
                  onChange={handleChange}
                  placeholder="Toulouse"
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                L'adresse de facturation n'est pas soumise au contrôle GeoFence (elle ne sert pas à la livraison/collecte).
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || geoStatus === "checking" || geoStatus === "invalid"}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:bg-gray-300"
          >
            {geoStatus === "checking" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Vérification GeoFence (50 km)...</span>
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Enregistrer les coordonnées</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}