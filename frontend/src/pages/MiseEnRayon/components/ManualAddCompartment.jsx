import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { ProductService } from "../../../services/ProductService";
import {
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Camera,
  ShieldCheck,
  RefreshCw,
  PackageCheck,
  Info,
  Sparkles,
  FileText,
  Award,
} from "lucide-react";

// État initial propre du formulaire
const INITIAL_FORM_STATE = (isBioCertified) => ({
  title: "",
  category: "Légumes",
  priceHT: "",
  vatRate: "5.5",
  unit: "kg",
  stock: "",
  harvestDate: new Date().toISOString().slice(0, 10),
  batchNumber: "",
  imagePreview: "",

  // Miel & Apiculture
  floralOrigin: "",
  honeyNetWeight: "",

  // Œufs & Élevage
  eggRearingMode: "",
  eggCaliber: "",
  dcrDate: "",
  eggSanitaryApproval: "",

  // Produits Secs & Transformés (INCO)
  dryGoodsType: "",
  ddmDate: "",
  dlcDate: "",
  packagingContainer: "bocal",
  incoImagePreview: "",
  ingredients: "",
  allergens: "",
  storageInstructions: "",

  // Labels & Certification SIQO / EGAlim
  isBio: Boolean(isBioCertified || false),
  isHve: false,
  isAop: false,
  isAoc: false,
  isIgp: false,
  isLabelRouge: false,
});

// 1. En-tête du composant
function FormHeader({ producerName }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
      <div>
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <PlusCircle className="text-emerald-600" size={20} />
          <span>Mise en Rayon Unitaire (Ajout Simple)</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Saisissez les informations de votre récolte ou produit.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
        <ShieldCheck size={16} className="text-emerald-600" />
        <span>Exploitation : {producerName}</span>
      </div>
    </div>
  );
}

// 2. Information logistique consignes
function LogisticsNotice() {
  return (
    <div className="p-3.5 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
      <PackageCheck size={18} className="text-amber-700 shrink-0" />
      <span>
        <strong>Logistique Circuit Court :</strong> Tous les produits sont emballés en caisses et cagettes réutilisables consignées.
      </span>
    </div>
  );
}

// 3. Champs généraux du produit
function GeneralFields({ formData, setFormData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
          Désignation du Produit *
        </label>
        <input
          type="text"
          required
          placeholder="ex: Carottes de Sable, Miel d'Acacia, Œufs Plein Air..."
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
          Catégorie *
        </label>
        <select
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          <option value="Légumes">Légumes</option>
          <option value="Fruits">Fruits</option>
          <option value="Herbes">Herbes</option>
          <option value="Miel & Apiculture">Miel & Apiculture</option>
          <option value="Œufs & Élevage">Œufs & Élevage</option>
          <option value="Produits Secs & Épicerie">Produits Secs & Épicerie</option>
          <option value="Produits Transformés & Conserves">Produits Transformés & Conserves</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
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
          onChange={(e) => setFormData({ ...formData, priceHT: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
          Taux de TVA *
        </label>
        <select
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
          value={formData.vatRate}
          onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
        >
          <option value="5.5">5.5 % (Taux réduit alimentation)</option>
          <option value="20.0">20.0 % (Taux normal)</option>
          <option value="0.0">0.0 % (Franchise art. 293 B CGI)</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
          Unité de Vente *
        </label>
        <select
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
        >
          <option value="kg">Kilogramme (kg)</option>
          <option value="g">Gramme (g)</option>
          <option value="piece">Pièce</option>
          <option value="botte">Botte</option>
          <option value="bouquet">Bouquet</option>
          <option value="pot">Pot</option>
          <option value="bocal">Bocal</option>
          <option value="bouteille">Bouteille</option>
          <option value="litre">Litre (L)</option>
          <option value="barquette">Barquette</option>
          <option value="cagette">Cagette</option>
          <option value="carton">Carton</option>
          <option value="sachet">Sachet</option>
          <option value="douzaine">Douzaine</option>
          <option value="demi-douzaine">Demi-douzaine</option>
          <option value="lot">Lot</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
          Quantité en Stock *
        </label>
        <input
          type="number"
          min="0"
          required
          placeholder="ex: 50"
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
          Date de Récolte / Production *
        </label>
        <input
          type="date"
          required
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
          value={formData.harvestDate}
          onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
          N° de Lot / Traçabilité
        </label>
        <input
          type="text"
          placeholder="Généré automatiquement si vide"
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
          value={formData.batchNumber}
          onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
        />
      </div>
    </div>
  );
}

// 4. Section Miel
function HoneyFields({ formData, setFormData }) {
  return (
    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
      <h3 className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
        <Sparkles size={16} className="text-amber-600" />
        <span>Champs Spécifiques Miel & Apiculture</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-amber-900 block mb-1">
            Origine Florale
          </label>
          <input
            type="text"
            placeholder="ex: Acacia, Châtaignier, Toutes Fleurs..."
            className="w-full border border-amber-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-amber-500"
            value={formData.floralOrigin}
            onChange={(e) => setFormData({ ...formData, floralOrigin: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-amber-900 block mb-1">
            Poids Net du Pot
          </label>
          <input
            type="text"
            placeholder="ex: 250g, 500g, 1kg..."
            className="w-full border border-amber-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-amber-500"
            value={formData.honeyNetWeight}
            onChange={(e) => setFormData({ ...formData, honeyNetWeight: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-amber-900 block mb-1">
            Date Durabilité Minimale (DDM)
          </label>
          <input
            type="date"
            className="w-full border border-amber-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-amber-500"
            value={formData.ddmDate}
            onChange={(e) => setFormData({ ...formData, ddmDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// 5. Section Œufs
function EggFields({ formData, setFormData }) {
  return (
    <div className="p-4 bg-yellow-50/70 border border-yellow-200 rounded-2xl space-y-3">
      <h3 className="font-extrabold text-yellow-950 text-xs flex items-center gap-1.5">
        <Info size={16} className="text-yellow-700" />
        <span>Traçabilité Sanitaire Œufs & Élevage</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[11px] font-bold text-yellow-950 block mb-1">
            Mode d'Élevage
          </label>
          <select
            className="w-full border border-yellow-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-yellow-500"
            value={formData.eggRearingMode}
            onChange={(e) => setFormData({ ...formData, eggRearingMode: e.target.value })}
          >
            <option value="">Sélectionner...</option>
            <option value="0">0 - Biologique (AB)</option>
            <option value="1">1 - Plein Air</option>
            <option value="2">2 - Au Sol (Intérieur)</option>
            <option value="3">3 - En Cage aménagement</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-yellow-950 block mb-1">
            Calibre
          </label>
          <select
            className="w-full border border-yellow-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-yellow-500"
            value={formData.eggCaliber}
            onChange={(e) => setFormData({ ...formData, eggCaliber: e.target.value })}
          >
            <option value="">Sélectionner...</option>
            <option value="S">S - Petit (&lt; 53g)</option>
            <option value="M">M - Moyen (53g - 63g)</option>
            <option value="L">L - Grand (63g - 73g)</option>
            <option value="XL">XL - Très Grand (&gt; 73g)</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-yellow-950 block mb-1">
            DCR (Date Consommation Recommandée)
          </label>
          <input
            type="date"
            className="w-full border border-yellow-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-yellow-500"
            value={formData.dcrDate}
            onChange={(e) => setFormData({ ...formData, dcrDate: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-yellow-950 block mb-1">
            Agrément Sanitaire Centre d'Emballage
          </label>
          <input
            type="text"
            placeholder="ex: FR 31.000.001 CE"
            className="w-full border border-yellow-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-yellow-500"
            value={formData.eggSanitaryApproval}
            onChange={(e) => setFormData({ ...formData, eggSanitaryApproval: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// 6. Photo étiquette INCO (Ingrédients / Allergènes)
function IncoPhotoSection({ formData, handleIncoImageChange }) {
  return (
    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
      <h3 className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
        <FileText size={16} className="text-emerald-700" />
        <span>Photo Étiquette Ingrédients / Allergènes (INCO)</span>
      </h3>
      <p className="text-[11px] text-emerald-800">
        Ajoutez une photo claire de l'étiquette au dos du produit montrant la composition et les allergènes.
      </p>
      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-2 px-3.5 py-2 bg-white border border-emerald-300 rounded-xl cursor-pointer hover:bg-emerald-100/50 transition-colors text-xs font-bold text-emerald-900 shadow-xs">
          <Camera size={15} className="text-emerald-700" />
          <span>Sélectionner la photo d'étiquette</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleIncoImageChange} />
        </label>
        {formData.incoImagePreview && (
          <div className="flex items-center gap-2">
            <img
              src={formData.incoImagePreview}
              alt="Aperçu Étiquette INCO"
              className="w-10 h-10 object-cover rounded-lg border border-emerald-300"
            />
            <span className="text-[11px] text-emerald-800 font-bold">Photo étiquette prête</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 7. Photo principale du produit
function MainProductPhoto({ formData, handleImageChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
        Photo du Produit
      </label>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors text-xs font-bold text-gray-700">
          <Camera size={16} className="text-emerald-600" />
          <span>Choisir un fichier visuel</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>
        {formData.imagePreview && (
          <div className="flex items-center gap-2">
            <img
              src={formData.imagePreview}
              alt="Aperçu Produit"
              className="w-10 h-10 object-cover rounded-lg border border-gray-300"
            />
            <span className="text-[11px] text-green-700 font-bold">Visuel prêt</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 8. Cases à cocher pour les 6 labels SIQO / EGAlim
function QualityLabelsSection({ formData, setFormData }) {
  const labelsConfig = [
    {
      id: "isBio",
      title: "🌿 Bio (AB)",
      subtitle: "Agriculture Biologique",
      activeBg: "bg-amber-50 border-amber-300 ring-2 ring-amber-400/40",
      textColor: "text-amber-900",
      subTextColor: "text-amber-700",
      checkboxColor: "text-amber-600 focus:ring-amber-500",
    },
    {
      id: "isHve",
      title: "🍃 HVE",
      subtitle: "Haute Valeur Env.",
      activeBg: "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40",
      textColor: "text-emerald-900",
      subTextColor: "text-emerald-700",
      checkboxColor: "text-emerald-600 focus:ring-emerald-500",
    },
    {
      id: "isAop",
      title: "🍷 AOP",
      subtitle: "Appellation Origine Protégée",
      activeBg: "bg-blue-50 border-blue-300 ring-2 ring-blue-400/40",
      textColor: "text-blue-900",
      subTextColor: "text-blue-700",
      checkboxColor: "text-blue-600 focus:ring-blue-500",
    },
    {
      id: "isAoc",
      title: "🍇 AOC",
      subtitle: "Appellation Origine Contrôlée",
      activeBg: "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/40",
      textColor: "text-indigo-900",
      subTextColor: "text-indigo-700",
      checkboxColor: "text-indigo-600 focus:ring-indigo-500",
    },
    {
      id: "isIgp",
      title: "🗺️ IGP",
      subtitle: "Indication Géog. Protégée",
      activeBg: "bg-purple-50 border-purple-300 ring-2 ring-purple-400/40",
      textColor: "text-purple-900",
      subTextColor: "text-purple-700",
      checkboxColor: "text-purple-600 focus:ring-purple-500",
    },
    {
      id: "isLabelRouge",
      title: "🔴 Label Rouge",
      subtitle: "Qualité Supérieure",
      activeBg: "bg-red-50 border-red-300 ring-2 ring-red-400/40",
      textColor: "text-red-900",
      subTextColor: "text-red-700",
      checkboxColor: "text-red-600 focus:ring-red-500",
    },
  ];

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
      <label className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <Award size={16} className="text-amber-600" />
        <span>Certifications & Labels de Qualité (SIQO / EGAlim)</span>
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {labelsConfig.map((label) => {
          const isChecked = Boolean(formData[label.id]);
          return (
            <label
              key={label.id}
              className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition-all ${
                isChecked
                  ? label.activeBg
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className={`mt-0.5 h-4 w-4 rounded ${label.checkboxColor}`}
                checked={isChecked}
                onChange={(e) =>
                  setFormData({ ...formData, [label.id]: e.target.checked })
                }
              />
              <div className="min-w-0">
                <span className={`text-xs font-extrabold block truncate ${label.textColor}`}>
                  {label.title}
                </span>
                <span className={`text-[10px] block truncate font-medium ${label.subTextColor}`}>
                  {label.subtitle}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// Composant Principal Exporté
export default function ManualAddCompartment({ onProductAdded }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const producerName =
    user?.companyName || user?.displayName || user?.name || user?.producerName || "Exploitation Locale";

  const [formData, setFormData] = useState(() => INITIAL_FORM_STATE(user?.isBioCertified));

  // CORRECTION CRUCIALE DU PARSEUR: e.target.files?.[0]
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({ ...prev, imagePreview: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleIncoImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({ ...prev, incoImagePreview: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });
    setLoading(true);

    try {
      await ProductService.addProduct(formData, user);

      setStatusMsg({
        type: "success",
        text: `Le produit "${formData.title}" a été mis en rayon avec succès !`,
      });

      setFormData(INITIAL_FORM_STATE(user?.isBioCertified));

      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: "error",
        text: err.message || "Une erreur est survenue lors de la mise en rayon.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isHoney =
    formData.category === "Miel & Apiculture" ||
    formData.title.toLowerCase().includes("miel");

  const isEggs =
    formData.category === "Œufs & Élevage" ||
    formData.title.toLowerCase().includes("œuf") ||
    formData.title.toLowerCase().includes("oeuf");

  const isINCO =
    formData.category === "Transformés" ||
    formData.category === "Produits Transformés & Conserves" ||
    formData.category === "Produits Secs & Épicerie";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
      <FormHeader producerName={producerName} />
      <LogisticsNotice />

      {statusMsg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            statusMsg.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-green-50 border border-green-200 text-green-800"
          }`}
        >
          {statusMsg.type === "error" ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <CheckCircle size={16} className="shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <GeneralFields formData={formData} setFormData={setFormData} />

        <QualityLabelsSection formData={formData} setFormData={setFormData} />

        {isHoney && <HoneyFields formData={formData} setFormData={setFormData} />}
        {isEggs && <EggFields formData={formData} setFormData={setFormData} />}
        {isINCO && (
          <IncoPhotoSection
            formData={formData}
            handleIncoImageChange={handleIncoImageChange}
          />
        )}

        <MainProductPhoto formData={formData} handleImageChange={handleImageChange} />

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-8 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Mise en rayon...</span>
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