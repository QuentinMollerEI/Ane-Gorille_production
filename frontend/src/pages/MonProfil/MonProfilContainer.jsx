import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { doc, getDoc } from "firebase/firestore";
import { ShieldCheck } from "lucide-react";

import AcheteurPublicContainer from "./AcheteurPublic/AcheteurPublicContainer";
import AcheteurPriveContainer from "./AcheteurPrive/AcheteurPriveContainer";
import ProducteurContainer from "./Producteur/ProducteurContainer";
import LivreurContainer from "./Livreur/LivreurContainer";
import AdminProfilContainer from "./Admin/AdminProfilContainer";

/**
 * 👤 ROUTEUR DE PROFIL : MonProfilContainer.jsx
 * Emplacement : src/pages/MonProfil/MonProfilContainer.jsx
 *
 * Orientation RBAC par rôle :
 * - client_public -> AcheteurPublicContainer
 * - client_pro    -> AcheteurPriveContainer
 * - producteur    -> ProducteurContainer
 * - livreur       -> LivreurContainer
 * - admin         -> AdminProfilContainer (Fiche personnelle, PAS la modération !)
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
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Erreur de chargement du profil utilisateur :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  const role = userProfile?.role || user?.role || "client_public";
  const isApproved = userProfile?.isApproved !== false;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* ⚠️ BANDEAU INFORMATIF SI COMPTE EN ATTENTE D'APPROBATION */}
      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 shadow-sm text-xs text-amber-950 font-medium">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-sm">
              Compte en Attente de Validation par l'Administration
            </h4>
            <p className="leading-relaxed opacity-90">
              Vous pouvez compléter vos informations ci-dessous. Un
              administrateur validera l'accès complet sous peu.
            </p>
          </div>
        </div>
      )}

      {/* 🧭 ORIENTATION VERS LE COMPOSANT DE PROFIL DÉDIÉ */}
      {role === "client_public" && <AcheteurPublicContainer />}
      {role === "client_pro" && <AcheteurPriveContainer />}
      {role === "producteur" && <ProducteurContainer />}
      {role === "livreur" && <LivreurContainer />}
      {role === "admin" && <AdminProfilContainer />}
    </div>
  );
}
