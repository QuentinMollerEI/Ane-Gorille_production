import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Save, CheckCircle, ShieldAlert, Building2 } from "lucide-react";

import ProfileHeader from "./components/ProfileHeader";
import GeneralInfoForm from "./components/GeneralInfoForm";

// Import Containers par rôles
import AcheteurPublicContainer from "./AcheteurPublic/AcheteurPublicContainer";
import AcheteurPriveContainer from "./AcheteurPrive/AcheteurPriveContainer";
import ProducteurContainer from "./Producteur/ProducteurContainer";
import LivreurContainer from "./Livreur/LivreurContainer";
import AdminContainer from "./Admin/AdminContainer";

/**
 * 🔒 PARENT ORCHESTRATEUR CENTRAL : MonProfilContainer.jsx
 * Responsabilité unique (SRP) : Orchestrer le chargement, la fusion de session (Firebase Auth + Firestore),
 * centraliser les règles de validation pour chaque rôle et rendre l'interface cohérente et symétrique.
 * Affiche un bouton de sauvegarde global et normalisé en bas de page pour tous les rôles.
 */
export default function MonProfilContainer() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // 1. Chargement et fusion des données (Firebase Auth + Firestore)
  useEffect(() => {
    async function fetchProfile() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const dbData = docSnap.data();
          // Fusion intelligente : Priorise Firestore, mais autopréremplit avec Firebase Auth si vide
          setProfileData({
            uid: user.uid,
            displayName: dbData.displayName || user.displayName || "",
            email: dbData.email || user.email || "",
            phone: dbData.phone || "",
            role: dbData.role || "buyer", // buyer | producer | driver | admin
            buyerProfile: dbData.buyerProfile || "B2B", // B2B | B2G
            validationStatus: dbData.validationStatus || "INCOMPLET",
            ...dbData,
          });
        } else {
          // Onboarding autonome pour un nouvel utilisateur
          setProfileData({
            uid: user.uid,
            displayName: user.displayName || "",
            email: user.email || "",
            phone: "",
            role: "buyer",
            buyerProfile: "B2B",
            validationStatus: "INCOMPLET",
          });
        }
      } catch (err) {
        console.error("Erreur d'acquisition de profil Firestore :", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Auto-effacement de la notification de succès après 5 secondes
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // 2. Gestion des modifications (SRP)
  const handleFieldChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // 3. Règles de validation centralisées (Matrice réglementaire et légale)

  // Validation commune (Nom du référent, téléphone de liaison direct)
  const validateCommon = () => {
    const commonErrors = {};
    if (!profileData?.displayName?.trim()) {
      commonErrors.displayName = "Le nom du référent principal est requis.";
    }
    if (!profileData?.phone?.trim()) {
      commonErrors.phone =
        "Le numéro de téléphone direct de liaison est requis.";
    }
    return commonErrors;
  };

  // Validation Acheteur Privé (B2B / Billie)
  const validateB2B = () => {
    const b2bErrors = {};
    const siretClean = (profileData?.siret || "").replace(/\s/g, "");

    if (!profileData?.companyName?.trim()) {
      b2bErrors.companyName =
        "La Raison Sociale / Nom commercial est obligatoire.";
    }
    if (!profileData?.siret?.trim()) {
      b2bErrors.siret =
        "Le numéro de SIRET est obligatoire pour l'évaluation de solvabilité.";
    } else if (siretClean.length !== 14 || isNaN(Number(siretClean))) {
      b2bErrors.siret =
        "Un SIRET français doit comporter exactement 14 chiffres.";
    }
    if (!profileData?.billingEmail?.trim()) {
      b2bErrors.billingEmail =
        "L'email de comptabilité B2B est obligatoire pour l'affacturage Billie.";
    }
    if (!profileData?.deliveryAddress?.trim()) {
      b2bErrors.deliveryAddress =
        "L'adresse de livraison pour la tournée du chauffeur est obligatoire.";
    }
    if (!profileData?.deliveryPhone?.trim()) {
      b2bErrors.deliveryPhone =
        "Le téléphone du point de livraison est requis.";
    }
    if (!profileData?.vatNumber?.trim()) {
      b2bErrors.vatNumber =
        "Le numéro de TVA intracommunautaire est obligatoire pour la facturation d'entreprise.";
    }
    return b2bErrors;
  };

  // Validation Acheteur Public (B2G / Chorus Pro)
  const validateB2G = () => {
    const b2gErrors = {};
    const siretClean = (profileData?.siret || "").replace(/\s/g, "");

    if (!profileData?.companyName?.trim()) {
      b2gErrors.companyName =
        "La Raison Sociale officielle de l'établissement public est requise.";
    }
    if (!profileData?.siret?.trim()) {
      b2gErrors.siret = "Le numéro de SIRET administratif est obligatoire.";
    } else if (siretClean.length !== 14 || isNaN(Number(siretClean))) {
      b2gErrors.siret =
        "Un SIRET administratif français doit comporter exactement 14 chiffres.";
    }
    if (!profileData?.billingEmail?.trim()) {
      b2gErrors.billingEmail =
        "L'email de comptabilité (Factur-X) est obligatoire.";
    }
    if (!profileData?.deliveryAddress?.trim()) {
      b2gErrors.deliveryAddress =
        "L'adresse physique de livraison pour les bons de livraison est requise.";
    }
    if (!profileData?.deliveryPhone?.trim()) {
      b2gErrors.deliveryPhone =
        "Le numéro de téléphone du quai ou contact de réception est requis.";
    }
    if (!profileData?.globalEngagementNumber?.trim()) {
      b2gErrors.globalEngagementNumber =
        "Le numéro d'Engagement Juridique (EJ) global ou bon de commande administratif est obligatoire pour Chorus Pro.";
    }
    if (!profileData?.billingDirectorName?.trim()) {
      b2gErrors.billingDirectorName =
        "Le nom de l'ordonnateur / intendant responsable du paiement est requis.";
    }
    return b2gErrors;
  };

  // Validation Producteur (Maraîcher / Stripe Connect)
  const validateProducer = () => {
    const prodErrors = {};
    const siretClean = (profileData?.siret || "").replace(/\s/g, "");

    if (!profileData?.companyName?.trim()) {
      prodErrors.companyName =
        "Le nom de l'exploitation agricole est obligatoire.";
    }
    if (!profileData?.siret?.trim()) {
      prodErrors.siret =
        "Le numéro de SIRET est obligatoire pour l'identification de vendeur tiers.";
    } else if (siretClean.length !== 14 || isNaN(Number(siretClean))) {
      prodErrors.siret =
        "Un SIRET français doit comporter exactement 14 chiffres.";
    }
    if (!profileData?.vatNumber?.trim()) {
      prodErrors.vatNumber =
        "Le numéro de TVA intracommunautaire est obligatoire.";
    }
    if (!profileData?.iduAdeme?.trim()) {
      prodErrors.iduAdeme =
        "L'Identifiant Unique ADEME (REP) est requis pour la traçabilité environnementale.";
    }
    if (!profileData?.harvestPhone?.trim()) {
      prodErrors.harvestPhone =
        "Le téléphone d'urgence hangar est obligatoire pour coordonner la logistique.";
    }
    if (!profileData?.producerAddress?.trim()) {
      prodErrors.producerAddress =
        "L'adresse physique de ramassage est requise pour dessiner les tournées.";
    }

    if (profileData?.isBio) {
      if (!profileData?.bioCertificationNumber?.trim()) {
        prodErrors.bioCertificationNumber =
          "Le numéro d'agrément de l'Agence Bio est obligatoire.";
      }
      if (!profileData?.bioControlBody) {
        prodErrors.bioControlBody =
          "L'organisme de contrôle (ex: Ecocert, Certipaq) est requis.";
      }
      if (!profileData?.bioCertificateExpiry && !profileData?.bioExpiryDate) {
        prodErrors.bioCertificateExpiry =
          "La date d'expiration de la certification bio est requise.";
      }
    }

    if (!profileData?.stripeAccountId?.trim()) {
      prodErrors.stripeAccountId =
        "Le raccordement de votre compte Stripe Connect Express (acct_...) est requis pour vos virements.";
    } else if (!profileData?.stripeAccountId.startsWith("acct_")) {
      prodErrors.stripeAccountId =
        "Un identifiant Stripe Connect Express valide doit commencer par 'acct_'.";
    }
    return prodErrors;
  };

  // Validation Livreur (Transporteur / DREAL)
  const validateDriver = () => {
    const driverErrors = {};
    const siretClean = (profileData?.siret || "").replace(/\s/g, "");

    if (!profileData?.companyName?.trim()) {
      driverErrors.companyName =
        "La dénomination sociale de l'entreprise de logistique est obligatoire.";
    }
    if (!profileData?.siret?.trim()) {
      driverErrors.siret =
        "Le numéro de SIRET de l'entreprise est obligatoire.";
    } else if (siretClean.length !== 14 || isNaN(Number(siretClean))) {
      driverErrors.siret =
        "Un SIRET français doit comporter exactement 14 chiffres.";
    }
    if (!profileData?.vatNumber?.trim()) {
      driverErrors.vatNumber =
        "Le numéro de TVA intracommunautaire est obligatoire.";
    }
    if (!profileData?.transportLicense?.trim()) {
      driverErrors.transportLicense =
        "Le numéro de licence de transport DREAL est obligatoire pour la conformité légale.";
    }
    if (!profileData?.transportLicenseExpiry) {
      driverErrors.transportLicenseExpiry =
        "La date d'expiration de la licence est requise.";
    }
    if (!profileData?.vehiclePlate?.trim()) {
      driverErrors.vehiclePlate =
        "La plaque d'immatriculation du véhicule de livraison est requise.";
    }
    if (!profileData?.maxLoadCapacity || profileData.maxLoadCapacity <= 0) {
      driverErrors.maxLoadCapacity =
        "La capacité de charge maximale du véhicule (kg) est requise.";
    }
    if (!profileData?.volumeCapacity || profileData.volumeCapacity <= 0) {
      driverErrors.volumeCapacity =
        "Le volume utile du véhicule (m³) est requis.";
    }
    if (!profileData?.activePickupTour && !profileData?.activeDeliveryTour) {
      driverErrors.noTourSelected =
        "Vous devez vous inscrire à au moins une des deux tournées (Ramassage ou Livraison).";
    }
    if (!profileData?.hasSanitaryCertificate) {
      driverErrors.hasSanitaryCertificate =
        "L'attestation d'agrément sanitaire (HACCP) pour le transport de denrées périssables est requise.";
    }
    return driverErrors;
  };

  // 4. Action de sauvegarde centralisée
  const handleGlobalSave = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);

    // 4.1 Exécution des validations
    const commonErrors = validateCommon();
    let subErrors = {};

    if (role === "buyer" && isPublicSector) {
      subErrors = validateB2G();
    } else if (role === "buyer" && !isPublicSector) {
      subErrors = validateB2B();
    } else if (role === "producer") {
      subErrors = validateProducer();
    } else if (role === "driver") {
      subErrors = validateDriver();
    }

    const combinedErrors = { ...commonErrors, ...subErrors };
    setErrors(combinedErrors);

    if (Object.keys(combinedErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 4.2 Nettoyage et formatage des données avant envoi
    try {
      setSaving(true);
      const docRef = doc(db, "users", user.uid);

      const siretClean = (profileData.siret || "").replace(/\s/g, "");
      const cleanedData = {
        ...profileData,
        siret: siretClean,
        updatedAt: new Date(),
      };

      // Si c'est un acheteur, on enregistre son profil type
      if (role === "buyer") {
        cleanedData.buyerProfile = isPublicSector ? "B2G" : "B2B";
        cleanedData.isPublicSector = isPublicSector;
      }

      // Progression du statut d'onboarding autonome
      if (profileData.validationStatus === "INCOMPLET") {
        cleanedData.validationStatus = "EN_ATTENTE_VALIDATION";
      }

      await updateDoc(docRef, cleanedData);
      setProfileData(cleanedData);
      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erreur de sauvegarde Firestore :", err);
      alert(
        "Une erreur est survenue lors de l'enregistrement de votre profil.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Chargement sécurisé de vos données de confiance...
        </span>
      </div>
    );
  }

  // Normalisation robuste des rôles
  const rawRole = profileData?.role || "buyer";
  const rawRoleLower = rawRole.toLowerCase();

  let role = "buyer";
  let isPublicSectorFromRole = false;

  if (
    rawRoleLower.includes("producer") ||
    rawRoleLower.includes("producteur")
  ) {
    role = "producer";
  } else if (
    rawRoleLower.includes("driver") ||
    rawRoleLower.includes("livreur") ||
    rawRoleLower.includes("transporteur")
  ) {
    role = "driver";
  } else if (rawRoleLower.includes("admin")) {
    role = "admin";
  } else if (
    rawRoleLower.includes("buyer") ||
    rawRoleLower.includes("acheteur")
  ) {
    role = "buyer";
    if (
      rawRoleLower.includes("public") ||
      rawRoleLower.includes("b2g") ||
      rawRoleLower.includes("etat") ||
      rawRoleLower.includes("collectivite")
    ) {
      isPublicSectorFromRole = true;
    }
  }

  const isPublicSector =
    isPublicSectorFromRole || profileData?.buyerProfile === "B2G";

  // Thème de couleur dynamique selon le rôle et le secteur
  const isB2GTheme = role === "buyer" && isPublicSector;
  const isDriverTheme = role === "driver";
  const themeColor = isB2GTheme || isDriverTheme ? "blue" : "green";

  const buttonStyleClass =
    themeColor === "blue"
      ? "bg-blue-700 hover:bg-blue-800 focus:ring-blue-500"
      : "bg-green-700 hover:bg-green-800 focus:ring-green-500";

  const textLabel = saving
    ? "Enregistrement de vos données..."
    : role === "buyer"
      ? isPublicSector
        ? "Enregistrer mon Profil B2G"
        : "Enregistrer mon Profil B2B"
      : role === "producer"
        ? "Enregistrer mon Profil Maraîcher"
        : "Enregistrer mon Profil Livreur";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* En-tête de conformité réglementaire */}
      <ProfileHeader
        userProfile={profileData}
        validationStatus={profileData?.validationStatus || "INCOMPLET"}
      />

      {/* Messages d'alertes UX */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs font-black text-red-800 animate-slide-in">
          <ShieldAlert size={18} />
          <span>
            Certains champs obligatoires sont incorrects ou vides. Veuillez
            vérifier vos données.
          </span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-xs font-black text-green-800 animate-slide-in">
          <CheckCircle size={18} />
          <span>
            Vos modifications ont été transmises et enregistrées avec succès !
          </span>
        </div>
      )}

      {/* Formulaire de profil unifié */}
      <form onSubmit={handleGlobalSave} className="space-y-6">
        {/* Partie commune : Identité connectée */}
        <GeneralInfoForm
          profileData={profileData}
          onChange={handleFieldChange}
          errors={errors}
        />

        {/* 🏢 SELECTION DU TYPE D'ACHETEUR (B2B vs B2G) - Bascule dynamique */}
        {role === "buyer" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs animate-slide-in">
            <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Building2 size={16} className="text-green-700" /> Structure
              Juridique de l'Établissement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleFieldChange("buyerProfile", "B2B")}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  !isPublicSector
                    ? "border-green-600 bg-green-50/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-xs font-black text-gray-900 uppercase">
                  Secteur Privé (B2B)
                </span>
                <span className="text-[10px] text-gray-500 font-medium leading-relaxed mt-2">
                  Pour les restaurants, épiceries, commerces privés et
                  grossistes. Paiement différé 30j garanti par Billie.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFieldChange("buyerProfile", "B2G")}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  isPublicSector
                    ? "border-blue-600 bg-blue-50/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-xs font-black text-gray-900 uppercase">
                  Secteur Public (B2G)
                </span>
                <span className="text-[10px] text-gray-500 font-medium leading-relaxed mt-2">
                  Pour les mairies, écoles, collèges, cantines publiques.
                  Règlement par Mandat Administratif via Chorus Pro.
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Routage adaptatif vers le compartiment de rôle correspondant */}
        {role === "buyer" && isPublicSector && (
          <AcheteurPublicContainer
            profileData={profileData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}

        {role === "buyer" && !isPublicSector && (
          <AcheteurPriveContainer
            profileData={profileData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}

        {role === "producer" && (
          <ProducteurContainer
            profileData={profileData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}

        {role === "driver" && (
          <LivreurContainer
            profileData={profileData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}

        {role === "admin" && <AdminContainer />}

        {/* Bouton de sauvegarde global et normalisé pour tous les rôles */}
        {role !== "admin" && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 text-white font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonStyleClass}`}
            >
              <Save size={16} />
              <span>{textLabel}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
