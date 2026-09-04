import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Package,
  Printer,
  ArrowRight,
  Clipboard,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle2,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";

/**
 * 🧑‍🌾 COMPOSANT : OrderPreparation.jsx
 * Espace opérationnel de préparation des commandes (Bons de Préparation) pour le maraîcher.
 * Se connecte en temps réel à Firestore sur la collection 'sub_orders' pour récupérer uniquement
 * les sous-commandes affectées à ce producteur connecté.
 */
export default function OrderPreparation() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Onglet de filtre local : 'all', 'A_PREPARER', 'PRET_A_EXPEDIER', 'LIVRE'
  const [activeFilter, setActiveTab] = useState("A_PREPARER");

  // État local pour stocker la saisie des numéros de lots (HACCP) avant validation
  const [batchInputs, setBatchInputs] = useState({});

  // 1. ÉCOUTE TEMPS RÉEL DE FIRESTORE (onSnapshot)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Filtrage par l'ID du producteur connecté pour isoler ses bons de préparation
    const q = query(
      collection(db, "sub_orders"),
      where("producerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Trier du plus récent au plus ancien
        ordersData.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setSubOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error(
          "Erreur de synchronisation des bons de préparation :",
          err,
        );
        setError("Impossible d'accéder aux données en temps réel.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // 2. FILTRAGE DES BONS DE PRÉPARATION CÔTÉ CLIENT
  const filteredSubOrders = subOrders.filter((order) => {
    if (activeFilter === "all") return true;
    return order.status === activeFilter;
  });

  // 3. MISE À JOUR DU STATUT (Validation logistique & HACCP)
  const handleReadyForDelivery = async (subOrderId, items) => {
    const lotNumbers = batchInputs[subOrderId] || "";

    // Contrainte sanitaire : Saisie obligatoire du numéro de lot pour assurer la traçabilité HACCP
    if (!lotNumbers.trim()) {
      alert(
        "⚠️ Renseignez obligatoirement le(s) numéro(s) de lot ou heure de récolte (HACCP) pour valider la préparation.",
      );
      return;
    }

    try {
      const subOrderRef = doc(db, "sub_orders", subOrderId);
      await updateDoc(subOrderRef, {
        status: "PRET_A_EXPEDIER",
        batchNumbers: lotNumbers.split(",").map((l) => l.trim()), // Découpage des lots saisis par virgule
        preparedAt: new Date(),
      });

      // Vider le champ de saisie du lot pour ce bon
      setBatchInputs((prev) => {
        const copy = { ...prev };
        delete copy[subOrderId];
        return copy;
      });

      alert(
        "🎉 Le Bon de Préparation a été validé ! Le livreur est notifié pour le ramassage.",
      );
    } catch (err) {
      console.error(
        "Erreur lors de la validation du bon de préparation :",
        err,
      );
      alert("Une erreur technique est survenue lors de la mise à jour.");
    }
  };

  const handleInputChange = (subOrderId, val) => {
    setBatchInputs((prev) => ({
      ...prev,
      [subOrderId]: val,
    }));
  };

  // 4. IMPRESSION PHYSIQUE DU BON DE PRÉPARATION (Logistique en hangar)
  const handlePrint = (subOrder) => {
    const printWindow = window.open("", "_blank");
    const itemsHtml = subOrder.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; font-weight: bold;">${item.name || item.title}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity || item.qty} ${item.unit || "kg"}</td>
        <td style="padding: 12px; text-align: right;">${(item.priceHT || 0).toFixed(2)} € HT</td>
        <td style="padding: 12px; border-left: 1px dashed #ccc; width: 150px;"></td>
      </tr>
    `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bon de Préparation - ${subOrder.subOrderId || subOrder.id}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #15803d; padding-bottom: 20px; }
            .meta { margin: 20px 0; display: grid; grid-cols-2; gap: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th { background-color: #f4f4f4; padding: 12px; text-align: left; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #777; border-t: 1px solid #eee; pt: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div>
              <h1 style="color: #15803d; margin: 0;">Âne & Gorille</h1>
              <small>L'Énergie Alimentaire en Circuit Court</small>
            </div>
            <div style="text-align: right;">
              <h2>BON DE PRÉPARATION</h2>
              <strong>N° ${subOrder.subOrderId || subOrder.id}</strong>
            </div>
          </div>
          <div class="meta">
            <div>
              <p><strong>Maraîcher :</strong> ${subOrder.producerName}</p>
              <p><strong>Destinataire (Acheteur) :</strong> ${subOrder.buyerName}</p>
            </div>
            <div>
              <p><strong>Date Commande :</strong> ${subOrder.createdAt ? new Date(subOrder.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</p>
              <p><strong>Lieu de livraison :</strong> ${subOrder.deliveryAddress || "Point Retrait / Standard"}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produit à récolter</th>
                <th style="text-align: center;">Quantité</th>
                <th style="text-align: right;">Prix unitaire</th>
                <th>Validation Lot (HACCP)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="footer">
            <p>Âne et Gorille SAS • Document logistique d'exploitation maraîchère conforme HACCP</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Synchronisation des bons de préparation...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* En-tête principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <CheckSquare className="text-green-700" size={28} />
            Préparation des Commandes
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gérez vos récoltes journalières, suivez la traçabilité sanitaire de
            vos lots (HACCP) et validez vos colis de livraison.
          </p>
        </div>
        <div className="bg-green-50 text-green-800 border border-green-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <Award size={16} />
          <span>Producteur Certifié Connecté</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Barre de navigation / filtrage par statut */}
      <div className="flex border-b border-gray-150 space-x-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("A_PREPARER")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeFilter === "A_PREPARER"
              ? "border-green-700 text-green-800"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          🥬 À Récolter / Préparer (
          {subOrders.filter((o) => o.status === "A_PREPARER").length})
        </button>
        <button
          onClick={() => setActiveTab("PRET_A_EXPEDIER")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeFilter === "PRET_A_EXPEDIER"
              ? "border-green-700 text-green-800"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          📦 Prêt pour Expédition (
          {subOrders.filter((o) => o.status === "PRET_A_EXPEDIER").length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeFilter === "all"
              ? "border-green-700 text-green-800"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Tout afficher ({subOrders.length})
        </button>
      </div>

      {/* Grille des Bons de Préparation */}
      {filteredSubOrders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <Package className="mx-auto text-gray-300 mb-4 stroke-1" size={48} />
          <p className="text-gray-500 font-extrabold text-sm">
            Aucun bon de préparation dans cette catégorie.
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Les nouvelles commandes s'afficheront automatiquement en temps réel
            dès qu'un achat sera validé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSubOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white border rounded-3xl p-6 shadow-xs transition-all ${
                order.status === "A_PREPARER"
                  ? "border-gray-250"
                  : "border-green-200 bg-green-50/20"
              }`}
            >
              {/* En-tête de la carte */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-black">
                      #{order.subOrderId || order.id.substring(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        order.status === "A_PREPARER"
                          ? "bg-amber-50 border-amber-200 text-amber-800 animate-pulse"
                          : "bg-green-50 border-green-200 text-green-800"
                      }`}
                    >
                      {order.status === "A_PREPARER"
                        ? "À Préparer"
                        : "Prêt pour le livreur"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 pt-1">
                    <User size={14} className="text-gray-400" />
                    {order.buyerName}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />{" "}
                      {order.createdAt
                        ? new Date(
                            order.createdAt.seconds * 1000,
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />{" "}
                      {order.createdAt
                        ? new Date(
                            order.createdAt.seconds * 1000,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Adresse de livraison */}
                <div className="text-left md:text-right max-w-xs space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider flex items-center md:justify-end gap-1">
                    <MapPin size={12} /> Destination de livraison
                  </p>
                  <p className="text-xs font-medium text-gray-600 leading-snug">
                    {order.deliveryAddress || "Point de distribution central"}
                  </p>
                </div>
              </div>

              {/* Contenu de la commande */}
              <div className="py-4">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mb-2.5">
                  Produits à récolter & conditionner :
                </p>
                <div className="bg-gray-50/70 border border-gray-150 rounded-2xl p-4">
                  <table className="w-full text-left text-xs font-medium text-gray-600">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-400">
                        <th className="pb-2">Produit</th>
                        <th className="pb-2 text-center">Quantité</th>
                        <th className="pb-2 text-right">Réf. Traçabilité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-white/40 transition-colors"
                        >
                          <td className="py-3 font-bold text-gray-900">
                            {item.name || item.title}
                          </td>
                          <td className="py-3 text-center font-extrabold text-green-700">
                            {item.quantity || item.qty} {item.unit || "kg"}
                          </td>
                          <td className="py-3 text-right text-gray-400 text-[10px] font-mono">
                            {item.batchNumber || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section d'action et Saisie HACCP */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pt-4 border-t border-gray-100">
                {/* Condition HACCP de traçabilité des lots agricoles */}
                {order.status === "A_PREPARER" ? (
                  <div className="flex-1 max-w-md space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Saisie de traçabilité HACCP (Obligatoire) *
                    </label>
                    <input
                      type="text"
                      value={batchInputs[order.id] || ""}
                      onChange={(e) =>
                        handleInputChange(order.id, e.target.value)
                      }
                      placeholder="Ex: LOT-2026-REC-01, LOT-2026-REC-02"
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-mono bg-white focus:ring-1 focus:ring-green-500"
                    />
                    <p className="text-[9px] text-gray-400">
                      Indiquez vos numéros de lot ou dates/heures exactes de
                      récolte séparés par des virgules.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-800 bg-green-50/80 px-4 py-3 rounded-2xl border border-green-150 text-xs font-medium max-w-md">
                    <CheckCircle2
                      className="text-green-700 flex-shrink-0"
                      size={16}
                    />
                    <div>
                      <strong>Bons de préparation validé HACCP</strong>
                      <p className="text-[10px] text-green-600 mt-0.5">
                        Lots associés :{" "}
                        <span className="font-mono">
                          {order.batchNumbers?.join(", ") || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Boutons d'impressions et d'envois */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => handlePrint(order)}
                    className="flex items-center justify-center gap-1.5 border border-gray-250 hover:bg-gray-50 text-gray-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer bg-white"
                  >
                    <Printer size={14} />
                    <span>Imprimer Bon</span>
                  </button>

                  {order.status === "A_PREPARER" && (
                    <button
                      onClick={() =>
                        handleReadyForDelivery(order.id, order.items)
                      }
                      className="flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 text-white font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Valider & Prêt</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
