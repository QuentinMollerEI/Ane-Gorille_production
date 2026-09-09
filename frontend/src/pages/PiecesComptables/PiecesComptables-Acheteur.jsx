import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FileText,
  TrendingUp,
  Clock,
  Calendar,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { OrderDocumentGenerator } from "../../services/OrderDocumentGenerator";

// =========================================================================
// COMPARTIMENT 1 : INDICATEURS & TRÉSORERIE (BuyerIndicators)
// =========================================================================
function BuyerIndicators({ documents }) {
  const [isRetracted, setIsRetracted] = useState(false);

  // Calcul des métriques basées sur l'historique réel
  const totalSpent = (documents || [])
    .filter((doc) => doc.status === "paid" || doc.status === "completed")
    .reduce((sum, doc) => sum + (doc.amount || 0), 0);

  const pendingAmount = (documents || [])
    .filter(
      (doc) => doc.status === "pending_30d" || doc.status === "pending_chorus",
    )
    .reduce((sum, doc) => sum + (doc.amount || 0), 0);

  const paidCount = (documents || []).filter(
    (doc) => doc.status === "paid" || doc.status === "completed",
  ).length;
  const averageBasket = paidCount > 0 ? totalSpent / paidCount : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          1. Indicateurs & Suivi des Dépenses
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
          type="button"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Cumul Achats */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Total Commandes Payées
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {totalSpent.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Base Factures Validées
            </p>
          </div>

          {/* En attente LME / Mandat */}
          <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Encours de Règlement
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {pendingAmount.toFixed(2)} €
                </p>
              </div>
              <Clock size={20} className="text-amber-600 animate-pulse" />
            </div>
            <p className="text-[10px] text-amber-700 font-bold uppercase mt-3">
              Délai LME 30j / Mandats Publics
            </p>
          </div>

          {/* Panier Moyen */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                Panier Moyen
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {averageBasket.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Hors taxes et taxes incluses
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPARTIMENT 2 : HISTORIQUE DES DOCUMENTS & CHORUS PRO (BuyerDocumentsTable)
// =========================================================================
function BuyerDocumentsTable({ documents }) {
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchTerm, setSearchQuery] = useState("");
  const [docFilter, setFilter] = useState("all");

  const filteredDocs = (documents || []).filter((doc) => {
    const matchesSearch =
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.entity || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.refEngagement || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      docFilter === "all" ||
      (docFilter === "factures" &&
        (doc.type === "Facture" || doc.type === "Facture de vente")) ||
      (docFilter === "bl" && doc.type === "Bon de livraison") ||
      (docFilter === "bc" && doc.type === "Bon de commande");

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-150 text-green-700 rounded-full text-xs font-bold">
            <CheckCircle size={12} /> Payé
          </span>
        );
      case "pending_30d":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-150 text-amber-700 rounded-full text-xs font-bold">
            <Clock size={12} /> Échéance LME 30j
          </span>
        );
      case "pending_chorus":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-150 text-blue-700 rounded-full text-xs font-bold">
            <RefreshCw size={12} className="animate-spin" /> Transmission Chorus
          </span>
        );
      case "rejected_chorus":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-bold">
            <AlertCircle size={12} /> Rejet Chorus Pro
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 rounded-full text-xs font-bold">
            Archivé
          </span>
        );
    }
  };

  const handleDownloadPDF = (doc) => {
    let type = "FAC";
    if (doc.type === "Bon de commande") type = "BC";
    else if (doc.type === "Bon de livraison") type = "BL";
    OrderDocumentGenerator.generatePDF(doc, type);
  };

  const handleDownloadFacturXXml = (doc) => {
    OrderDocumentGenerator.downloadFacturXXml(doc);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          2. Journal des Pièces Comptables & Dépôt Administratif
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
          type="button"
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
                placeholder="Rechercher par N° de pièce, maraîcher, engagement..."
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
              <option value="all">Tous les documents</option>
              <option value="factures">Factures uniquement</option>
              <option value="bl">Bons de livraison (BL)</option>
              <option value="bc">Bons de commande (BC)</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Émission</th>
                  <th className="p-4">N° Pièce / Type</th>
                  <th className="p-4">Maraîcher Exploitant</th>
                  <th className="p-4">Montant TTC (TVA)</th>
                  <th className="p-4">Statut Comptable</th>
                  <th className="p-4 text-right">Téléchargements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr
                      key={doc.id || idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 text-gray-600 font-medium">
                        {doc.date ||
                          (doc.createdAt?.toDate
                            ? doc.createdAt.toDate().toLocaleDateString("fr-FR")
                            : new Date().toLocaleDateString("fr-FR"))}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{doc.id}</p>
                        <p className="text-xs text-gray-500 font-semibold">
                          {doc.type}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">
                          {doc.entity ||
                            doc.producerName ||
                            "Plateforme Âne & Gorille"}
                        </p>
                        {doc.refEngagement && doc.refEngagement !== "-" && (
                          <p className="text-xs text-blue-600 font-bold">
                            Réf. Engagement : {doc.refEngagement}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-gray-950">
                        {doc.amount ? `${doc.amount.toFixed(2)} €` : "-"}
                        <span className="block text-[10px] text-gray-400 font-medium">
                          TVA : {doc.vatRate ?? "5.5"}%
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(doc.status)}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleDownloadPDF(doc)}
                          className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-gray-200 transition-all"
                          title="Télécharger le document certifié au format PDF"
                          type="button"
                        >
                          <Download size={15} />
                        </button>
                        {(doc.isChorus || doc.type === "Facture") && (
                          <button
                            onClick={() => handleDownloadFacturXXml(doc)}
                            className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-150 px-2.5 py-1.5 rounded-md transition-all shadow-sm"
                            title="Télécharger la facture au format Factur-X XML (EN 16931)"
                            type="button"
                          >
                            Factur-X XML
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucune pièce comptable trouvée pour ces filtres.
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
// COMPARTIMENT 3 : CONFIGURATION CHORUS PRO & RÈGLEMENTS (BuyerBillingSettings)
// =========================================================================
function BuyerBillingSettings() {
  const [isRetracted, setIsRetracted] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    siret: "21310555400018",
    codeService: "CANTINE-CENTRALE",
    defaultEngagement: "ENG-2026-908",
    billingContact: "service.compta@mairie-toulouse.fr",
    preferredPayment: "mandat", // 'stripe' | 'mandat'
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Building size={18} className="text-emerald-600" />
          3. Identification Institutionnelle (Chorus Pro & Règlements)
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
          type="button"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6 animate-fade-in">
          {isSaved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-semibold flex items-center gap-2">
              <ShieldCheck size={16} /> Vos paramètres de facturation ont été
              enregistrés avec succès.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SIRET */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Numéro de SIRET Acheteur *
              </label>
              <input
                type="text"
                required
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.siret}
                onChange={(e) =>
                  setBillingInfo({ ...billingInfo, siret: e.target.value })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Sert de validation unique pour le routage Chorus Pro / Factur-X.
              </p>
            </div>

            {/* Code Service */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Code Service Chorus Pro (Optionnel)
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.codeService}
                onChange={(e) =>
                  setBillingInfo({
                    ...billingInfo,
                    codeService: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Obligatoire pour les ministères et grands établissements de
                santé.
              </p>
            </div>

            {/* Numéro Engagement par défaut */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                N° d'Engagement Public (Par défaut)
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.defaultEngagement}
                onChange={(e) =>
                  setBillingInfo({
                    ...billingInfo,
                    defaultEngagement: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Numéro du marché public ou bon de commande interne.
              </p>
            </div>

            {/* Contact Facturation */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                E-mail Référent Comptabilité
              </label>
              <input
                type="email"
                required
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-green-500 border focus:border-green-500"
                value={billingInfo.billingContact}
                onChange={(e) =>
                  setBillingInfo({
                    ...billingInfo,
                    billingContact: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Destinataire des factures de commission et des relances.
              </p>
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              Mode de Règlement Préféré
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/50 transition">
                <input
                  type="radio"
                  name="preferredPayment"
                  checked={billingInfo.preferredPayment === "stripe"}
                  onChange={() =>
                    setBillingInfo({
                      ...billingInfo,
                      preferredPayment: "stripe",
                    })
                  }
                  className="mt-1 text-emerald-600 focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <CreditCard size={16} className="text-gray-500" /> Carte
                    bancaire (Stripe B2B)
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Débit immédiat après validation ou prélèvement SEPA
                    automatisé.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/50 transition">
                <input
                  type="radio"
                  name="preferredPayment"
                  checked={billingInfo.preferredPayment === "mandat"}
                  onChange={() =>
                    setBillingInfo({
                      ...billingInfo,
                      preferredPayment: "mandat",
                    })
                  }
                  className="mt-1 text-emerald-600 focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Building size={16} className="text-gray-500" /> Virement
                    par Mandat Administratif (LME 30j)
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Dédié aux administrations publiques et hôpitaux. Échéance
                    légale de 30 jours.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              Enregistrer les options
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// =========================================================================
// COMPOSANT PARENT : PiecesComptables (Acheteur Container)
// =========================================================================
export default function PiecesComptables() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Écoute en direct des documents liés à cet acheteur connecté (Zéro écrit en dur)
    const q = query(
      collection(db, "documents"),
      where("buyerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDocuments(docsList);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur d'écoute réelle des documents acheteur :", err);
        setError(
          "Erreur d'autorisation ou de connexion lors de la récupération des pièces comptables.",
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-gray-50 min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <FileText size={28} />
          </span>
          Pièces Comptables & Chorus Pro
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Consultez et téléchargez vos justificatifs d'achat, factures de
          circuit court et données Chorus Pro.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <BuyerIndicators documents={documents} />
      <BuyerDocumentsTable documents={documents} />
      <BuyerBillingSettings />
    </div>
  );
}
