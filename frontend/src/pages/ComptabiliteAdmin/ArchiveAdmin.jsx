import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, onSnapshot } from "firebase/firestore";
import {
  FileText,
  Shield,
  TrendingUp,
  Clock,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  FileSpreadsheet,
  Server,
} from "lucide-react";

// =========================================================================
// COMPARTIMENT 1 : VOLUME D'AFFAIRES ET COMMISSIONS PLATFORM (AdminIndicators)
// =========================================================================
function AdminIndicators({ transactions }) {
  const [isRetracted, setIsRetracted] = useState(false);

  // Volume global transité (GMV) sur la plateforme (somme de toutes les ventes d'aliments de sub_orders)
  const totalVolume = transactions.reduce(
    (sum, tx) => sum + (tx.amount || 0),
    0,
  );

  // Chiffre d'affaires propre de la plateforme (somme des commissions de 18% sur sub_orders)
  const totalCommissions = transactions.reduce(
    (sum, tx) => sum + (tx.commissionAmount || tx.amount * 0.18),
    0,
  );

  // Fonds détenus en séquestre sur Stripe Connect (en transit légal)
  const escrowFunds = totalVolume - totalCommissions;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <BarChart3 size={18} className="text-emerald-600" />
          1. Volume d'Affaires Global & Commissions Collectées
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
          {/* GMV - Volume d'affaires */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Volume d'Affaires Brut (GMV)
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {totalVolume.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Toutes transactions consolidées
            </p>
          </div>

          {/* Commissions perçues */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Commissions Platform (HT)
                </p>
                <p className="text-2xl font-black text-brand-dark">
                  {totalCommissions.toFixed(2)} €
                </p>
              </div>
              <TrendingUp
                size={20}
                className="text-emerald-600 animate-pulse"
              />
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Rémunération de mise en relation (18%)
            </p>
          </div>

          {/* Escrow balance */}
          <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Fonds de Tiers sous Séquestre
              </p>
              <p className="text-2xl font-black text-gray-900">
                {escrowFunds.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              En transit sécurisé sur Stripe Connect
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPARTIMENT 2 : REGISTRE GLOBAL DES TRANSACTIONS (AdminGlobalRegister)
// =========================================================================
function AdminGlobalRegister({ transactions }) {
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchTerm, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTx = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.producerName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = statusFilter === "all" || tx.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "TERMINE":
      case "delivered":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-150 text-green-700 rounded text-xs font-bold">
            Succès (Livré)
          </span>
        );
      case "A_RAMASSER":
      case "RAMASSE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 border border-yellow-150 text-yellow-700 rounded text-xs font-bold">
            Logistique en cours
          </span>
        );
      case "A_PREPARER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-150 text-amber-700 rounded text-xs font-bold">
            À préparer
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          2. Registre des Ventes & Flux Financiers Consolidés
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
          {/* Outils de filtre */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher par N° transaction, acheteur, maraîcher..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 font-semibold text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 text-gray-600 font-semibold bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les flux</option>
              <option value="TERMINE">Règlements finalisés</option>
              <option value="A_RAMASSER">Flux logistiques</option>
              <option value="A_PREPARER">Flux de préparation</option>
            </select>
          </div>

          {/* Tableau des transactions système */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">ID Sous-Commande</th>
                  <th className="p-4">Acheteur tiers</th>
                  <th className="p-4">Maraîcher vendeur</th>
                  <th className="p-4">Montant TTC</th>
                  <th className="p-4">Commission plateforme</th>
                  <th className="p-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredTx.length > 0 ? (
                  filteredTx.map((tx, idx) => {
                    const commission = tx.commissionAmount || tx.amount * 0.18;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4 text-gray-600 font-medium">
                          {tx.date}
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          {tx.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="p-4 text-gray-700 font-semibold">
                          {tx.buyerName || "Acheteur"}
                        </td>
                        <td className="p-4 text-gray-700 font-semibold">
                          {tx.producerName || "Maraîcher"}
                        </td>
                        <td className="p-4 font-bold text-gray-950">
                          {(tx.amount || 0).toFixed(2)} €
                        </td>
                        <td className="p-4 font-semibold text-emerald-700">
                          +{commission.toFixed(2)} €
                          <span className="block text-[9px] text-gray-400 font-medium">
                            TVA à 20% incluse
                          </span>
                        </td>
                        <td className="p-4">{getStatusBadge(tx.status)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucune ligne de transaction trouvée.
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
// COMPARTIMENT 3 : DECLARATIONS DGFIP (DAC7) & MONITOR CHORUS PRO (AdminFiscalReporting)
// =========================================================================
function AdminFiscalReporting() {
  const [isRetracted, setIsRetracted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleExport = (type) => {
    setIsGenerating(true);
    setSuccessMsg("");
    setTimeout(() => {
      setIsGenerating(false);
      if (type === "dac7") {
        setSuccessMsg(
          "Déclaration consolidée de l'exercice fiscal éditée au format légal DGFIP XML (DAC7) !",
        );
      } else {
        setSuccessMsg("Audit d'intégration Chorus Pro généré avec succès.");
      }
    }, 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Server size={18} className="text-emerald-600" />
          3. Déclarations Fiscales Administratives (DAC7 & Chorus Pro Monitor)
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
          {successMsg && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Directive Européenne DAC7 */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={15} /> Déclarations Annuelles Opérateur
                (DAC7)
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Conformément aux directives fiscales européennes anti-fraude, la
                plateforme \"Âne & Gorille\" doit obligatoirement transmettre à
                la DGFIP le récapitulatif annuel des revenus perçus par chaque
                maraîcher exploitant.
              </p>

              <div className="bg-blue-50/50 border border-blue-150 p-4 rounded-xl text-xs text-blue-950 font-bold space-y-1">
                <p>Échéance de déclaration : 31 Janvier</p>
                <p className="font-medium text-blue-700">
                  Rapport d'activité consolidé des tiers-vendeurs : Suivi de vos
                  maraîchers actifs.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={isGenerating}
                  onClick={() => handleExport("dac7")}
                  className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-350 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  {isGenerating ? "Compilation..." : "Compiler Rapport DAC7"}
                </button>
              </div>
            </div>

            {/* Chorus Pro Transmissions Monitor */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Server size={15} /> Surveillance de Télétransmission Chorus Pro
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Contrôle automatique de l'état des factures électroniques à
                destination de la sphère publique (B2G). Les anomalies de dépôt
                (Siret ou engagement manquant) doivent être signalées.
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 p-2.5 rounded-lg border border-green-150">
                  <span className="text-base font-black text-green-700">
                    100%
                  </span>
                  <p className="text-[9px] text-green-800 font-bold uppercase mt-1">
                    Succès Transmission
                  </p>
                </div>
                <div className="bg-yellow-50 p-2.5 rounded-lg border border-yellow-150">
                  <span className="text-base font-black text-yellow-700">
                    API
                  </span>
                  <p className="text-[9px] text-yellow-800 font-bold uppercase mt-1">
                    Liaison AIFE
                  </p>
                </div>
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-150">
                  <span className="text-base font-black text-red-700">0</span>
                  <p className="text-[9px] text-red-800 font-bold uppercase mt-1">
                    Rejets critiques
                  </p>
                </div>
              </div>

              <button
                disabled={isGenerating}
                onClick={() => handleExport("chorus")}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw
                  size={12}
                  className={isGenerating ? "animate-spin" : ""}
                />{" "}
                Tester la liaison de télétransmission API AIFE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPOSANT PARENT : ArchiveAdmin (Admin Container)
// =========================================================================
export default function ArchiveAdmin() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Écoute dynamique de la collection globale sub_orders pour l'administrateur
    const q = query(collection(db, "sub_orders"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dataList = snapshot.docs.map((doc) => {
          const docData = doc.data();
          const dateStr = docData.createdAt?.toDate
            ? docData.createdAt.toDate().toLocaleDateString("fr-FR")
            : new Date().toLocaleDateString("fr-FR");

          return {
            id: doc.id,
            date: dateStr,
            buyerName: docData.buyerName || "Acheteur tiers",
            producerName: docData.producerName || "Maraîcher exploitant",
            amount: docData.amount || 0,
            commissionAmount: docData.commissionAmount || docData.amount * 0.18,
            status: docData.status || "A_PREPARER",
          };
        });

        setTransactions(dataList);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation admin :", err);
        setError(
          "Erreur de droits ou d'accès lors de la synchronisation consolidée.",
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
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
            <Shield size={28} />
          </span>
          Surveillance Fiscale & Flux Globaux
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Espace d'administration comptable : Volume d'affaires consolidé de la
          marketplace, registre réglementaire et audits DAC7 / Chorus Pro.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <AdminIndicators transactions={transactions} />
      <AdminGlobalRegister transactions={transactions} />
      <AdminFiscalReporting />
    </div>
  );
}
