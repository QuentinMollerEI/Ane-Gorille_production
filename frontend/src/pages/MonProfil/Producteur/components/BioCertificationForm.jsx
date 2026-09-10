import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { profileService } from "../../../../services/profile.service";
import { Award, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

export default function BioCertificationForm() {
  const { user } = useAuth();
  const [isBioCertified, setIsBioCertified] = useState(false);
  const [bioCertNumber, setBioCertNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    async function loadData() {
      const data = await profileService.getUserProfile(user.uid);
      if (data) {
        setIsBioCertified(!!data.isBioCertified);
        setBioCertNumber(data.bioCertNumber || "");
      }
    }
    loadData();
  }, [user?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);

    try {
      await profileService.updateUserProfile(
        user.uid,
        { isBioCertified, bioCertNumber },
        user.role,
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Erreur certification Bio :", err);
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
        <Award className="text-emerald-700 shrink-0" size={22} />
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            Certification Bio (AB) & Conformité EGAlim
          </h3>
          <p className="text-gray-500 font-medium">
            Débloque automatiquement le macaron Bio sur vos fiches produits et
            la mise en rayon.
          </p>
        </div>
      </div>

      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-extrabold text-emerald-950 flex items-center gap-2">
            <span>Exploitation Certifiée Agriculture Biologique (AB) :</span>
          </label>
          <input
            type="checkbox"
            checked={isBioCertified}
            onChange={(e) => setIsBioCertified(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        {isBioCertified && (
          <div className="space-y-1 pt-2 border-t border-emerald-200/60">
            <label className="font-bold text-gray-700">
              Numéro de Certificat / Agrément Organisme (Ecocert / Certipaq) :
            </label>
            <input
              type="text"
              required={isBioCertified}
              placeholder="ex: AB-99120-2026"
              value={bioCertNumber}
              onChange={(e) => setBioCertNumber(e.target.value)}
              className="w-full p-2.5 border border-emerald-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : saved ? (
          <CheckCircle2 size={16} />
        ) : (
          <ShieldCheck size={16} />
        )}
        <span>
          {saved ? "Certification Mise à Jour" : "Valider mon Agrément Bio"}
        </span>
      </button>
    </form>
  );
}
