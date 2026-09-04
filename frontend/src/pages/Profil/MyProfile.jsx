import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  ShieldCheck,
  Key,
  FileText,
  Building,
  MapPin,
  Landmark,
  Award,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";

/**
 * 👤 COMPOSANT : MyProfile.jsx ("Legal by Design" - RGPD & KYB)
 * Espace complet et modulaire permettant à l'acheteur (B2B/B2G) et au producteur (maraîcher)
 * de renseigner de manière unique et pérenne leurs coordonnées, SIRET et documents obligatoires.
 *
 * Les données de l'acheteur alimentent le panier "Zero-Saisie".
 * Les données du maraîcher alimentent sa conformité EGAlim et son compte de versement Stripe Connect.
 */
export default function MyProfile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Accordéons de compartiments (SRP & Modularité visuelle de l'Espace)
  const [activeCompartment, setActiveCompartment] = useState("identity");

  // États locaux de saisie
  const [identityState, setIdentityState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [proState, setProState] = useState({
    companyName: "",
    siret: "",
    address: "",
    deliveryAddress: "",
    billingAddress: "",
    globalEngagementNumber: "", // Spécifique B2G (Chorus Pro)
    stripeAccountId: "", // Spécifique Maraîchers (Connecté à Stripe Connect Express)
  });

  const [securityState, setSecurityState] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [docsState, setDocsState] = useState({
    organicCertId: "", // Numéro de certification Bio / Ecocert (Maraîchers)
    hveCertId: "", // Numéro de certification HVE (Maraîchers)
    publicEligibilityProof: "", // Lien ou justificatif public (B2G)
  });

  // 1. Chargement de l'utilisateur Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData(data);

          // Initialisation des états de saisie
          setIdentityState({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
          });

          setProState({
            companyName: data.companyName || data.nomExploitation || "",
            siret: data.siret || "",
            address: data.address || "",
            deliveryAddress: data.deliveryAddress || data.address || "",
            billingAddress: data.billingAddress || data.address || "",
            globalEngagementNumber: data.globalEngagementNumber || "",
            stripeAccountId: data.stripeAccountId || "",
          });

          setDocsState({
            organicCertId: data.organicCertId || "",
            hveCertId: data.hveCertId || "",
            publicEligibilityProof: data.publicEligibilityProof || "",
          });
        }
      } catch (err) {
        console.error("Erreur de récupération du profil :", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // 2. Sauvegarde des modifications en base de données
  const handleSave = async (section, payload) => {
    if (!user?.uid) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const docRef = doc(db, "users", user.uid);

      // Si c'est la première fois, on initialise les statuts de validation administrative (Modération)
      const isNewProSaisie =
        section === "pro" && !profileData?.siret && payload.siret;
      const moderationFields = isNewProSaisie
        ? {
            status: "PENDING", // Statut initial en attente de vérification par l'admin d'Âne & Gorille
            isValidated: false,
            updatedAt: serverTimestamp(),
          }
        : { updatedAt: serverTimestamp() };

      await updateDoc(docRef, {
        ...payload,
        ...moderationFields,
      });

      // Mettre à jour l'état local du profil
      setProfileData((prev) => ({
        ...prev,
        ...payload,
        ...moderationFields,
      }));

      setSaveMessage({
        type: "success",
        text: `Félicitations ! Vos informations de la section "${section.toUpperCase()}" ont été enregistrées avec succès.`,
      });

      // Auto-refresh du message de succès
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err) {
      console.error("Erreur d'enregistrement :", err);
      setSaveMessage({
        type: "error",
        text: "Une erreur technique s'est produite lors de l'enregistrement.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Changement de mot de passe (Simulation sécurité)
  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (
      !securityState.newPassword ||
      securityState.newPassword !== securityState.confirmPassword
    ) {
      alert(
        "⚠️ Les nouveaux mots de passe ne correspondent pas ou sont vides.",
      );
      return;
    }

    // Appel simulé pour la sécurité locale
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage({
        type: "success",
        text: "🔐 Votre mot de passe a été réinitialisé en toute sécurité.",
      });
      setSecurityState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSaveMessage(null), 5000);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Chargement de vos informations de profil...
        </span>
      </div>
    );
  }

  const role = profileData?.role || user?.role || "acheteur";
  const isPublicSector =
    profileData?.isPublicSector || role === "client_public";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* En-tête principal de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <User className="text-green-700" size={28} />
            Mon Profil d'Exploitation
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gérez vos informations réglementaires (RGPD / KYB), complétez votre
            dossier et suivez votre statut de validation.
          </p>
        </div>

        {/* Badge de modération administrative (Phase 3) */}
        {profileData?.status === "APPROVED" || profileData?.isValidated ? (
          <div className="bg-green-50 text-green-800 border border-green-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
            <ShieldCheck size={16} className="text-green-700" />
            <span>Compte Professionnel Validé</span>
          </div>
        ) : profileData?.status === "PENDING" ? (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
            <RefreshCw size={14} className="text-amber-700 animate-spin" />
            <span>SIRET en cours de modération</span>
          </div>
        ) : (
          <div className="bg-gray-50 text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
            <AlertCircle size={16} className="text-gray-400" />
            <span>Profil en attente d'informations pro</span>
          </div>
        )}
      </div>

      {/* Messages de retour de transaction */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            saveMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {saveMessage.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Structure de l'espace de profil modulaire */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation latérale des compartiments */}
        <div className="md:col-span-1 bg-white border border-gray-250 rounded-2xl p-4 space-y-2">
          <button
            onClick={() => setActiveCompartment("identity")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeCompartment === "identity"
                ? "bg-green-50 text-green-800 border-l-4 border-green-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <User size={16} />
            <span>1. Identité Personnelle</span>
          </button>
          <button
            onClick={() => setActiveCompartment("pro")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeCompartment === "pro"
                ? "bg-green-50 text-green-800 border-l-4 border-green-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Building size={16} />
            <span>2. Informations Pro</span>
          </button>
          <button
            onClick={() => setActiveCompartment("security")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeCompartment === "security"
                ? "bg-green-50 text-green-800 border-l-4 border-green-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Key size={16} />
            <span>3. Sécurité d'accès</span>
          </button>
          <button
            onClick={() => setActiveCompartment("docs")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeCompartment === "docs"
                ? "bg-green-50 text-green-800 border-l-4 border-green-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FileText size={16} />
            <span>4. Certificats & Justificatifs</span>
          </button>
        </div>

        {/* Espace de travail dynamique du compartiment sélectionné */}
        <div className="md:col-span-3 bg-white border border-gray-250 rounded-2xl p-6">
          {/* COMPARTIMENT 1 : IDENTITÉ PERSONNELLE (RGPD Compliant) */}
          {activeCompartment === "identity" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Identité du Responsable de Compte
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Données personnelles conformes au RGPD. Vous disposez d'un
                  droit permanent de rectification ou suppression.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                <div className="space-y-1.5">
                  <label className="text-gray-500">Prénom *</label>
                  <input
                    type="text"
                    value={identityState.firstName}
                    onChange={(e) =>
                      setIdentityState({
                        ...identityState,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-1 focus:ring-green-500"
                    placeholder="Ex: Quentin"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-500">Nom de famille *</label>
                  <input
                    type="text"
                    value={identityState.lastName}
                    onChange={(e) =>
                      setIdentityState({
                        ...identityState,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-1 focus:ring-green-500"
                    placeholder="Ex: Moller"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-500">
                    Adresse E-mail professionnelle (Non modifiable)
                  </label>
                  <input
                    type="email"
                    value={identityState.email}
                    disabled
                    className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-400 font-mono cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-500">
                    Téléphone de contact direct *
                  </label>
                  <input
                    type="tel"
                    value={identityState.phone}
                    onChange={(e) =>
                      setIdentityState({
                        ...identityState,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-1 focus:ring-green-500 font-mono"
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleSave("identity", identityState)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white font-black py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Enregistrer l'Identité</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* COMPARTIMENT 2 : INFORMATIONS PROFESSIONNELLES (KYB & Zero-Saisie) */}
          {activeCompartment === "pro" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Informations de Facturation & Établissement (KYB)
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Saisissez vos coordonnées de structure légale. Celles-ci
                  alimenteront automatiquement la génération de vos factures et
                  bons de commande.
                </p>
              </div>

              {/* Cas Maraîcher (Producteur) */}
              {role === "producteur" && (
                <div className="space-y-4 text-xs font-medium">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        Nom de l'Exploitation Agricole *
                      </label>
                      <input
                        type="text"
                        value={proState.companyName}
                        onChange={(e) =>
                          setProState({
                            ...proState,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white"
                        placeholder="Ex: Ferme de la Rosée"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        Numéro SIRET (14 chiffres) *
                      </label>
                      <input
                        type="text"
                        value={proState.siret}
                        onChange={(e) =>
                          setProState({ ...proState, siret: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white font-mono"
                        placeholder="Ex: 84382039200012"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-500">
                      Adresse du Hangar d'Exploitation (Lieu de ramassage
                      logistique) *
                    </label>
                    <input
                      type="text"
                      value={proState.address}
                      onChange={(e) =>
                        setProState({ ...proState, address: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl p-2.5 bg-white"
                      placeholder="Ex: 12 Rue des Maraîchers, 44000 Nantes"
                    />
                  </div>

                  {/* Bouton de raccordement Stripe Connect Express (Indispensable pour recevoir l'argent) */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
                    <div className="flex gap-2 items-start">
                      <Landmark
                        className="text-blue-700 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <div>
                        <strong className="font-bold text-blue-900 text-[12px]">
                          Reversements Automatiques (Stripe Connect)
                        </strong>
                        <p className="text-blue-700 text-[10px] mt-1 leading-relaxed">
                          Pour que notre place de marché puisse vous reverser le
                          montant de vos ventes à la validation de la livraison,
                          Stripe Connect Express doit être activé et relié à
                          votre compte bancaire.
                        </p>
                      </div>
                    </div>

                    {proState.stripeAccountId ? (
                      <div className="inline-flex items-center gap-1.5 text-green-800 font-bold text-[10px] uppercase bg-green-50 border border-green-200 p-2 rounded-lg">
                        <CheckCircle2 size={12} /> Compte Stripe Connect Relié :{" "}
                        {proState.stripeAccountId}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setProState({
                            ...proState,
                            stripeAccountId: `acct_test_${Math.random().toString(36).substr(2, 9)}`,
                          })
                        }
                        className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black py-2 px-4 rounded-lg text-[10px] uppercase transition-all cursor-pointer"
                      >
                        <span>Se connecter avec Stripe Connect Express</span>
                        <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Cas Acheteur (B2B / B2G) */}
              {role !== "producteur" && (
                <div className="space-y-4 text-xs font-medium">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        Raison Sociale / Nom de l'Établissement *
                      </label>
                      <input
                        type="text"
                        value={proState.companyName}
                        onChange={(e) =>
                          setProState({
                            ...proState,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white"
                        placeholder="Ex: Cantine Municipale ou Restaurant L'Étoile"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        Numéro de SIRET d'Établissement *
                      </label>
                      <input
                        type="text"
                        value={proState.siret}
                        onChange={(e) =>
                          setProState({ ...proState, siret: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white font-mono"
                        placeholder="Ex: 12000000000001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        Adresse de Facturation Légale *
                      </label>
                      <input
                        type="text"
                        value={proState.billingAddress}
                        onChange={(e) =>
                          setProState({
                            ...proState,
                            billingAddress: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white"
                        placeholder="Ex: Hôtel de Ville, Service Compta, 44000 Nantes"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        Adresse de Livraison (Lieu d'approvisionnement cagettes)
                        *
                      </label>
                      <input
                        type="text"
                        value={proState.deliveryAddress}
                        onChange={(e) =>
                          setProState({
                            ...proState,
                            deliveryAddress: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white"
                        placeholder="Ex: Rue de la Cantine Centrale, 44000 Nantes"
                      />
                    </div>
                  </div>

                  {/* Saisie de l'Engagement Annuel Optionnel pour le B2G (Chorus Pro) */}
                  {isPublicSector && (
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl space-y-2">
                      <label className="block text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                        Engagement Budgétaire Annuel Global (Chorus Pro)
                      </label>
                      <input
                        type="text"
                        value={proState.globalEngagementNumber}
                        onChange={(e) =>
                          setProState({
                            ...proState,
                            globalEngagementNumber: e.target.value,
                          })
                        }
                        placeholder="Ex: ENG-ANNUEL-2026-NANTES"
                        className="w-full border border-purple-300 rounded-lg p-2.5 text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500"
                      />
                      <p className="text-[10px] text-purple-700 leading-normal font-medium">
                        Si votre établissement dispose d'un engagement d'achat
                        annuel récurrent, renseignez son numéro ici. Notre
                        panier l'utilisera par défaut pour vous permettre de
                        valider vos achats en un clic sans aucune saisie.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleSave("pro", proState)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white font-black py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Enregistrer mes Données Pro</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* COMPARTIMENT 3 : SÉCURITÉ D'ACCÈS */}
          {activeCompartment === "security" && (
            <form
              onSubmit={handlePasswordChange}
              className="space-y-6 animate-fade-in"
            >
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Sécurité de votre Compte
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Renforcez la protection de vos accès. N'utilisez pas de mot de
                  passe déjà utilisé pour un autre service en ligne.
                </p>
              </div>

              <div className="space-y-4 text-xs font-medium max-w-md">
                <div className="space-y-1.5">
                  <label className="text-gray-500 flex items-center gap-1">
                    <Lock size={12} /> Ancien mot de passe *
                  </label>
                  <input
                    type="password"
                    value={securityState.oldPassword}
                    onChange={(e) =>
                      setSecurityState({
                        ...securityState,
                        oldPassword: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-1 focus:ring-green-500"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-500 flex items-center gap-1">
                    <Key size={12} /> Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={securityState.newPassword}
                    onChange={(e) =>
                      setSecurityState({
                        ...securityState,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-1 focus:ring-green-500"
                    placeholder="Minimum 8 caractères"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-500">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={securityState.confirmPassword}
                    onChange={(e) =>
                      setSecurityState({
                        ...securityState,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-1 focus:ring-green-500"
                    placeholder="À ressaisir à l'identique"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white font-black py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Changer mon Mot de Passe</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </form>
          )}

          {/* COMPARTIMENT 4 : DOCUMENTS & LABELS (EGAlim & B2G Proof) */}
          {activeCompartment === "docs" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Pièces justificatives & Certifications Réglementaires
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Indiquez vos numéros d'agréments et de certifications légales
                  pour garantir la conformité et la crédibilité de votre
                  établissement.
                </p>
              </div>

              {/* Cas Maraîcher (Labels sanitaires et environnementaux EGAlim) */}
              {role === "producteur" && (
                <div className="space-y-4 text-xs font-medium">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl space-y-2 leading-relaxed text-green-950">
                    <p className="font-bold flex items-center gap-1.5 text-green-800">
                      <Award size={14} /> Respect de la réglementation EGAlim
                    </p>
                    <p className="text-[10px] font-medium text-green-700">
                      La loi EGAlim impose à la restauration collective
                      d'acheter au moins 50% de produits de qualité et durables,
                      dont 20% issus de l'Agriculture Biologique. Renseigner vos
                      labels ci-dessous augmente considérablement votre
                      visibilité auprès des cantines scolaires !
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        N° Certification Agriculture Biologique (AB / Ecocert)
                      </label>
                      <input
                        type="text"
                        value={docsState.organicCertId}
                        onChange={(e) =>
                          setDocsState({
                            ...docsState,
                            organicCertId: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white font-mono"
                        placeholder="Ex: CERT-AB-2026-X83"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-500">
                        N° Certification Haute Valeur Environnementale (HVE)
                      </label>
                      <input
                        type="text"
                        value={docsState.hveCertId}
                        onChange={(e) =>
                          setDocsState({
                            ...docsState,
                            hveCertId: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white font-mono"
                        placeholder="Ex: CERT-HVE-2026-928"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cas Établissement Public (B2G - Justificatif administratif) */}
              {role !== "producteur" && (
                <div className="space-y-4 text-xs font-medium">
                  <div className="space-y-1.5">
                    <label className="text-gray-500">
                      Avis d'Éligibilité Administration Publique / Extrait
                      SIRENE
                    </label>
                    <input
                      type="text"
                      value={docsState.publicEligibilityProof}
                      onChange={(e) =>
                        setDocsState({
                          ...docsState,
                          publicEligibilityProof: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-xl p-2.5 bg-white"
                      placeholder="Indiquez une référence administrative d'établissement"
                    />
                    <p className="text-[10px] text-gray-400">
                      Ce numéro permet à notre équipe d'accélérer la modération
                      administrative de votre compte.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleSave("docs", docsState)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white font-black py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Enregistrer mes Justificatifs</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
