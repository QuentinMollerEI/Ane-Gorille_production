import React, { useState, useMemo } from "react";
import { db } from "../../../services/firestore.service";
import { doc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import {
  Search,
  Trash2,
  Edit2,
  Package,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Archive,
  Filter,
  Lock,
  Info,
  Award,
  Tag,
  Calendar
} from "lucide-react";

/**
 * 🌾 COMPOSANT : StockCompartment.jsx
 * Tableau de gestion du rayon actif avec modale d'édition enrichie :
 * - Support Miel & Apiculture (Origine florale, DDM, Poids net)
 * - Support Œufs & Élevage (Mode d'élevage 0/1/2/3, Calibre S/M/L/XL, DCR 28j max)
 * - Support AOP & AOC séparés
 * - Protection intégrité désignation si commandes enregistrées
 */
export default function StockCompartment({ products = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const activeProducts = useMemo(() => {
    return (products || []).filter((item) => item.status !== "archived");
  }, [products]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((item) => {
      const matchesSearch =
        (item.title || item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategory === "all" ||
        (item.category || "").toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [activeProducts, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(activeProducts.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [activeProducts]);

  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isNameLocked = (p) => {
    if (!p) return false;
    return Boolean(
      p.hasOrders ||
      (p.orderedCount && p.orderedCount > 0) ||
      (p.salesCount && p.salesCount > 0) ||
      (p.soldQuantity && p.soldQuantity > 0)
    );
  };

  const handleToggleVisibility = async (product) => {
    const newHidden = !product.isHidden;
    setLoadingId(product.id);
    try {
      await updateDoc(doc(db, "products", product.id), {
        isHidden: newHidden,
        status: newHidden ? "hidden" : "published",
        updatedAt: serverTimestamp(),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de la modification de visibilité :", err);
      alert("Erreur lors de la modification de visibilité.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleArchiveSingle = async (id) => {
    if (
      !window.confirm(
        "Voulez-vous retirer ce produit de votre rayon actif et le placer dans vos archives ?"
      )
    )
      return;

    setLoadingId(id);
    try {
      await updateDoc(doc(db, "products", id), {
        status: "archived",
        isHidden: true,
        isAvailable: false,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSelectedIds(selectedIds.filter((item) => item !== id));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de l'archivage du produit :", err);
      alert("Erreur lors de l'archivage du produit.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleBatchVisibility = async (shouldHide) => {
    if (selectedIds.length === 0) return;
    const actionText = shouldHide ? "masquer" : "afficher en boutique";
    if (
      !window.confirm(
        `Voulez-vous vraiment ${actionText} les ${selectedIds.length} produit(s) sélectionné(s) ?`
      )
    )
      return;

    setBatchLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        const ref = doc(db, "products", id);
        batch.update(ref, {
          isHidden: shouldHide,
          status: shouldHide ? "hidden" : "published",
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur d'action de groupe :", err);
      alert("Erreur lors de la mise à jour groupée.");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Voulez-vous vraiment archiver ces ${selectedIds.length} produit(s) ?`
      )
    )
      return;

    setBatchLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        const ref = doc(db, "products", id);
        batch.update(ref, {
          status: "archived",
          isHidden: true,
          isAvailable: false,
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur d'archivage de groupe :", err);
      alert("Erreur lors de l'archivage groupé.");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSaveEditModal = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoadingId(editingProduct.id);

    try {
      const pHT = Number(editingProduct.priceHT || 0);
      const vRate = Number(editingProduct.vatRate || 5.5);
      const st = Number(editingProduct.stock || 0);

      const finalTitle = isNameLocked(editingProduct)
        ? (editingProduct.originalTitle || editingProduct.title || editingProduct.name)
        : editingProduct.title;

      const updatePayload = {
        title: finalTitle,
        name: finalTitle,
        category: editingProduct.category || "Légumes",
        unit: editingProduct.unit || "kg",
        priceHT: pHT,
        price: pHT,
        vatRate: vRate,
        stock: st,
        quantity: st,
        isAvailable: st > 0,
        batchNumber: editingProduct.batchNumber || "LOT-STD",
        harvestDate: editingProduct.harvestDate || null,
        manufacturingDate: editingProduct.manufacturingDate || null,

        // Miel
        floralOrigin: editingProduct.floralOrigin || null,
        honeyNetWeight: editingProduct.honeyNetWeight || null,
        ddmDate: editingProduct.ddmDate || null,

        // Œufs
        eggRearingMode: editingProduct.eggRearingMode || null,
        eggCaliber: editingProduct.eggCaliber || null,
        dcrDate: editingProduct.dcrDate || null,
        eggSanitaryApproval: editingProduct.eggSanitaryApproval || null,

        // Labels
        isBio: Boolean(editingProduct.isBio),
        isAOP: Boolean(editingProduct.isAOP),
        isAOC: Boolean(editingProduct.isAOC),
        isIGP: Boolean(editingProduct.isIGP),
        isLabelRouge: Boolean(editingProduct.isLabelRouge),
        isHVE: Boolean(editingProduct.isHVE),

        imageUrl: editingProduct.imageUrl || null,
        image: editingProduct.imageUrl || null,
        labelImageUrl: editingProduct.labelImageUrl || editingProduct.ingredientsImageUrl || null,
        isHidden: Boolean(editingProduct.isHidden),
        status: editingProduct.isHidden ? "hidden" : "published",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "products", editingProduct.id), updatePayload);

      setEditingProduct(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur de mise à jour du produit :", err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Package size={18} className="text-emerald-700" />
            <span>Gestion des Stocks & Masquage Boutique ({filteredProducts.length})</span>
          </h2>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Sélectionnez vos lignes pour agir en masse, masquez les produits temporairement ou modifiez leur fiche.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par produit ou n° de lot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-xl px-2.5 py-1.5 font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 animate-fade-in">
          <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
            <CheckCircle size={15} className="text-emerald-700" />
            <span>{selectedIds.length} produit(s) sélectionné(s)</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchVisibility(true)}
              disabled={batchLoading}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <EyeOff size={13} />
              <span>Masquer la sélection</span>
            </button>

            <button
              onClick={() => handleBatchVisibility(false)}
              disabled={batchLoading}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye size={13} />
              <span>Afficher en boutique</span>
            </button>

            <button
              onClick={handleBatchArchive}
              disabled={batchLoading}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Archive size={13} />
              <span>Archiver la sélection</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[9px] tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="p-3">Visuel & Désignation</th>
                <th className="p-3">Catégorie & Spécificités</th>
                <th className="p-3">Prix HT (TTC)</th>
                <th className="p-3">Stock Disponible</th>
                <th className="p-3">Visibilité Boutique</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const priceHT = Number(p.priceHT ?? p.price ?? 0);
                  const vat = Number(p.vatRate ?? 5.5);
                  const priceTTC = priceHT * (1 + vat / 100);
                  const stock = Number(p.stock ?? 0);
                  const isSelected = selectedIds.includes(p.id);
                  const nameLocked = isNameLocked(p);

                  const isHoneyProd = p.category === "Miel & Apiculture" || (p.title || "").toLowerCase().includes("miel");
                  const isEggProd = p.category === "Œufs & Élevage" || (p.title || "").toLowerCase().includes("œuf") || (p.title || "").toLowerCase().includes("oeuf");

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(p.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                            {p.imageUrl || p.image ? (
                              <img
                                src={p.imageUrl || p.image}
                                alt={p.title || p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs font-bold">
                                {isHoneyProd ? "🍯" : isEggProd ? "🥚" : "🥕"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="font-extrabold text-gray-900 text-xs">
                                {p.title || p.name}
                              </span>

                              {p.isBio && (
                                <span className="bg-amber-100 text-amber-900 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                                  Bio
                                </span>
                              )}
                              {p.isAOP && (
                                <span className="bg-blue-100 text-blue-900 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                                  AOP
                                </span>
                              )}
                              {p.isAOC && (
                                <span className="bg-red-100 text-red-900 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                                  AOC
                                </span>
                              )}
                              {p.isIGP && (
                                <span className="bg-purple-100 text-purple-900 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                                  IGP
                                </span>
                              )}
                              {nameLocked && (
                                <span title="Désignation verrouillée" className="text-gray-400">
                                  <Lock size={12} />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold block">
                              Lot : {p.batchNumber || "LOT-STD"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-gray-700 block">{p.category || "Légumes"}</span>
                        {isHoneyProd && (
                          <span className="text-[10px] text-amber-900 font-extrabold block">
                            🍯 {p.floralOrigin || "Toutes Fleurs"} ({p.honeyNetWeight || "500g"})
                          </span>
                        )}
                        {isEggProd && (
                          <span className="text-[10px] text-amber-900 font-extrabold block">
                            🥚 Mode {p.eggRearingMode ?? "0"} - Calibre {p.eggCaliber || "M"}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="font-black text-gray-900 block">
                          {priceHT.toFixed(2)} € HT
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          {priceTTC.toFixed(2)} € TTC ({vat}%)
                        </span>
                      </td>

                      <td className="p-3 font-black">
                        <span
                          className={
                            stock > 10
                              ? "text-emerald-700"
                              : stock > 0
                              ? "text-amber-700"
                              : "text-red-600"
                          }
                        >
                          {stock} {p.unit || "kg"}
                        </span>
                      </td>

                      <td className="p-3">
                        {p.isHidden ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                            <EyeOff size={11} />
                            <span>Masqué</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Eye size={11} />
                            <span>En rayon</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setEditingProduct({
                                ...p,
                                originalTitle: p.title || p.name,
                              })
                            }
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Modifier la fiche"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleToggleVisibility(p)}
                            disabled={loadingId === p.id}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.isHidden
                                ? "text-amber-700 hover:bg-amber-50"
                                : "text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={p.isHidden ? "Afficher en boutique" : "Masquer de la boutique"}
                          >
                            {p.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>

                          <button
                            onClick={() => handleArchiveSingle(p.id)}
                            disabled={loadingId === p.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Archiver ce produit"
                          >
                            <Archive size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400 font-bold italic">
                    Aucun produit trouvé dans votre rayon pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Edit2 size={16} className="text-emerald-700" />
                <span>Modification de : {editingProduct.originalTitle || editingProduct.title || editingProduct.name}</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                  Désignation du Produit *
                </label>
                {isNameLocked(editingProduct) ? (
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={editingProduct.title || editingProduct.name || ""}
                        className="w-full p-2 pr-8 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs cursor-not-allowed"
                      />
                      <Lock size={14} className="absolute right-3 top-2.5 text-gray-400" />
                    </div>
                    <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5 font-bold">
                      <Lock size={12} className="shrink-0 text-amber-700" />
                      <span>Désignation verrouillée : Ce produit possède un historique de commandes et factures associées.</span>
                    </p>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={editingProduct.title || editingProduct.name || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={editingProduct.category || "Légumes"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Légumes">🥕 Légumes</option>
                    <option value="Fruits">🍎 Fruits</option>
                    <option value="Herbes & Aromates">🌿 Herbes & Aromates</option>
                    <option value="Miel & Apiculture">🍯 Miel & Apiculture</option>
                    <option value="Œufs & Élevage">🥚 Œufs & Élevage</option>
                    <option value="Produits Transformés & Conserves">🥫 Produits Transformés & Conserves</option>
                    <option value="Produits Secs & Épicerie">🌾 Produits Secs & Épicerie</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                    Unité de Vente *
                  </label>
                  <select
                    value={editingProduct.unit || "kg"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kg">au Kilogramme (kg)</option>
                    <option value="pièce">à la Pièce</option>
                    <option value="botte">la Botte</option>
                    <option value="barquette">la Barquette</option>
                    <option value="cagette">la Cagette / Caisse (5 kg)</option>
                    <option value="bocal">le Bocal</option>
                    <option value="pot">le Pot</option>
                    <option value="sachet">le Sachet</option>
                    <option value="boîte">la Boîte</option>
                  </select>
                </div>
              </div>

              {/* ÉDITION MIEL */}
              {(editingProduct.category === "Miel & Apiculture" || (editingProduct.title || "").toLowerCase().includes("miel")) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="font-extrabold text-amber-950 text-xs block">🍯 Spécificités Miel & Apiculture</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-extrabold text-amber-900 block">Origine Florale</label>
                      <input
                        type="text"
                        value={editingProduct.floralOrigin || "Toutes Fleurs"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, floralOrigin: e.target.value })}
                        className="w-full p-1.5 border border-amber-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-amber-900 block">Poids Net Pot</label>
                      <input
                        type="text"
                        value={editingProduct.honeyNetWeight || "500 g"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, honeyNetWeight: e.target.value })}
                        className="w-full p-1.5 border border-amber-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ÉDITION ŒUFS */}
              {(editingProduct.category === "Œufs & Élevage" || (editingProduct.title || "").toLowerCase().includes("œuf") || (editingProduct.title || "").toLowerCase().includes("oeuf")) && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <span className="font-extrabold text-amber-950 text-xs block">🥚 Spécificités Œufs Coquille</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-extrabold text-amber-900 block">Mode d'Élevage (Code)</label>
                      <select
                        value={editingProduct.eggRearingMode ?? "0"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, eggRearingMode: e.target.value })}
                        className="w-full p-1.5 border border-amber-300 rounded-lg text-xs font-bold bg-white"
                      >
                        <option value="0">0 - Bio (Agriculture Biologique)</option>
                        <option value="1">1 - Plein Air</option>
                        <option value="2">2 - Au Sol</option>
                        <option value="3">3 - En Cage</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-amber-900 block">Calibre</label>
                      <select
                        value={editingProduct.eggCaliber || "M"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, eggCaliber: e.target.value })}
                        className="w-full p-1.5 border border-amber-300 rounded-lg text-xs font-bold bg-white"
                      >
                        <option value="S">S - Petit (&lt; 53g)</option>
                        <option value="M">M - Moyen (53-63g)</option>
                        <option value="L">L - Gros (63-73g)</option>
                        <option value="XL">XL - Très Gros (≥ 73g)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                    Prix HT (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.priceHT ?? editingProduct.price ?? ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceHT: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                    Taux TVA (%) *
                  </label>
                  <select
                    value={editingProduct.vatRate ?? "5.5"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, vatRate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="5.5">5.5 % (Taux réduit)</option>
                    <option value="20.0">20.0 % (Taux normal)</option>
                    <option value="0.0">0.0 % (Franchise)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock ?? ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                    N° de Lot Sanitaire
                  </label>
                  <input
                    type="text"
                    value={editingProduct.batchNumber || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, batchNumber: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-600 block mb-1">
                    Date de Récolte / Fab.
                  </label>
                  <input
                    type="date"
                    value={editingProduct.harvestDate || editingProduct.manufacturingDate || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, harvestDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-gray-600 block">Labels & Certifications</span>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isBio)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isBio: e.target.checked })}
                      className="rounded text-amber-600"
                    />
                    <span>🌿 Bio</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isAOP)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isAOP: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>🇪🇺 AOP</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isAOC)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isAOC: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>🇫🇷 AOC</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isIGP)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isIGP: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>🗺️ IGP</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isLabelRouge)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isLabelRouge: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span>🔴 Label Rouge</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isHVE)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isHVE: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>🍃 HVE</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingId === editingProduct.id}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
