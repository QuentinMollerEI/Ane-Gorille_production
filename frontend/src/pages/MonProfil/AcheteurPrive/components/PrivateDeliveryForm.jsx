import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import {
  Truck,
  Clock,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function PrivateDeliveryForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState({
    deliveryWindow: "06:00 - 10:00",
    deliveryInstructions: "",
  });

  useEffect(() => {
    if (!user?.uid) return;
    const fetchDeliveryData = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setFormData({
          deliveryWindow: snap.data().deliveryWindow || "06:00 - 10:00",
          deliveryInstructions: snap.data().deliveryInstructions || "",
        });
      }
    };
    fetchDeliveryData();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), formData);
      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <Truck className="text-emerald-700" size={18} />
          <span>Spécificités de Livraison B2B / Restauration</span>
        </h3>
        {isSaved && (
          <span className="text-emerald-600 flex items-center gap-1 font-bold">
            <CheckCircle2 size={14} /> Sauvegardé
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <div className="space-y-1">
          <label className="font-bold text-gray-700 flex items-center gap-1.5">
            <Clock size={14} className="text-emerald-700" />
            <span>Créneau de réception privilégié :</span>
          </label>
          <select
            value={formData.deliveryWindow}
            onChange={(e) =>
              setFormData({ ...formData, deliveryWindow: e.target.value })
            }
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="06:00 - 08:00">
              06:00 - 08:00 (Avant service du midi)
            </option>
            <option value="08:00 - 10:00">08:00 - 10:00 (Matinée)</option>
            <option value="14:00 - 16:00">14:00 - 16:00 (Après-midi)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700 flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-700" />
            <span>Instructions pour le livreur (Accès / Quai) :</span>
          </label>
          <input
            type="text"
            placeholder="ex: Entrée quai déchargement, sonner en cuisine"
            value={formData.deliveryInstructions}
            onChange={(e) =>
              setFormData({ ...formData, deliveryInstructions: e.target.value })
            }
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:bg-gray-300"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Mettre à jour la livraison
        </button>
      </div>
    </form>
  );
}
