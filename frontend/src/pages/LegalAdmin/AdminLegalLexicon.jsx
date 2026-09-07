import React, { useState, useEffect } from "react";
import { Scale, ShieldAlert, Loader2 } from "lucide-react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service";

// Imports des compartiments isolés (Dossier local LegalAdmin/components/)
import LegalPlatformSpecs from "./components/LegalPlatformSpecs";
import FiscalVatLexicon from "./components/FiscalVatLexicon";
import LogisticsDrealHaccp from "./components/LogisticsDrealHaccp";
import B2gChorusEgalim from "./components/B2gChorusEgalim";

export default function AdminLegalLexicon() {
  const [regulatoryConfig, setRegulatoryConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-initialisation et abonnement temps réel aux paramètres réglementaires dans Firestore
  useEffect(() => {
    const configDocRef = doc(db, "config", "regulatory");

    const unsubscribe = onSnapshot(
      configDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setRegulatoryConfig({ id: snapshot.id, ...snapshot.data() });
          setLoading(false);
        } else {
          // Initialisation automatique de sécurité lors du tout premier lancement
          const defaultConfig = {
            commissionRate: 18, // Commission par défaut de 18% demandée par l'utilisateur
            tvaBaseThreshold: 37500, // Seuils réglementaires France 2026 de Franchise de TVA
            tvaMajoratedThreshold: 41250,
            haccpMinTemp: 2.0, // Températures réglementaires HACCP pour denrées fraîches
            haccpMaxTemp: 6.0,
            egalimBioQuota: 20, // Seuil légal EGAlim d'achats biologiques en restauration collective
            lastUpdated: new Date().toISOString(),
          };
          try {
            await setDoc(configDocRef, defaultConfig);
          } catch (err) {
            console.error(
              "Erreur lors de l'initialisation de la configuration légale :",
              err,
            );
          }
        }
      },
      (error) => {
        console.error(
          "Erreur d'écoute de la configuration réglementaire :",
          error,
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="animate-spin text-red-600" size={32} />
        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">
          Chargement du Cahier des Charges Légal...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-red-50 text-red-700 rounded-lg">
            <Scale size={28} />
          </span>
          Cahier des Charges & Lexique de Conformité Administrative
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Onglet administratif d'entreprise : Pilotage légal, fiscalité
          micro-entreprise et règles de mise en relation.
        </p>
      </div>

      {/* Alerte RGPD et de responsabilité de l'opérateur de la plateforme */}
      <div className="p-4 bg-amber-50 border border-amber-250 rounded-xl text-amber-950 flex items-start space-x-3 text-sm shadow-sm">
        <ShieldAlert
          className="text-amber-600 mt-0.5 flex-shrink-0"
          size={18}
        />
        <div>
          <p className="font-bold">Avertissement de Responsabilité Opérateur</p>
          <p className="text-xs text-amber-800 mt-1">
            En tant que micro-entreprise assurant la mise en relation, la
            facturation déléguée et la livraison physique de denrées
            alimentaires, vous êtes soumis à un maillage réglementaire strict
            ("Legal by Design"). Le non-respect de ces règles peut engager votre
            responsabilité à hauteur de 4% du chiffre d'affaires.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Les compartiments de configuration connectés à Firestore */}
        <LegalPlatformSpecs config={regulatoryConfig} />
        <FiscalVatLexicon config={regulatoryConfig} />
        <LogisticsDrealHaccp config={regulatoryConfig} />
        <B2gChorusEgalim config={regulatoryConfig} />
      </div>
    </div>
  );
}
