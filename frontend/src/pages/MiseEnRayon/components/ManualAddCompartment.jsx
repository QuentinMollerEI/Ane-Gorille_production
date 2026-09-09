import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Camera,
  ShieldCheck,
  RefreshCw,
  PackageCheck,
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ManualAddCompartment.jsx
 * Responsabilité unique : Formulaire de saisie unitaire de mise en rayon pour le maraîcher.
 * Reprend automatiquement le département, la localisation et le lieu de récolte depuis le profil utilisateur.
 */
export default function ManualAddCompartment({ onProductAdded }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const producerDept =
    user?.department || user?.departmentCode || user?.city || "Dépt. Local";
  const producerLocation =
    user?.address || user?.city || user?.companyName || "Exploitation locale";
  const producerName =
    user?.companyName ||
    user?.displayName ||
    user?.name ||
    user?.producerName ||
    "Maraîcher Exploitant";

  const [formData, setFormData] = useState({
    title: "",
    category: "Légumes",
    priceHT: "",
    vatRate: "5.5",
    unit: "kg",
    stock: "",
    harvestDate: new Date().toISOString().slice(0, 10),
    batchNumber: "",
    isBio: Boolean(user?.isBioCertified || false),
    imageFile: null,
    imagePreview: "",
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!formData.title.trim()) {
      setErrorMsg("Veuillez saisir la désignation du produit.");
      return;
    }

    if (!formData.priceHT || Number(formData.priceHT) <= 0) {
      setErrorMsg("Veuillez indiquer un prix unitaire HT valide.");
      return;
    }

    if (!formData.stock || Number(formData.stock) < 0) {
      setErrorMsg("Veuillez indiquer la quantité en stock.");
      return;
    }

    setLoading(true);

    try {
      const finalBatch =
        formData.batchNumber.trim() ||
        `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
          100 + Math.random() * 900,
        )}`;

      const productPayload = {
        title: formData.title.trim(),
        name: formData.title.trim(),
        category: formData.category,
        priceHT: Number(parseFloat(formData.priceHT).toFixed(2)),
        price: Number(parseFloat(formData.priceHT).toFixed(2)),
        vatRate: Number(formData.vatRate),
        unit: formData.unit,
        stock: Number(formData.stock),
        quantity: Number(formData.stock),
        harvestDate: formData.harvestDate,
        batchNumber: finalBatch,
        isBio: Boolean(formData.isBio),

        producerId: user?.uid || "PROD_ANONYME",
        producer: producerName,
        producerName: producerName,
        companyName: producerName,
        department: producerDept,
        origin: producerDept,
        harvestLocation: producerLocation,

        packagingType: "Caisses & Cagettes Réutilisables (Consignées)",
        isReusableCrate: true,

        imageUrl: formData.imagePreview || null,
        image: formData.imagePreview || null,

        isAvailable: Number(formData.stock) > 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productPayload);

      setSuccessMsg(
        `Le produit "${formData.title}" a été mis en rayon avec succès !`,
      );

      setFormData({
        title: "",
        category: "Légumes",
        priceHT: "",
        vatRate: "5.5",
        unit: "kg",
        stock: "",
        harvestDate: new Date().toISOString().slice(0, 10),
        batchNumber: "",
        isBio: Boolean(user?.isBioCertified || false),
        imageFile: null,
        imagePreview: "",
      });

      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error("Erreur d'ajout du produit :", err);
      setErrorMsg(
        "Une erreur est survenue lors de la mise en rayon. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <PlusCircle className="text-emerald-600" size={20} />
            Mise en Rayon Unitaire (Ajout Simple)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Saisissez les informations de votre récolte. L'origine (
            {producerDept}) et le lieu sont hérités de votre profil.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Exploitation : {producerName}</span>
        </div>
      </div>

      <div className="p-3.5 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
        <PackageCheck size={18} className="text-amber-700 shrink-0" />
        <span>
          <strong>Logistique Circuit Court :</strong> Tous les produits sont
          emballés en caisses et cagettes réutilisables consignées.
        </span>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              Désignation du Produit *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Carottes de Sable Fraîches, Poireaux Bio..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              Catégorie *
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="Légumes">Légumes</option>
              <option value="Fruits">Fruits</option>
              <option value="Herbes">Herbes</option>
              <option value="Transformés">Transformés</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              Prix Unitaire HT (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="ex: 2.50"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              value={formData.priceHT}
              onChange={(e) =>
                setFormData({ ...formData, priceHT: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              Taux de TVA *
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
              value={formData.vatRate}
              onChange={(e) =>
                setFormData({ ...formData, vatRate: e.target.value })
              }
            >
              <option value="5.5">5.5 % (Taux réduit alimentation)</option>
              <option value="20.0">20.0 % (Taux normal)</option>
              <option value="0.0">0.0 % (Franchise de TVA art. 293 B)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              Unité de Vente *
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
            >
              <option value="kg">au Kilogramme (kg)</option>
              <option value="pièce">à la Pièce</option>
              <option value="botte">la Botte</option>
              <option value="barquette">la Barquette</option>
              <option value="cagette">la Cagette (5 kg)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              Quantité en Stock *
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="ex: 50"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              Date de Récolte *
            </label>
            <input
              type="date"
              required
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              value={formData.harvestDate}
              onChange={(e) =>
                setFormData({ ...formData, harvestDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">
              N° de Lot / Traçabilité
            </label>
            <input
              type="text"
              placeholder="Automatique si vide (ex: LOT-2026-001)"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex">
            Photo du Produit
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors text-xs font-bold text-gray-700">
              <Camera size={16} className="text-emerald-600" />
              <span>Choisir un fichier visuel</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            {formData.imagePreview && (
              <div className="flex items-center gap-2">
                <img
                  src={formData.imagePreview}
                  alt="Aperçu"
                  className="w-10 h-10 object-cover rounded-lg border border-gray-300"
                />
                <span className="text-[11px] text-green-700 font-bold">
                  Visuel prêt
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <label className="flex items-start gap-3 p-3.5 border border-amber-200 bg-amber-50/40 rounded-xl cursor-pointer hover:bg-amber-50 transition w-full">
            <input
              type="checkbox"
              className="mt-1 text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
              checked={formData.isBio}
              onChange={(e) =>
                setFormData({ ...formData, isBio: e.target.checked })
              }
            />
            <div>
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex">
                Label Agriculture Biologique (AB / Bio)
              </span>
              <span className="text-[11px] text-amber-700 leading-tight flex mt-0.5">
                Cochez si ce lot bénéficie de la certification AB officielle
                Ecocert / Agence Bio.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-8 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                <span>Mettre le Produit en Rayon</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
