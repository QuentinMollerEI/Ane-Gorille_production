import React, { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Info,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../services/firestore.service.js";
import { useAuth } from "../../../context/AuthContext";

export default function ManualAddCompartment({ hasValidCertifications }) {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [imagePreview, setImagePreview] = useState(null);
  const [resolvedProducerName, setResolvedProducerName] =
    useState("Producteur local");

  // Récupération dynamique et asynchrone de la raison sociale/nom d'exploitation depuis la collection 'users'
  useEffect(() => {
    async function fetchProducerProfile() {
      if (!user?.uid) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const name =
            userData.companyName ||
            userData.nomExploitation ||
            userData.displayName ||
            `${userData.firstName} ${userData.lastName}`.trim();
          if (name) {
            setResolvedProducerName(name);
          }
        } else if (user.displayName) {
          setResolvedProducerName(user.displayName);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du profil utilisateur Firestore :",
          error,
        );
        if (user?.displayName) {
          setResolvedProducerName(user.displayName);
        }
      }
    }
    fetchProducerProfile();
  }, [user?.uid, user?.displayName]);

  // État initialisé de façon exhaustive avec tous les champs obligatoires, légaux et UX
  const initialProductState = {
    name: "",
    description: "",
    category: "Légumes",
    origin: "",
    department: "", // Département (ex: 31, 32)
    priceHT: "",
    vatRate: "5.5",
    unit: "kg", // kg, pièce, botte
    stock: "",
    isBio: false,
    batchNumber: "", // Traçabilité HACCP
    harvestDate: "", // Fraîcheur / HACCP
    iduAdeme: "", // Identifiant Unique ADEME (Loi AGEC emballage)
    distanceKm: "", // Distance locale / Énergie alimentaire
    image: "", // Stockée en base64 pour ce prototype (ou URL Firebase Storage)
    isPublished: true, // Statut de mise en ligne
  };

  const [product, setProduct] = useState(initialProductState);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Gestion de la photo (Smartphone/Tablette camera ou Import de fichier)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatus({
          type: "error",
          message: "L'image dépasse la taille maximale autorisée de 2 Mo.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProduct((prev) => ({ ...prev, image: reader.result }));
        setStatus(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    // Validation de sécurité : Empêcher de cocher Bio sans certifications validées
    if (product.isBio && !hasValidCertifications) {
      setStatus({
        type: "error",
        message:
          "Fraude détectée : vous ne possédez pas les certifications Bio validées dans votre profil.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Enregistrement exhaustive et synchronisé dans Firestore
      await addDoc(collection(db, "products"), {
        ...product,
        priceHT: parseFloat(product.priceHT),
        vatRate: parseFloat(product.vatRate),
        stock: parseInt(product.stock, 10),
        distanceKm: product.distanceKm ? parseInt(product.distanceKm, 10) : 0,
        createdAt: serverTimestamp(),
        producerId: user?.uid || "ID_PRODUCTEUR_TEST",
        producerName: resolvedProducerName, // Utilise le vrai nom d'exploitation résolu
      });

      setStatus({
        type: "success",
        message:
          "Le produit a été ajouté de manière exhaustive et synchronisé avec succès !",
      });
      setProduct(initialProductState);
      setImagePreview(null);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement Firestore:", error);
      setStatus({
        type: "error",
        message: "Erreur lors de la synchronisation avec la base de données.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm transition-all overflow-hidden">
      {/* En-tête du Compartiment */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-green-100 text-green-700 rounded-lg text-lg">
            ✍️
          </span>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">
              2. Ajouter un produit (Saisie manuelle exhaustive)
            </h2>
            <p className="text-xs text-gray-500">
              Formulaire conforme aux obligations réglementaires de transparence
              B2B/B2G
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          {isRetracted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!isRetracted && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Messages de statut */}
          {status && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
                status.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle className="mt-0.5 flex-shrink-0" size={18} />
              ) : (
                <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* SECTION 1 : VISUEL & DESCRIPTION */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Visuel & Présentation
            </h3>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Zone d'aperçu d'image */}
              <div className="w-full md:w-40 h-40 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden relative group">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setProduct((p) => ({ ...p, image: "" }));
                      }}
                      className="absolute inset-0 bg-black/50 text-white font-semibold text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      Supprimer
                    </button>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <Camera size={28} className="mx-auto text-gray-400 mb-2" />
                    <span className="text-[10px] text-gray-500 font-medium">
                      Aucun visuel
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Multi-support */}
              <div className="flex-1 flex flex-col justify-center space-y-2">
                <div className="flex flex-wrap gap-3">
                  <label className="cursor-pointer flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors">
                    <Camera size={16} className="text-gray-500" />
                    <span>Prendre une photo (Mobile)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>

                  <label className="cursor-pointer flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100/70 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors">
                    <Upload size={16} className="text-green-600" />
                    <span>Importer un fichier</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Formats acceptés : JPG, PNG. Poids max : 2 Mo. S'adapte à
                  l'orientation smartphone.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description exhaustive du produit *
              </label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Décrivez précisément votre produit (variété, goût, conseils de conservation, pratiques de culture...) requis pour la fiche complète."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm"
              />
            </div>
          </div>

          {/* SECTION 2 : INFORMATIONS COMPLÈTES ET DONNÉES LÉGALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                placeholder="Ex: Tomates anciennes Cœur de Bœuf"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
              >
                <option value="Légumes">Légumes</option>
                <option value="Fruits">Fruits</option>
                <option value="Aromates">Aromates</option>
                <option value="Epicerie">Épicerie</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Unité de vente *
              </label>
              <select
                name="unit"
                value={product.unit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
              >
                <option value="kg">au Kilogramme (kg)</option>
                <option value="pièce">à la Pièce</option>
                <option value="botte">à la Botte</option>
              </select>
            </div>
          </div>

          {/* SECTION 3 : TARIFICATION ET FISCALITÉ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Prix Unitaire (HT) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="priceHT"
                  value={product.priceHT}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl p-3 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm"
                />
                <span className="absolute right-3 top-3 text-sm text-gray-400 font-bold">
                  €
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Taux de TVA (%) *
              </label>
              <select
                name="vatRate"
                value={product.vatRate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
              >
                <option value="5.5">5.5% (Taux réduit alimentaire)</option>
                <option value="20">20% (Taux standard)</option>
                <option value="0">
                  0% (Franchise en base de TVA - Art. 293 B)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Prix TTC estimé
              </label>
              <div className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 h-[46px] flex items-center">
                {product.priceHT
                  ? (
                      parseFloat(product.priceHT) *
                      (1 + parseFloat(product.vatRate) / 100)
                    ).toFixed(2)
                  : "0.00"}{" "}
                € / {product.unit}
              </div>
            </div>
          </div>

          {/* SECTION 4 : STOCKS, LOCALISATION & TRAÇABILITÉ HACCP */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stock disponible initial *
              </label>
              <input
                type="number"
                min="0"
                name="stock"
                value={product.stock}
                onChange={handleChange}
                required
                placeholder="Quantité"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Département de production *
              </label>
              <input
                type="text"
                name="department"
                value={product.department}
                onChange={handleChange}
                required
                placeholder="Ex: Haute-Garonne (31)"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Lieu précis de récolte / Origine *
              </label>
              <input
                type="text"
                name="origin"
                value={product.origin}
                onChange={handleChange}
                required
                placeholder="Ex: Ramonville-Saint-Agne"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Distance locale (Km) *
              </label>
              <input
                type="number"
                min="0"
                name="distanceKm"
                value={product.distanceKm}
                onChange={handleChange}
                required
                placeholder="Distance à la boutique"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 shadow-sm"
              />
            </div>
          </div>

          {/* SECTION 5 : TRACABILITÉ ET NORMES TECHNIQUES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Numéro de lot (Traçabilité HACCP) *
              </label>
              <input
                type="text"
                name="batchNumber"
                value={product.batchNumber}
                onChange={handleChange}
                required
                placeholder="Ex: LOT-TOM-202609"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 shadow-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date de récolte *
              </label>
              <input
                type="date"
                name="harvestDate"
                value={product.harvestDate}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 shadow-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                IDU ADEME (Emballage / Éco-contrôle) *
              </label>
              <input
                type="text"
                name="iduAdeme"
                value={product.iduAdeme}
                onChange={handleChange}
                required
                placeholder="Ex: FR123456_01ECOR"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 shadow-sm bg-white"
              />
            </div>
          </div>

          {/* SECTION 6 : LABELS & SÉCURISATION JURIDIQUE */}
          <div className="flex items-center space-x-3 p-4 bg-green-50/50 rounded-xl border border-green-100">
            <input
              type="checkbox"
              id="isBio"
              name="isBio"
              checked={product.isBio}
              onChange={handleChange}
              disabled={!hasValidCertifications}
              className="w-5 h-5 text-green-600 border-gray-300 rounded-lg focus:ring-green-500 disabled:opacity-50 cursor-pointer"
            />
            <div className="flex flex-col">
              <label
                htmlFor="isBio"
                className="text-sm font-bold text-gray-900 cursor-pointer disabled:opacity-50"
              >
                Labellisé Agriculture Biologique (AB) & loi EGAlim
              </label>
              <span className="text-xs text-gray-500">
                Permet de répondre aux obligations d'achat des cantines
                publiques (20% de Bio)
              </span>
              {!hasValidCertifications && (
                <span className="text-xs text-red-600 flex items-center mt-1 font-semibold">
                  <Info size={14} className="mr-1 flex-shrink-0" /> Option
                  verrouillée : Vous devez d'abord valider vos certificats
                  officiels (Ecocert...) dans l'onglet "Mon Profil".
                </span>
              )}
            </div>
          </div>

          {/* SOUUMISSION */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-8 rounded-xl shadow-md disabled:opacity-70 transition-all cursor-pointer text-sm"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting
                ? "Enregistrement en cours..."
                : "Ajouter et synchroniser"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
