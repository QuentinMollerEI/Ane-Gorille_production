import React, { useState } from 'react';
import { db } from '../../../config/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext.jsx';

import { parseCsvText, autoDetectMapping, validateAndTransformRow } from './csv/csvParser.js';
import { CsvMappingStep } from './csv/CsvMappingStep.jsx';
import { CsvPreviewStep } from './csv/CsvPreviewStep.jsx';

import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function CsvImportCompartment() {
  const { userProfile, user } = useAuth();
  const currentUser = userProfile || user || {};

  const [step, setStep] = useState(1); // 1: Fichier, 2: Mapping, 3: Prévisualisation
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [parsedRows, setParsedRows] = useState([]);

  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setImportSuccessMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const { headers, rows } = parseCsvText(text);
        setCsvHeaders(headers);
        setRawRows(rows);

        const initialMapping = autoDetectMapping(headers);
        setMapping(initialMapping);
        setStep(2);
      } catch (err) {
        console.error('Erreur lecture CSV :', err);
        setError(err.message || 'Fichier CSV invalide.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmMapping = () => {
    setError('');
    const validated = rawRows.map((raw) =>
      validateAndTransformRow(raw, mapping, currentUser.uid)
    );
    setParsedRows(validated);
    setStep(3);
  };

  const handleImportValidRows = async () => {
    const validItems = parsedRows.filter((r) => r.isValid).map((r) => r.data);
    if (validItems.length === 0) return;

    setIsImporting(true);
    setError('');

    try {
      const productsRef = collection(db, 'products');
      let successCount = 0;

      for (const item of validItems) {
        await addDoc(productsRef, {
          ...item,
          vendorUid: currentUser.uid || 'vendor_default',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        successCount++;
      }

      setImportSuccessMessage(`${successCount} références injectées avec succès dans votre catalogue !`);
      setStep(1);
      setCsvHeaders([]);
      setRawRows([]);
      setParsedRows([]);
    } catch (err) {
      console.error('Erreur injection CSV :', err);
      setError("Échec lors de l'injection en base de données.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-700" size={24} />
          Importation de Stock par Fichier CSV
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          Intégration de masse avec détection automatique des colonnes et contrôle d'intégrité
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {step === 1 && (
        <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl text-center space-y-4 hover:border-emerald-500 transition-all">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Sélectionnez votre fichier CSV</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
              Prise en charge des fichiers avec séparateur virgule ou point-virgule (UTF-8). Titre et Prix HT obligatoires.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md">
            <span>Parcourir mes fichiers</span>
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {step === 2 && (
        <CsvMappingStep
          headers={csvHeaders}
          mapping={mapping}
          onMappingChange={(key, val) => setMapping((prev) => ({ ...prev, [key]: val }))}
          onConfirmMapping={handleConfirmMapping}
          onCancel={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <CsvPreviewStep
          parsedRows={parsedRows}
          onImportValidRows={handleImportValidRows}
          isImporting={isImporting}
          onReset={() => setStep(1)}
        />
      )}
    </div>
  );
}