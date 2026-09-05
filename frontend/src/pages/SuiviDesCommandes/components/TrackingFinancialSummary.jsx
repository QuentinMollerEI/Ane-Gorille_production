import React from "react";
import { MapPin, Receipt, FileText, ExternalLink } from "lucide-react";

/**
 * 💳 COMPOSANT : TrackingFinancialSummary.jsx
 * CHEMIN DE DESTINATION : src/pages/SuiviDesCommandes/components/TrackingFinancialSummary.jsx
 * Responsabilité unique : Gérer la synthèse financière, le détail du mode de facturation
 * (B2B/B2G Chorus Pro) et l'accès sécurisé aux justificatifs comptables (Factur-X/BL) [cite: 4, 18].
 */
export default function TrackingFinancialSummary({ order }) {
  const handleDownloadInvoice = () => {
    alert(
      "Génération en cours de votre duplicata de facture Factur-X certifiée conforme...",
    );
  };

  const handleDownloadBL = () => {
    alert("Téléchargement du duplicata PDF du bon de livraison logistique...");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 📍 COMPARTIMENT 1 : Adresse de Livraison */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl space-y-3.5">
        <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <MapPin size={14} className="text-green-700" /> Informations de
          Livraison
        </h4>
        <div className="text-xs space-y-2">
          <p>
            <strong className="text-gray-500">Adresse de livraison :</strong>{" "}
            <span className="text-gray-800 font-semibold">
              {order.deliveryAddress}
            </span>
          </p>
          <p>
            <strong className="text-gray-500">E-mail de facturation :</strong>{" "}
            <span className="text-gray-800 font-mono">
              {order.billingEmail}
            </span>
          </p>
          <p>
            <strong className="text-gray-500">N° de SIRET acheteur :</strong>{" "}
            <span className="text-gray-800 font-mono">
              {order.siretBuyer || "N/A"}
            </span>
          </p>

          {order.engagementNumber && (
            <div className="p-2.5 bg-blue-50 border border-blue-150 rounded-xl mt-2 text-[10px] text-blue-900 flex items-center gap-1.5 font-bold">
              <Receipt size={14} className="text-blue-700" />
              <span>Engagement Chorus Pro : {order.engagementNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* 💶 COMPARTIMENT 2 : Synthèse Comptable & Prix */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl space-y-3.5">
        <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <Receipt size={14} className="text-green-700" /> Mode de Paiement &
          Totaux
        </h4>
        <div className="text-xs space-y-2.5">
          <p>
            <strong className="text-gray-500">Méthode de règlement :</strong>{" "}
            <span className="text-gray-800 font-black uppercase">
              {order.paymentMethod === "mandat_public"
                ? "Mandat Administratif"
                : order.paymentMethod}
            </span>
          </p>

          <p>
            <strong className="text-gray-500">
              Référence transactionnelle :
            </strong>{" "}
            <span className="text-gray-800 font-mono text-[10px] block truncate max-w-[200px]">
              {order.stripePaymentIntentId ||
                order.billieInvoiceReference ||
                "N/A"}
            </span>
          </p>

          <div className="border-t border-dashed pt-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-gray-500 font-semibold">
              <span>Total HT :</span>
              <span>{(order.totalHT || 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-500 font-semibold">
              <span>TVA cumulée :</span>
              <span>{(order.totalTVA || 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-900 font-black border-t pt-1.5">
              <span>Montant Total TTC :</span>
              <span className="text-green-700">
                {(order.totalTTC || 0).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📄 COMPARTIMENT 3 : Documents Légaux Factur-X */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl space-y-3.5">
        <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <FileText size={14} className="text-green-700" /> Pièces
          Justificatives Officielles
        </h4>
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            Conformément à la réglementation fiscale, vos factures au format
            Factur-X certifié et vos bons logistiques sont générés à la commande
            et archivés de façon immuable [cite: 4, 10].
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1.5">
            <button
              onClick={handleDownloadInvoice}
              className="w-full flex items-center justify-between text-left border border-gray-200 hover:bg-gray-50 p-2.5 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer bg-white"
            >
              <span className="flex items-center gap-2">
                <FileText size={14} className="text-green-700" />{" "}
                Facture_Factur-X.xml
              </span>
              <ExternalLink size={12} className="text-gray-400" />
            </button>

            <button
              onClick={handleDownloadBL}
              className="w-full flex items-center justify-between text-left border border-gray-200 hover:bg-gray-50 p-2.5 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer bg-white"
            >
              <span className="flex items-center gap-2">
                <FileText size={14} className="text-green-700" />{" "}
                Bon_de_Livraison.pdf
              </span>
              <ExternalLink size={12} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
