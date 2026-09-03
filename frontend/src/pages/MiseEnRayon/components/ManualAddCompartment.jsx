import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Info,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../services/firestore.service.js";
import { useAuth } from "../../../context/AuthContext";

export default function ManualEntryForm({ hasValidCertifications }) {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // État initialisé avec des valeurs par défaut pour éviter les erreurs de typage
  const initialProductState = {
    name: "",
    category: "Légumes",
    origin: "",
    price: "",
    vat: "5.5",
    unit: "kg",
    stock: "",
    isBio: false,
  };
  const [product, setProduct] = useState(initialProductState);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      // Écriture sécurisée dans la collection "products" de Firestore
      await addDoc(collection(db, "products"), {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock, 10),
        createdAt: serverTimestamp(),
        producerId: user?.uid || "ID_UTILISATEUR_COURANT",
      });

      setStatus({
        type: "success",
        message: "Produit ajouté avec succès au catalogue.",
      });
      setProduct(initialProductState); // Réinitialisation propre du formulaire
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      setStatus({
        type: "error",
        message: "Échec de la connexion à la base de données.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-all">
      <div className="flex justify-between items-center p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 text-lg">
          1. Ajouter un produit (Saisie manuelle)
        </h2>
        <button
          type="button"
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800"
        >
          {isRetracted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!isRetracted && (
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Notifications de succès ou d'erreur */}
          {status && (
            <div
              className={`p-3 rounded-md flex items-center gap-2 text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
            >
              {status.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {status.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                placeholder="Ex: Tomates anciennes Cœur de Bœuf"
                className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-green-500"
              >
                <option value="Légumes">Légumes</option>
                <option value="Fruits">Fruits</option>
                <option value="Aromates">Aromates</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origine / Traçabilité *
              </label>
              <input
                type="text"
                name="origin"
                value={product.origin}
                onChange={handleChange}
                placeholder="Lieu de récolte"
                className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix Unitaire (HT) *
              </label>
              <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="€"
                className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux de TVA *
              </label>
              <select
                name="vat"
                value={product.vat}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-green-500"
              >
                <option value="5.5">5.5% (Alimentaire)</option>
                <option value="0">0% (Franchise en base)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unité de vente *
              </label>
              <select
                name="unit"
                value={product.unit}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-green-500"
              >
                <option value="kg">kg</option>
                <option value="pièce">pièce</option>
                <option value="botte">botte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock disponible *
              </label>
              <input
                type="number"
                name="stock"
                value={product.stock}
                onChange={handleChange}
                min="0"
                placeholder="Quantité"
                className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-200">
            <input
              type="checkbox"
              name="isBio"
              checked={product.isBio}
              onChange={handleChange}
              disabled={!hasValidCertifications}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                Label Agriculture Biologique (AB) / Loi EGAlim
              </span>
              {!hasValidCertifications && (
                <span className="text-xs text-red-500 flex items-center mt-1">
                  <Info size={12} className="mr-1" /> Vous devez valider vos
                  certificats dans "Mon Profil" pour activer cette option.
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center bg-brand-green text-white font-medium py-2 px-6 rounded hover:bg-opacity-90 disabled:opacity-70 transition-colors"
            >
              {isSubmitting && (
                <Loader2 size={16} className="animate-spin mr-2" />
              )}
              {isSubmitting ? "Enregistrement..." : "Ajouter au catalogue"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
