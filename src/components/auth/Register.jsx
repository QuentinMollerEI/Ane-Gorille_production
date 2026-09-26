import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../config/firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Store, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

import { MAX_RADIUS_KM } from "./register/constants.js";
import { useSiretVerification } from "./register/hooks/useSiretVerification.js";
import { useGeoFence } from "./register/hooks/useGeoFence.js";

import { RoleSelector } from "./register/components/RoleSelector.jsx";
import { SiretStep } from "./register/components/SiretStep.jsx";
import { LocationStep } from "./register/components/LocationStep.jsx";
import { CredentialsStep } from "./register/components/CredentialsStep.jsx";
import { MandateCheckbox } from "./register/components/MandateCheckbox.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("producteur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    verifyingLocation,
    locationVerified,
    detectedDistance,
    checkGeoDistance,
    resetLocationStatus
  } = useGeoFence();

  const {
    siret,
    setSiret,
    verifyingSiret,
    siretVerified,
    verifySiret,
    resetSiretStatus
  } = useSiretVerification({
    setCompanyName,
    setAddress,
    setPostalCode,
    setCity,
    onSiretVerified: (fullQuery) => checkGeoDistance({ customQueryAddress: fullQuery, setError })
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const cleanSiret = siret.replace(/\s/g, "");

    if (!siretVerified) {
      setError("Veuillez cliquer sur 'Vérifier SIRET' pour valider votre numéro d'identification.");
      return;
    }

    if (!locationVerified || detectedDistance === null) {
      setError("Veuillez cliquer sur 'Valider la Localisation' pour certifier la zone des 50 km.");
      return;
    }

    if (detectedDistance > MAX_RADIUS_KM) {
      setError(`Inscription impossible : Votre établissement (${detectedDistance} km) dépasse le rayon maximal de ${MAX_RADIUS_KM} km.`);
      return;
    }

    if (!email || !password || !companyName) {
      setError("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (!acceptTerms) {
      setError("Vous devez accepter le mandat de facturation et la politique des données.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userPayload = {
        uid: user.uid,
        email: email.trim(),
        role,
        companyName: companyName.trim(),
        displayName: companyName.trim(),
        siret: cleanSiret,
        siretVerified: true,
        locationVerified: true,
        phone: phone.trim() || "",
        address: address.trim() || "",
        postalCode: postalCode.trim() || "",
        city: city.trim() || "",
        department: postalCode.trim().substring(0, 2) || "28",
        distanceFromHubKm: detectedDistance,
        stripeAccountId: null,
        stripeOnboardingStatus: "NOT_CREATED",
        mandatFacturationAccepted: true,
        mandatFacturationDate: new Date().toISOString(),
        rgpdConsent: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userDocRef, userPayload);

      let targetModule = "boutique";
      if (role === "producteur" || role === "artisan") targetModule = "rayon";
      if (role === "livreur") targetModule = "route";

      navigate(`/dashboard?module=${targetModule}`);
    } catch (err) {
      console.error("Erreur création de compte :", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Cette adresse e-mail est déjà enregistrée.");
      } else {
        setError(err.message || "Impossible de créer le compte.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
          <Store className="text-emerald-700" size={28} />
          Inscription Sécurisée Âne & Gorille
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          Contrôle SIRET (SIRENE / Gouv) & Périmètre 50 km (Saint-Rémy-sur-Avre)
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        <RoleSelector selectedRole={role} onSelectRole={setRole} />

        <SiretStep
          siret={siret}
          onSiretChange={(e) => {
            setSiret(e.target.value);
            resetSiretStatus();
            resetLocationStatus();
          }}
          onVerifySiret={() => verifySiret(setError)}
          verifyingSiret={verifyingSiret}
          siretVerified={siretVerified}
          companyName={companyName}
          onCompanyNameChange={(e) => setCompanyName(e.target.value)}
        />

        <LocationStep
          address={address}
          onAddressChange={(e) => {
            setAddress(e.target.value);
            resetLocationStatus();
          }}
          postalCode={postalCode}
          onPostalCodeChange={(e) => {
            setPostalCode(e.target.value);
            resetLocationStatus();
          }}
          city={city}
          onCityChange={(e) => {
            setCity(e.target.value);
            resetLocationStatus();
          }}
          onValidateLocation={() => checkGeoDistance({ address, postalCode, city, setError })}
          verifyingLocation={verifyingLocation}
          locationVerified={locationVerified}
          detectedDistance={detectedDistance}
          maxRadiusKm={MAX_RADIUS_KM}
        />

        <CredentialsStep
          email={email}
          onEmailChange={(e) => setEmail(e.target.value)}
          phone={phone}
          onPhoneChange={(e) => setPhone(e.target.value)}
          password={password}
          onPasswordChange={(e) => setPassword(e.target.value)}
        />

        <MandateCheckbox
          acceptTerms={acceptTerms}
          onToggleTerms={(e) => setAcceptTerms(e.target.checked)}
        />

        <button
          type="submit"
          disabled={loading || !siretVerified || !locationVerified}
          className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Création du compte en cours...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Valider & Inscrire mon Compte ({role.toUpperCase()})</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-bold text-emerald-800 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}