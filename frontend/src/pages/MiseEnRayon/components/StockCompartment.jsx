import React, { useState } from "react";
import { db } from "../../../services/firestore.service";
import { doc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
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
} from "lucide-react";

/**
 * 🌾 COMPOSANT : StockCompartment.jsx
 * Responsabilité unique : Tableau de gestion des stocks, visibilité en boutique et édition globale.
 * Permet :
 *  1. Masquer/Afficher un produit individuel (icône Œil / EyeOff).
 *  2. Sélectionner plusieurs lignes via cases à cocher (Sélection multiple).
 *  3. Action de groupe : Masquer, Afficher ou Supprimer la sélection en masse (Batch Firestore).
 *  4. Modification intégrale de chaque ligne produit via la modale d'édition.
 */
export default function StockCompartment({ products, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Filtrage local des produits
  const filteredProducts = (products || []).filter((item) => {
    const matchesSearch =
      (item.title || item.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.batchNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat =
      selectedCategory === "all" ||
      (item.category || "").toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCat;
  });

  // Gestion de la sélection globale
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

  // 👁️ Toggle Masquer/Afficher un produit unique
  const handleToggleVisibility = async (product) => {
    const newHidden = !product.isHidden;
    setLoadingId(product.id);
    try {
      await updateDoc(doc(db, "products", product.id), {
        isHidden: newHidden,
        status: newHidden ? "hidden" : "published",
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de la modification de visibilité :", err);
      alert("Erreur lors de la modification de visibilité.");
    } finally {
      setLoadingId(null);
    }
  };

  // 🗑️ Suppression d'un produit unique
  const handleDeleteSingle = async (id) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir retirer ce produit de votre rayon ?",
      )
    )
      return;
    setLoadingId(id);
    try {
      await deleteDoc(doc(db, "products", id));
      setSelectedIds(selectedIds.filter((item) => item !== id));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur de suppression du produit :", err);
      alert("Erreur lors de la suppression.");
    } finally {
      setLoadingId(null);
    }
  };

  // ⚡ ACTIONS DE GROUPE (BATCH)
  const handleBatchVisibility = async (shouldHide) => {
    if (selectedIds.length === 0) return;
    const actionText = shouldHide ? "masquer" : "afficher en boutique";
    if (
      !window.confirm(
        `Voulez-vous vraiment ${actionText} les ${selectedIds.length} produit(s) sélectionné(s) ?`,
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

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `⚠️ ATTENTION : Voulez-vous vraiment supprimer DEFINITIVEMENT ces ${selectedIds.length} produit(s) du rayon ?`,
      )
    )
      return;

    setBatchLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        const ref = doc(db, "products", id);
        batch.delete(ref);
      });
      await batch.commit();
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur de suppression de groupe :", err);
      alert("Erreur lors de la suppression groupée.");
    } finally {
      setBatchLoading(false);
    }
  };

  // Sauvegarde des modifications globales de la modale
  const handleSaveEditModal = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoadingId(editingProduct.id);
    try {
      const pHT = Number(editingProduct.priceHT || 0);
      const vRate = Number(editingProduct.vatRate || 5.5);
      const st = Number(editingProduct.stock || 0);

      await updateDoc(doc(db, "products", editingProduct.id), {
        title: editingProduct.title,
        name: editingProduct.title,
        category: editingProduct.category || "Légumes",
        unit: editingProduct.unit || "kg",
        priceHT: pHT,
        price: pHT,
        vatRate: vRate,
        stock: st,
        quantity: st,
        isAvailable: st > 0,
        batchNumber: editingProduct.batchNumber || "LOT-2026-STD",
        harvestDate: editingProduct.harvestDate || "",
        isBio: Boolean(editingProduct.isBio),
        imageUrl: editingProduct.imageUrl || null,
        image: editingProduct.imageUrl || null,
        isHidden: Boolean(editingProduct.isHidden),
      });

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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* EN-TÊTE DU COMPARTIMENT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Package className="text-emerald-600" size={20} />
            Gestion des Stocks & Masquage Boutique ({filteredProducts.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sélectionnez vos lignes pour agir en masse, masquez les produits
            temporairement ou modifiez leur fiche.
          </p>
        </div>

        {/* MOTEUR DE RECHERCHE ET FILTRES */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
      </div>

      {/* 🛠️ BARRE D'ACTIONS GROUPÉES (AFFICHEE SI DES PRODUITS SONT SÉLECTIONNÉS) */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-black">
              {selectedIds.length} sélectionné(s)
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-emerald-200 hover:text-white underline text-xs font-semibold ml-2"
            >
              Désélectionner tout
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={batchLoading}
              onClick={() => handleBatchVisibility(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <EyeOff size={14} />
              <span>Masquer en Boutique</span>
            </button>

            <button
              type="button"
              disabled={batchLoading}
              onClick={() => handleBatchVisibility(false)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Eye size={14} />
              <span>Rendre Visible</span>
            </button>

            <button
              type="button"
              disabled={batchLoading}
              onClick={handleBatchDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 size={14} />
              <span>Supprimer Sélection</span>
            </button>
          </div>
        </div>
      )}

      {/* TABLEAU DES PRODUITS EN RAYON */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold uppercase">
            <tr>
              {/* CASE A COCHER GLOBALE */}
              <th className="p-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="p-4">Visuel & Désignation</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Prix HT (TTC)</th>
              <th className="p-4">Stock Disponible</th>
              <th className="p-4">Visibilité Boutique</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 font-medium">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const priceHT = Number(p.priceHT || p.price || 0);
                const vat = Number(p.vatRate || 5.5);
                const priceTTC = priceHT * (1 + vat / 100);
                const stock = Number(p.stock ?? p.quantity ?? 0);
                const isSelected = selectedIds.includes(p.id);
                const isHidden = Boolean(p.isHidden);

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-emerald-50/60"
                        : isHidden
                          ? "bg-gray-50/90 text-gray-400"
                          : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* CASE A COCHER DE LIGNE */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(p.id)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </td>

                    {/* VISUEL & TITRE */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                          {p.imageUrl || p.image ? (
                            <img
                              src={p.imageUrl || p.image}
                              alt={p.title}
                              className={`w-full h-full object-cover ${isHidden ? "grayscale opacity-60" : ""}`}
                            />
                          ) : (
                            <span className="text-base">🥕</span>
                          )}
                        </div>
                        <div>
                          <p
                            className={`font-bold text-sm leading-snug ${isHidden ? "text-gray-500 line-through" : "text-gray-900"}`}
                          >
                            {p.title || p.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.isBio && (
                              <span className="px-2 py-0.2 bg-amber-100 text-amber-900 font-black text-[9px] rounded-full uppercase">
                                BIO
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono">
                              {p.batchNumber || "LOT-STD"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CATÉGORIE */}
                    <td className="p-4 text-gray-600 font-semibold">
                      {p.category || "Légumes"}
                    </td>

                    {/* PRIX HT & TTC */}
                    <td className="p-4">
                      <p className="font-bold text-gray-900">
                        {priceHT.toFixed(2)} €{" "}
                        <span className="text-[10px] text-gray-400 font-normal">
                          HT
                        </span>
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold">
                        {priceTTC.toFixed(2)} € TTC ({vat}%)
                      </p>
                    </td>

                    {/* STOCK DISPONIBLE */}
                    <td className="p-4">
                      <span
                        className={`font-black text-sm ${
                          stock > 10
                            ? "text-emerald-700"
                            : stock > 0
                              ? "text-amber-700"
                              : "text-red-600"
                        }`}
                      >
                        {stock} {p.unit || "kg"}
                      </span>
                    </td>

                    {/* VISIBILITÉ BOUTIQUE (OEIL TOGGLE) */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(p)}
                        disabled={loadingId === p.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all ${
                          isHidden
                            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        }`}
                        title={
                          isHidden
                            ? "Produit masqué en boutique (Cliquer pour afficher)"
                            : "Produit visible en boutique (Cliquer pour masquer)"
                        }
                      >
                        {loadingId === p.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : isHidden ? (
                          <>
                            <EyeOff size={13} className="text-amber-600" />
                            <span>Masqué</span>
                          </>
                        ) : (
                          <>
                            <Eye size={13} className="text-emerald-600" />
                            <span>Visible</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* ACTIONS INDIVIDUELLES */}
                    <td className="p-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...p })}
                        className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Modifier la fiche complète du produit"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(p.id)}
                        disabled={loadingId === p.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Retirer ce produit du rayon"
                      >
                        {loadingId === p.id ? (
                          <RefreshCw
                            size={15}
                            className="animate-spin text-gray-500"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="p-8 text-center text-gray-400 italic"
                >
                  Aucun produit trouvé dans votre rayon pour ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📝 MODALE DE MODIFICATION INTEGRALE */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Edit2 size={18} className="text-emerald-600" />
                Modifier la fiche du produit
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEditModal}
              className="space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="block text-gray-600 mb-1">
                  Désignation du Produit *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-900"
                  value={editingProduct.title || editingProduct.name || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">Catégorie</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800"
                    value={editingProduct.category || "Légumes"}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="Légumes">Légumes</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Herbes">Herbes</option>
                    <option value="Transformés">Transformés</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Unité</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800"
                    value={editingProduct.unit || "kg"}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        unit: e.target.value,
                      })
                    }
                  >
                    <option value="kg">kg</option>
                    <option value="pièce">pièce</option>
                    <option value="botte">botte</option>
                    <option value="barquette">barquette</option>
                    <option value="cagette">cagette</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">
                    Prix HT (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-900"
                    value={editingProduct.priceHT || editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        priceHT: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">
                    Taux TVA (%)
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800"
                    value={editingProduct.vatRate || 5.5}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        vatRate: e.target.value,
                      })
                    }
                  >
                    <option value={5.5}>5.5 % (Alimentaire)</option>
                    <option value={20.0}>20.0 % (Standard)</option>
                    <option value={0.0}>0.0 % (Exonéré)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">
                    Stock dispo *
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-900"
                    value={editingProduct.stock ?? editingProduct.quantity ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">
                    N° de Lot / Traçabilité
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono font-bold text-gray-800"
                    value={editingProduct.batchNumber || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        batchNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">
                    Date de Récolte
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-semibold text-gray-800"
                    value={editingProduct.harvestDate || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        harvestDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  URL de l'image (Visuel)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs font-semibold text-gray-800"
                  value={editingProduct.imageUrl || editingProduct.image || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      imageUrl: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isBio)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isBio: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Produit certifié Bio (AB)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isHidden)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isHidden: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-amber-800">
                    Masquer en boutique
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
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
