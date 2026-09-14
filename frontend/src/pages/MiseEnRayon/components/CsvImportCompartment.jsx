import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { ProductService } from "../../../services/ProductService";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  PackageCheck
} from "lucide-react";

// ==========================================
// 1. HELPER PUR : Parsing & Normalisation CSV
// ==========================================
function parseBool(val) {
  if (!val) return false;
  const clean = String(val).trim().toLowerCase();
  return ["oui", "vrai", "1", "true", "x"].includes(clean);
}

function parseCsvText(text) {
  const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    throw new Error("Le fichier CSV doit contenir au moins un en-tête et une ligne de produit.");
  }

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map((h) => 
    h.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  const parsedProducts = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim());
    if (values.length < 2) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    // Cartographie vers le schéma Firestore avec extraction des 6 labels distincts
    parsedProducts.push({
      title: row.title || row.designation || row.nom || "Produit sans nom",
      category: row.category || row.categorie || "Légumes",
      priceHT: parseFloat(row.priceht || row.prixht || row.prix || 1.0),
      vatRate: row.vatrate || row.tva || "5.5",
      unit: row.unit || row.unite || "kg",
      stock: parseInt(row.stock || row.quantite || 0, 10),
      harvestDate: row.harvestdate || row.daterecolte || new Date().toISOString().slice(0, 10),
      batchNumber: row.batchnumber || row.numerolot || row.lot || "",
      
      // Extraction indépendante des 6 labels de qualité (SIQO / EGAlim)
      isBio: parseBool(row.isbio || row.bio || row.ab),
      isHve: parseBool(row.ishve || row.hve),
      isAop: parseBool(row.isaop || row.aop),
      isAoc: parseBool(row.isaoc || row.aoc),
      isIgp: parseBool(row.isigp || row.igp),
      isLabelRouge: parseBool(row.islabelrouge || row.labelrouge),

      // Attributs filières facultatifs (Miel, Œufs, INCO)
      floralOrigin: row.floralorigin || row.origineflorale || "",
      honeyNetWeight: row.honeynetweight || row.poidsnet || "",
      eggRearingMode: row.eggrearingmode || row.modeelevage || "",
      eggCaliber: row.eggcaliber || row.calibre || "",
      dcrDate: row.dcrdate || row.dcr || "",
      eggSanitaryApproval: row.eggsanitaryapproval || row.agrementsanitaire || "",
      ddmDate: row.ddmdate || row.ddm || "",
      dlcDate: row.dlcdate || row.dlc || "",
      storageInstructions: row.storageinstructions || row.conservation || ""
    });
  }

  return parsedProducts;
}

// ==========================================
// 2. SOUS-COMPOSANT : Modèle CSV Téléchargeable
// ==========================================
function CsvTemplateButton() {
  const handleDownload = () => {
    const csvContent =
      "title;category;priceHT;vatRate;unit;stock;harvestDate;batchNumber;isBio;isHve;isAop;isAoc;isIgp;isLabelRouge\n" +
      "Miel d'Acacia 500g;Miel & Apiculture;6.50;5.5;pot;40;2026-08-15;LOT-MIEL-01;oui;non;non;non;oui;non\n" +
      "Carottes Bio de Saison;Légumes;2.20;5.5;kg;150;2026-09-01;LOT-CAR-02;oui;oui;non;non;non;non\n" +
      "Huile d'Olive AOP;Produits Transformés & Conserves;12.00;5.5;bouteille;25;2026-07-10;LOT-HUI-03;non;oui;oui;non;non;oui\n" +
      "Poulet Fermier Label Rouge;Transformés;14.50;5.5;kg;15;2026-09-10;LOT-POU-04;non;non;non;non;non;oui";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_mise_en_rayon_multi_labels.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
    >
      <Download size={14} className="text-emerald-600" />
      <span>Modèle CSV (6 Labels)</span>
    </button>
  );
}

// ==========================================
// 3. SOUS-COMPOSANT : Zone de Sélecteur de Fichier
// ==========================================
function CsvDropZone({ onFileSelected, loading }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
      <label className="cursor-pointer flex flex-col items-center gap-2">
        <Upload size={28} className="text-emerald-600" />
        <span className="font-extrabold text-gray-800 text-xs">Cliquez pour sélectionner votre fichier CSV</span>
        <span className="text-[10px] text-gray-500">Formats supportés : .csv (Séparateur point-virgule ou virgule)</span>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleChange} 
          disabled={loading} 
        />
      </label>
      {loading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-emerald-800 font-bold">
          <RefreshCw size={14} className="animate-spin" />
          <span>Analyse du fichier CSV en cours...</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. SOUS-COMPOSANT : Tableau de Prévisualisation
// ==========================================
function CsvPreviewTable({ products, onClear, onConfirm, loading }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-3 pt-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900 text-xs flex items-center gap-2">
          <PackageCheck size={16} className="text-emerald-600" />
          <span>Aperçu des récoltes ({products.length} produits détectés)</span>
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Annuler l'import</span>
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white max-h-64 shadow-xs">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-black tracking-wider">
            <tr>
              <th className="p-2.5">Désignation</th>
              <th className="p-2.5">Catégorie</th>
              <th className="p-2.5">Prix HT</th>
              <th className="p-2.5">TVA</th>
              <th className="p-2.5">Stock</th>
              <th className="p-2.5">Labels SIQO / EGAlim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
            {products.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80">
                <td className="p-2.5 font-bold text-gray-900">{p.title}</td>
                <td className="p-2.5">{p.category}</td>
                <td className="p-2.5 font-bold">{p.priceHT.toFixed(2)} €</td>
                <td className="p-2.5">{p.vatRate} %</td>
                <td className="p-2.5">{p.stock} {p.unit}</td>
                <td className="p-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {p.isBio && <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-black">Bio</span>}
                    {p.isHve && <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[9px] font-black">HVE</span>}
                    {p.isAop && <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-[9px] font-black">AOP</span>}
                    {p.isAoc && <span className="bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded text-[9px] font-black">AOC</span>}
                    {p.isIgp && <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[9px] font-black">IGP</span>}
                    {p.isLabelRouge && <span className="bg-red-100 text-red-900 px-1.5 py-0.5 rounded text-[9px] font-black">Label Rouge</span>}
                    {!p.isBio && !p.isHve && !p.isAop && !p.isAoc && !p.isIgp && !p.isLabelRouge && (
                      <span className="text-gray-400 italic text-[10px]">Aucun</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-6 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Importation en cours...</span>
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              <span>Valider et Mettre les {products.length} Produits en Rayon</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 5. COMPOSANT PRINCIPAL ORCHESTRATEUR
// ==========================================
export default function CsvImportCompartment({ onProductAdded }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [parsedProducts, setParsedProducts] = useState([]);

  const handleFileSelected = (file) => {
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const products = parseCsvText(text);
        setParsedProducts(products);
      } catch (err) {
        console.error(err);
        setStatusMsg({ type: "error", text: err.message || "Erreur de syntaxe dans le fichier CSV." });
        setParsedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;

    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      await ProductService.addBulkProducts(parsedProducts, user);

      setStatusMsg({
        type: "success",
        text: `${parsedProducts.length} produits mis en rayon avec succès !`,
      });

      setParsedProducts([]);
      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: err.message || "Erreur lors de l'enregistrement." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" size={18} />
            Importation de Masse CSV Multi-Labels
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Importation rapide du stock avec prise en charge des 6 cases de labels (Bio, HVE, AOP, AOC, IGP, Label Rouge).
          </p>
        </div>
        <CsvTemplateButton />
      </div>

      {statusMsg.text && (
        <div className={`p-3 rounded-xl font-bold flex items-center gap-2 animate-fade-in ${statusMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {statusMsg.type === 'error' ? <AlertCircle size={16} className="shrink-0" /> : <CheckCircle size={16} className="shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {parsedProducts.length === 0 && (
        <CsvDropZone onFileSelected={handleFileSelected} loading={loading} />
      )}

      <CsvPreviewTable
        products={parsedProducts}
        onClear={() => setParsedProducts([])}
        onConfirm={handleConfirmImport}
        loading={loading}
      />
    </div>
  );
}