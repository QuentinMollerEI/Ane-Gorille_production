import React, { useState } from "react";
import {
  Scale,
  CheckSquare,
  Square,
  ShieldCheck,
  FileText,
  CreditCard,
  Truck,
  AlertTriangle,
  Building,
  Info,
  BookOpen,
} from "lucide-react";

/**
 * ⚖️ COMPOSANT : AdminLegalLexicon.jsx
 * Catalogue exhaustif des obligations légales, articles de lois et réglementations
 * pour le chef d'entreprise de la marketplace "Âne & Gorille".
 */
export default function AdminLegalLexicon() {
  const [checkedItems, setCheckedItems] = useState({
    acpr: true,
    lme: true,
    chorus: true,
    facturx: true,
    egalim: true,
    haccp: true,
    agec: true,
    p2b: true,
    dsa: true,
    lcen: true,
    rgpd: true,
    cgi293b: true,
  });

  const toggleCheck = (key) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalCount = Object.keys(checkedItems).length;
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in pb-16">
      {/* HEADER DU CADRE LÉGAL */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
              <Scale size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Registre de Conformité Légale & Réglementaire
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Point de repère exhaustif du Dirigeant — Marketplace Agricole
                B2B / B2G "Âne & Gorille"
              </p>
            </div>
          </div>

          {/* BARRE DE PROGRESSION CONFORMITÉ */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-4 min-w-[240px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-black uppercase text-emerald-950 mb-1">
                <span>Niveau de Conformité</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-700 h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BANDEAU RÔLE CHEF D'ENTREPRISE */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950 font-medium">
          <Info size={20} className="text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            En tant que chef d'entreprise d'une place de marché en ligne, vous
            opérez au croisement du <strong>Droit de la Consommation</strong>,
            du <strong>Code de Commerce</strong>, de la{" "}
            <strong>Réglementation Bancaire (ACPR)</strong> et de la{" "}
            <strong>Sécurité Sanitaire (HACCP)</strong>. Ce guide interactif
            vous permet de valider point par point la mise en conformité de
            votre plateforme.
          </p>
        </div>
      </div>

      {/* SECTION 1 : INTERMÉDIATION FINANCIÈRE & PAIEMENTS */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-150 pb-3">
          <CreditCard size={20} className="text-emerald-700" />
          1. Intermédiation Financière & Séquestre de Fonds
        </h2>

        <div className="space-y-3 text-xs">
          {/* ACPR */}
          <div
            onClick={() => toggleCheck("acpr")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.acpr
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.acpr ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Interdiction d'encaissement pour compte de tiers sans agrément
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">
                  Code Monétaire et Financier art. L521-2 / DSP2
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Il est strictement interdit à une
                marketplace d'encaisser les fonds des ventes sur son propre
                compte bancaire principal pour les reverser ensuite.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Utilisation de Stripe Connect Express en mode
                séquestre (Split Payment).
              </p>
            </div>
          </div>

          {/* LME */}
          <div
            onClick={() => toggleCheck("lme")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.lme
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.lme ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Délais de paiement légaux de la commande publique (30 jours)
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md uppercase">
                  Loi LME / Code de Commerce art. L441-10
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Délai maximal de règlement fixé à 30
                jours pour les commandes publiques (écoles, mairies, hôpitaux).
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Masquage du paiement CB pour l'Acheteur Public
                et paiement par Mandat Administratif avec Bon de
                Commande/Engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 : COMMANDE PUBLIQUE & CHORUS PRO (B2G) */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-150 pb-3">
          <Building size={20} className="text-blue-700" />
          2. Commande Publique & Facturation Électronique (B2G)
        </h2>

        <div className="space-y-3 text-xs">
          {/* CHORUS PRO */}
          <div
            onClick={() => toggleCheck("chorus")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.chorus
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.chorus ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Télétransmission obligatoire sur le portail d'État Chorus Pro
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-md uppercase">
                  Ordonnance n° 2014-697 / Réforme 2026
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Interdiction des factures papier/PDF
                simples par e-mail au secteur public depuis le 1er janvier 2020.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Capturation du SIRET, Code Service et N°
                d'Engagement Budgétaire dans "Mon Profil".
              </p>
            </div>
          </div>

          {/* FACTUR-X */}
          <div
            onClick={() => toggleCheck("facturx")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.facturx
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.facturx ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Format mixte Factur-X (PDF + Données XML structurées EN 16931)
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md uppercase">
                  Standard Européen EN 16931
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Les factures publiques doivent
                comporter des métadonnées lisibles par automate pour accélérer
                le mandat.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Génération automatique des identifiants
                d'engagement et structuration des factures B2G.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 : SÉCURITÉ SANITAIRE & ENVIRONNEMENT */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-150 pb-3">
          <Truck size={20} className="text-amber-700" />
          3. Sécurité Sanitaire Alimentaire (HACCP) & Transition Écologique
        </h2>

        <div className="space-y-3 text-xs">
          {/* EGALIM */}
          <div
            onClick={() => toggleCheck("egalim")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.egalim
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.egalim ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Loi EGAlim : 50% de produits durables dont 20% de Bio
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">
                  Loi EGAlim / Climat & Résilience
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> La restauration collective publique
                doit justifier de son approvisionnement en produits sous signe
                de qualité.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Verrouillage strict de la case "Bio" en Mise en
                Rayon conditionné au dépôt du certificat Ecocert.
              </p>
            </div>
          </div>

          {/* HACCP */}
          <div
            onClick={() => toggleCheck("haccp")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.haccp
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.haccp ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Chaîne du Froid & Traçabilité Sanitaire HACCP
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-md uppercase">
                  Règlement CE n°852/2004
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Obligation d'enregistrer et de prouver
                la température de transport des denrées périssables (2°C à 6°C).
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Relevé obligatoire de la température au
                déchargement et signature d'émargement sur le Bon de Livraison.
              </p>
            </div>
          </div>

          {/* AGEC */}
          <div
            onClick={() => toggleCheck("agec")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.agec
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.agec ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Loi AGEC : Économie circulaire & Zéro plastique jetable
                </span>
                <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-black rounded-md uppercase">
                  Loi AGEC Anti-Gaspillage
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Suppression progressive des emballages
                plastique pour les fruits et légumes frais.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Conditionnement en cagettes bois réutilisables
                et bacs consignés pour les tournées.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 : REGLEMENTATION PLATFORME & RGPD */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-150 pb-3">
          <ShieldCheck size={20} className="text-purple-700" />
          4. Transparence Commerciale, RGPD & Régulation Européenne
        </h2>

        <div className="space-y-3 text-xs">
          {/* P2B / DSA */}
          <div
            onClick={() => toggleCheck("dsa")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.dsa
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.dsa ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Transparence des Vendeurs, P2B & Digital Services Act (DSA)
                </span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-md uppercase">
                  Règlement UE 2019/1150 & DSA
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Obligation d'expliquer les règles de
                classement, de motiver par écrit toute suspension de compte
                vendeur et de proposer une voie de recours.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Statuts PENDING/APPROVED/REJECTED motivés avec
                notifications dans le Centre de Modération Admin.
              </p>
            </div>
          </div>

          {/* RGPD */}
          <div
            onClick={() => toggleCheck("rgpd")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.rgpd
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.rgpd ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Protection des Données Personnelles (RGPD)
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-md uppercase">
                  Règlement Général sur la Protection des Données
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Minimisation des données collectées,
                chiffrement des accès, consentement et droit à l'oubli.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Sécurisation Firebase Auth, chiffrement TLS/SSL
                et règles Firestore RBAC étanches.
              </p>
            </div>
          </div>

          {/* CGI 293 B */}
          <div
            onClick={() => toggleCheck("cgi293b")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              checkedItems.cgi293b
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mt-0.5 text-emerald-700">
              {checkedItems.cgi293b ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">
                  Fiscalité & Mention de Franchise de TVA (Art. 293 B du CGI)
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-black rounded-md uppercase">
                  Code Général des Impôts art. 293 B
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Règle :</strong> Indication automatique des taux de TVA
                (5,5% alimentaire / 20% commission) ou de la mention
                d'exonération pour les micro-entrepreneurs.
              </p>
              <p className="text-emerald-800 font-bold">
                ✓ Application : Ventilation automatique des taux de TVA sur
                chaque ligne de Bon et Facture.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
