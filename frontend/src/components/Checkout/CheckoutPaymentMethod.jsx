import React from "react";
import { ShieldCheck, Landmark, FileText, HelpCircle } from "lucide-react";

/**
 * 🏛️ COMPOSANT : B2GPaymentCard (Secteur Public / B2G)
 * Responsabilité unique : Présenter les détails de paiement par Mandat Administratif
 * et télétransmission Chorus Pro pour les acheteurs publics.
 */
function B2GPaymentCard({ globalEngagementNumber, billingEmail }) {
  return (
    <div
      className="space-y-4 p-5 border border-blue-200 bg-blue-50/40 rounded-3xl animate-fade-in"
      role="region"
      aria-labelledby="b2g-payment-title"
    >
      <div className="flex gap-3.5 items-start">
        <Landmark
          className="text-blue-700 shrink-0 mt-0.5"
          size={20}
          aria-hidden="true"
        />
        <div className="space-y-2 text-blue-950">
          <h4
            id="b2g-payment-title"
            className="text-xs font-black uppercase tracking-wider text-blue-900"
          >
            Règlement par Mandat Administratif (SEPA)
          </h4>
          <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
            Conformément aux règles de la comptabilité publique, votre règlement
            s'effectuera par <strong>virement bancaire SEPA</strong> sous un
            délai de 30 jours après réception de la livraison.
          </p>

          <div className="pt-1.5 space-y-1.5">
            <span className="text-[10px] text-blue-900 font-black uppercase tracking-wider block">
              Flux de Facturation Dématérialisé (B2G) :
            </span>
            <p className="text-[10px] text-gray-500 font-medium leading-normal">
              Votre facture électronique certifiée au format national{" "}
              <strong>Factur-X</strong> sera automatiquement télétransmise sur
              votre portail <strong>Chorus Pro</strong> dès la confirmation de
              livraison par le transporteur.
            </p>
          </div>

          {/* Métadonnées obligatoires d'engagement pour Chorus Pro */}
          <div className="pt-2 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 bg-blue-100/60 px-3 py-1.5 rounded-xl border border-blue-200/50">
              <FileText size={12} className="text-blue-700" />
              <span>
                N° Engagement Juridique (EJ) :{" "}
                <code className="font-mono text-[11px] text-blue-900">
                  {globalEngagementNumber || "Saisie en cours..."}
                </code>
              </span>
            </div>

            {billingEmail && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                <span>
                  E-mail comptabilité :{" "}
                  <span className="font-mono text-gray-800">
                    {billingEmail}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 🏢 COMPOSANT : B2BPaymentCard (Secteur Privé / B2B)
 * Responsabilité unique : Présenter les détails de paiement différé via Billie BNPL
 * pour les entreprises et acheteurs professionnels privés.
 */
function B2BPaymentCard({ companyName }) {
  return (
    <div
      className="space-y-4 p-5 border border-green-200 bg-green-50/30 rounded-3xl animate-fade-in"
      role="region"
      aria-labelledby="b2b-payment-title"
    >
      <div className="flex gap-3.5 items-start">
        <ShieldCheck
          className="text-green-700 shrink-0 mt-0.5"
          size={20}
          aria-hidden="true"
        />
        <div className="space-y-2 text-green-950">
          <h4
            id="b2b-payment-title"
            className="text-xs font-black uppercase tracking-wider text-green-900"
          >
            Paiement Différé Billie B2B (30 jours)
          </h4>
          <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
            Pour soutenir la trésorerie de votre établissement{" "}
            <strong>{companyName || "privé"}</strong>, bénéficiez de notre
            solution de financement intégrée avec <strong>Billie</strong>. Votre
            panier est garanti et payable sous 30 jours sans frais
            supplémentaires.
          </p>

          <div className="pt-1.5 space-y-1.5">
            <span className="text-[10px] text-green-900 font-black uppercase tracking-wider block">
              Sécurisation et Séquestre des fonds :
            </span>
            <p className="text-[10px] text-gray-500 font-medium leading-normal">
              Lors de la validation, le montant de votre achat est garanti et
              sera reversé de manière sécurisée sur le compte séquestre{" "}
              <strong>Stripe Connect Express</strong> des maraîchers
              partenaires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 🛒 COMPOSANT ORCHESTRATEUR : CheckoutPaymentMethod
 * Responsabilité unique (SRP) : Router dynamiquement l'affichage des informations de paiement
 * selon la nature de l'acheteur (Public B2G vs Privé B2B).
 */
export default function CheckoutPaymentMethod({
  profileData,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="p-6 border border-gray-100 bg-white rounded-3xl animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
        <div className="h-20 bg-gray-150 rounded-2xl w-full"></div>
      </div>
    );
  }

  // Détection ultra-robuste de la structure publique (B2G) pour correspondre au profil et au rôle d'auth
  const isPublicSector =
    profileData?.buyerProfile === "B2G" ||
    profileData?.isPublicSector === true ||
    String(profileData?.role || "")
      .toLowerCase()
      .includes("public") ||
    String(profileData?.role || "")
      .toLowerCase()
      .includes("b2g") ||
    String(profileData?.role || "")
      .toLowerCase()
      .includes("collectivite") ||
    String(profileData?.role || "")
      .toLowerCase()
      .includes("etat");

  return (
    <div className="space-y-4">
      {/* Titre de section de paiement */}
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
        Mode de Règlement Autorisé
      </h3>

      {isPublicSector ? (
        <B2GPaymentCard
          globalEngagementNumber={profileData?.globalEngagementNumber}
          billingEmail={profileData?.billingEmail}
        />
      ) : (
        <B2BPaymentCard companyName={profileData?.companyName} />
      )}

      {/* En-tête informatif commun */}
      <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex gap-3 items-start text-[10px] text-gray-500 font-medium leading-relaxed">
        <HelpCircle size={16} className="text-gray-400 shrink-0 mt-0.5" />
        <p>
          En tant que plateforme de confiance "<strong>Âne & Gorille</strong>",
          nous garantissons la traçabilité environnementale (EGAlim) et
          sanitaire (HACCP) de vos produits locaux en circuit court. Toutes les
          transactions financières transitent par un tiers de confiance agréé
          européen.
        </p>
      </div>
    </div>
  );
}
