import React, { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Edit2,
  Trash2,
  Camera,
  Check,
  X,
  Loader2,
  Filter,
  Eye,
  EyeOff,
  Save,
  CheckSquare,
  Square,
  Trash,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../services/firestore.service.js";
import { useAuth } from "../../../context/AuthContext";

export default function StockCompartment() {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // États de filtrage et recherche
  const [searchTerm, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState("");

  // Pagination / Nb de lignes affichées
  const [pageSize, setPageSize] = useState("10"); // '10', '20', 'All'

  // États de sélection multiple
  const [selectedIds, setSelectedIds] = useState([]);

  // État d'édition d'une ligne produit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Écoute temps réel des produits appartenant UNIQUEMENT au producteur connecté
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "products"),
      where("producerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const prods = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Trier par date de création décroissante
        prods.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
        setProducts(prods);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lors de la synchronisation du stock :", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Filtrage combiné côté client
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.batchNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || p.category === selectedCategory;

    let matchesStock = true;
    if (selectedStockStatus === "low") {
      matchesStock = (p.stock || 0) > 0 && (p.stock || 0) <= 15;
    } else if (selectedStockStatus === "out") {
      matchesStock = (p.stock || 0) === 0;
    } else if (selectedStockStatus === "available") {
      matchesStock = (p.stock || 0) > 15;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Produits réellement affichés selon la pagination/limitation
  const displayedProducts =
    pageSize === "All"
      ? filteredProducts
      : filteredProducts.slice(0, Number(pageSize));

  // Sélection globale basée sur les produits actuellement visibles (displayedProducts)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(displayedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Suppression par lots (Batch delete)
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer les ${selectedIds.length} produits sélectionnés ?`,
      )
    )
      return;

    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.delete(doc(db, "products", id));
      });
      await batch.commit();
      setSelectedIds([]);
      alert("Produits supprimés avec succès.");
    } catch (error) {
      console.error("Erreur de suppression multiple:", error);
      alert("Une erreur est survenue lors de la suppression par lot.");
    }
  };

  // Publication / Masquage par lots (Batch publish/unpublish)
  const handlePublishSelected = async (publishStatus) => {
    if (selectedIds.length === 0) return;
    const actionText = publishStatus ? "mettre en ligne" : "masquer";
    if (
      !window.confirm(
        `Voulez-vous vraiment ${actionText} les ${selectedIds.length} produits sélectionnés ?`,
      )
    )
      return;

    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "products", id), {
          isPublished: publishStatus,
        });
      });
      await batch.commit();
      setSelectedIds([]);
      alert(
        `Mise en ligne mise à jour pour les ${selectedIds.length} produits.`,
      );
    } catch (error) {
      console.error(
        "Erreur lors de l'action de groupe pour mise en ligne:",
        error,
      );
      alert("Une erreur est survenue lors de la mise à jour groupée.");
    }
  };

  // Mise en ligne / Hors ligne directe d'un seul produit (Toggle isPublished)
  const handleTogglePublished = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "products", id), {
        isPublished: !currentStatus,
      });
    } catch (error) {
      console.error("Erreur de mise à jour du statut en ligne:", error);
    }
  };

  // Lancement du mode édition
  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ ...p });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Enregistrement des modifications d'un seul produit
  const handleSaveEdit = async () => {
    try {
      const updatedFields = {
        name: editForm.name,
        description: editForm.description,
        category: editForm.category,
        origin: editForm.origin,
        department: editForm.department,
        priceHT: parseFloat(editForm.priceHT),
        vatRate: parseFloat(editForm.vatRate),
        unit: editForm.unit,
        stock: parseInt(editForm.stock, 10),
        isBio: Boolean(editForm.isBio),
        batchNumber: editForm.batchNumber,
        harvestDate: editForm.harvestDate,
        iduAdeme: editForm.iduAdeme,
        distanceKm: parseInt(editForm.distanceKm, 10) || 0,
      };

      await updateDoc(doc(db, "products", editingId), updatedFields);
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error("Erreur d'enregistrement:", error);
      alert("Impossible d'enregistrer les modifications.");
    }
  };

  // Suppression unitaire
  const handleDeleteOne = async (id) => {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer ce produit de votre inventaire ?",
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      console.error("Erreur de suppression:", error);
      alert("Impossible de supprimer le produit.");
    }
  };

  // Changement d'image à la volée depuis la table
  const handleRowImageChange = (e, id) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await updateDoc(doc(db, "products", id), {
            image: reader.result,
          });
        } catch (error) {
          console.error("Erreur lors de la mise à jour de l'image:", error);
          alert("Erreur lors de la sauvegarde de l'image.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm transition-all overflow-hidden mt-6">
      {/* En-tête de Section */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-green-100 text-green-700 rounded-lg text-lg">
            📊
          </span>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">
              1. Votre Espace Stock & Catalogue Privé
            </h2>
            <p className="text-xs text-gray-500">
              Mettez à jour vos quantités en temps réel pour l'affichage
              boutique des clients
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          {isRetracted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 space-y-6">
          {/* Barre d'action et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-3.5 text-gray-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher (Nom, N° de lot...)"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
              >
                \n <option value="">Toutes catégories</option>
                <option value="Légumes">Légumes</option>
                <option value="Fruits">Fruits</option>
                <option value="Aromates">Aromates</option>
                <option value="Epicerie">Épicerie</option>
              </select>

              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
              >
                <option value="">Tous les stocks</option>
                <option value="available">Disponible (&gt;15)</option>
                <option value="low">Stock faible (1 - 15)</option>
                <option value="out">Rupture (0)</option>
              </select>

              {/* Sélecteur de nombre de lignes */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setSelectedIds([]); // On vide la sélection pour éviter les erreurs de sélection invisible
                }}
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
              >
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="All">Tout afficher</option>
              </select>
            </div>

            {/* Menu des actions de groupe quand des cases sont cochées */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-green-50/70 p-2 border border-green-100 rounded-xl shadow-sm">
                <span className="text-xs font-bold text-green-800 px-2">
                  Sélection ({selectedIds.length}) :
                </span>

                <button
                  onClick={() => handlePublishSelected(true)}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-bold shadow-sm transition-colors"
                  title="Mettre en ligne la sélection"
                >
                  <Eye size={13} />
                  <span>Tout afficher</span>
                </button>

                <button
                  onClick={() => handlePublishSelected(false)}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded-lg text-xs font-bold shadow-sm transition-colors"
                  title="Masquer de la boutique"
                >
                  <EyeOff size={13} />
                  <span>Tout masquer</span>
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-xs font-bold shadow-sm transition-colors"
                  title="Supprimer la sélection"
                >
                  <Trash size={13} />
                  <span>Tout supprimer</span>
                </button>
              </div>
            )}
          </div>

          {/* Tableau principal des stocks */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-green-700" size={32} />
              <span className="ml-3 text-sm text-gray-500 font-semibold">
                Récupération de vos lignes produits...
              </span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <p className="text-gray-400 font-medium">
                Vous n'avez actuellement aucun produit enregistré dans votre
                catalogue.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Utilisez l'un des deux formulaires ci-dessus pour ajouter des
                produits.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          displayedProducts.length > 0 &&
                          displayedProducts.every((p) =>
                            selectedIds.includes(p.id),
                          )
                        }
                        className="rounded-md border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 font-bold">Visuel / Photo</th>
                    <th className="p-4 font-bold">Produit / Traçabilité</th>
                    <th className="p-4 font-bold">Catégorie</th>
                    <th className="p-4 font-bold text-center">Bio / Label</th>
                    <th className="p-4 font-bold">Prix Unitaire</th>
                    <th className="p-4 font-bold">Stock en ligne</th>
                    <th className="p-4 font-bold text-center">
                      Mettre en ligne
                    </th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedProducts.map((p) => {
                    const isEditing = editingId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50/80 transition-colors ${!p.isPublished ? "bg-gray-50/40 text-gray-400" : ""}`}
                      >
                        {/* Case de sélection */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => handleSelectOne(p.id)}
                            className="rounded-md border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* Visuel du produit (avec modification dynamique de photo) */}
                        <td className="p-4">
                          <div className="relative h-14 w-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center group shadow-sm">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Camera size={18} className="text-gray-400" />
                            )}
                            <label className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                              <Camera size={12} />
                              <span className="text-[8px] font-bold mt-1">
                                Changer
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleRowImageChange(e, p.id)}
                              />
                            </label>
                          </div>
                        </td>

                        {/* Nom, Lot, etc. */}
                        <td className="p-4">
                          {isEditing ? (
                            <div className="space-y-2 max-w-[200px]">
                              <input
                                type="text"
                                name="name"
                                value={editForm.name}
                                onChange={handleEditChange}
                                className="w-full border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-green-500 bg-white"
                              />
                              <input
                                type="text"
                                name="batchNumber"
                                value={editForm.batchNumber}
                                onChange={handleEditChange}
                                placeholder="N° de lot"
                                className="w-full border border-gray-300 rounded p-1 text-[10px] focus:ring-1 focus:ring-green-500 bg-white"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-gray-900">
                                {p.name || "Produit sans nom"}
                              </p>
                              <p className="text-[10px] text-gray-500 font-semibold tracking-wider">
                                Lot: {p.batchNumber || "N/A"} • Dépt:{" "}
                                {p.department || "N/A"}
                              </p>
                              <p className="text-[9px] text-gray-400 font-medium">
                                Récolte: {p.harvestDate || "Inconnue"}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Catégorie */}
                        <td className="p-4 text-gray-600 font-medium">
                          {isEditing ? (
                            <select
                              name="category"
                              value={editForm.category}
                              onChange={handleEditChange}
                              className="border border-gray-300 rounded p-1 text-xs bg-white"
                            >
                              <option value="Légumes">Légumes</option>
                              <option value="Fruits">Fruits</option>
                              <option value="Aromates">Aromates</option>
                              <option value="Epicerie">Épicerie</option>
                            </select>
                          ) : (
                            p.category
                          )}
                        </td>

                        {/* Label Bio */}
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <input
                              type="checkbox"
                              name="isBio"
                              checked={editForm.isBio}
                              onChange={handleEditChange}
                              className="rounded border-gray-300 text-green-600"
                            />
                          ) : p.isBio ? (
                            <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                              Bio AB
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        {/* Prix */}
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex flex-col gap-1 w-20">
                              <div className="flex items-center border rounded p-1 bg-white">
                                <input
                                  type="number"
                                  step="0.01"
                                  name="priceHT"
                                  value={editForm.priceHT}
                                  onChange={handleEditChange}
                                  className="w-full border-0 p-0 text-xs focus:ring-0"
                                />
                                <span className="text-[10px] text-gray-400">
                                  €
                                </span>
                              </div>
                              <span className="text-[9px] text-gray-400">
                                HT
                              </span>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-gray-900">
                                {Number(p.priceHT || 0).toFixed(2)} €{" "}
                                <span className="text-[10px] text-gray-400 font-normal">
                                  / {p.unit || "kg"}
                                </span>
                              </p>
                              <p className="text-[10px] text-gray-400 font-medium">
                                TTC ({p.vatRate || 5.5}%)
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1 w-20">
                              <input
                                type="number"
                                name="stock"
                                value={editForm.stock}
                                onChange={handleEditChange}
                                className="w-full border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-green-500 bg-white"
                              />
                            </div>
                          ) : (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                (p.stock || 0) === 0
                                  ? "bg-red-50 text-red-700 border border-red-150"
                                  : (p.stock || 0) <= 15
                                    ? "bg-amber-50 text-amber-800 border border-amber-150"
                                    : "bg-green-50 text-green-800 border border-green-150"
                              }`}
                            >
                              {p.stock} {p.unit || "kg"}
                            </span>
                          )}
                        </td>

                        {/* Mettre en ligne (Toggle) */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePublished(p.id, p.isPublished)
                            }
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            {p.isPublished ? (
                              <Eye className="text-green-600" size={18} />
                            ) : (
                              <EyeOff className="text-gray-400" size={18} />
                            )}
                          </button>
                        </td>

                        {/* Actions (Editer, Supprimer) */}
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 rounded bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                                title="Sauvegarder"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm(null);
                                }}
                                className="p-1 rounded bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                                title="Annuler"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => startEdit(p)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteOne(p.id)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
