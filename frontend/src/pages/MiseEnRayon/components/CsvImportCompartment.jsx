import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  PackageCheck,
  Tag,
  Calendar,
  Award
} from "lucide-react";

/**
 * 🌾 COMPOSANT : CsvImportCompartment.jsx
 * Responsabilité unique : Importation en masse de produits via fichier CSV.
 * 
 * Supporte la totalité des catégories et unités B2B / B2G :
 * - Catégories : Légumes, Fruits, Herbes & Aromates, Miel & Apiculture, Œufs & Élevage, Produits Transformés & Conserves, Produits Secs & Épicerie.
 * - Unités : kg, pièce, botte, barquette, cagette, bocal, pot, sachet.
 */
export default function CsvImportCompartment({ onProductsImported }) {
  const { user } = useAuth();
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const producerName =
    user?.companyName ||
    user?.displayName ||
    user?.name ||
    user?.producerName ||
    "Maraîcher Exploitant";

  const producerDept =
    user?.department ||
    user?.departmentCode ||
    (user?.postalCode ? user.postalCode.substring(0, 2) : "") ||
    "Local";

  const harvestLocation =
    user?.address || user?.city || user?.companyName || "Exploitation locale";

  // Helper de sanitization de la catégorie
  const sanitizeCategory = (cat) => {
    const clean = (cat || "").toLowerCase().trim();
    if (clean.includes("fruit")) return "Fruits";
    if (clean.includes("herb") || clean.includes("aromat")) return "Herbes & Aromates";
    if (clean.includes("miel") || clean.includes("apicult")) return "Miel & Apiculture";
    if (clean.includes("œuf") || clean.includes("oeuf") || clean.includes("élevag") || clean.includes("elevag")) return "Œufs & Élevage";
    if (clean.includes("transfor") || clean.includes("conserv")) return "Produits Transformés & Conserves";
    if (clean.includes("sec") || clean.includes("épicer") || clean.includes("epicer")) return "Produits Secs & Épicerie";
    return "Légumes";
  };

  // Helper de sanitization de l'unité
  const sanitizeUnit = (u) => {
    const clean = (u || "").toLowerCase().trim();
    if (clean.includes("bot")) return "botte";
    if (clean.includes("barq")) return "barquette";
    if (clean.includes("cag")) return "cagette";
    if (clean.includes("bocal")) return "bocal";
    if (clean.includes("pot")) return "pot";
    if (clean.includes("sachet")) return "sachet";
    if (clean.includes("p") && !clean.includes("pot")) return "pièce";
    return "kg";
  };

  // 1. 📥 Téléchargement du modèle CSV d'exemple (UTF-8 BOM pour Excel)
  const handleDownloadTemplate = () => {
    const csvContent =
      "\uFEFF" +
      "Désignation;Catégorie;Prix HT;TVA;Unité;Stock;Date de Récolte;N° de Lot;Bio\n" +
      "Carottes de Sable;Légumes;2.50;5.5;kg;100;2026-09-18;LOT-2026-CAR01;Oui\n" +
      "Pommes Gala du Verger;Fruits;2.80;5.5;kg;200;2026-09-17;LOT-2026-POM01;Non\n" +
      "Persil Plat Bio;Herbes & Aromates;1.20;5.5;botte;60;2026-09-18;LOT-2026-PER01;Oui\n" +
      "Miel de Fleurs Sauvages;Miel & Apiculture;7.50;5.5;pot;30;2026-09-15;LOT-2026-MIE01;Non\n" +
      "Œufs Frais de Plein Air;Œufs & Élevage;3.20;5.5;pièce;120;2026-09-18;LOT-2026-OEU01;Oui\n" +
      "Ratatouille Artisanale 500g;Produits Transformés & Conserves;6.00;5.5;bocal;40;2026-09-10;LOT-2026-RAT01;Oui";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_import_catalogue_ane_et_gorille.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. 🔍 Analyse et nettoyage du fichier CSV (Parsing)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setStatusMsg({ type: "", text: "" });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") return;

        const lines = text.split(/\r\n|\n/);
        if (lines.length < 2) {
          setStatusMsg({
            type: "error",
            text: "Le fichier CSV est vide ou ne contient aucune ligne de données.",
          });
          return;
        }

        const firstLine = lines[0];
        const separator = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";

        const headers = firstLine
          .split(separator)
          .map((h) => h.replace(/^["\uFEFF]/, "").replace(/["\r]/g, "").trim().toLowerCase());

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(separator).map((v) => v.replace(/^"/, "").replace(/["\r]/g, "").trim());
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || "";
          });

          const rawTitle =
            rowObj["désignation"] ||
            rowObj["designation"] ||
            rowObj["title"] ||
            rowObj["nom"] ||
            rowObj["produit"] ||
            "";

          const rawCategory =
            rowObj["catégorie"] ||
            rowObj["categorie"] ||
            rowObj["category"] ||
            "Légumes";

          const rawPriceHT =
            rowObj["prix ht"] ||
            rowObj["priceht"] ||
            rowObj["prix"] ||
            rowObj["price"] ||
            "0";

          const rawVatRate =
            rowObj["tva"] ||
            rowObj["vatrate"] ||
            rowObj["taux tva"] ||
            rowObj["vat"] ||
            "5.5";

          const rawUnit = rowObj["unité"] || rowObj["unite"] || rowObj["unit"] || "kg";
          const rawStock = rowObj["stock"] || rowObj["quantité"] || rowObj["quantite"] || "0";
          const rawHarvestDate = rowObj["date de récolte"] || rowObj["date de recolte"] || rowObj["harvestdate"] || "";
          const rawBatchNumber = rowObj["n° de lot"] || rowObj["num de lot"] || rowObj["batchnumber"] || "";
          const rawBio = rowObj["bio"] || rowObj["isbio"] || rowObj["ab"] || "";

          const title = rawTitle.trim();
          const priceHT = parseFloat(rawPriceHT.replace(",", ".")) || 0;
          const vatRate = parseFloat(rawVatRate.replace(",", ".")) || 5.5;
          const stock = parseInt(rawStock, 10) || 0;
          const unit = sanitizeUnit(rawUnit);
          const category = sanitizeCategory(rawCategory);
          const isBio =
            Boolean(rawBio) &&
            ["oui", "true", "1", "yes", "ab", "bio"].includes(
              rawBio.toString().toLowerCase().trim()
            );

          const isValid = title.length > 0 && priceHT > 0 && stock >= 0;

          rows.push({
            id: `row-${i}`,
            title,
            category,
            priceHT: Number(priceHT.toFixed(2)),
            vatRate,
            unit,
            stock,
            harvestDate: rawHarvestDate || new Date().toISOString().slice(0, 10),
            batchNumber:
              rawBatchNumber ||
              `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            isBio,
            isValid,
            error: !title
              ? "Désignation manquante"
              : priceHT <= 0
              ? "Prix HT invalide (> 0)"
              : null,
          });
        }

        setParsedRows(rows);
        const validCount = rows.filter((r) => r.isValid).length;
        if (rows.length === 0) {
          setStatusMsg({
            type: "error",
            text: "Aucune ligne de produit exploitable trouvée dans le fichier.",
          });
        } else {
          setStatusMsg({
            type: "info",
            text: `${validCount} produit(s) valide(s) sur ${rows.length} extrait(s) du CSV.`,
          });
        }
      } catch (err) {
        console.error("Erreur de lecture CSV :", err);
        setStatusMsg({
          type: "error",
          text: "Format de fichier non reconnu. Veuillez utiliser le modèle CSV fourni.",
        });
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleRemoveRow = (id) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // 3. 🚀 ÉCRITURE EN MASSE DANS FIRESTORE (writeBatch)
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setStatusMsg({
        type: "error",
        text: "Aucun produit valide à importer.",
      });
      return;
    }

    if (!user?.uid) {
      setStatusMsg({
        type: "error",
        text: "Accès refusé : Producteur non connecté.",
      });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const batchSize = 450;
      let importedCount = 0;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const chunk = validRows.slice(i, i + batchSize);
        const batch = writeBatch(db);

        chunk.forEach((row) => {
          const productRef = doc(collection(db, "products"));
          const productPayload = {
            title: row.title,
            name: row.title,
            category: row.category,
            priceHT: row.priceHT,
            price: row.priceHT,
            vatRate: row.vatRate,
            unit: row.unit,
            stock: row.stock,
            quantity: row.stock,
            harvestDate: row.harvestDate,
            batchNumber: row.batchNumber,
            isBio: row.isBio,

            producerId: user.uid,
            producer: producerName,
            producerName: producerName,
            companyName: producerName,
            department: producerDept,
            origin: producerDept,
            harvestLocation: harvestLocation,

            packagingType: "Caisses & Cagettes Réutilisables (Consignées)",
            isReusableCrate: true,

            imageUrl: null,
            image: null,
            labelImageUrl: null,

            isAvailable: row.stock > 0,
            isHidden: false,
            status: "published",

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(productRef, productPayload);
        });

        await batch.commit();
        importedCount += chunk.length;
      }

      setStatusMsg({
        type: "success",
        text: `Félicitations ! ${importedCount} produit(s) ont été importés et mis en rayon avec succès.`,
      });

      setCsvFile(null);
      setParsedRows([]);
      if (onProductsImported) onProductsImported();
    } catch (err) {
      console.error("Erreur d'importation CSV :", err);
      setStatusMsg({
        type: "error",
        text: err.message || "Erreur lors de l'enregistrement dans la base de données.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-150 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">
              Importation CSV en Masse
            </h2>
            <p className="text-gray-500 text-[11px]">
              Téléversez votre catalogue d'un seul coup. Origine ({producerDept}) et traçabilité sont attribuées à votre exploitation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold rounded-xl border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Download size={14} className="text-emerald-700" />
          <span>Télécharger le Modèle CSV</span>
        </button>
      </div>

      {/* Message de statut */}
      {statusMsg.text && (
        <div
          className={`p-3 rounded-xl font-bold flex items-center gap-2 text-xs animate-fade-in ${
            statusMsg.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : statusMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          {statusMsg.type === "error" ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : statusMsg.type === "success" ? (
            <CheckCircle size={16} className="shrink-0" />
          ) : (
            <FileSpreadsheet size={16} className="shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Zone d'importation */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50/50 hover:bg-emerald-50/20 transition-colors">
        <Upload size={28} className="mx-auto text-emerald-700 mb-2" />
        <p className="font-extrabold text-gray-800 text-xs">
          Glissez-déposez votre fichier CSV ici ou
        </p>
        <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl cursor-pointer transition-colors shadow-xs">
          <span>Sélectionner un fichier CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <p className="text-[10px] text-gray-400 mt-2 font-bold">
          Fichiers .CSV encodés en UTF-8 (Séparateurs : Point-virgule ou Virgule)
        </p>
      </div>

      {/* Tableau d'aperçu */}
      {parsedRows.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-700" />
              <span>Aperçu des produits à importer ({parsedRows.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-gray-500">
              Vérifiez vos données avant de valider l'importation.
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[9px] tracking-wider">
                    <th className="p-2.5">Désignation</th>
                    <th className="p-2.5">Catégorie</th>
                    <th className="p-2.5">Prix HT</th>
                    <th className="p-2.5">Unité</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5">N° Lot</th>
                    <th className="p-2.5">Date Récolte</th>
                    <th className="p-2.5 text-center">Bio</th>
                    <th className="p-2.5 text-center">Statut</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px] font-semibold text-gray-800">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.id}
                      className={!row.isValid ? "bg-red-50/50" : "hover:bg-gray-50"}
                    >
                      <td className="p-2.5 font-bold text-gray-900">
                        {row.title || <span className="text-red-500 italic">Manquant</span>}
                      </td>
                      <td className="p-2.5 text-gray-600">{row.category}</td>
                      <td className="p-2.5 font-black text-gray-900">
                        {row.priceHT.toFixed(2)} €
                      </td>
                      <td className="p-2.5 text-gray-600">{row.unit}</td>
                      <td className="p-2.5 font-black text-emerald-800">{row.stock}</td>
                      <td className="p-2.5 text-gray-500 font-bold">{row.batchNumber}</td>
                      <td className="p-2.5 text-gray-500">{row.harvestDate}</td>
                      <td className="p-2.5 text-center">
                        {row.isBio ? (
                          <span className="bg-amber-100 text-amber-900 font-black text-[8px] px-1.5 py-0.5 rounded">
                            BIO
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        {row.isValid ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[9px]">
                            Valide
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 text-[9px]">
                            {row.error}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={loading || parsedRows.filter((r) => r.isValid).length === 0}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                    Valider et Importer ({parsedRows.filter((r) => r.isValid).length}) Produits
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
