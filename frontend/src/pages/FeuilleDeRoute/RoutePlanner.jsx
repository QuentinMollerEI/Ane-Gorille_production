import React, { useState, useEffect } from "react";
import {
  Package,
  ShieldCheck,
  AlertCircle,
  Map,
  RefreshCw,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";
import { DocumentWorkflowService } from "../../services/documentWorkflowService";

// Importation des sous-compartiments d'onglet conformément au principe SRP
import RouteFilters from "./components/RouteFilters";
import RouteSummary from "./components/RouteSummary";
import PickupLeg from "./components/PickupLeg";
import DeliveryLeg from "./components/DeliveryLeg";

/**
 * UTILITAIRE DE FORMATAGE DE DATE ULTRA-RÉSILIENT
 * Convertit tout format de date (Timestamp Firestore, brut, Date JS, String) en AAAA-MM-JJ sans jamais crasher
 */
const getFormattedDate = (createdAt) => {
  if (!createdAt) return null;

  // 1. Si c'est un Timestamp Firestore réel (avec sa méthode .toDate)
  if (typeof createdAt.toDate === "function") {
    try {
      return createdAt.toDate().toISOString().split("T")[0];
    } catch (e) {
      return null;
    }
  }

  // 2. Si c'est un Timestamp Firestore sérialisé au format brut {seconds, nanoseconds}
  if (createdAt.seconds !== undefined && createdAt.seconds !== null) {
    try {
      return new Date(createdAt.seconds * 1000).toISOString().split("T")[0];
    } catch (e) {
      return null;
    }
  }

  // 3. Si c'est déjà une chaîne de caractères, un nombre (timestamp ms), ou un objet Date
  try {
    const parsed = new Date(createdAt);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch (e) {
    return null;
  }

  return null;
};

/**
 * 🗺️ COMPOSANT CENTRAL : RoutePlanner.jsx (v4 - Complétude Logistique Synchronisée)
 * Responsabilité unique : Orchestrer l'espace logistique de planification des tournées (Livreur).
 * Écoute en temps réel les sous-commandes maraîchères prêtes pour organiser de façon optimisée,
 * mutualisée et synchronisée la double tournée (ramassage maraîcher ➔ livraison acheteurs).
 * Calcule en direct la complétude des commandes multi-producteurs pour éviter les erreurs de livraison partielle.
 */
export default function RoutePlanner() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États locaux de filtrage et d'interface
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [processingId, setProcessingId] = useState(null);

  // 🔄 ÉCOUTE EN TEMPS RÉEL : Récupérer TOUTES les sous-commandes logistiques actives de la marketplace
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Requête globale des sous-commandes logistiques (pour livreurs & administrateurs)
    const q = query(collection(db, "sub_orders"));
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
        setError("Impossible d'accéder aux données logistiques en temps réel.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // =========================================================================
  // ⚡ ACTIONS LOGISTIQUES : Transitions d'États Logistiques (Confiance Serveur)
  // =========================================================================

  // 1. CONFIRMER L'ENLÈVEMENT : Passe les sous-commandes du maraîcher au statut EXPEDIE
  const handleConfirmPickup = async (producerId, associatedSubs) => {
    setProcessingId(producerId);
    try {
      const batch = writeBatch(db);
      associatedSubs.forEach((sub) => {
        const docRef = doc(db, "sub_orders", sub.id);
        // Écrit à la fois carrierId et deliveryDriverId pour garantir que tout autre composant s'y retrouve
        batch.update(docRef, {
          status: "EXPEDIE",
          pickedUpAt: new Date(),
          carrierId: user.uid,
          carrierName: user.displayName || "Livreur Âne & Gorille",
          deliveryDriverId: user.uid,
        });

        if (sub.parentOrderId) {
          const parentRef = doc(db, "orders", sub.parentOrderId);
          batch.update(parentRef, {
            status: "EN_COURS_DE_LIVRAISON",
            carrierId: user.uid,
            carrierName: user.displayName || "Livreur Âne & Gorille",
          });
        }
      });

      await batch.commit();
      alert(
        "🟢 Enlèvement confirmé ! Les colis maraîchers ont été chargés et sont en route.",
      );
    } catch (err) {
      console.error("Erreur lors de la validation de l'enlèvement :", err);
      alert(
        "Une erreur technique est survenue lors de la validation du chargement.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  // 2. CONFIRMER LA LIVRAISON : Appelle le workflow transactionnel officiel pour valider la livraison HACCP et émettre les factures
  const handleConfirmDelivery = async (parentOrderId, tempHaccp, signature) => {
    setProcessingId(parentOrderId);
    try {
      // Appel du service transactionnel officiel (sécurisé fiscalement et HACCP)
      await DocumentWorkflowService.validateDelivery(
        parentOrderId,
        tempHaccp,
        signature || "EMARGEMENT_NUMERIQUE_OK",
      );
      alert(
        "🎉 Livraison validée avec succès ! Les factures et bons de livraison correspondants ont été émis.",
      );
    } catch (err) {
      console.error("Erreur lors de la validation de la livraison :", err);
      alert("Erreur de validation : " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================================
  // 📈 LOGIQUE MÉTIER : Filtrage, Mutualisation & Regroupements
  // =========================================================================

  // 1. Détermination de la commune/département de livraison pour extraire les secteurs d'activité uniques
  const sectors = [
    ...new Set(
      subOrders
        .map((sub) =>
          sub.deliveryAddress
            ? sub.deliveryAddress.split(",").pop()?.trim()
            : null,
        )
        .filter(Boolean),
    ),
  ];

  // 2. Application des filtres combinés sur l'ensemble de la base logistique active
  const filteredSubOrders = subOrders.filter((sub) => {
    // A. Filtrer par date (si la date de commande est sélectionnée) - Utilisation du helper sécurisé
    if (selectedDate) {
      const subDate = getFormattedDate(sub.createdAt);
      // N'applique le filtre que si le document a une date de création pour éviter de masquer les documents en cours de sauvegarde local
      if (subDate && subDate !== selectedDate) return false;
    }

    // B. Filtrer par secteur logistique
    if (selectedSector !== "ALL") {
      const subSector = sub.deliveryAddress
        ? sub.deliveryAddress.split(",").pop()?.trim()
        : "";
      if (subSector !== selectedSector) return false;
    }

    // C. Filtrer par barre de recherche textuelle (Producteur, Acheteur, etc.)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchProducer = (sub.producerName || "").toLowerCase().includes(q);
      const matchBuyer = (sub.buyerName || "").toLowerCase().includes(q);
      const matchAddress = (sub.deliveryAddress || "")
        .toLowerCase()
        .includes(q);
      const matchId =
        sub.id.toLowerCase().includes(q) ||
        (sub.subOrderId && sub.subOrderId.toLowerCase().includes(q));
      return matchProducer || matchBuyer || matchAddress || matchId;
    }
    return true;
  });

  // 3. SEGREGATION DES FLUX DE TOURNÉE (Logique SRP de regroupement)

  // A. Étape 1 - Tournée de ramassage : Tout ce qui est prêt en Hangar ("A_RAMASSER" ou "PRET_A_EXPEDIER")
  const readyForPickupSubs = filteredSubOrders.filter(
    (sub) => sub.status === "A_RAMASSER" || sub.status === "PRET_A_EXPEDIER",
  );

  // Regroupement par producteur unique pour mutualiser le point d'enlèvement (une seule visite par maraîcher)
  const pickupGroupsMap = {};
  readyForPickupSubs.forEach((sub) => {
    const pId = sub.producerId || "ID_PRODUCTEUR_TEST";
    if (!pickupGroupsMap[pId]) {
      pickupGroupsMap[pId] = {
        producerId: pId,
        producerName: sub.producerName || "Producteur local",
        producerAddress: sub.producerAddress || "Adresse de l'exploitation",
        producerPhone: sub.producerPhone || null,
        subOrders: [],
      };
    }
    pickupGroupsMap[pId].subOrders.push(sub);
  });
  const pickups = Object.values(pickupGroupsMap);

  // B. Étape 2 - Tournée de livraison : Tout ce qui est en transit ("EXPEDIE" / "EN_COURS_DE_LIVRAISON")
  const readyForDeliverySubs = filteredSubOrders.filter(
    (sub) => sub.status === "EXPEDIE" || sub.status === "EN_COURS_DE_LIVRAISON",
  );

  // Regroupement par commande parente étanche pour éviter de mélanger les paniers de commandes différentes
  const deliveryGroupsMap = {};
  readyForDeliverySubs.forEach((sub) => {
    const pOrderId = sub.parentOrderId || "COMMANDE_SANS_PARENT";

    // Récupérer tous les sous-bons de cette commande pour estimer la complétude de transport
    const allSubsForThisOrder = filteredSubOrders.filter(
      (s) => s.parentOrderId === pOrderId,
    );
    const missingSubs = allSubsForThisOrder.filter(
      (s) =>
        s.status === "A_PREPARER" ||
        s.status === "A_RAMASSER" ||
        s.status === "PRET_A_EXPEDIER",
    );
    const isComplete = missingSubs.length === 0;
    const missingProducers = missingSubs.map(
      (s) => s.producerName || "Producteur inconnu",
    );

    if (!deliveryGroupsMap[pOrderId]) {
      deliveryGroupsMap[pOrderId] = {
        parentOrderId: pOrderId,
        buyerId: sub.buyerId || "ID_ACHETEUR_TEST",
        buyerName: sub.buyerName || "Acheteur Pro/Public",
        buyerProfile: sub.buyerProfile || "B2B",
        deliveryAddress: sub.deliveryAddress || "Point de distribution central",
        buyerPhone: sub.buyerPhone || null,
        isComplete: isComplete,
        missingProducers: [...new Set(missingProducers)],
        totalColisToday: allSubsForThisOrder.length,
        colisLoaded: allSubsForThisOrder.length - missingSubs.length,
        subOrders: [],
      };
    }
    deliveryGroupsMap[pOrderId].subOrders.push(sub);
  });
  const deliveries = Object.values(deliveryGroupsMap);

  // 4. STATISTIQUES GLOBALISÉES & CALCUL DE MUTUALISATION LOGISTIQUE
  const calculateStats = () => {
    const totalSubOrders = filteredSubOrders.length;
    const totalProducers = pickups.length;
    const totalBuyers = deliveries.length;

    // Calcul de la quantité totale de colis en transit
    let totalQty = 0;
    filteredSubOrders.forEach((sub) => {
      sub.items?.forEach((item) => {
        totalQty += Number(item.quantity || item.qty || 0);
      });
    });

    // Calcul de l'indice de mutualisation
    let mutualizationRate = 0;
    const totalStops = totalProducers + totalBuyers;
    if (totalStops > 0 && totalSubOrders > 0) {
      mutualizationRate = Math.max(0, (1 - totalStops / totalSubOrders) * 100);
    }

    return {
      totalSubOrders,
      totalProducers,
      totalBuyers,
      totalQty,
      mutualizationRate,
      totalPickupItems: readyForPickupSubs.length,
      totalOrders: readyForDeliverySubs.length,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Calcul de la feuille de route mutualisée...
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
            <Map className="text-green-700" size={28} />
            Feuille de Route Logistique
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Optimisez et pilotez votre double-tournée d'exploitation : ramassez
            les récoltes prêtes chez les maraîchers, chargez votre véhicule, et
            validez les livraisons groupées.
          </p>
        </div>
        <div className="bg-green-50 text-green-800 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck size={16} className="text-green-700" />
          <span>Espace Logistique Connecté</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* 📊 Section 1 : Indicateurs logistiques & Taux de Mutualisation */}
      <RouteSummary stats={stats} />

      {/* 🔍 Section 2 : Filtres intelligents & Moteur de Recherche */}
      <RouteFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSector={selectedSector}
        setSelectedSector={setSelectedSector}
        sectors={sectors}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      {/* 🚚 Section 3 : Les deux phases de la double-tournée mutualisée */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Colonne Gauche : Tournée de Ramassage */}
        <div className="bg-gray-50/50 border border-gray-250 rounded-3xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-sm">
              🌾 Points de Collecte
            </h3>
            <p className="text-[10px] text-gray-400">
              Visitez les exploitations partenaires pour charger les colis déjà
              préparés et étiquetés HACCP.
            </p>
          </div>
          <PickupLeg
            pickups={pickups}
            onConfirmPickup={handleConfirmPickup}
            processingId={processingId}
          />
        </div>

        {/* Colonne Droite : Tournée de Livraison */}
        <div className="bg-gray-50/50 border border-gray-250 rounded-3xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-sm">
              🚚 Points de Distribution
            </h3>
            <p className="text-[10px] text-gray-400">
              Livrez les marchandises groupées aux collectivités (B2G) et
              établissements professionnels (B2B).
            </p>
          </div>
          <DeliveryLeg
            deliveries={deliveries}
            onConfirmDelivery={handleConfirmDelivery}
            processingId={processingId}
          />
        </div>
      </div>
    </div>
  );
}
