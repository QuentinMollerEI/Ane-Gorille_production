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
  FileCode,
  CreditCard,
} from "lucide-react";
import { OrderDocumentGenerator } from "../../services/OrderDocumentGenerator";

export default function ArchiveProducteur() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const qDocs = query(
      collection(db, "documents"),
      where("producerId", "==", user.uid),
    );

    const qSubOrders = query(
      collection(db, "sub_orders"),
      where("producerId", "==", user.uid),
    );

    const unsubscribeDocs = onSnapshot(qDocs, (snapshot) => {
      const dataList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDocuments(dataList);
    });

    const unsubscribeSubOrders = onSnapshot(qSubOrders, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubOrders(list);
      setLoading(false);
    });

    return () => {
      unsubscribeDocs();
      unsubscribeSubOrders();
    };
  }, [user?.uid]);

  const handleDownloadPdf = (doc) => {
    let type = "FAC";
    if (doc.type === "Bon de préparation") type = "BP";
    OrderDocumentGenerator.generatePDF(doc, type);
  };

  const handleDownloadFacturX = (doc) => {
    OrderDocumentGenerator.downloadFacturXXml(doc);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-screen">
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
          Comptabilité & Documents Dématérialisés Exploitant
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Consultez et téléchargez vos Bons de Préparation (BP) et Factures au
          format certifié PDF & Factur-X.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par N° de pièce, acheteur..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">N° Pièce</th>
                <th className="p-4">Type de Pièce</th>
                <th className="p-4">Acheteur Tiers</th>
                <th className="p-4">Montant TTC</th>
                <th className="p-4 text-right">Téléchargements Certifiés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {documents.length > 0 ? (
                documents.map((doc, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 text-gray-600 font-medium">
                      {doc.date || "Récemment"}
                    </td>
                    <td className="p-4 font-bold text-gray-900">{doc.id}</td>
                    <td className="p-4 font-semibold text-gray-700">
                      {doc.type || "Facture"}
                    </td>
                    <td className="p-4 text-gray-800 font-bold">
                      {doc.buyerName || "Acheteur"}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {Number(doc.amount || 0).toFixed(2)} €
                    </td>
                    <td className="p-4 text-right space-x-2 flex items-center justify-end">
                      <button
                        onClick={() => handleDownloadPdf(doc)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="Télécharger au format PDF certifié"
                      >
                        <Download size={14} />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => handleDownloadFacturX(doc)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="Télécharger la facture dématérialisée au format Factur-X XML"
                      >
                        <FileCode size={14} />
                        <span>Factur-X</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-gray-400 italic"
                  >
                    Aucun document comptable archivé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
