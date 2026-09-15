// Chemin du fichier : src/pages/MonProfil/components/GeneralInfoForm.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { checkGeoFence } from "../../../services/logisticsService";
import {
  User,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Building2,
  Lock,
  Building,
} from "lucide-react";

/**
 * COMPOSANT : GeneralInfoForm.jsx
 * Saisie des coordonnées de base, contrôle GeoFence (50 km / Saint-Rémy-sur-Avre)
 * en temps réel (onBlur) + à la soumission, et calcul dynamique de isProfileCompleted.
 * Champ SIRET verrouillé de manière immuable pour conformité réglementaire.
 */
export default function GeneralInfoForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Statut du contrôle GeoFence temps réel : "idle" | "checking" | "valid" | "invalid"
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

  // ÉTATS POUR L'AUTO-COMPLÉTION BAN DE L'ADRESSE DE FACTURATION
  const [billingAddressQuery, setBillingAddressQuery] = useState("");
  const [billingSuggestions, setBillingSuggestions] = useState([]);
  const [showBillingSuggestions, setShowBillingSuggestions] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
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

          if (data.billingAddress && !data.billingSameAsAddress) {
            setBillingAddressQuery(
              `${data.billingAddress}, ${data.billingPostalCode} ${data.billingCity}`
            );
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des informations générales :",
          error
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

  // RECHERCHE BAN POUR L'ADRESSE DE FACTURATION
  const handleBillingAddressSearch = async (queryText) => {
    setBillingAddressQuery(queryText);
    if (queryText.length < 3) {
      setBillingSuggestions([]);
      setShowBillingSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          queryText
        )}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        const list = data.features.map((feat) => ({
          street: feat.properties.name,
          zipCode: feat.properties.postcode,
          city: feat.properties.city,
          label: feat.properties.label,
        }));
        setBillingSuggestions(list);
        setShowBillingSuggestions(true);
      }
    } catch (err) {
      console.error("Erreur API BAN :", err);
    }
  };

  const handleSelectBillingAddress = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: suggestion.street || "",
      billingPostalCode: suggestion.zipCode || "",
      billingCity: suggestion.city || "",
    }));
    setBillingAddressQuery(suggestion.label);
    setShowBillingSuggestions(false);
  };

  // Contrôle GeoFence en temps réel, déclenché à la perte de focus
  const runGeoCheck = async (nextFormData) => {
    const postalCode = nextFormData.postalCode.trim();
    const city = nextFormData.city.trim();

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
            "Cette adresse se situe au-delà du périmètre de livraison/collecte autorisé (50 km autour de Saint-Rémy-sur-Avre)."
        );
      } else {
        setGeoStatus("valid");
        setGeoMessage(null);
      }
    } catch (error) {
      console.error("Erreur lors du contrôle GeoFence :", error);
      setGeoStatus("invalid");
      setGeoMessage(
        "Impossible de vérifier la zone de livraison pour le moment. Le contrôle sera refait à l'enregistrement."
      );
    }
  };

  const handleAddressBlur = () => {
    runGeoCheck(formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid || isSubmitting || geoStatus === "checking") return;

    setErrorMessage(null);

    // Contrôle GeoFence bloquant avant soumission
    const postalCode = formData.postalCode.trim();
    const city = formData.city.trim();

    if (!postalCode || !city) {
      const msg = "Veuillez renseigner un code postal et une ville valides.";
      setGeoStatus("invalid");
      setGeoMessage(msg);
      setErrorMessage(msg);
      return;
    }

    try {
      const geoResult = await checkGeoFence(postalCode, city, 50);
      if (geoResult && geoResult.isEligible === false) {
        const message =
          geoResult.message ||
          "Cette adresse se situe au-delà du périmètre de livraison/collecte autorisé (50 km autour de Saint-Rémy-sur-Avre). Veuillez saisir une adresse valide.";
        setGeoStatus("invalid");
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

      // 1. Vérification des coordonnées de base
      const hasBaseInfo = Boolean(
        formData.displayName.trim() &&
          formData.companyName.trim() &&
          formData.siret.trim() &&
          formData.phone.trim() &&
          formData.address.trim() &&
          formData.postalCode.trim() &&
          formData.city.trim()
      );

      // 1bis. Vérification de l'adresse de facturation (si distincte)
      const hasBillingInfo = formData.billingSameAsAddress
        ? true
        : Boolean(
            formData.billingAddress.trim() &&
              formData.billingPostalCode.trim() &&
              formData.billingCity.trim()
          );

      // 2. Vérification des spécificités selon le rôle
      const userRole = currentData.role || "acheteur_prive";
      let isRoleComplete = false;

      if (userRole === "acheteur_prive") {
        isRoleComplete = Boolean(
          currentData.preferredPayment ||
            currentData.sepaMandateActive ||
            currentData.billieApproved
        );
      } else if (userRole === "acheteur_public") {
        isRoleComplete = Boolean(currentData.siretChorus);
      } else if (userRole === "producteur") {
        isRoleComplete = Boolean(
          currentData.stripeAccountId || currentData.harvestAddress
        );
      } else if (userRole === "livreur") {
        isRoleComplete = Boolean(
          currentData.vehicleType || currentData.tourZone
        );
      } else if (userRole === "admin") {
        isRoleComplete = true;
      }

      const isComplete = hasBaseInfo && hasBillingInfo && isRoleComplete;

      // 3. Sauvegarde Firestore avec écriture du statut
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
      <div className="p-8 text-center flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs bg-white border border-gray-200 rounded-3xl shadow-sm">
        <Loader2 size={18} className="animate-spin text-emerald-600" />
        <span>Chargement des coordonnées...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6 text-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <User className="text-emerald-700" size={18} />
          <span>Informations Générales & Coordonnées de l'Établissement</span>
        </h3>
        {isSaved && (
          <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fade-in">
            <CheckCircle2 size={14} /> Enregistré !
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom & Prénom du responsable */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 block">
              Nom & Prénom du Responsable *
            </label>
            <input
              type="text"
              name="displayName"
              required
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Ex: Martin Dupont"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Raison Sociale */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 block">
              Raison Sociale / Nom de l'Établissement *
            </label>
            <input
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Ex: Ferme du Val / Cantine Municipale"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* CHAMP SIRET — Strictement Verrouillé & Immuable */}
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-700 flex items-center gap-1">
                <Building2 size={13} className="text-gray-400" /> Numéro SIRET (14 chiffres) *
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                <Lock size={10} /> Donnée certifiée (Non modifiable)
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                name="siret"
                value={formData.siret || ""}
                disabled={true}
                readOnly={true}
                placeholder="14 chiffres"
                className="w-full p-2.5 bg-gray-100/80 border border-gray-200 rounded-xl font-mono text-xs text-gray-500 font-bold cursor-not-allowed outline-none select-none pr-9"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={14} />
              </div>
            </div>

            <p className="text-[10px] text-gray-400 font-medium">
              Le SIRET est vérifié auprès du registre national lors de la création du compte. En cas d'erreur ou de changement de structure, veuillez contacter le support administrateur.
            </p>
          </div>

          {/* Téléphone */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 block">
              Téléphone de Contact *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ex: 06 12 34 56 78"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Adresse Physique */}
          <div className="space-y-1 md:col-span-2">
            <label className="font-bold text-gray-700 block">
              Adresse Physique (Livraison / Collecte) *
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Ex: 15 Rue des Maraîchers"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Code Postal */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 block">
              Code Postal *
            </label>
            <input
              type="text"
              name="postalCode"
              required
              value={formData.postalCode}
              onChange={handleChange}
              onBlur={handleAddressBlur}
              placeholder="Ex: 28380"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Ville */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 block">
              Ville *
            </label>
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              onBlur={handleAddressBlur}
              placeholder="Ex: Saint-Rémy-sur-Avre"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Indication Périmètre GeoFence */}
        {geoStatus === "checking" && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl font-medium text-xs flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-blue-600 shrink-0" />
            <span>Vérification du périmètre de livraison (50 km autour de Saint-Rémy-sur-Avre)...</span>
          </div>
        )}

        {geoStatus === "valid" && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-medium text-xs flex items-center gap-2">
            <MapPin size={14} className="text-emerald-600 shrink-0" />
            <span>Adresse éligible à la collecte et livraison locale (Zone &lt; 50 km).</span>
          </div>
        )}

        {geoStatus === "invalid" && geoMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-600 shrink-0" />
            <span>{geoMessage}</span>
          </div>
        )}

        {/* Gestion de l'Adresse de Facturation */}
        <div className="pt-2 border-t space-y-3">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 text-xs">
            <input
              type="checkbox"
              name="billingSameAsAddress"
              checked={formData.billingSameAsAddress}
              onChange={handleChange}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>L'adresse de facturation est identique à l'adresse physique</span>
          </label>

          {!formData.billingSameAsAddress && (
            <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl animate-fade-in">
              <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <Building size={14} className="text-emerald-700" />
                <span>Adresse de Facturation Spécifique</span>
              </h4>

              {/* Recherche BAN pour l'adresse de facturation */}
              <div className="relative space-y-1">
                <label className="font-bold text-gray-700 block">
                  Rechercher l'adresse de facturation (API BAN)
                </label>
                <input
                  type="text"
                  value={billingAddressQuery}
                  onChange={(e) => handleBillingAddressSearch(e.target.value)}
                  placeholder="Tapez votre adresse..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />

                {showBillingSuggestions && billingSuggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y">
                    {billingSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelectBillingAddress(item)}
                        className="p-2.5 hover:bg-emerald-50 cursor-pointer font-medium text-gray-800 transition-colors"
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="font-bold text-gray-700 block">Voie / Rue *</label>
                  <input
                    type="text"
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    placeholder="Ex: 10 Rue de la Paix"
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Code Postal *</label>
                  <input
                    type="text"
                    name="billingPostalCode"
                    value={formData.billingPostalCode}
                    onChange={handleChange}
                    placeholder="Ex: 75001"
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="font-bold text-gray-700 block">Ville *</label>
                  <input
                    type="text"
                    name="billingCity"
                    value={formData.billingCity}
                    onChange={handleChange}
                    placeholder="Ex: Paris"
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bouton de Sauvegarde */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || geoStatus === "checking"}
            className="py-3 px-6 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Enregistrer mes coordonnées</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}