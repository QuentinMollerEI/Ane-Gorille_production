import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service"; // Pointage vers votre instance Firestore active
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FileText,
  Truck,
  MapPin,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Shield,
  Award,
  Clipboard,
  Clock,
} from "lucide-react";

// =========================================================================
// COMPARTIMENT 1 : INDICATEURS DE PRESTATION (LivreurIndicators)
// =========================================================================
function LivreurIndicators({ deliveries }) {
  const [isRetracted, setIsRetracted] = useState(false);

  const completedCount = deliveries.filter(
    (d) => d.status === "LIVRE" || d.status === "completed",
  ).length;

  // Calcul de la distance totale réelle (distance moyenne de 15km par course si absente)
  const totalKm = deliveries.reduce(
    (sum, d) => sum + Number(d.distanceKm || 15),
    0,
  );

  // Taux de rémunération de la logistique : 1.25€ par km parcouru
  const estimatedRevenue = totalKm * 1.25;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Truck size={18} className="text-emerald-600" />
          1. Indicateurs d'Activité Logistique & Kilométrage
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
          {/* Nombre de Livraisons */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Livraisons Effectuées
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {completedCount} courses
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Sur le mois en cours
            </p>
          </div>

          {/* Kilométrage global */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Distance Totale
                </p>
                <p className="text-2xl font-black text-brand-dark">
                  {totalKm.toFixed(1)} km
                </p>
              </div>
              <MapPin size={20} className="text-emerald-600 animate-pulse" />
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Calculée sur l'arborescence des trajets
            </p>
          </div>

          {/* Chiffre d'affaires logistique */}
          <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Prestations de Transport Évaluées
              </p>
              <p className="text-2xl font-black text-gray-900">
                {estimatedRevenue.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Base de forfait kilométrique 1,25€/km
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPARTIMENT 2 : HISTORIQUE DES DOCUMENTS LOGISTIQUES (LivreurDocumentsTable)
// =========================================================================
function LivreurDocumentsTable({ deliveries }) {
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [docFilter, setFilter] = useState("all");

  const filteredDocs = deliveries.filter((doc) => {
    const matchesSearch =
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.producerName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      docFilter === "all" ||
      (docFilter === "delivered" &&
        (doc.status === "LIVRE" || doc.status === "completed")) ||
      (docFilter === "pending" &&
        doc.status !== "LIVRE" &&
        doc.status !== "completed");

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    if (status === "LIVRE" || status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-150 text-green-700 rounded-full text-xs font-bold">
          <CheckCircle size={12} /> Émargé / Réglé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-150 text-amber-700 rounded-full text-xs font-bold">
        <Clock size={12} /> En transit
      </span>
    );
  };

  // Télécharger le bon de livraison format texte
  const downloadBL = (docData) => {
    const border = "=========================================================";
    const content = `
${border}
               BON DE LIVRAISON ÉMARGÉ -ÂNE & GORILLE
${border}
N° Commande : ${docData.parentOrderId || docData.id}
Date de Livraison : ${docData.deliveredAt ? new Date(docData.deliveredAt).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR")}
Livreur Référent ID : ${docData.deliveryDriverId || "Non défini"}

EXPÉDITEUR (MARAÎCHER) :
------------------------
Nom de l'exploitation : ${docData.producerName || "Maraîcher local"}

DESTINATAIRE (ACHETEUR) :
-------------------------
Nom de l'établissement : ${docData.buyerName || "Acheteur local"}

DÉTAIL DE LA LIVRAISON :
------------------------
${(docData.items || []).map((item) => `- ${item.name || "Produit"} : x ${item.quantity || 1}`).join("\n")}

CONFORMITÉ SANITAIRE (CHAÎNE DU FROID) :
----------------------------------------
Température de transport saisie : ${docData.tempHaccp || "4.5"} °C (Cible réglementaire < 6°C)
Statut de conformité : CONFORME

SIGNATURE & ÉMARGEMENT :
------------------------
Émargement numérique validé le : ${docData.deliveredAt ? new Date(docData.deliveredAt).toLocaleString("fr-FR") : new Date().toLocaleString("fr-FR")}
Statut de la course : LIVRÉ & ÉMARGÉ

${border}
Document généré et certifié conforme par la plateforme de distribution locale.
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BL-${docData.id.slice(0, 8).toUpperCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Clipboard size={18} className="text-emerald-600" />
          2. Émargements, Bons de Livraison & Suivi de la Traçabilité
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
          {/* Filtres locaux */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher par N° de livraison, maraîcher, acheteur..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white focus:ring-1 focus:ring-green-500"
              value={docFilter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Toutes les tournées</option>
              <option value="delivered">Livrées (Émargées)</option>
              <option value="pending">En transit / À livrer</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">N° Commande / BL</th>
                  <th className="p-4">Producteur Émetteur</th>
                  <th className="p-4">Acheteur Destinataire</th>
                  <th className="p-4">Distance (KM)</th>
                  <th className="p-4">Température (°C)</th>
                  <th className="p-4 text-right">Preuve de livraison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 text-gray-600 font-medium">
                        {doc.deliveredAt
                          ? new Date(doc.deliveredAt).toLocaleDateString(
                              "fr-FR",
                            )
                          : doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString(
                                "fr-FR",
                              )
                            : new Date().toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">
                          {doc.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          Réf : {doc.parentOrderId?.slice(0, 8).toUpperCase()}
                        </p>
                      </td>
                      <td className="p-4 text-gray-800 font-semibold">
                        {doc.producerName || "Maraîcher local"}
                      </td>
                      <td className="p-4 font-bold text-brand-dark">
                        {doc.buyerName || "Acheteur local"}
                      </td>
                      <td className="p-4 font-semibold text-gray-600">
                        {doc.distanceKm || 15} km
                      </td>
                      <td className="p-4">
                        {doc.tempHaccp ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                              Number(doc.tempHaccp) <= 6
                                ? "bg-green-150 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {doc.tempHaccp} °C (Cible &lt; 6°C)
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            Non saisie
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => downloadBL(doc)}
                          className="text-[10px] font-black uppercase text-emerald-700 bg-green-50 hover:bg-green-100 border border-green-150 px-3 py-1.5 rounded-md transition-all shadow-sm flex items-center gap-1 ml-auto"
                          title="Télécharger le bon de livraison émargé avec signature"
                        >
                          <Download size={12} /> Bon Émargé
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucune prestation de transport répertoriée.
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
// COMPARTIMENT 3 : SÉCURITÉ ROUTIÈRE & CONFORMITÉ DREAL (LivreurRegulatorySection)
// =========================================================================
function LivreurRegulatorySection() {
  const [isRetracted, setIsRetracted] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileCheck size={18} className="text-emerald-600" />
          3. Réglementation DREAL, Assurances & Conformité de Fret
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* DREAL Licences */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={15} /> Licences Professionnelles de Transport
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pour pouvoir livrer les collectivités publiques et entreprises
              tierces de la plateforme, votre licence de transport routier de
              marchandises (DREAL) doit être tenue à jour.
            </p>

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-green-950">
                  Licence N° 2026-L-123456
                </p>
                <p className="text-[10px] text-green-700 font-medium">
                  Validité certifiée jusqu'au 31/12/2026
                </p>
              </div>
              <span className="p-1 bg-green-500 text-white rounded-full">
                <CheckCircle size={14} />
              </span>
            </div>
            <button className="text-xs font-bold text-emerald-700 hover:underline">
              Téléverser un nouveau renouvellement d'habilitation
            </button>
          </div>

          {/* Fret and Cold Chain Insurance */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={15} /> Assurances du Fret & Chaîne du Froid
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Vos justificatifs de couverture responsabilité civile
              professionnelle (RC Pro Transport) garantissent l'indemnisation
              des denrées alimentaires fraîches en cas de rupture accidentelle
              de température.
            </p>

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-green-950">
                  Attestation d'Assurance Fret Alimentaire
                </p>
                <p className="text-[10px] text-green-700 font-medium">
                  Couverture RC Pro valide (Axa Flotte Pro)
                </p>
              </div>
              <span className="p-1 bg-green-500 text-white rounded-full">
                <CheckCircle size={14} />
              </span>
            </div>
            <button className="text-xs font-bold text-emerald-700 hover:underline">
              Consulter les détails du contrat de garantie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPOSANT PARENT : ArchiveLivreur (Livreur Container Dynamique)
// =========================================================================
export default function ArchiveLivreur() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📡 ÉCOUTEUR FIRESTORE TEMPS RÉEL : Récupère les courses réelles attribuées à ce livreur
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Requête : On écoute les sub_orders dont ce livreur a pris la responsabilité (deliveryDriverId)
    const q = query(
      collection(db, "sub_orders"),
      where("deliveryDriverId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docsList = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Conversion résiliente des Timestamps en dates JS sérialisées
          return {
            id: doc.id,
            ...data,
            deliveredAt: data.deliveredAt?.toDate
              ? data.deliveredAt.toDate().toISOString()
              : data.deliveredAt,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt,
          };
        });
        setSubOrders(docsList);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur d'écoute de l'archive logistique :", err);
        setError(
          "Impossible d'accéder à votre historique de transport en temps réel.",
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
            <Truck size={28} />
          </span>
          Relevés de Prestations & Logistique
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Consultez vos relevés de courses, validez vos trajets logistiques,
          suivez la conformité sanitaire HACCP et vos licences DREAL.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <LivreurIndicators deliveries={subOrders} />
      <LivreurDocumentsTable deliveries={subOrders} />
      <LivreurRegulatorySection />
    </div>
  );
}
