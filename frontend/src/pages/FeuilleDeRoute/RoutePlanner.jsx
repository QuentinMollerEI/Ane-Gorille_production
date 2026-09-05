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
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";

// Importation des sous-compartiments d'onglet conformément au principe SRP
import RouteFilters from "./components/RouteFilters";
import RouteSummary from "./components/RouteSummary";
import PickupLeg from "./components/PickupLeg";
import DeliveryLeg from "./components/DeliveryLeg";

/**
 * 🗺️ COMPOSANT CENTRAL : RoutePlanner.jsx (v3 - Complétude Logistique Intégrée)
 * Responsabilité unique : Orchestrer l'espace logistique de planification des tournées (Livreur) [cite: 50, 74].
 * Écoute en temps réel les sous-commandes maraîchères prêtes pour organiser de façon optimisée,
 * mutualisée et synchronisée la double tournée (ramassage maraîcher ➔ livraison acheteurs) [cite: 10, 11].
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
        batch.update(docRef, {
          status: "EXPEDIE",
          pickedUpAt: new Date(),
          deliveryDriverId: user.uid,
        });
      });

      await batch.commit();
      alert(
        "🟢 Enlèvement confirmé ! Les colis maraîchers ont été chargés dans votre véhicule et sont en route.",
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

  // 2. CONFIRMER LA LIVRAISON : Passe les sous-commandes de l'acheteur au statut LIVRE
  const handleConfirmDelivery = async (buyerId, associatedSubs) => {
    setProcessingId(buyerId);
    try {
      const batch = writeBatch(db);
      associatedSubs.forEach((sub) => {
        const docRef = doc(db, "sub_orders", sub.id);
        batch.update(docRef, {
          status: "LIVRE",
          deliveredAt: new Date(),
        });
      });

      await batch.commit();
      alert(
        "🎉 Livraison validée ! Les légumes de proximité ont été remis en main propre à l'acheteur.",
      );
    } catch (err) {
      console.error("Erreur lors de la validation de la livraison :", err);
      alert(
        "Une erreur technique est survenue lors de la validation de livraison.",
      );
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
    // A. Filtrer par date (si la date de commande est sélectionnée)
    if (selectedDate && sub.createdAt) {
      const subDate = new Date(sub.createdAt.seconds * 1000)
        .toISOString()
        .split("T")[0];
      if (subDate !== selectedDate) return false;
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

  // A. Étape 1 - Tournée de ramassage : Tout ce qui est prêt en Hangar ("PRET_A_EXPEDIER")
  const readyForPickupSubs = filteredSubOrders.filter(
    (sub) => sub.status === "PRET_A_EXPEDIER",
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

  // Regroupement par acheteur unique pour mutualiser le point de dépôt (un seul arrêt par établissement)
  const deliveryGroupsMap = {};
  readyForDeliverySubs.forEach((sub) => {
    const bId = sub.buyerId || "ID_ACHETEUR_TEST";

    // Calcul de la complétude de la commande multi-producteur en temps réel :
    // On va chercher dans tous les bons d'aujourd'hui pour cet acheteur s'il y en a qui ne sont pas encore chargés.
    const allSubsForThisBuyerToday = filteredSubOrders.filter(
      (s) => s.buyerId === bId,
    );
    const missingSubs = allSubsForThisBuyerToday.filter(
      (s) => s.status === "A_PREPARER" || s.status === "PRET_A_EXPEDIER",
    );
    const isComplete = missingSubs.length === 0;
    const missingProducers = missingSubs.map(
      (s) => s.producerName || "Producteur inconnu",
    );

    if (!deliveryGroupsMap[bId]) {
      deliveryGroupsMap[bId] = {
        buyerId: bId,
        buyerName: sub.buyerName || "Acheteur Pro/Public",
        buyerProfile: sub.buyerProfile || "B2B",
        deliveryAddress: sub.deliveryAddress || "Point de distribution central",
        billingName: sub.billingName || sub.buyerName || "Acheteur",
        billingEmail: sub.billingEmail || "",
        engagementNumber: sub.engagementNumber || null,
        isComplete: isComplete,
        missingProducers: [...new Set(missingProducers)], // dédoublonnage des producteurs
        totalColisToday: allSubsForThisBuyerToday.length,
        colisLoaded: allSubsForThisBuyerToday.length - missingSubs.length,
        subOrders: [],
      };
    }
    deliveryGroupsMap[bId].subOrders.push(sub);
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

    // Calcul de l'indice de mutualisation :
    // Plus il y a de sous-commandes regroupées par arrêt (Maraîcher ou Acheteur), plus le taux est élevé.
    let mutualizationRate = 0;
    const totalStops = totalProducers + totalBuyers;
    if (totalStops > 0 && totalSubOrders > 0) {
      // Formule d'optimisation : (1 - (Stops uniques / Total commandes individuelles)) * 100
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
            validez les livraisons groupées [cite: 10, 11].
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
              préparés et étiquetés HACCP [cite: 10, 11].
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
              établissements professionnels (B2B) [cite: 12].
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
