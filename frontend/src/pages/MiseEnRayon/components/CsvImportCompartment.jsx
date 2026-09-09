import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import {
  collection,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

/**
 * 🌾 COMPOSANT : CsvImportCompartment.jsx
 * Responsabilité unique : Importation en masse de produits par fichier CSV.
 * Simplifié : supprime la saisie du département, lieu de récolte, distance locale et IDU ADEME.
 * Enrichit automatiquement chaque ligne avec les données du compte exploitant connecté.
 */
export default function CsvImportCompartment({ onProductsImported }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [parsedRows, setParsedRows] = useState([]);

  // Extrait automatiquement les données de l'exploitant depuis son compte
  const producerDept =
    user?.department || user?.departmentCode || user?.city || "Dépt. Local";
  const producerLocation =
    user?.address || user?.city || user?.companyName || "Exploitation locale";

  // Téléchargement du Modèle CSV Modifié (Simplifié)
  const handleDownloadTemplate = () => {
    const csvContent = `Titre;Prix_HT;TVA;Stock;Unite;Bio;Categorie;Numero_Lot
Carottes de Sable;2.20;5.5;50;kg;Oui;Légumes;LOT-2026-001
Tomates Coeur de Boeuf;3.80;5.5;30;kg;Non;Légumes;LOT-2026-002
Pommes Gala;2.90;5.5;100;kg;Oui;Fruits;LOT-2026-003
Persil Plat Frais;1.20;5.5;25;botte;Non;Herbes;LOT-2026-004`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modele_mise_en_rayon_ane_et_gorille.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Traitement et parsing du fichier CSV
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMsg("");
    setErrorMsg("");
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          setErrorMsg(
            "Le fichier CSV doit contenir au moins une ligne d'en-tête et une ligne de données.",
          );
          return;
        }

        // Détection automatique du séparateur (point-virgule ou virgule)
        const delimiter = lines[0].includes(";") ? ";" : ",";
        const headers = lines[0]
          .split(delimiter)
          .map((h) => h.trim().replace(/^"|"$/g, ""));

        const items = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(delimiter)
            .map((v) => v.trim().replace(/^"|"$/g, ""));
          if (values.length < 2 || !values[0]) continue;

          // Alignement dynamique des colonnes
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || "";
          });

          // Extraction normalisée
          const title =
            rowObj["Titre"] || rowObj["Nom"] || rowObj["title"] || values[0];
          const priceHT = parseFloat(
            rowObj["Prix_HT"] || rowObj["priceHT"] || values[1] || 0,
          );
          const vatRate = parseFloat(
            rowObj["TVA"] || rowObj["vatRate"] || values[2] || 5.5,
          );
          const stock = parseInt(
            rowObj["Stock"] || rowObj["stock"] || values[3] || 0,
            10,
          );
          const unit = rowObj["Unite"] || rowObj["unit"] || values[4] || "kg";
          const isBioStr = (
            rowObj["Bio"] ||
            rowObj["isBio"] ||
            values[5] ||
            ""
          ).toLowerCase();
          const isBio = ["oui", "yes", "true", "1"].includes(isBioStr);
          const category =
            rowObj["Categorie"] || rowObj["category"] || "Légumes";
          const batchNumber =
            rowObj["Numero_Lot"] ||
            rowObj["batchNumber"] ||
            `LOT-${Date.now()}-${i}`;

          if (title && priceHT > 0) {
            items.push({
              title,
              priceHT,
              vatRate,
              stock,
              unit,
              isBio,
              category,
              batchNumber,
            });
          }
        }

        if (items.length === 0) {
          setErrorMsg(
            "Aucune ligne de produit valide n'a pu être extraite du fichier CSV.",
          );
        } else {
          setParsedRows(items);
          setSuccessMsg(
            `${items.length} produit(s) prêt(s) à être importé(s). Vérifiez le récapitulatif ci-dessous.`,
          );
        }
      } catch (err) {
        console.error("Erreur de lecture du CSV :", err);
        setErrorMsg(
          "Erreur lors de l'analyse du fichier CSV. Assurez-vous d'utiliser le modèle fourni.",
        );
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  // Exécution de l'importation en masse Firestore (Batch)
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const batch = writeBatch(db);
      const todayStr = new Date().toISOString().slice(0, 10);

      parsedRows.forEach((item) => {
        const docRef = doc(collection(db, "products"));

        const payload = {
          title: item.title,
          name: item.title,
          category: item.category,
          priceHT: Number(item.priceHT.toFixed(2)),
          price: Number(item.priceHT.toFixed(2)),
          vatRate: item.vatRate,
          unit: item.unit,
          stock: item.stock,
          quantity: item.stock,
          harvestDate: todayStr,
          batchNumber: item.batchNumber,
          isBio: item.isBio,

          // 🔗 HÉRITAGE AUTOMATIQUE DU PROFIL DE L'EXPLOITANT
          producerId: user?.uid || "PROD_ANONYME",
          producerName:
            user?.companyName || user?.name || "Maraîcher Exploitant",
          department: producerDept,
          origin: producerDept,
          harvestLocation: producerLocation,

          // ♻️ CONDITIONNEMENT ZÉRO DÉCHET
          packagingType: "Caisses & Cagettes Réutilisables (Consignées)",
          isReusableCrate: true,

          imageUrl: null,
          image: null,
          isAvailable: item.stock > 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        batch.set(docRef, payload);
      });

      await batch.commit();

      setSuccessMsg(
        `${parsedRows.length} produit(s) mis en rayon avec succès dans votre catalogue !`,
      );
      setParsedRows([]);
      if (onProductsImported) onProductsImported();
    } catch (err) {
      console.error("Erreur de commit du batch CSV :", err);
      setErrorMsg(
        "Une erreur est survenue lors de l'importation dans la base de données.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" size={20} />
            Mise en Rayon par Fichier CSV (Importation en Masse)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Importez votre catalogue de récolte en une seule fois. Les
            informations de localisation sont automatiquement liées à votre
            compte.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Download size={15} />
          <span>Télécharger le Modèle CSV</span>
        </button>
      </div>

      {/* BANDEAU RAPPEL CONFIGURATION COMPTE */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-xs space-y-1 text-emerald-900">
        <p className="font-bold flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-emerald-700" />
          Rappel d'Enrichissement Automatique :
        </p>
        <p className="text-emerald-800 font-medium">
          Chaque ligne importée sera automatiquement rattachée à votre
          exploitation (<strong>{producerLocation}</strong> -{" "}
          <strong>{producerDept}</strong>) et configurée pour la livraison en{" "}
          <strong>cagettes réutilisables</strong>.
        </p>
      </div>

      {/* MESSAGES */}
      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* ZONE DE DÉPÔT DU FICHIER */}
      <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-gray-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer">
        <input
          type="file"
          accept=".csv, text/csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-file-input"
        />
        <label
          htmlFor="csv-file-input"
          className="cursor-pointer space-y-3 block"
        >
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Upload size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">
              Cliquez ici pour sélectionner votre fichier CSV
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Format UTF-8 séparateur point-virgule (;) ou virgule (,)
            </p>
          </div>
        </label>
      </div>

      {/* RÉCAPITULATIF AVANT IMPORTATION BATCH */}
      {parsedRows.length > 0 && (
        <div className="space-y-4 animate-fade-in border-t border-gray-100 pt-5">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Aperçu des articles détectés ({parsedRows.length}) :
            </h3>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Importation en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>
                    Confirmer la Mise en Rayon de ces {parsedRows.length}{" "}
                    Produits
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="p-3">Produit</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Prix HT</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Bio</th>
                  <th className="p-3">N° Lot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 font-medium">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">{row.title}</td>
                    <td className="p-3 text-gray-600">{row.category}</td>
                    <td className="p-3 font-semibold text-gray-800">
                      {row.priceHT.toFixed(2)} € / {row.unit}
                    </td>
                    <td className="p-3 font-bold text-amber-800">
                      {row.stock} {row.unit}
                    </td>
                    <td className="p-3">
                      {row.isBio ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black text-[10px]">
                          BIO
                        </span>
                      ) : (
                        <span className="text-gray-400">Non</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-[11px]">
                      {row.batchNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
