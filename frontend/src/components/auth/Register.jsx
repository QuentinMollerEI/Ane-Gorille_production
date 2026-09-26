import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db, functions } from "../../config/firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  Store,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileCheck,
  Search,
  CheckCircle2,
  MapPin,
  Building2,
  Lock
} from "lucide-react";

// Point central : Saint-Rémy-sur-Avre (28350)
const CENTRAL_LAT = 48.7628;
const CENTRAL_LON = 1.2422;
const MAX_RADIUS_KM = 50;

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function isValidLuhnSiret(siret) {
  const clean = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(clean.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("producteur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);

  // ÉTATS DE SÉCURITÉ
  const [verifyingSiret, setVerifyingSiret] = useState(false);
  const [siretVerified, setSiretVerified] = useState(false);

  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [detectedDistance, setDetectedDistance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // EFFETS AUTOMATIQUES (VÉRIFICATIONS)
  // ==========================================

  // 1. AUTO-VÉRIFICATION DU SIRET
  useEffect(() => {
    const cleanSiret = siret.replace(/\s/g, "");
    if (cleanSiret.length === 14 && isValidLuhnSiret(cleanSiret) && !siretVerified && !verifyingSiret) {
      handleVerifySiret(cleanSiret);
    }
  }, [siret, siretVerified]);

  // 2. AUTO-VÉRIFICATION DE L'ADRESSE (Debounce de 1 seconde)
  useEffect(() => {
    const isAddressComplete =
      address.trim().length >= 5 && postalCode.trim().length === 5 && city.trim().length >= 2;

    if (isAddressComplete && !locationVerified && detectedDistance === null && !verifyingLocation) {
      const timer = setTimeout(() => {
        checkGeoDistance();
      }, 1000); // 1 seconde de délai pour laisser l'utilisateur finir de taper
      return () => clearTimeout(timer);
    }
  }, [address, postalCode, city, locationVerified, detectedDistance]);

  // ==========================================
  // FONCTIONS DE VALIDATION
  // ==========================================

  const handleVerifySiret = async (cleanSiret) => {
    setSiretVerified(false);
    setLocationVerified(false);
    setDetectedDistance(null);
    setError("");
    setVerifyingSiret(true);

    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`);
      if (!res.ok) throw new Error("Impossible de contacter l'API du répertoire national SIRENE.");

      const data = await res.json();
      const companyResult = data.results && data.results.length > 0 ? data.results[0] : null;

      if (!companyResult) {
        throw new Error("Numéro SIRET introuvable dans le répertoire national SIRENE.");
      }

      const nomRaison = companyResult.nom_complet || companyResult.nom_raison_sociale || "";
      const siege = companyResult.siege || {};
      const fullAddr = siege.adresse || "";
      const pCode = siege.code_postal || "";
      const commune = siege.libelle_commune || "";

      setCompanyName(nomRaison);
      if (fullAddr) setAddress(fullAddr);
      if (pCode) setPostalCode(pCode);
      if (commune) setCity(commune);

      setSiretVerified(true);
    } catch (err) {
      console.error("Erreur SIRET :", err);
      setError(err.message || "Échec de la validation SIRET.");
      setSiretVerified(false);
    } finally {
      setVerifyingSiret(false);
    }
  };

  const checkGeoDistance = async () => {
    setLocationVerified(false);
    setDetectedDistance(null);
    setError("");

    const queryAddr = `${address}, ${postalCode} ${city}`;
    if (!queryAddr || queryAddr.trim().length < 5) return;

    setVerifyingLocation(true);

    try {
      try {
        const checkGeoFn = httpsCallable(functions, "checkGeoFenceServer");
        const cloudRes = await checkGeoFn({ address: queryAddr, postalCode, city });
        if (cloudRes.data && cloudRes.data.distanceKm !== undefined) {
          const dist = cloudRes.data.distanceKm;
          setDetectedDistance(dist);
          if (dist <= MAX_RADIUS_KM) {
            setLocationVerified(true);
            return;
          } else {
            setLocationVerified(false);
            setError(`Accès refusé : Votre entreprise est située à ${dist} km de Saint-Rémy-sur-Avre. Limite : ${MAX_RADIUS_KM} km.`);
            return;
          }
        }
      } catch (cloudErr) {
        console.warn("Fallback API Adresse directe :", cloudErr);
      }

      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(queryAddr)}&limit=1`
      );
      if (!res.ok) throw new Error("Service de géocodage indisponible.");

      const data = await res.json();
      const match = data.features && data.features.length > 0 ? data.features[0] : null;

      if (!match) {
        throw new Error("Adresse introuvable. Veuillez vérifier le libellé de la voie et du code postal.");
      }

      const [lon, lat] = match.geometry.coordinates;
      const distance = calculateDistanceKm(CENTRAL_LAT, CENTRAL_LON, lat, lon);

      setDetectedDistance(distance);

      if (distance > MAX_RADIUS_KM) {
        setLocationVerified(false);
        setError(
          `Accès refusé : Votre établissement se situe à ${distance} km de Saint-Rémy-sur-Avre (28350). Le rayon d'action est limité à ${MAX_RADIUS_KM} km.`
        );
      } else {
        setLocationVerified(true);
      }
    } catch (err) {
      console.error("Erreur Géolocalisation :", err);
      setError(err.message || "Échec de la vérification géographique.");
      setLocationVerified(false);
    } finally {
      setVerifyingLocation(false);
    }
  };

  // 3. SOUMISSION STRICTE
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const cleanSiret = siret.replace(/\s/g, "");

    if (!siretVerified) {
      setError("Le SIRET n'est pas encore validé ou est incorrect.");
      return;
    }

    if (!locationVerified || detectedDistance === null) {
      setError("L'adresse n'est pas encore validée ou se trouve hors de la zone des 50 km.");
      return;
    }

    if (detectedDistance > MAX_RADIUS_KM) {
      setError(`Inscription impossible : Votre établissement (${detectedDistance} km) dépasse la limite légale de ${MAX_RADIUS_KM} km.`);
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
        role: role,
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
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            Profil d'Activité Professionnelle *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setRole("producteur")}
              className={`p-3.5 rounded-2xl border-2 text-left text-xs transition-all cursor-pointer ${
                role === "producteur"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-bold">🥦 Producteur Maraîcher (Âne)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Récoltes alimentaires & produits frais</p>
            </button>

            <button
              type="button"
              onClick={() => setRole("artisan")}
              className={`p-3.5 rounded-2xl border-2 text-left text-xs transition-all cursor-pointer ${
                role === "artisan"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-bold">🦍 Artisan Créateur (Gorille)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Créations façonnées & fait main</p>
            </button>

            <button
              type="button"
              onClick={() => setRole("acheteur_prive")}
              className={`p-3.5 rounded-2xl border-2 text-left text-xs transition-all cursor-pointer ${
                role === "acheteur_prive"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-bold">💼 Acheteur Privé (B2B)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Restaurants, épiceries, traiteurs</p>
            </button>

            <button
              type="button"
              onClick={() => setRole("acheteur_public")}
              className={`p-3.5 rounded-2xl border-2 text-left text-xs transition-all cursor-pointer ${
                role === "acheteur_public"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-bold">🏛️ Secteur Public (B2G)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Cantines, mairies, Chorus Pro</p>
            </button>

            <button
              type="button"
              onClick={() => setRole("livreur")}
              className={`p-3.5 rounded-2xl border-2 text-left text-xs transition-all cursor-pointer sm:col-span-2 ${
                role === "livreur"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-bold">🚚 Transporteur / Livreur DREAL</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tournées de ramasse & livraison VUL -3.5t</p>
            </button>
          </div>
        </div>

        {/* VERROU 1 : SIRET */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <label className="text-[11px] font-black text-slate-800 uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 size={16} className="text-emerald-700" />
              1. Identification SIRET (Obligatoire) *
            </span>
            {verifyingSiret ? (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Recherche...
              </span>
            ) : siretVerified ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                <CheckCircle2 size={12} /> SIRET Validé
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Lock size={12} /> Automatique si 14 chiffres
              </span>
            )}
          </label>

          <div className="relative">
            <input
              type="text"
              maxLength={14}
              value={siret}
              onChange={(e) => {
                setSiret(e.target.value);
                setSiretVerified(false);
                setLocationVerified(false);
                setDetectedDistance(null);
              }}
              placeholder="SIRET (14 chiffres)"
              required
              className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {verifyingSiret && (
              <div className="absolute right-3 top-2.5">
                <Loader2 size={18} className="animate-spin text-emerald-600" />
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Raison Sociale Officielle (SIRENE)
            </label>
            <input
              type="text"
              required
              readOnly={siretVerified}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Raison sociale importée automatiquement"
              className={`w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none ${
                siretVerified ? "bg-slate-100 cursor-not-allowed" : "bg-white"
              }`}
            />
          </div>
        </div>

        {/* VERROU 2 : GÉOFENCING 50 KM */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
              <MapPin size={16} className="text-emerald-700" />
              2. Adresse & Périmètre (50 km max) *
            </label>
            {verifyingLocation ? (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Calcul...
              </span>
            ) : locationVerified ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                <CheckCircle2 size={12} /> Zone Validée ({detectedDistance} km)
              </span>
            ) : detectedDistance !== null ? (
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold">
                Hors zone ({detectedDistance} km)
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Lock size={12} /> Calcul Automatique
              </span>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Adresse physique
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setLocationVerified(false);
                setDetectedDistance(null);
              }}
              placeholder="Ex: 12 Rue des Maraîchers"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Code Postal *
              </label>
              <input
                type="text"
                maxLength={5}
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  setLocationVerified(false);
                  setDetectedDistance(null);
                }}
                placeholder="28350"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Commune / Ville *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setLocationVerified(false);
                  setDetectedDistance(null);
                }}
                placeholder="Saint-Rémy-sur-Avre"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* IDENTIFIANTS */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Adresse E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.fr"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Téléphone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 00 00 00 00"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
              Mot de Passe *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-2">
          <div className="flex items-start gap-2">
            <FileCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Mandat de Facturation Transparent (Art. 289-I-2 du CGI) & RGPD :</p>
              <p className="text-amber-800 leading-tight">
                Vous autorisez Âne & Gorille à générer les factures au nom et pour le compte de votre structure et acceptez la conservation sécurisée des données.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 pt-1 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="accent-emerald-700 w-4 h-4"
            />
            <span>J'accepte le mandat de facturation et la politique des données.</span>
          </label>
        </div>

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