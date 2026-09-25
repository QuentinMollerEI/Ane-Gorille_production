import { useState, useEffect } from "react";
import { db } from "../../../config/firebase.js";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext.jsx";

export function useOrderTracking() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const role = profile?.role || "acheteur_prive";
    let q;

    if (role === "producteur" || role === "artisan") {
      q = query(
        collection(db, "sub_orders"),
        where("producerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "orders"),
        where("buyerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setOrders(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de chargement des commandes :", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, profile]);

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === "ALL" || ord.status === statusFilter;
    const matchesSearch =
      searchTerm.trim() === "" ||
      (ord.orderId && ord.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ord.buyerName && ord.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ord.producerName && ord.producerName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return {
    orders: filteredOrders,
    loading,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    userRole: profile?.role || "acheteur_prive"
  };
}

export default useOrderTracking;