import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { doc, getDoc } from "firebase/firestore";
import { User, ShieldCheck, Building, Store, Truck, Crown } from "lucide-react";

import AcheteurPublicContainer from "./AcheteurPublic/AcheteurPublicContainer";
import AcheteurPriveContainer from "./AcheteurPrive/AcheteurPriveContainer";
import ProducteurContainer from "./Producteur/ProducteurContainer";
import LivreurContainer from "./Livreur/LivreurContainer";
import AdminContainer from "./Admin/AdminContainer";

/**
 * 👤 ROUTEUR DE PROFIL : MonProfilContainer.jsx (Orientation RBAC par Rôle)
 *
 * Responsabilité unique : Charger les données de l'utilisateur connecté depuis Firestore (users/{uid}),
 * déterminer son rôle métier (B2G, B2B, Producteur, Livreur, Admin), et afficher le composant de profil dédié.
 */
export default function MonProfilContainer() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        } else {
          setUserProfile(user);
        }
      } catch (err) {
        console.error("Erreur de chargement profil :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  // Normalisation du rôle utilisateur
  const rawRole = userProfile?.role || user?.role || "client_public";

  const isPublicBuyer =
    rawRole === "client_public" || rawRole === "acheteur_public";
  const isPrivateBuyer =
    rawRole === "client_pro" ||
    rawRole === "acheteur_prive" ||
    rawRole === "client_prive";
  const isProducer = rawRole === "producteur";
  const isLivreur = rawRole === "livreur";
  const isAdmin = rawRole === "admin";

  const roleTitleDisplay = isPublicBuyer
    ? "Acheteur Public & Collectivité"
    : isPrivateBuyer
      ? "Acheteur Professionnel (B2B)"
      : isProducer
        ? "Fournisseur & Exploitant Agricole"
        : isLivreur
          ? "Opérateur Logistique & Transporteur"
          : "Administration & Supervision";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* EN-TÊTE UNIFIÉ DU PROFIL AVEC BADGE DE RÔLE */}
      <div className="border-b border-gray-150 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <User size={28} />
            </span>
            Mon Profil & Paramètres du Compte
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
            {isPublicBuyer
              ? "Profil Acheteur Public & Collectivité : Facturation Chorus Pro & Mandats LME 30 jours"
              : isPrivateBuyer
                ? "Profil Acheteur Professionnel (B2B) : Raison Sociale, Prélèvement SEPA & Adresse de Livraison"
                : isProducer
                  ? "Profil Fournisseur & Exploitant Agricole : Informations Vendeur, Label Bio & Reversements Stripe"
                  : isLivreur
                    ? "Profil Opérateur Logistique & Transporteur : LogiTraction, Licence DREAL & Flotte Frigorifique"
                    : "Profil Administration & Supervision : Contrôle du Registre Utilisateurs"}
          </p>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full uppercase tracking-wider shadow-sm">
            <ShieldCheck size={16} className="text-emerald-600" />
            {roleTitleDisplay}
          </span>
        </div>
      </div>

      {/* CHARGEMENT DYNAMIQUE DU COMPOSANT DU RÔLE */}
      {isPublicBuyer && <AcheteurPublicContainer />}
      {isPrivateBuyer && <AcheteurPriveContainer />}
      {isProducer && <ProducteurContainer />}
      {isLivreur && <LivreurContainer />}
      {isAdmin && <AdminContainer />}

      {!isPublicBuyer &&
        !isPrivateBuyer &&
        !isProducer &&
        !isLivreur &&
        !isAdmin && <AcheteurPublicContainer />}
    </div>
  );
}
