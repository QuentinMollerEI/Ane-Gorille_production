import { useState, useEffect } from "react";
import { db } from "../../../config/firebase.js";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext.jsx";

export function useAccountingDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docsList = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          docsList.push({
            id: docSnap.id,
            docType: "FACTURE",
            number: `FACT-${data.orderId}`,
            date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString("fr-FR") : "-",
            amountTTC: data.totals?.grandTotalTTC || 0,
            rawOrder: data
          });
          docsList.push({
            id: `${docSnap.id}-BC`,
            docType: "BON_COMMANDE",
            number: `BC-${data.orderId}`,
            date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString("fr-FR") : "-",
            amountTTC: data.totals?.grandTotalTTC || 0,
            rawOrder: data
          });
        });
        setDocuments(docsList);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur pièces comptables :", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredDocs = documents.filter((doc) => {
    const matchesType = docTypeFilter === "ALL" || doc.docType === docTypeFilter;
    const matchesQuery =
      searchQuery.trim() === "" ||
      doc.number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  return {
    documents: filteredDocs,
    loading,
    docTypeFilter,
    setDocTypeFilter,
    searchQuery,
    setSearchQuery
  };
}

export default useAccountingDocuments;