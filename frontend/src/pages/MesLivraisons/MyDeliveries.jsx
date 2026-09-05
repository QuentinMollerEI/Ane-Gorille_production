import React, { useState, useEffect } from "react";
import {
  Truck,
  ShieldCheck,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";

// Importation des sous-compartiments d'onglet conformément au principe SRP
import DeliveryFilters from "./components/DeliveryFilters";
import DeliveryCard from "./components/DeliveryCard";
import SignatureModal from "./components/SignatureModal";

/**
 * 🚚 COMPOSANT PRINCIPAL : MyDeliveries.jsx
 * Responsabilité unique : Orchestrer l'espace d'émargement et de suivi de livraison (Livreur) [cite: 50, 74].
 * Écoute en temps réel les colis chargés assignés à ce livreur pour piloter la distribution
 * de circuit court de proximité et l'émargement numérique légal des acheteurs [cite: 10, 11].
 */
export default function MyDeliveries() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États locaux de filtrage et d'interface
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, TO_DELIVER, DELIVERED
  const [expandedDeliveries, setExpandedDeliveries] = useState({});
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 🔄 ÉCOUTE EN TEMPS RÉEL : Récupérer les sous-commandes de ce livreur (EXPEDIE ou LIVRE)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Requête filtrée sur l'UID du livreur pour les colis en transit et livrés
    const q = query(
      collection(db, "sub_orders"),
      where("deliveryDriverId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation logistique :", err);
        setError("Impossible de synchroniser vos livraisons en temps réel.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // =========================================================================
  // ✍️ ACTION : Enregistrer l'émargement client et clore la commande (LIVRE)
  // =========================================================================
  const handleConfirmDeliveryRemittance = async (signatureData) => {
    if (!selectedDelivery) return;

    setProcessing(true);
    try {
      const batch = writeBatch(db);

      // Mettre à jour l'intégralité des sous-commandes associées à cette escale client
      selectedDelivery.subOrders.forEach((sub) => {
        const docRef = doc(db, "sub_orders", sub.id);
        batch.update(docRef, {
          status: "LIVRE",
          deliveredAt: new Date(),
          recipientName: signatureData.recipientName,
          recipientRole: signatureData.recipientRole,
          signatureBase64: signatureData.signatureBase64, // Archivage de l'image de signature légale [cite: 4, 10]
        });
      });

      await batch.commit();

      setIsSignatureOpen(false);
      setSelectedDelivery(null);
      alert(
        `🎉 Livraison validée ! L'émargement pour "${selectedDelivery.billingName}" a été correctement enregistré.`,
      );
    } catch (err) {
      console.error("Erreur d'émargement logistique :", err);
      alert(
        "Une erreur technique est survenue lors de l'enregistrement de l'émargement.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // Permet de déplier / replier les détails d'une escale
  const toggleDeliveryExpand = (buyerId) => {
    setExpandedDeliveries((prev) => ({
      ...prev,
      [buyerId]: !prev[buyerId],
    }));
  };

  const handleOpenSignature = (delivery) => {
    setSelectedDelivery(delivery);
    setIsSignatureOpen(true);
  };

  // =========================================================================
  // 📈 LOGIQUE MÉTIER : Regroupement par client et calcul de complétude
  // =========================================================================

  // Regroupement de l'ensemble des sub-orders par Acheteur Unique (Escale de livraison)
  const deliveryGroupsMap = {};

  subOrders.forEach((sub) => {
    const bId = sub.buyerId || "ID_ACHETEUR_TEST";
    if (!deliveryGroupsMap[bId]) {
      deliveryGroupsMap[bId] = {
        buyerId: bId,
        buyerName: sub.buyerName || "Acheteur Pro/Public",
        buyerProfile: sub.buyerProfile || "B2B",
        deliveryAddress: sub.deliveryAddress || "Adresse de livraison",
        billingName: sub.billingName || sub.buyerName || "Acheteur",
        billingEmail: sub.billingEmail || "",
        engagementNumber: sub.engagementNumber || null,
        subOrders: [],

        // Moteur de diagnostic de complétude
        status: "LIVRE", // Devient EXPEDIE si au moins une sub_order de l'escale n'est pas encore livrée
        loadedCount: 0,
        totalCount: 0,
        isComplete: true,
        pendingProducers: [],
      };
    }

    // Ajout à la liste
    deliveryGroupsMap[bId].subOrders.push(sub);

    // Logique de statut de l'escale
    if (sub.status !== "LIVRE") {
      deliveryGroupsMap[bId].status = "EXPEDIE";
    }

    // Gestion de la complétude
    deliveryGroupsMap[bId].totalCount += 1;
    if (
      sub.status === "EXPEDIE" ||
      sub.status === "EN_COURS_DE_LIVRAISON" ||
      sub.status === "LIVRE"
    ) {
      deliveryGroupsMap[bId].loadedCount += 1;
    } else {
      deliveryGroupsMap[bId].isComplete = false;
      const prodName = sub.producerName || "Maraîcher inconnu";
      if (!deliveryGroupsMap[bId].pendingProducers.includes(prodName)) {
        deliveryGroupsMap[bId].pendingProducers.push(prodName);
      }
    }
  });

  const allDeliveries = Object.values(deliveryGroupsMap);

  // Application des filtres d'onglets et de recherche
  const filteredDeliveries = allDeliveries.filter((delivery) => {
    // A. Filtre d'onglets de statut
    if (activeFilter === "TO_DELIVER" && delivery.status === "LIVRE")
      return false;
    if (activeFilter === "DELIVERED" && delivery.status !== "LIVRE")
      return false;

    // B. Filtre de recherche textuelle
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchClient = (delivery.billingName || "")
        .toLowerCase()
        .includes(q);
      const matchAddress = (delivery.deliveryAddress || "")
        .toLowerCase()
        .includes(q);
      const matchId = delivery.buyerId.toLowerCase().includes(q);
      const matchItems = delivery.subOrders.some((sub) =>
        sub.items?.some((item) =>
          (item.title || item.name || "").toLowerCase().includes(q),
        ),
      );
      return matchClient || matchAddress || matchId || matchItems;
    }

    return true;
  });

  // Calcul des badges de filtres
  const counts = {
    all: allDeliveries.length,
    toDeliver: allDeliveries.filter((d) => d.status !== "LIVRE").length,
    delivered: allDeliveries.filter((d) => d.status === "LIVRE").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Synchronisation de vos tournées d'émargement...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* En-tête principal de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Truck className="text-green-700" size={28} />
            Mes Livraisons & Émargements
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gérez vos remises de colis en direct chez vos acheteurs : effectuez
            le pointage de contrôle, imprimez les bons de livraison et
            recueillez les signatures de conformité [cite: 10, 11].
          </p>
        </div>
        <div className="bg-green-50 text-green-800 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck size={16} className="text-green-700" />
          <span>Contrôle & Traçabilité Active (HACCP)</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Barre de Recherche et Filtres par Onglet */}
      <DeliveryFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        counts={counts}
      />

      {/* Liste des escales clients de livraison */}
      {filteredDeliveries.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <ShoppingBag
            className="mx-auto text-gray-300 mb-4 stroke-1"
            size={48}
          />
          <p className="text-gray-500 font-extrabold text-sm">
            Aucune livraison en cours dans cette catégorie.
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Chargez vos colis maraîchers à la Feuille de Route pour faire
            apparaître vos escales clients [cite: 10, 11].
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.buyerId}
              delivery={delivery}
              isExpanded={!!expandedDeliveries[delivery.buyerId]}
              onToggle={() => toggleDeliveryExpand(delivery.buyerId)}
              onOpenSignatureModal={handleOpenSignature}
            />
          ))}
        </div>
      )}

      {/* Modal interactif d'Émargement par signature tactile */}
      <SignatureModal
        isOpen={isSignatureOpen}
        onClose={() => {
          setIsSignatureOpen(false);
          setSelectedDelivery(null);
        }}
        onConfirm={handleConfirmDeliveryRemittance}
        clientName={selectedDelivery?.billingName || "Établissement Client"}
        processing={processing}
      />
    </div>
  );
}
