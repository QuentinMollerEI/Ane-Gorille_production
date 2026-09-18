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
  FileText,
  Award,
  X
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ManualAddCompartment.jsx
 * Formulaire de mise en rayon unitaire épuré, structuré et professionnel.
 * 
 * Garanties :
 * 1. Design B2B sobre (suppression des arrondis excessifs, typographie nette, bordures précises).
 * 2. Filtrage strict des champs par catégorie : seuls les champs pertinents pour le produit sélectionné sont affichés.
 * 3. Conservation intégrale de l'ensemble des données (HACCP, Factur-X, SIQO, Ingrédients, Miel, Œufs).
 */
export default function ManualAddCompartment({ onProductAdded }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const producerName =
    user?.companyName ||
    user?.displayName ||
    user?.name ||
    user?.producerName ||
    "Exploitation Agricole Locale";

  const producerDept =
    user?.department ||
    user?.departmentCode ||
    (user?.postalCode ? user.postalCode.substring(0, 2) : "") ||
    "Local";

  const producerLocation =
    user?.address || user?.city || user?.companyName || "Exploitation locale";

  const todayStr = new Date().toISOString().slice(0, 10);
  const dcrDefaultStr = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const ddmDefaultStr = new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    title: "",
    category: "Légumes",
    priceHT: "",
    vatRate: "5.5",
    unit: "kg",
    stock: "",
    harvestDate: todayStr,
    manufacturingDate: todayStr,
    batchNumber: "",

    // Miel
    floralOrigin: "Toutes Fleurs",
    customFloralOrigin: "",
    honeyNetWeight: "500 g",
    honeyOrigin: "100% Récolté en France (Miel de France)",
    ddmDate: ddmDefaultStr,
    apiaryNumber: "",

    // Œufs
    eggRearingMode: "0",
    eggCaliber: "M",
    layingDate: todayStr,
    dcrDate: dcrDefaultStr,
    eggSanitaryApproval: "",

    // Labels
    isBio: Boolean(user?.isBioCertified || false),
    isAOP: false,
    isAOC: false,
    isIGP: false,
    isLabelRouge: false,
    isHVE: false,
    isDemeter: false,
    isSTG: false,
    isEgalim: false,

    imagePreview: null,
    incoImagePreview: null,
  });

  // Category flags
  const isHoney = formData.category === "Miel & Apiculture";
  const isEggs = formData.category === "Œufs & Élevage";
  const isProcessed = ["Produits Transformés & Conserves", "Produits Secs & Épicerie"].includes(formData.category);

  // Category change handler
  const handleCategoryChange = (cat) => {
    let defaultUnit = "kg";
    if (cat === "Miel & Apiculture") defaultUnit = "pot";
    if (cat === "Œufs & Élevage") defaultUnit = "boîte";
    if (["Produits Transformés & Conserves", "Produits Secs & Épicerie"].includes(cat)) defaultUnit = "bocal";

    setFormData((prev) => ({
      ...prev,
      category: cat,
      unit: defaultUnit,
    }));
  };

  // Image handlers
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIncoImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, incoImagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Live TTC calculation
  const priceHTNum = parseFloat(formData.priceHT) || 0;
  const vatRateNum = parseFloat(formData.vatRate) || 5.5;
  const priceTTCNum = priceHTNum * (1 + vatRateNum / 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });

    const cleanTitle = (formData.title || "").trim();
    if (!cleanTitle) {
      setStatusMsg({ type: "error", text: "Veuillez saisir la désignation du produit." });
      return;
    }

    if (priceHTNum <= 0) {
      setStatusMsg({ type: "error", text: "Le prix unitaire HT doit être supérieur à 0." });
      return;
    }

    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setStatusMsg({ type: "error", text: "La quantité en stock doit être égale ou supérieure à 0." });
      return;
    }

    if (!user?.uid) {
      setStatusMsg({ type: "error", text: "Accès refusé : Producteur non connecté." });
      return;
    }

    setLoading(true);

    try {
      const finalBatchNumber =
        formData.batchNumber.trim() ||
        `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const labelsList = [];
      if (formData.isBio) labelsList.push("Bio (AB)");
      if (formData.isAOP) labelsList.push("AOP");
      if (formData.isAOC) labelsList.push("AOC");
      if (formData.isIGP) labelsList.push("IGP");
      if (formData.isLabelRouge) labelsList.push("Label Rouge");
      if (formData.isHVE) labelsList.push("HVE");
      if (formData.isDemeter) labelsList.push("Demeter");
      if (formData.isSTG) labelsList.push("STG");
      if (formData.isEgalim) labelsList.push("EGAlim");

      const finalFloralOrigin =
        formData.floralOrigin === "Autre"
          ? formData.customFloralOrigin || "Polyfloral"
          : formData.floralOrigin;

      const productPayload = {
        title: cleanTitle,
        name: cleanTitle,
        category: formData.category,
        priceHT: Number(priceHTNum.toFixed(2)),
        price: Number(priceHTNum.toFixed(2)),
        vatRate: vatRateNum,
        unit: formData.unit,
        stock: stockNum,
        quantity: stockNum,

        dateType: isProcessed ? "manufacturing" : "harvest",
        harvestDate: !isProcessed && !isEggs ? formData.harvestDate : null,
        manufacturingDate: isProcessed ? formData.manufacturingDate : null,
        batchNumber: finalBatchNumber,

        // Miel
        isHoney: Boolean(isHoney),
        floralOrigin: isHoney ? finalFloralOrigin : null,
        honeyNetWeight: isHoney ? formData.honeyNetWeight : null,
        honeyOrigin: isHoney ? formData.honeyOrigin : null,
        ddmDate: isHoney ? formData.ddmDate : null,
        apiaryNumber: isHoney ? formData.apiaryNumber || null : null,

        // Œufs
        isEggs: Boolean(isEggs),
        eggRearingMode: isEggs ? formData.eggRearingMode : null,
        eggCaliber: isEggs ? formData.eggCaliber : null,
        layingDate: isEggs ? formData.layingDate : null,
        dcrDate: isEggs ? formData.dcrDate : null,
        eggSanitaryApproval: isEggs ? formData.eggSanitaryApproval || null : null,

        // Labels
        isBio: Boolean(formData.isBio),
        isAOP: Boolean(formData.isAOP),
        isAOC: Boolean(formData.isAOC),
        isIGP: Boolean(formData.isIGP),
        isLabelRouge: Boolean(formData.isLabelRouge),
        isHVE: Boolean(formData.isHVE),
        isDemeter: Boolean(formData.isDemeter),
        isSTG: Boolean(formData.isSTG),
        isEgalim: Boolean(formData.isEgalim),
        labels: labelsList,

        producerId: user.uid,
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
        labelImageUrl: formData.incoImagePreview || null,
        ingredientsImageUrl: formData.incoImagePreview || null,

        isAvailable: stockNum > 0,
        isHidden: false,
        status: "published",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productPayload);

      setStatusMsg({
        type: "success",
        text: `Le produit "${cleanTitle}" a été mis en rayon avec succès !`,
      });

      setFormData({
        title: "",
        category: "Légumes",
        priceHT: "",
        vatRate: "5.5",
        unit: "kg",
        stock: "",
        harvestDate: todayStr,
        manufacturingDate: todayStr,
        batchNumber: "",
        floralOrigin: "Toutes Fleurs",
        customFloralOrigin: "",
        honeyNetWeight: "500 g",
        honeyOrigin: "100% Récolté en France (Miel de France)",
        ddmDate: ddmDefaultStr,
        apiaryNumber: "",
        eggRearingMode: "0",
        eggCaliber: "M",
        layingDate: todayStr,
        dcrDate: dcrDefaultStr,
        eggSanitaryApproval: "",
        isBio: Boolean(user?.isBioCertified || false),
        isAOP: false,
        isAOC: false,
        isIGP: false,
        isLabelRouge: false,
        isHVE: false,
        isDemeter: false,
        isSTG: false,
        isEgalim: false,
        imagePreview: null,
        incoImagePreview: null,
      });

      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error("Erreur lors de l'ajout du produit :", err);
      setStatusMsg({
        type: "error",
        text: err.message || "Une erreur est survenue lors de la mise en rayon.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5 text-xs shadow-xs">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-3 gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <PlusCircle className="text-emerald-700" size={16} />
            <span>Mise en Rayon Unitaire</span>
          </h2>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Renseignez les données de votre produit. Origine ({producerDept}) attribuée à votre exploitation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900 bg-emerald-50/80 border border-emerald-200 px-3 py-1 rounded-md shrink-0">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span>Producteur : {producerName}</span>
        </div>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3 rounded-md font-medium flex items-center gap-2 text-xs transition-all ${
            statusMsg.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          {statusMsg.type === "error" ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: Informations Générales */}
        <div className="space-y-3">
          <div className="border-b border-gray-100 pb-1 flex items-center justify-between">
            <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-[10px]">
              1. Informations Principales
            </span>
            <span className="text-[10px] text-gray-400 font-normal">* Champs obligatoires</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Désignation */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                Désignation du Produit *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Carottes de Sable Fraîches, Miel de Lavande AOP, Œufs Bio..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 font-medium text-gray-900 bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
              >
                <option value="Légumes">🥦 Légumes</option>
                <option value="Fruits">🍎 Fruits</option>
                <option value="Herbes & Aromates">🌿 Herbes & Aromates</option>
                <option value="Miel & Apiculture">🍯 Miel & Apiculture</option>
                <option value="Œufs & Élevage">🥚 Œufs & Élevage</option>
                <option value="Produits Transformés & Conserves">🥫 Produits Transformés & Conserves</option>
                <option value="Produits Secs & Épicerie">🌾 Produits Secs & Épicerie</option>
              </select>
            </div>

            {/* Prix HT */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                Prix Unitaire HT (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="2.50"
                value={formData.priceHT}
                onChange={(e) => setFormData({ ...formData, priceHT: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 font-bold text-gray-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
              />
            </div>

            {/* TVA */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                Taux de TVA *
              </label>
              <select
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 font-medium text-gray-900 bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
              >
                <option value="5.5">5.5 % (Taux réduit alimentation)</option>
                <option value="20.0">20.0 % (Taux normal)</option>
                <option value="0.0">0.0 % (Franchise art. 293 B)</option>
              </select>
            </div>

            {/* Aperçu TTC */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                Prix TTC Calculé
              </label>
              <div className="w-full border border-gray-200 bg-gray-50/70 rounded-md p-2 font-bold text-emerald-800 text-xs flex items-center justify-between">
                <span>{priceTTCNum.toFixed(2)} € TTC</span>
                <span className="text-[10px] text-gray-400 font-normal">({formData.vatRate}%)</span>
              </div>
            </div>

            {/* Unité de Vente */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                Unité de Vente *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 font-medium text-gray-900 bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
              >
                <option value="kg">au Kilogramme (kg)</option>
                <option value="pièce">à la Pièce</option>
                <option value="botte">la Botte</option>
                <option value="barquette">la Barquette</option>
                <option value="cagette">la Cagette / Caisse (5 kg)</option>
                <option value="bocal">le Bocal</option>
                <option value="pot">le Pot</option>
                <option value="sachet">le Sachet</option>
                <option value="boîte">la Boîte (de 6 ou 12)</option>
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                Stock Disponible *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="50"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 font-bold text-gray-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
              />
            </div>

            {/* Date (Récolte vs Fabrication selon catégorie) */}
            {!isEggs && (
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                  {isProcessed ? "Date de Fabrication *" : "Date de Récolte *"}
                </label>
                <input
                  type="date"
                  required
                  value={isProcessed ? formData.manufacturingDate : formData.harvestDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [isProcessed ? "manufacturingDate" : "harvestDate"]: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
                />
              </div>
            )}

            {/* N° de Lot Sanitaire */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                N° de Lot Sanitaire
              </label>
              <input
                type="text"
                placeholder="Auto si vide (ex: LOT-2026-001)"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CARTE SPÉCIFIQUE MIEL (AFFICHEE UNIQUEMENT POUR CATEGORIE MIEL) */}
        {isHoney && (
          <div className="border border-amber-200 bg-amber-50/40 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <span>🍯</span>
                <span>Spécificités Apiculture & Miel</span>
              </span>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                Conformité Décret Miel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Origine Florale / Végétale *
                </label>
                <select
                  value={formData.floralOrigin}
                  onChange={(e) => setFormData({ ...formData, floralOrigin: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 bg-white focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="Toutes Fleurs">Toutes Fleurs / Polyfloral</option>
                  <option value="Acacia">Acacia</option>
                  <option value="Châtaignier">Châtaignier</option>
                  <option value="Lavande">Lavande</option>
                  <option value="Sapin / Miellat">Sapin / Miellat</option>
                  <option value="Tilleul">Tilleul</option>
                  <option value="Bruyère">Bruyère</option>
                  <option value="Tournesol">Tournesol</option>
                  <option value="Fleur d'Oranger">Fleur d'Oranger</option>
                  <option value="Garrigue / Maquis">Garrigue / Maquis</option>
                  <option value="Autre">Autre variété...</option>
                </select>
              </div>

              {formData.floralOrigin === "Autre" && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                    Nom de la variété florale
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Miel de Romarin..."
                    value={formData.customFloralOrigin}
                    onChange={(e) => setFormData({ ...formData, customFloralOrigin: e.target.value })}
                    className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Poids Net du Pot *
                </label>
                <select
                  value={formData.honeyNetWeight}
                  onChange={(e) => setFormData({ ...formData, honeyNetWeight: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 bg-white focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="125 g">125 g</option>
                  <option value="250 g">250 g</option>
                  <option value="500 g">500 g</option>
                  <option value="1 kg">1 kg</option>
                  <option value="VRAC (5 kg)">VRAC (Seau de 5 kg)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Origine / Provenance Récolte *
                </label>
                <input
                  type="text"
                  value={formData.honeyOrigin}
                  onChange={(e) => setFormData({ ...formData, honeyOrigin: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Date Durabilité Minimale (DDM)
                </label>
                <input
                  type="date"
                  value={formData.ddmDate}
                  onChange={(e) => setFormData({ ...formData, ddmDate: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  N° Rucher / Immatriculation NAPI
                </label>
                <input
                  type="text"
                  placeholder="ex: NAPI A1234567"
                  value={formData.apiaryNumber}
                  onChange={(e) => setFormData({ ...formData, apiaryNumber: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CARTE SPÉCIFIQUE ŒUFS (AFFICHEE UNIQUEMENT POUR CATEGORIE OEUFS) */}
        {isEggs && (
          <div className="border border-amber-200 bg-amber-50/30 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <span>🥚</span>
                <span>Traçabilité Avicole & Œufs Coquille</span>
              </span>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                Règlement CE n° 589/2008
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Mode d'Élevage (Code Marquage) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { code: "0", title: "0 - Bio", desc: "Biologique" },
                    { code: "1", title: "1 - Plein Air", desc: "Parcours extérieur" },
                    { code: "2", title: "2 - Au Sol", desc: "En bâtiment" },
                    { code: "3", title: "3 - En Cage", desc: "Aménagées" },
                  ].map((mode) => (
                    <label
                      key={mode.code}
                      className={`p-2 border rounded-md cursor-pointer transition-colors text-center ${
                        formData.eggRearingMode === mode.code
                          ? "bg-amber-200/80 border-amber-500 font-bold text-amber-950"
                          : "bg-white border-amber-200 text-gray-700 hover:bg-amber-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="eggRearingMode"
                        value={mode.code}
                        checked={formData.eggRearingMode === mode.code}
                        onChange={(e) => setFormData({ ...formData, eggRearingMode: e.target.value })}
                        className="hidden"
                      />
                      <span className="text-xs font-bold block">{mode.title}</span>
                      <span className="text-[9px] text-gray-500 block">{mode.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Calibre des Œufs *
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { cal: "S", label: "S", sub: "< 53g" },
                    { cal: "M", label: "M", sub: "53-63g" },
                    { cal: "L", label: "L", sub: "63-73g" },
                    { cal: "XL", label: "XL", sub: "≥ 73g" },
                  ].map((c) => (
                    <button
                      key={c.cal}
                      type="button"
                      onClick={() => setFormData({ ...formData, eggCaliber: c.cal })}
                      className={`p-1.5 border rounded-md transition-all text-center cursor-pointer ${
                        formData.eggCaliber === c.cal
                          ? "bg-amber-300/80 border-amber-600 font-bold text-amber-950"
                          : "bg-white border-amber-200 text-gray-700 hover:bg-amber-50"
                      }`}
                    >
                      <span className="block text-xs font-bold">{c.cal}</span>
                      <span className="block text-[8px] text-gray-500">{c.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Date de Ponte *
                </label>
                <input
                  type="date"
                  required
                  value={formData.layingDate}
                  onChange={(e) => setFormData({ ...formData, layingDate: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  DCR (Consommation Recommandée) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dcrDate}
                  onChange={(e) => setFormData({ ...formData, dcrDate: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  N° Agrément Sanitaire Centre CE
                </label>
                <input
                  type="text"
                  placeholder="ex: FR 31.000.001 CE"
                  value={formData.eggSanitaryApproval}
                  onChange={(e) => setFormData({ ...formData, eggSanitaryApproval: e.target.value })}
                  className="w-full border border-amber-300 rounded-md p-2 font-medium text-gray-900 focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: LABELS ET CERTIFICATIONS */}
        <div className="space-y-2">
          <div className="border-b border-gray-100 pb-1">
            <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-[10px]">
              2. Labels, Certifications & SIQO (Optionnel)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { id: "isBio", label: "Bio (AB)", color: "bg-amber-50 text-amber-900 border-amber-300" },
              { id: "isAOP", label: "AOP (Europe)", color: "bg-blue-50 text-blue-900 border-blue-300" },
              { id: "isAOC", label: "AOC (France)", color: "bg-red-50 text-red-900 border-red-300" },
              { id: "isIGP", label: "IGP", color: "bg-purple-50 text-purple-900 border-purple-300" },
              { id: "isLabelRouge", label: "Label Rouge", color: "bg-rose-50 text-rose-900 border-rose-300" },
              { id: "isHVE", label: "HVE", color: "bg-emerald-50 text-emerald-900 border-emerald-300" },
              { id: "isDemeter", label: "Demeter", color: "bg-orange-50 text-orange-900 border-orange-300" },
              { id: "isSTG", label: "STG", color: "bg-teal-50 text-teal-900 border-teal-300" },
              { id: "isEgalim", label: "EGAlim", color: "bg-cyan-50 text-cyan-900 border-cyan-300" },
            ].map((cert) => (
              <label
                key={cert.id}
                className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors text-xs font-medium ${
                  formData[cert.id] ? `${cert.color} font-bold` : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(formData[cert.id])}
                  onChange={(e) => setFormData({ ...formData, [cert.id]: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>{cert.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SECTION 4: VISUELS ET ÉTIQUETTES */}
        <div className="space-y-2">
          <div className="border-b border-gray-100 pb-1">
            <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-[10px]">
              3. Photos Produit & Étiquette Ingrédients
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Photo Produit */}
            <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-md space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-700 block">
                Photo Principale du Produit
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-700">
                  <Camera size={14} className="text-emerald-700" />
                  <span>Choisir un visuel</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {formData.imagePreview && (
                  <div className="flex items-center gap-2">
                    <img
                      src={formData.imagePreview}
                      alt="Aperçu Produit"
                      className="w-9 h-9 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imagePreview: null })}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Étiquette INCO */}
            <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-md space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-700 flex items-center gap-1">
                <FileText size={13} className="text-emerald-700" />
                <span>Photo Étiquette Ingrédients & Allergènes (INCO)</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-700">
                  <Camera size={14} className="text-emerald-700" />
                  <span>Ajouter la photo d'étiquette</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleIncoImageChange} />
                </label>
                {formData.incoImagePreview && (
                  <div className="flex items-center gap-2">
                    <img
                      src={formData.incoImagePreview}
                      alt="Aperçu Étiquette INCO"
                      className="w-9 h-9 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, incoImagePreview: null })}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Soumission */}
        <div className="flex justify-end pt-2 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-6 rounded-md text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <PlusCircle size={15} />
                <span>Mettre le Produit en Rayon</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
