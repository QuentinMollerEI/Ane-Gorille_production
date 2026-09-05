import React, { useState, useEffect } from "react";
import {
  Landmark,
  FileSpreadsheet,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";

import AccountingFilters from "./components/AccountingFilters";
import AccountingTotals from "./components/AccountingTotals";
import InvoiceCard from "./components/InvoiceCard";

export default function PiecesComptables() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, "orders"), where("buyerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setInvoices(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation des pieces comptables :", err);
        setError(
          "Impossible d'accéder à vos documents comptables en temps réel.",
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredInvoices = invoices.filter((invoice) => {
    if (selectedType === "B2G" && invoice.buyerProfile !== "B2G") return false;
    if (selectedType === "B2B" && invoice.buyerProfile === "B2G") return false;

    if (invoice.createdAt) {
      const invoiceDate = new Date(invoice.createdAt.seconds * 1000);
      if (dateRange.start && invoiceDate < new Date(dateRange.start))
        return false;
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (invoiceDate > endDate) return false;
      }
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchId =
        invoice.id.toLowerCase().includes(q) ||
        (invoice.orderId && invoice.orderId.toLowerCase().includes(q));
      const matchName = (invoice.billingName || "").toLowerCase().includes(q);
      const matchSiret = (invoice.siretBuyer || "").toLowerCase().includes(q);
      const matchEngagement = (invoice.engagementNumber || "")
        .toLowerCase()
        .includes(q);
      return matchId || matchName || matchSiret || matchEngagement;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Sécurisation et archivage de vos factures...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Landmark className="text-green-700" size={28} />
            Espace Comptabilité & Dépôt Chorus Pro
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Consultez, analysez et exportez vos factures immuables de circuit
            court au format réglementaire Factur-X et pilotez vos transmissions
            Chorus Pro (B2G) et Billie (B2B).
          </p>
        </div>
        <div className="bg-green-50 text-green-800 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck size={16} className="text-green-700" />
          <span>Archivage Fiscal Certifié LME</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <AccountingTotals invoices={filteredInvoices} />

      <AccountingFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <FileSpreadsheet
            className="mx-auto text-gray-300 mb-4 stroke-1"
            size={48}
          />
          <p className="text-gray-500 font-extrabold text-sm">
            Aucune pièce comptable disponible.
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Vos factures réglementaires s'archivent ici dès validation de vos
            paniers de proximité.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              isExpanded={expandedInvoiceId === invoice.id}
              onToggle={() =>
                setExpandedInvoiceId(
                  expandedInvoiceId === invoice.id ? null : invoice.id,
                )
              }
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
