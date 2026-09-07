import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firestore.service";
import {
  ShieldCheck,
  FileCheck,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function LivreurRegulatorySection() {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [regulatory, setRegulatory] = useState({
    licenseNumber: "",
    insuranceCompany: "",
    licenseStatus: "pending", // 'pending' | 'verified'
  });

  // Charger les informations réelles depuis Firestore au montage du composant
  useEffect(() => {
    if (!user?.uid) return;

    async function loadLivreurProfile() {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setRegulatory({
            licenseNumber: data.licenseNumber || "",
            insuranceCompany: data.insuranceCompany || "",
            licenseStatus: data.licenseStatus || "verified",
          });
        }
      } catch (error) {
        console.error(
          "Erreur de récupération des données réglementaires livreur :",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadLivreurProfile();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setIsSubmitting(true);
    setIsSaved(false);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        licenseNumber: regulatory.licenseNumber,
        insuranceCompany: regulatory.insuranceCompany,
        licenseStatus: regulatory.licenseStatus,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement des licences livreur :",
        error,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
        Chargement de la conformité transport...
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileCheck size={18} className="text-emerald-600" />
          3. Conformité Professionnelle & Licences DREAL
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
              <ShieldCheck size={16} /> Vos documents réglementaires de
              transport ont été enregistrés et transmis pour validation.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Numéro de licence */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Numéro de Licence DREAL *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: LIC-2026-L-123456"
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={regulatory.licenseNumber}
                onChange={(e) =>
                  setRegulatory({
                    ...regulatory,
                    licenseNumber: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Obligatoire pour l'activité de transporteur de marchandises de
                tiers.
              </p>
            </div>

            {/* Compagnie d'assurance */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Responsabilité Civile Professionnelle (RC Pro)
              </label>
              <input
                type="text"
                required
                placeholder="Compagnie et N° de police"
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={regulatory.insuranceCompany}
                onChange={(e) =>
                  setRegulatory({
                    ...regulatory,
                    insuranceCompany: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Garantit la couverture du fret alimentaire transporté.
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl flex items-center justify-between ${regulatory.licenseStatus === "verified" ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}
          >
            <div>
              <p className="text-sm font-bold">Statut de validation DREAL</p>
              <p className="text-xs">
                {regulatory.licenseStatus === "verified"
                  ? "Licence de transport validée par l'opérateur • Vous pouvez effectuer des courses."
                  : "En attente d'approbation administrative."}
              </p>
            </div>
            <span className="font-extrabold text-xl">
              {regulatory.licenseStatus === "verified" ? "✓" : "!"}
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting
                ? "Enregistrement..."
                : "Enregistrer les certificats"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
