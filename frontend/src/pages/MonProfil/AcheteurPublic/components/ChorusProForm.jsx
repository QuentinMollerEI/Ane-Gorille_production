import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { profileService } from "../../../../services/profile.service";
import { FileText, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

export default function ChorusProForm() {
  const { user } = useAuth();
  const [codeService, setCodeService] = useState("");
  const [engagementRef, setEngagementRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    async function loadData() {
      const data = await profileService.getUserProfile(user.uid);
      if (data) {
        setCodeService(data.codeService || "");
        setEngagementRef(data.engagementRef || "");
      }
    }
    loadData();
  }, [user?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    setSaved(false);

    try {
      await profileService.updateUserProfile(
        user.uid,
        { codeService, engagementRef },
        user.role,
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Erreur Chorus Pro :", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs"
    >
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <FileText className="text-blue-700 shrink-0" size={20} />
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            Paramètres Chorus Pro & Facturation Publique (B2G)
          </h3>
          <p className="text-gray-500 font-medium">
            Champs nécessaires à la télétransmission automatique des factures
            dématérialisées.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Code Service Chorus Pro (Optionnel) :
          </label>
          <input
            type="text"
            placeholder="ex: SERV-CANTINE"
            value={codeService}
            onChange={(e) => setCodeService(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Référence d'Engagement Par Défaut (N° Bon de Commande) :
          </label>
          <input
            type="text"
            placeholder="ex: BC-2026-COLLECTIVITE"
            value={engagementRef}
            onChange={(e) => setEngagementRef(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : saved ? (
          <CheckCircle2 size={16} />
        ) : (
          <ShieldCheck size={16} />
        )}
        <span>
          {saved
            ? "Paramètres Chorus Pro Enregistrés"
            : "Sauvegarder les identifiants Chorus Pro"}
        </span>
      </button>
    </form>
  );
}
