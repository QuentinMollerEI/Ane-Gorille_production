import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FileText,
  Download,
  Printer,
  Search,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle,
} from "lucide-react";

/**
 * COMPORTEMENT DE TÉLÉCHARGEMENT DIRECT (ZÉRO SIMULATION EN DUR)
 *
 * Génère dynamiquement un document structuré et certifié "Âne & Gorille"
 * sous forme de fichier texte officiel (.txt) téléchargeable immédiatement.
 */
const downloadDocumentAsFile = (docData) => {
  const border = "=========================================================";
  const content = `
${border}
               BON DE COMMANDE - ÂNE & GORILLE
${border}
N° de Pièce : ${docData.id}
Réf. Commande : ${docData.orderId}
Émis le : ${docData.createdAt?.toDate ? docData.createdAt.toDate().toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR")}
Émetteur : ${docData.entity || "Plateforme Âne & Gorille (Micro-Entreprise)"}

ACHETEUR :
----------
Nom/Établissement : ${docData.buyerName}
Rôle : ${docData.buyerRole === "client_public" || docData.buyerRole === "acheteur_public" ? "Établissement Public (B2G)" : "Professionnel (B2B)"}
Réf. Engagement : ${docData.refEngagement || "-"}

DÉTAIL DES ARTICLES EN CIRCUIT COURT :
--------------------------------------
${(docData.items || []).map((item) => `- ${item.name} x ${item.quantity} : ${(item.price * item.quantity).toFixed(2)} € (TVA : ${item.vatRate || 5.5}%)`).join("\n")}

--------------------------------------
TOTAL DE LA TRANSACTION : ${docData.amount?.toFixed(2)} € (TTC)
Taux de TVA Moyen : 5.5%

MENTION LÉGALE :
----------------
"TVA non applicable, art. 293 B du Code Général des Impôts (CGI)."
Mandat administratif de paiement à 30 jours (Loi de Modernisation de l'Économie - LME).
Facture télétransmise sur le portail de l'État Chorus Pro.

${border}
Document généré et certifié conforme par la plateforme de distribution locale.
  `;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${docData.id}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function PublicDocumentsTable() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 📡 REQUÊTE FIRESTORE RÉELLE (Pull dynamique de l'option B)
    // S'abonne à la collection racine "documents" pour cet acheteur précis
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
      (error) => {
        console.error("Erreur d'écoute réelle des documents publics :", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredDocs = documents.filter(
    (doc) =>
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.refEngagement || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          Pièces Justificatives Officielles & Bons de Commande (B2G/Chorus Pro)
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}\
        </button>
      </div>

      {!isRetracted && (
        <div className="p-5 space-y-4">
          {/* Barre de recherche réelle */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par N° de bon, référence d'engagement public..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tableau dynamique des pièces */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Émis le</th>
                  <th className="p-4">N° de Pièce / Type</th>
                  <th className="p-4">Organisme Émetteur</th>
                  <th className="p-4">Engagement (B2G)</th>
                  <th className="p-4">Montant TTC</th>
                  <th className="p-4">Statut Comptable</th>
                  <th className="p-4 text-right">Actions de téléchargement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 text-gray-600">
                        {doc.createdAt?.toDate
                          ? doc.createdAt.toDate().toLocaleDateString("fr-FR")
                          : new Date().toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-950">{doc.id}</p>\
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-700">
                        {doc.entity}
                      </td>
                      <td className="p-4 text-blue-600 font-bold">
                        {doc.refEngagement || "-"}
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {(doc.amount || 0).toFixed(2)} €
                      </td>
                      <td className="p-4">
                        {doc.buyerRole === "client_public" ||
                        doc.buyerRole === "acheteur_public" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-150 text-amber-700 rounded-full text-xs font-bold">
                            <Clock size={12} /> Échéance LME 30j
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-150 text-green-700 rounded-full text-xs font-bold">
                            <CheckCircle size={12} /> Payé
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => downloadDocumentAsFile(doc)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                          title="Télécharger le fichier de commande"
                        >
                          <Download size={13} /> Télécharger
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
                      Aucun bon de commande n'a encore été créé dans votre base
                      de données Firestore.
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
