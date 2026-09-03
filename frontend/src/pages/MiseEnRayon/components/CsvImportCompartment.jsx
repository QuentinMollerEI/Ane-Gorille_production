import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Download,
  UploadCloud,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

// Assurez-vous que l'extension .js est présente si Vite la requiert, et que le chemin correspond bien à l'emplacement du composant.
import { db } from "../../../services/firestore.service.js";
import { useAuth } from "../../../context/AuthContext";

export default function CsvImportCompartment() {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(true);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setStatus(null);
    } else {
      setFile(null);
      setStatus({
        type: "error",
        message: "Veuillez sélectionner un fichier au format .csv valide.",
      });
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text
          .split("\n")
          .map((row) => row.trim())
          .filter((row) => row);

        if (rows.length < 2)
          throw new Error(
            "Le fichier CSV est vide ou ne contient que l'en-tête.",
          );

        const batch = writeBatch(db);
        const productsRef = collection(db, "products");

        // Boucle à partir de l'index 1 pour ignorer la ligne d'en-tête
        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i].split(/[;,]/);

          if (columns.length >= 7) {
            const newDocRef = doc(productsRef);
            batch.set(newDocRef, {
              name: columns[0]?.trim(),
              category: columns[1]?.trim(),
              origin: columns[2]?.trim(),
              price: parseFloat(columns[3]?.trim() || 0),
              vat: columns[4]?.trim() || "5.5",
              unit: columns[5]?.trim() || "kg",
              stock: parseInt(columns[6]?.trim() || 0, 10),
              isBio: columns[7]?.trim().toLowerCase() === "true",
              createdAt: serverTimestamp(),
              producerId: user?.uid || "ID_UTILISATEUR_COURANT",
              importSource: "csv",
            });
          }
        }

        await batch.commit();

        setStatus({
          type: "success",
          message: `${rows.length - 1} produits importés avec succès.`,
        });
        setFile(null);
      } catch (error) {
        console.error("Erreur lors de l'analyse ou de l'import:", error);
        setStatus({
          type: "error",
          message:
            error.message || "Une erreur est survenue lors de l’importation.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    reader.onerror = () => {
      setStatus({ type: "error", message: "Impossible de lire le fichier." });
      setIsSubmitting(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-all">
      <div className="flex justify-between items-center p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 text-lg">
          2. Ajout multiple (Importation CSV)
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
        <div className="p-5 space-y-4">
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

          <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-md">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Format d'importation requis
              </p>
              <p className="text-xs text-blue-700 mt-1 font-mono">
                nom_produit; categorie; origine; prix_unitaire; tva; unite;
                stock; is_bio
              </p>
            </div>
            <a
              href="/template_import_rosee.csv"
              download
              className="flex items-center text-sm font-semibold text-blue-700 hover:underline"
            >
              <Download size={16} className="mr-1" /> Télécharger l'exemple
            </a>
          </div>

          <form onSubmit={handleImport} className="space-y-4">
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-gray-50 transition cursor-pointer">
              <UploadCloud
                size={32}
                className={`${file ? "text-brand-green" : "text-gray-400"} mb-2`}
              />

              {file ? (
                <p className="text-sm text-brand-green font-bold">
                  Fichier prêt : {file.name}
                </p>
              ) : (
                <p className="text-sm text-gray-600 font-medium">
                  Glissez votre fichier CSV ici ou{" "}
                  <span className="text-brand-green">
                    parcourez vos fichiers
                  </span>
                </p>
              )}

              <p className="text-xs text-gray-400 mt-1">
                Fichiers .csv uniquement (Max 5Mo)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!file || isSubmitting}
                className="flex items-center bg-gray-900 text-white font-medium py-2 px-6 rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                {isSubmitting && (
                  <Loader2 size={16} className="animate-spin mr-2" />
                )}
                {isSubmitting
                  ? "Importation en cours..."
                  : "Lancer l'importation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
