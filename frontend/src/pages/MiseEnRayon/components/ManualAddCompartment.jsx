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
  FileText
} from "lucide-react";

export default function ManualAddCompartment({ onProductAdded }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const producerName = user?.companyName || user?.displayName || user?.name || user?.producerName || "Exploitation Locale";

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
    storageInstructions: "",

    // Labels EGAlim / SIQO complémentaires
    isHve: false,
    isAopIgp: false,
    isLabelRouge: false,
  });

  // Photo principale du produit (syntaxe [0] sécurisée)
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Photo de l'étiquette INCO (syntaxe [0] sécurisée)
  const handleIncoImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          incoImagePreview: reader.result,
        }));
      };
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
        text: `Le produit "${formData.title}" a été mis en rayon avec succès !` 
      });
      
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
        imagePreview: "",
        floralOrigin: "",
        honeyNetWeight: "",
        eggRearingMode: "",
        eggCaliber: "",
        dcrDate: "",
        eggSanitaryApproval: "",
        dryGoodsType: "",
        ddmDate: "",
        dlcDate: "",
        packagingContainer: "bocal",
        incoImagePreview: "",
        storageInstructions: "",
        isHve: false,
        isAopIgp: false,
        isLabelRouge: false,
      });

      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: err.message || "Une erreur est survenue lors de la mise en rayon." });
    } finally {
      setLoading(false);
    }
  };

  const isHoney = formData.category === "Miel & Apiculture" || formData.title.toLowerCase().includes("miel");
  const isEggs = formData.category === "Œufs & Élevage" || formData.title.toLowerCase().includes("œuf") || formData.title.toLowerCase().includes("oeuf");
  const isDryGoods = formData.category === "Produits Secs & Épicerie";
  const isProcessed = formData.category === "Transformés" || formData.category === "Produits Transformés & Conserves";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <PlusCircle className="text-emerald-600" size={20} />
            Mise en Rayon Unitaire Multi-Filières
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Saisissez les informations de votre récolte ou produit.
          </p>
        </div>
        <div className="flex items-center gap-2 font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Exploitation : {producerName}</span>
        </div>
      </div>

      <div className="p-3.5 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xl flex items-center gap-2">
        <PackageCheck size={18} className="text-amber-700 shrink-0" />
        <span>
          <strong>Logistique Circuit Court :</strong> Tous les produits sont emballés en caisses/cagettes réutilisables consignées ou emballages recyclables certifiés.
        </span>
      </div>

      {statusMsg.text && (
        <div className={`p-3.5 rounded-xl font-bold flex items-center gap-2 animate-fade-in ${statusMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {statusMsg.type === 'error' ? <AlertCircle size={16} className="shrink-0" /> : <CheckCircle size={16} className="shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">Désignation du Produit *</label>
            <input
              type="text"
              required
              placeholder="ex: Miel d'Acacia 500g, Carottes Bio, Œufs Plein Air..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">Catégorie *</label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Légumes">Légumes</option>
              <option value="Fruits">Fruits</option>
              <option value="Herbes">Herbes</option>
              <option value="Transformés">Transformés</option>
              <option value="Miel & Apiculture">🍯 Miel & Apiculture</option>
              <option value="Œufs & Élevage">🥚 Œufs & Élevage</option>
              <option value="Produits Secs & Épicerie">🌾 Produits Secs & Épicerie</option>
              <option value="Produits Transformés & Conserves">🫙 Produits Transformés & Conserves</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">Prix Unitaire HT (€) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="ex: 6.50"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              value={formData.priceHT}
              onChange={(e) => setFormData({ ...formData, priceHT: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">Taux de TVA *</label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
              value={formData.vatRate}
              onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
            >
              <option value="5.5">5.5 % (Taux réduit alimentation)</option>
              <option value="10.0">10.0 % (Produits préparés / Traiteur)</option>
              <option value="20.0">20.0 % (Taux normal)</option>
              <option value="0.0">0.0 % (Franchise de TVA art. 293 B)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">Unité de Vente *</label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="pot">le Pot / Bocal</option>
              <option value="kg">au Kilogramme (kg)</option>
              <option value="pièce">à la Pièce</option>
              <option value="botte">la Botte</option>
              <option value="barquette">la Barquette</option>
              <option value="cagette">la Cagette (5 kg)</option>
              <option value="bouteille">la Bouteille / Flacon</option>
              <option value="boite_6">la Boîte de 6 œufs</option>
              <option value="boite_12">la Boîte de 12 œufs</option>
              <option value="plateau_30">le Plateau de 30 œufs</option>
              <option value="sachet">le Sachet / Paquet</option>
              <option value="litre">au Litre (L)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">Quantité en Stock *</label>
            <input
              type="number"
              min="0"
              required
              placeholder="ex: 30"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">Date de Récolte / Extraction *</label>
            <input
              type="date"
              required
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              value={formData.harvestDate}
              onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex">N° de Lot / Traçabilité</label>
            <input
              type="text"
              placeholder="Automatique si vide"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            />
          </div>
        </div>

        {/* 🍯 Attributs Miel */}
        {isHoney && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-fade-in">
            <h3 className="font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-600" />
              <span>Attributs Miel & Apiculture</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-amber-900 uppercase block mb-1">Origine Florale / Variété</label>
                <input
                  type="text"
                  placeholder="ex: Acacia, Fleurs, Châtaignier..."
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 font-semibold text-gray-900 bg-white"
                  value={formData.floralOrigin}
                  onChange={(e) => setFormData({ ...formData, floralOrigin: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-amber-900 uppercase block mb-1">Poids Net du Pot</label>
                <input
                  type="text"
                  placeholder="ex: 250g, 500g, 1 kg"
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 font-semibold text-gray-900 bg-white"
                  value={formData.honeyNetWeight}
                  onChange={(e) => setFormData({ ...formData, honeyNetWeight: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-amber-900 uppercase block mb-1">DDM (Date Durabilité Minimale)</label>
                <input
                  type="date"
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 font-semibold text-gray-900 bg-white"
                  value={formData.ddmDate}
                  onChange={(e) => setFormData({ ...formData, ddmDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 🥚 Attributs Œufs */}
        {isEggs && (
          <div className="p-4 bg-yellow-50/70 border border-yellow-200 rounded-2xl space-y-3 animate-fade-in">
            <h3 className="font-black text-yellow-950 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={16} className="text-yellow-700" />
              <span>Attributs Œufs & Élevage</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-yellow-950 uppercase block mb-1">Mode d'Élevage</label>
                <select
                  className="w-full border border-yellow-300 rounded-xl px-3 py-2 font-semibold text-gray-900 bg-white"
                  value={formData.eggRearingMode}
                  onChange={(e) => setFormData({ ...formData, eggRearingMode: e.target.value })}
                >
                  <option value="">Sélectionner un mode</option>
                  <option value="0">0 - Biologique (AB)</option>
                  <option value="1">1 - Plein Air</option>
                  <option value="2">2 - Au Sol (Intérieur)</option>
                  <option value="3">3 - En Cage aménagement</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-yellow-950 uppercase block mb-1">Calibre</label>
                <select
                  className="w-full border border-yellow-300 rounded-xl px-3 py-2 font-semibold text-gray-900 bg-white"
                  value={formData.eggCaliber}
                  onChange={(e) => setFormData({ ...formData, eggCaliber: e.target.value })}
                >
                  <option value="">Sélectionner calibre</option>
                  <option value="M">M - Moyen (53g à 63g)</option>
                  <option value="L">L - Grand (63g à 73g)</option>
                  <option value="XL">XL - Très Grand (&gt; 73g)</option>
                  <option value="S">S - Petit (&lt; 53g)</option>
                  <option value="Mixte">Calibre Mélangé</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-yellow-950 uppercase block mb-1">DCR (28j max)</label>
                <input
                  type="date"
                  className="w-full border border-yellow-300 rounded-xl px-3 py-2 font-semibold text-gray-900 bg-white"
                  value={formData.dcrDate}
                  onChange={(e) => setFormData({ ...formData, dcrDate: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-yellow-950 uppercase block mb-1">Agrément Sanitaire</label>
                <input
                  type="text"
                  placeholder="ex: 0FR3101"
                  className="w-full border border-yellow-300 rounded-xl px-3 py-2 font-semibold text-gray-900 bg-white"
                  value={formData.eggSanitaryApproval}
                  onChange={(e) => setFormData({ ...formData, eggSanitaryApproval: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 🌾🫙 Photo de l'étiquette INCO */}
        {(isDryGoods || isProcessed) && (
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in">
            <h3 className="font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={16} className="text-emerald-700" />
              <span>Photo Étiquette Ingrédients & Allergènes (INCO)</span>
            </h3>
            <p className="text-[11px] text-gray-600">
              Ajoutez une photo claire de l'étiquette au dos du produit montrant la composition et les allergènes.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-emerald-300 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors font-bold text-emerald-900 shadow-xs">
                <Camera size={16} className="text-emerald-600" />
                <span>Téléverser la photo de l'étiquette INCO</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleIncoImageChange} />
              </label>
              {formData.incoImagePreview && (
                <div className="flex items-center gap-2">
                  <img src={formData.incoImagePreview} alt="Aperçu Étiquette INCO" className="w-12 h-12 object-cover rounded-lg border border-emerald-300" />
                  <span className="text-emerald-700 font-bold text-[11px]">Photo étiquette prête</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo principale du Produit */}
        <div>
          <label className="font-bold text-gray-700 uppercase tracking-wider mb-2 flex">Photo Principale du Produit</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors font-bold text-gray-700">
              <Camera size={16} className="text-emerald-600" />
              <span>Choisir un fichier visuel</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {formData.imagePreview && (
              <div className="flex items-center gap-2">
                <img src={formData.imagePreview} alt="Aperçu" className="w-10 h-10 object-cover rounded-lg border border-gray-300" />
                <span className="text-green-700 font-bold">Visuel prêt</span>
              </div>
            )}
          </div>
        </div>

        {/* BLOC LABELS ET CERTIFICATIONS QUALITÉ (RESTAURÉ : BIO, HVE, AOP/IGP, LABEL ROUGE) */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3.5 border border-amber-200 bg-amber-50/40 rounded-xl cursor-pointer hover:bg-amber-50 transition w-full">
            <input
              type="checkbox"
              className="mt-1 text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
              checked={formData.isBio}
              onChange={(e) => setFormData({ ...formData, isBio: e.target.checked })}
            />
            <div>
              <span className="font-extrabold text-amber-900 uppercase tracking-wider flex">Label Agriculture Biologique (AB / Bio)</span>
              <span className="text-amber-700 leading-tight flex mt-0.5">
                Cochez si ce lot bénéficie de la certification AB officielle Ecocert / Agence Bio.
              </span>
            </div>
          </label>

          {/* Extensibilité SIQO / EGAlim (HVE, AOP/IGP, Label Rouge) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50/60 cursor-pointer text-xs font-bold text-gray-700 hover:bg-gray-100">
              <input
                type="checkbox"
                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
                checked={formData.isHve}
                onChange={(e) => setFormData({ ...formData, isHve: e.target.checked })}
              />
              <span>HVE (Haute Val. Env.)</span>
            </label>

            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50/60 cursor-pointer text-xs font-bold text-gray-700 hover:bg-gray-100">
              <input
                type="checkbox"
                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
                checked={formData.isAopIgp}
                onChange={(e) => setFormData({ ...formData, isAopIgp: e.target.checked })}
              />
              <span>AOP / AOC / IGP</span>
            </label>

            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50/60 cursor-pointer text-xs font-bold text-gray-700 hover:bg-gray-100">
              <input
                type="checkbox"
                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
                checked={formData.isLabelRouge}
                onChange={(e) => setFormData({ ...formData, isLabelRouge: e.target.checked })}
              />
              <span>Label Rouge</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-8 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
