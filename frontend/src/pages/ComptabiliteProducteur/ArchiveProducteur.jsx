import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FileText,
  TrendingUp,
  Clock,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Settings,
  ShieldCheck,
} from "lucide-react";

// =========================================================================
// COMPARTIMENT 1 : INDICATEURS & TRÉSORERIE (ProducerIndicators)
// =========================================================================
function ProducerIndicators({ documents, subOrders }) {
  const [isRetracted, setIsRetracted] = useState(false);

  // Somme totale des factures de vente payées (Chiffre d'Affaires Brut)
  const totalSales = documents
    .filter((doc) => doc.type === "Facture" && doc.status === "paid")
    .reduce((sum, doc) => sum + (doc.amount || 0), 0);

  // Somme des commissions de la plateforme
  const totalCommissions = documents
    .filter(
      (doc) =>
        doc.type === "Frais de service (commission)" && doc.status === "paid",
    )
    .reduce((sum, doc) => sum + (doc.amount || 0), 0);

  // Trésorerie en attente (séquestre Stripe) : Bons de préparation terminés ou en transit non encore payés définitivement
  const pendingPayouts =
    subOrders
      .filter((o) => o.status === "RAMASSE" || o.status === "A_RAMASSER")
      .reduce((sum, o) => sum + (o.amount || 0), 0) * 0.82; // 82% après déduction automatique des 18%

  const netRevenue = totalSales - totalCommissions;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          1. Indicateurs Financiers & Trésorerie Exploitant
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* CA Brut */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Chiffre d'Affaires Brut
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {totalSales.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Cumul de vos ventes réelles
            </p>
          </div>

          {/* Solde Séquestre Stripe Connect */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Solde Séquestre (Express)
                </p>
                <p className="text-2xl font-black text-brand-dark">
                  {pendingPayouts.toFixed(2)} €
                </p>
              </div>
              <CreditCard
                size={20}
                className="text-emerald-600 animate-pulse"
              />
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Reversement Stripe Connect en attente
            </p>
          </div>

          {/* Revenu Net */}
          <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Revenu Net Encaissé
              </p>
              <p className="text-2xl font-black text-gray-900">
                {netRevenue.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              CA encaissé après reversement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPARTIMENT 2 : HISTORIQUE DES DOCUMENTS & VENTES (ProducerDocumentsTable)
// =========================================================================
function ProducerDocumentsTable({ documents }) {
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchTerm, setSearchQuery] = useState("");
  const [docFilter, setFilter] = useState("all");

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      docFilter === "all" ||
      (docFilter === "ventes" && doc.type === "Facture") ||
      (docFilter === "frais" && doc.type === "Frais de service (commission)");

    return matchesSearch && matchesFilter;
  });

  const handleDownloadDoc = (docData) => {
    const border = "=========================================================";
    const content = `
${border}
                  DOCUMENT FISCAL - ÂNE & GORILLE
${border}
N° de Pièce : ${docData.id}
Type : ${docData.type}
Date de Génération : ${docData.date}
Montant : ${docData.amount?.toFixed(2)} € (TTC)

DÉTAILS DES TRANSACTIONS :
--------------------------
Émetteur : ${docData.type === "Facture" ? "Maraîcher Exploitant" : "Âne & Gorille SAS (Plateforme)"}
Bénéficiaire : ${docData.type === "Facture" ? docData.buyerName : "Maraîcher local"}

Régime de TVA appliquée : ${docData.vatRate || 5.5}%
Statut du paiement : Payé (Garanti par Stripe Connect / Mandat)

${border}
Document émis de manière électronique conforme au mandat de facturation.
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${docData.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          2. Factures de Vente, Bons de livraison & Commissions
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-5 space-y-4 animate-fade-in">
          {/* Filtres locaux */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher par N° de pièce, nom de l'acheteur..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 font-semibold text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 text-gray-600 font-semibold bg-white"
              value={docFilter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Toutes les pièces</option>
              <option value="ventes">Factures de vente</option>
              <option value="frais">Factures de commissions</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Émis le</th>
                  <th className="p-4">N° Pièce</th>
                  <th className="p-4">Type de Pièce</th>
                  <th className="p-4">Acheteur / Tiers</th>
                  <th className="p-4">Montant TTC</th>
                  <th className="p-4">TVA (%)</th>
                  <th className="p-4 text-right">Fichiers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 text-gray-600 font-medium">
                        {doc.date}
                      </td>
                      <td className="p-4 font-bold text-gray-900">{doc.id}</td>
                      <td className="p-4 font-semibold text-gray-700">
                        {doc.type}
                      </td>
                      <td className="p-4 text-gray-800 font-bold">
                        {doc.buyerName || "Acheteur"}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        {(doc.amount || 0).toFixed(2)} €
                      </td>
                      <td className="p-4">
                        <span className="text-xs bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded font-bold">
                          {doc.vatRate || 5.5}%
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-gray-200 transition-all"
                          title="Télécharger la pièce comptable"
                        >
                          <Download size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucun document comptable ne correspond.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPARTIMENT 3 : REVERSEMENTS STRIPE & REGIME FISCAL (ProducerPayoutsSettings)
// =========================================================================
function ProducerPayoutsSettings() {
  const [isRetracted, setIsRetracted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [vatRegime, setVatRegime] = useState("franchise"); // 'franchise' | 'normal'

  const handleFiscalSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-600" />
          3. Statut Stripe Connect & Paramétrage de la TVA
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stripe Connect Express Info */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={15} /> Compte Express (Stripe Connect)
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Le versement automatique de vos fonds dépend du statut de
                validation réglementaire de votre identité (KYC / LCB-FT) géré
                par notre tiers de confiance financier agréé.
              </p>

              <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-green-950">
                    Statut : Identité Vérifiée
                  </p>
                  <p className="text-[10px] text-green-700 font-medium">
                    Fonds de séquestre transférables sous 24h ouvrées.
                  </p>
                </div>
                <span className="p-1 bg-green-500 text-white rounded-full">
                  <CheckCircle size={14} />
                </span>
              </div>
            </div>

            {/* Fiscal TVA Settings */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={15} /> Régime de Taxe sur la Valeur Ajoutée
                (TVA)
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Configurez votre régime pour permettre à la plateforme d'égaler
                automatiquement vos factures via mandat de facturation.
              </p>

              <form onSubmit={handleFiscalSave} className="space-y-4">
                <label className="flex items-start gap-2.5 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/50 transition">
                  <input
                    type="radio"
                    name="vat_regime"
                    checked={vatRegime === "franchise"}
                    onChange={() => setVatRegime("franchise")}
                    className="mt-1 text-emerald-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      Franchise en Base de TVA (Auto-entrepreneur)
                    </span>
                    <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                      TVA à 0%. Mention légale obligatoire apposée : \"TVA non
                      applicable, art. 293 B du CGI\".
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/50 transition">
                  <input
                    type="radio"
                    name="vat_regime"
                    checked={vatRegime === "normal"}
                    onChange={() => setVatRegime("normal")}
                    className="mt-1 text-emerald-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      Régime Assujetti (Société / Entreprise locale)
                    </span>
                    <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                      Collecte active de la TVA (5.5% sur l'alimentation
                      générale, 20% sur la commission plateforme).
                    </span>
                  </div>
                </label>

                {isSaved && (
                  <div className="p-2.5 bg-green-50 text-green-800 border border-green-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Préférences fiscales mises à jour.
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-brand-dark hover:bg-opacity-95 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPOSANT PARENT : ArchiveComptabilite (Producteur Container)
// =========================================================================
export default function ArchiveComptabilite() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Écoute dynamique de la collection /documents racine filtrée sur ce producteur
    const qDocs = query(
      collection(db, "documents"),
      where("producerId", "==", user.uid),
    );

    // Écoute dynamique de /sub_orders pour calculer la trésorerie en transit
    const qSubOrders = query(
      collection(db, "sub_orders"),
      where("producerId", "==", user.uid),
    );

    const unsubscribeDocs = onSnapshot(
      qDocs,
      (snapshot) => {
        const dataList = snapshot.docs.map((doc) => {
          const docData = doc.data();
          const dateStr = docData.createdAt?.toDate
            ? docData.createdAt.toDate().toLocaleDateString("fr-FR")
            : new Date().toLocaleDateString("fr-FR");

          return {
            id: doc.id,
            date: dateStr,
            type: docData.type || "Facture",
            buyerName: docData.buyerName || "Acheteur tiers",
            amount: docData.amount || 0,
            vatRate: docData.vatRate || 5.5,
            status: docData.status || "paid",
          };
        });
        setDocuments(dataList);
      },
      (err) => {
        console.error("Erreur d'écoute des documents :", err);
        setError("Erreur de synchronisation des pièces comptables.");
      },
    );

    const unsubscribeSubOrders = onSnapshot(
      qSubOrders,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur d'écoute des sub_orders :", err);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeDocs();
      unsubscribeSubOrders();
    };
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-gray-50 min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <TrendingUp size={28} />
          </span>
          Archive & Comptabilité Exploitation
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Suivez votre chiffre d'affaires, gérez les factures de ventes
          dématérialisées (B2B/B2G) et contrôlez vos versements Stripe Connect.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <ProducerIndicators documents={documents} subOrders={subOrders} />
      <ProducerDocumentsTable documents={documents} />
      <ProducerPayoutsSettings />
    </div>
  );
}
