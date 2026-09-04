import React, { useState, useEffect } from "react";
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
  getDoc,
} from "firebase/firestore";
import { db } from "../../../services/firestore.service.js";
import { useAuth } from "../../../context/AuthContext";

export default function CsvImportCompartment({ hasValidCertifications }) {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(true);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv"))
    ) {
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

  // Génération dynamique d'un modèle d'exemple CSV téléchargeable
  const handleDownloadTemplate = () => {
    const headers =
      "nom_produit;description;categorie;origine;departement;prix_ht;taux_tva;unite;stock;est_bio;numero_lot;date_recolte;idu_ademe;distance_km\n";
    const exampleRow =
      "Pommes de terre de conservation;Pommes de terre récoltées à la main ideales pour purées et frites;Légumes;Ramonville-Saint-Agne;Haute-Garonne (31);2.37;5.5;kg;120;true;LOT-PDT-001;2026-09-02;FR384920_01ECOR;12\n";
    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(headers + exampleRow);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "template_import_ane_et_gorille.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        let importedCount = 0;
        let lineErrors = [];

        // Boucle à partir de l'index 1 (ignorer la ligne d'en-tête)
        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i].split(/[;]/); // Séparateur point-virgule recommandé sous Excel FR

          if (columns.length < 14) {
            lineErrors.push(
              `Ligne ${i + 1} : Colonnes insuffisantes (attendu: 14, trouvé: ${columns.length})`,
            );
            continue;
          }

          const name = columns[0]?.trim();
          const description = columns[1]?.trim();
          const category = columns[2]?.trim();
          const origin = columns[3]?.trim();
          const department = columns[4]?.trim();
          const priceHT = parseFloat(columns[5]?.trim() || 0);
          const vatRate = parseFloat(columns[6]?.trim() || 5.5);
          const unit = columns[7]?.trim() || "kg";
          const stock = parseInt(columns[8]?.trim() || 0, 10);
          const isBioCsv = columns[9]?.trim().toLowerCase() === "true";
          const batchNumber = columns[10]?.trim();
          const harvestDate = columns[11]?.trim();
          const iduAdeme = columns[12]?.trim();
          const distanceKm = parseInt(columns[13]?.trim() || 0, 10);

          // Validation de sécurité : Empêcher d'importer du Bio sans certifications validées
          if (isBioCsv && !hasValidCertifications) {
            lineErrors.push(
              `Ligne ${i + 1} : Produit "${name}" marqué Bio rejeté car vos certifications d'exploitation ne sont pas validées.`,
            );
            continue;
          }

          if (!name || isNaN(priceHT) || isNaN(stock)) {
            lineErrors.push(
              `Ligne ${i + 1} : Champs requis invalides (nom, prix ou stock).`,
            );
            continue;
          }

          const newDocRef = doc(productsRef);
          batch.set(newDocRef, {
            name,
            description: description || "Aucune description fournie.",
            category: category || "Légumes",
            origin: origin || "France",
            department: department || "Local",
            priceHT,
            vatRate,
            unit,
            stock,
            isBio: isBioCsv,
            batchNumber: batchNumber || "LOT-CSV-AUTO",
            harvestDate: harvestDate || new Date().toISOString().split("T")[0],
            iduAdeme: iduAdeme || "NON_RENSEIGNE",
            distanceKm,
            createdAt: serverTimestamp(),
            producerId: user?.uid || "ID_PRODUCTEUR_TEST",
            producerName: resolvedProducerName, // Utilise le vrai nom d'exploitation résolu
            isPublished: true,
            importSource: "csv",
          });
          importedCount++;
        }

        if (importedCount > 0) {
          await batch.commit();
          setStatus({
            type: "success",
            message:
              `${importedCount} produit(s) importé(s) de manière exhaustive et synchronisé(s) en base de données.` +
              (lineErrors.length > 0
                ? ` (${lineErrors.length} ligne(s) rejetée(s)).`
                : ""),
          });
          setFile(null);
        } else {
          throw new Error(lineErrors.join(" | "));
        }
      } catch (error) {
        console.error("Erreur lors de l'import CSV:", error);
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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm transition-all overflow-hidden mt-6">
      {/* En-tête */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-green-100 text-green-700 rounded-lg text-lg">
            📁
          </span>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">
              3. Ajout multiple par fichier (Importation CSV)
            </h2>
            <p className="text-xs text-gray-500">
              Mettez à jour votre catalogue de masse via Excel ou OpenOffice
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
        <div className="p-6 space-y-6">
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

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-blue-50 border border-blue-150 p-5 rounded-2xl gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900 mb-1">
                ℹ️ Modèle de document réglementaire d'importation
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Le fichier CSV doit contenir exactement 14 colonnes séparées par
                des points-virgules (;). Le format doit correspondre exactement
                aux données de traçabilité HACCP et ADEME.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer flex-shrink-0"
            >
              <Download size={16} />
              <span>Télécharger le modèle (.CSV)</span>
            </button>
          </div>

          <form onSubmit={handleImport} className="space-y-4">
            <label className="border-2 border-dashed border-gray-250 rounded-2xl p-10 flex flex-col items-center justify-center hover:bg-gray-50/50 hover:border-gray-400 transition-all cursor-pointer bg-white shadow-inner relative group">
              <UploadCloud
                size={40}
                className={`${file ? "text-green-600 animate-bounce" : "text-gray-400"} group-hover:scale-110 transition-transform duration-300`}
              />

              {file ? (
                <div className="mt-4 text-center">
                  <p className="text-sm text-green-700 font-bold">
                    Fichier prêt pour l'envoi :
                  </p>
                  <p className="text-xs text-gray-600 font-semibold mt-1 bg-green-50 px-3 py-1 rounded-md border border-green-150 inline-block">
                    {file.name}
                  </p>
                </div>
              ) : (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-700 font-bold">
                    Glissez votre fichier CSV ici
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ou{" "}
                    <span className="text-green-700 font-bold hover:underline">
                      parcourez vos fichiers locaux
                    </span>
                  </p>
                </div>
              )}

              <p className="text-[10px] text-gray-400 mt-3">
                Formats compatibles : CSV encodé UTF-8 uniquement (Poids max : 2
                Mo)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={!file || isSubmitting}
                className="flex items-center gap-2 bg-gray-900 text-white font-bold py-3 px-8 rounded-xl shadow-md disabled:bg-gray-250 disabled:text-gray-400 transition-all cursor-pointer text-sm"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting
                  ? "Insertion en base de données..."
                  : "Importer et synchroniser"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
