import React, { useState, useMemo } from "react";
import { db } from "../../../services/firestore.service";
import { doc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import {
  Search,
  Archive,
  RotateCcw,
  Tag,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  Award
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ProductArchiveTool.jsx
 * Outil de consultation et réintégration des produits archivés sous forme de LIGNES.
 */
export default function ProductArchiveTool({ products = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const archivedProducts = useMemo(() => {
    return (products || []).filter((item) => item.status === "archived");
  }, [products]);

  const filteredArchives = useMemo(() => {
    return archivedProducts.filter((item) => {
      const matchesSearch =
        (item.title || item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategory === "all" ||
        (item.category || "").toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [archivedProducts, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(archivedProducts.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [archivedProducts]);

  const isAllSelected =
    filteredArchives.length > 0 &&
    filteredArchives.every((p) => selectedIds.includes(p.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredArchives.map((p) => p.id));
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRestoreProduct = async (productId) => {
    if (
      !window.confirm(
        "Voulez-vous réintégrer ce produit dans votre catalogue actif ?"
      )
    )
      return;

    setLoadingId(productId);
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        status: "published",
        isHidden: false,
        isAvailable: true,
        restoredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSelectedIds(selectedIds.filter((id) => id !== productId));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de la réintégration :", err);
      alert("Erreur lors de la réintégration.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Voulez-vous vraiment remettre en rayon les ${selectedIds.length} produit(s) sélectionné(s) ?`
      )
    )
      return;

    setBatchLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        const ref = doc(db, "products", id);
        batch.update(ref, {
          status: "published",
          isHidden: false,
          isAvailable: true,
          restoredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de la réintégration groupée :", err);
      alert("Erreur lors de la réintégration groupée.");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-150 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
            <Archive size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <span>Archives du Catalogue ({archivedProducts.length})</span>
            </h2>
            <p className="text-gray-500 text-[11px]">
              Consultez et réintégrez vos anciennes références en rayon actif en masse.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Traçabilité HACCP & Factures préservées
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit archivé ou n° de lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 text-xs"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-xl px-3 py-2 font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredArchives.length > 0 && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          <span className="font-extrabold text-amber-900 text-xs">
            {selectedIds.length} produit(s) archivé(s) sélectionné(s)
          </span>
          <button
            onClick={handleBatchRestore}
            disabled={batchLoading}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {batchLoading ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={14} />}
            <span>Remettre la sélection en rayon</span>
          </button>
        </div>
      )}

      {filteredArchives.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
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
                  <th className="p-3">Catégorie & Détails</th>
                  <th className="p-3">Dernier Prix HT</th>
                  <th className="p-3">N° Lot / Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                {filteredArchives.map((p) => {
                  const priceHT = Number(p.priceHT ?? p.price ?? 0);
                  const isSelected = selectedIds.includes(p.id);
                  const isLoading = loadingId === p.id;

                  const isHoneyProd = p.category === "Miel & Apiculture" || (p.title || "").toLowerCase().includes("miel");
                  const isEggProd = p.category === "Œufs & Élevage" || (p.title || "").toLowerCase().includes("œuf") || (p.title || "").toLowerCase().includes("oeuf");

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-amber-50/50" : ""
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
                          <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                            {p.imageUrl || p.image ? (
                              <img src={p.imageUrl || p.image} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-400 text-xs font-bold">
                                {isHoneyProd ? "🍯" : isEggProd ? "🥚" : "📦"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="font-extrabold text-gray-900">{p.title || p.name}</span>
                              <span className="text-[8px] font-black uppercase text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                                Archivé
                              </span>
                              {p.isBio && (
                                <span className="text-[8px] font-black uppercase text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  Bio
                                </span>
                              )}
                              {p.isAOP && (
                                <span className="text-[8px] font-black uppercase text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded">
                                  AOP
                                </span>
                              )}
                              {p.isAOC && (
                                <span className="text-[8px] font-black uppercase text-red-900 bg-red-100 px-1.5 py-0.2 rounded">
                                  AOC
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-gray-700 block">{p.category || "Légumes"}</span>
                        {isHoneyProd && (
                          <span className="text-[10px] text-amber-900 font-extrabold block">
                            🍯 {p.floralOrigin || "Polyfloral"} ({p.honeyNetWeight || "500g"})
                          </span>
                        )}
                        {isEggProd && (
                          <span className="text-[10px] text-amber-900 font-extrabold block">
                            🥚 Mode {p.eggRearingMode ?? "0"} - Calibre {p.eggCaliber || "M"}
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-black text-gray-900">
                        {priceHT.toFixed(2)} € HT / {p.unit || "kg"}
                      </td>

                      <td className="p-3 text-[10px] text-gray-500 font-bold">
                        <div>Lot : {p.batchNumber || "N/A"}</div>
                        {p.harvestDate || p.manufacturingDate ? (
                          <div>Date : {new Date(p.harvestDate || p.manufacturingDate).toLocaleDateString("fr-FR")}</div>
                        ) : null}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestoreProduct(p.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50 ml-auto"
                        >
                          {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                          <span>Remettre en rayon</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 font-bold italic">
          {archivedProducts.length === 0
            ? "Aucun produit archivé pour le moment."
            : "Aucun produit archivé ne correspond à votre recherche."}
        </div>
      )}
    </div>
  );
}
