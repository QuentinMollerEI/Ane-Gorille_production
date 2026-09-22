/**
 * 📜 SERVICE DOCUMENTAIRE OFFICIEL : OrderDocumentGenerator.js
 * Emplacement : src/services/OrderDocumentGenerator.js
 * 
 * Façade / Orchestrateur universel des documents commerciaux Âne & Gorille :
 * Redirige chaque type de document vers son générateur unique (SRP).
 */

import { OrderSlipGenerator } from "./documents/OrderSlipGenerator";
import { DeliverySlipGenerator } from "./documents/DeliverySlipGenerator";
import { PreparationSlipGenerator } from "./documents/PreparationSlipGenerator";
import { PickupSlipGenerator } from "./documents/PickupSlipGenerator";
import { InvoiceGenerator } from "./documents/InvoiceGenerator";

export const OrderDocumentGenerator = {
  COMPANY_INFO: DeliverySlipGenerator.COMPANY_INFO || {
    tradeName: "Âne & Gorille",
    legalName: "Quentin Moller EI",
    legalStatus: "Entrepreneur Individuel (EI)",
    siret: "912 345 678 00012",
    rcs: "RCS Toulouse",
    drealLicense: "Licence de Transport Intérieur n° 2026/76/0001234",
    vatNumber: "FR 12 912345678",
    address: "Toulouse, France",
    phone: "05 82 95 06 24",
    email: "contact@ane-et-gorille.fr",
    website: "https://www.ane-et-gorille.fr",
    logoUrl: "/Logo.png"
  },

  /**
   * Bon de Commande B2B/B2G
   */
  generateOrderSlipHTML(order) {
    if (OrderSlipGenerator && typeof OrderSlipGenerator.generateHTML === "function") {
      return OrderSlipGenerator.generateHTML(order);
    }
    return "<p>Erreur: OrderSlipGenerator non disponible.</p>";
  },

  /**
   * Bon de Livraison (BL)
   */
  generateDeliverySlipHTML(order) {
    if (DeliverySlipGenerator && typeof DeliverySlipGenerator.generateHTML === "function") {
      return DeliverySlipGenerator.generateHTML(order);
    }
    return "<p>Erreur: DeliverySlipGenerator non disponible.</p>";
  },

  /**
   * Bon de Préparation / Fiche de Récolte
   */
  generatePreparationSlipHTML(subOrder, parentOrder = null) {
    if (PreparationSlipGenerator && typeof PreparationSlipGenerator.generateHTML === "function") {
      return PreparationSlipGenerator.generateHTML(subOrder, parentOrder);
    }
    return "<p>Erreur: PreparationSlipGenerator non disponible.</p>";
  },

  /**
   * Bon de Ramassage / Enlèvement
   */
  generatePickupSlipHTML(pickup) {
    if (PickupSlipGenerator && typeof PickupSlipGenerator.generateHTML === "function") {
      return PickupSlipGenerator.generateHTML(pickup);
    }
    return "<p>Erreur: PickupSlipGenerator non disponible.</p>";
  },

  /**
   * Facture de Vente
   */
  generateInvoiceHTML(order, subOrder = null) {
    if (InvoiceGenerator && typeof InvoiceGenerator.generateInvoiceHTML === "function") {
      return InvoiceGenerator.generateInvoiceHTML(order, subOrder);
    }
    return "<p>Erreur: InvoiceGenerator non disponible.</p>";
  },

  /**
   * Facture de Commission
   */
  generateCommissionInvoiceHTML(subOrder) {
    if (InvoiceGenerator && typeof InvoiceGenerator.generateCommissionInvoiceHTML === "function") {
      return InvoiceGenerator.generateCommissionInvoiceHTML(subOrder);
    }
    return "<p>Erreur: InvoiceGenerator non disponible.</p>";
  }
};
