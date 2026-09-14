import React, { useRef, useState } from "react";
// 1. Alias de l'icône Lucide pour éviter le conflit de nom
import { Image as ImageIcon, Upload, Trash2, Sparkles, FolderOpen, Loader2, CheckCircle } from "lucide-react";
import { db } from "../../../services/firestore.service";
import { useAuth } from "../../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";

export default function ProducerBannerSettings({ profileData, setProfileData, onProfileUpdated }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // 🗜️ Redimensionnement et compression d'image (Max 1200x450px, JPEG 75%)
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        // 2. Utilisation explicite du constructeur natif du navigateur
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 450;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Exportation en JPEG compressé (~100 Ko max)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // 📁 Sélection de fichier et sauvegarde Firestore
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).");
      return;
    }

    try {
      setUploading(true);

      // 1. Compression de l'image
      const compressedBannerUrl = await compressImage(file);

      // 2. Mise à jour de l'état local
      if (setProfileData) {
        setProfileData((prev) => ({ ...prev, bannerUrl: compressedBannerUrl }));
      }

      // 3. Sauvegarde directe dans Firestore
      if (user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          bannerUrl: compressedBannerUrl,
        });
      }

      if (onProfileUpdated) {
        onProfileUpdated();
      }

      setSuccessMessage("Photo de couverture enregistrée avec succès !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'image :", error);
      alert("Erreur lors de l'importation de la photo. Veuillez réessayer.");
    } finally {
      setUploading(false);
    }
  };

  // 🗑️ Suppression de la photo de couverture
  const handleRemoveBanner = async () => {
    if (!window.confirm("Voulez-vous supprimer votre photo de couverture ?")) return;

    try {
      setUploading(true);

      if (setProfileData) {
        setProfileData((prev) => ({ ...prev, bannerUrl: "" }));
      }

      if (user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { bannerUrl: "" });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      {/* En-tête de section */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-emerald-700" />
          <h2 className="text-sm font-black text-gray-900">
            Image de couverture de l'exploitation
          </h2>
        </div>
        {profileData?.bannerUrl && (
          <button
            type="button"
            onClick={handleRemoveBanner}
            disabled={uploading}
            className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={14} />
            <span>Supprimer</span>
          </button>
        )}
      </div>

      {/* Toast de succès */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Zone d'importation */}
      <div className="space-y-3">
        <p className="text-xs text-gray-600 font-medium">
          Choisissez une photo représentative de votre ferme (champs, serres, étal de marché) depuis vos dossiers.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Traitement & Optimisation...</span>
              </>
            ) : (
              <>
                <FolderOpen size={16} />
                <span>Choisir une photo dans mes dossiers</span>
              </>
            )}
          </button>

          <span className="text-[11px] text-gray-400 font-semibold">
            Formats acceptés : PNG, JPG, WEBP (Optimisé automatiquement)
          </span>
        </div>
      </div>

      {/* Aperçu dynamique */}
      {profileData?.bannerUrl ? (
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
            <Sparkles size={12} className="text-emerald-600" /> Aperçu du rendu sur votre enseigne :
          </span>
          <div className="h-36 w-full rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner bg-gray-100">
            <img
              src={profileData.bannerUrl}
              alt="Aperçu couverture"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-xl">
              Bannière active
            </span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="h-28 w-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer text-gray-400"
        >
          <Upload size={24} className="text-gray-400" />
          <span className="text-xs font-bold">
            Aucune image sélectionnée — Cliquez pour parcourir vos dossiers
          </span>
        </div>
      )}
    </div>
  );
}