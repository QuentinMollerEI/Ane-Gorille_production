import React, { useState } from "react";
import {
  Truck,
  ShieldAlert,
  Award,
  FileText,
  Edit,
  Save,
  Loader2,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firestore.service";

export default function LexiqueTransportReglementation({ lawData, onRefresh }) {
  const [isRetracted, setIsRetracted] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // États d'édition connectés à Firestore
  const [editedTitle, setEditedTitle] = useState(
    lawData?.title ||
      "3. Logistique & Livraison : Transport de Marchandises & Normes DREAL",
  );
  const [editedDrealRule, setEditedDrealRule] = useState(
    lawData?.drealRule ||
      "Puisque la micro-entreprise réalise elle-même la livraison physique des marchandises, elle exerce de fait l'activité réglementée de transporteur public routier de marchandises pour compte d'autrui.",
  );
  const [editedHaccpRule, setEditedHaccpRule] = useState(
    lawData?.haccpRule ||
      "Le transport de denrées alimentaires périssables (comme les salades ou fruits fragiles) est soumis à la réglementation HACCP d'hygiène et de sécurité des aliments.",
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "laws_lexicon", "logistics_dreal");
      await updateDoc(docRef, {
        title: editedTitle,
        drealRule: editedDrealRule,
        haccpRule: editedHaccpRule,
        lastUpdatedBy: "Admin",
        updatedAt: new Date(),
      });
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Erreur de sauvegarde de la loi DREAL :", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      {/* HEADER COMPARTIMENT */}
      <div className="flex justify-between items-center p-5 border-b border-gray-150 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Truck size={18} className="text-brand-green" />
          {editedTitle}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded transition-all"
            title="Éditer cette fiche légale"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setIsRetracted(!isRetracted)}
            className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isRetracted ? (
              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                Déployer
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                Masquer
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENU COMPARTIMENT */}
      {!isRetracted && (
        <div className="p-6 space-y-6 animate-fade-in">
          {isEditing ? (
            <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-xs font-black text-green-700 uppercase tracking-wider mb-2">
                Mode Édition - DREAL & HACCP
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Obligations DREAL & Transport Léger
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500"
                    value={editedDrealRule}
                    onChange={(e) => setEditedDrealRule(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Normes Sanitaires HACCP (Chaîne du Froid)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500"
                    value={editedHaccpRule}
                    onChange={(e) => setEditedHaccpRule(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-lg text-xs"
                >
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  Sauvegarder dans Firestore
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* VUE CLIENT - LOGISTIQUE REELLE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DREAL */}
                <div className="p-5 border border-amber-150 bg-amber-50/10 rounded-xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-extrabold uppercase">
                    <Award size={11} /> Réglementation Routière (DREAL)
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">
                    Obligation d'Inscription & Licences
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {editedDrealRule}
                  </p>
                  <div className="space-y-2 mt-1">
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <FileText size={12} className="text-amber-600" />
                      <strong>Licence de transport léger :</strong> Obligatoire
                      pour les utilitaires de moins de 3,5 tonnes.
                    </p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <FileText size={12} className="text-amber-600" />
                      <strong>Capacité financière :</strong> Une garantie
                      financière de <strong>900 €</strong> doit être bloquée ou
                      assurée pour le premier véhicule léger.
                    </p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <FileText size={12} className="text-amber-600" />
                      <strong>RC Pro Transport :</strong> Obligation d'assurer
                      la marchandise d'autrui contre le vol, le gel ou la casse
                      lors de la livraison.
                    </p>
                  </div>
                </div>

                {/* HACCP */}
                <div className="p-5 border border-emerald-150 bg-emerald-50/10 rounded-xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-extrabold uppercase">
                    <ShieldAlert size={11} /> Sécurité Alimentaire (HACCP)
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">
                    Traçabilité & Chaîne du Froid
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {editedHaccpRule}
                  </p>
                  <div className="p-3 bg-white border border-emerald-100 rounded-lg text-[11px] text-emerald-800 space-y-1">
                    <p className="font-bold">
                      ✓ Cible de Température Légumes Frais :
                    </p>
                    <p className="text-gray-600 leading-normal">
                      Entre <strong>2°C et 6°C</strong> lors du chargement,
                      transport et livraison des légumes fragiles de mise en
                      rayon. Les relevés de température des caissons thermiques
                      doivent être consignés de manière persistante sur la
                      feuille de route du livreur.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
