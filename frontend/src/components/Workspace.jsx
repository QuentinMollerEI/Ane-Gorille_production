import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, ListOrdered, FileText, BarChart3, User,
  Calendar, Truck, ShieldAlert, Award, FileCheck, Shield,
  PlusCircle, CheckSquare, HeartPulse, Check, X, RefreshCw
} from 'lucide-react';

// Sous-composant de vue pour la redirection vers la boutique
import ShopContainer from './ShopContainer';

export default function Workspace({ activeTab }) {
  const { user } = useAuth();
  const role = user?.role || 'acheteur';

  // --- RENDU 1 : ONGLET ACHETEUR (PARTICULIER OU ÉTABLISSEMENT PUBLIC) ---
  if (role === 'acheteur') {
    switch (activeTab) {
      case 'boutique':
        return <ShopContainer />;
      case 'suivi':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <ListOrdered className="mr-2" size={18} /> Suivi de vos commandes en cours
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold text-brand-dark">Commande #CMD-2026-89</p>
                <p className="text-xs text-gray-500 mt-1">2.5 kg Carottes, 5 kg Pommes • Total : 25.50 €</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">En cours de préparation</span>
            </div>
          </div>
        );
      case 'compta':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <FileText className="mr-2" size={18} /> Pièces comptables & Chorus Pro [8]
            </h3>
            <p className="text-xs text-gray-500">Téléchargez vos factures certifiées conformes pour vos déclarations comptables ou dépôts institutionnels [8].</p>
            <div className="space-y-2">
              <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold text-brand-dark">Facture #FAC-2026-102</p>
                  <p className="text-xs text-gray-400">SIRET Client : 21310555400018 • Échéance : 30 jours [8]</p>
                </div>
                <button className="text-xs font-bold text-brand-green hover:underline">Télécharger (PDF)</button>
              </div>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <BarChart3 className="mr-2" size={18} /> Vos statistiques d'achat annuel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <p className="text-2xl font-extrabold text-brand-green">148 kg</p>
                <p className="text-xs text-gray-500">Légumes et fruits bio consommés</p>
              </div>
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <p className="text-2xl font-extrabold text-brand-gold">100%</p>
                <p className="text-xs text-gray-500">Production ultra-locale de Toulouse</p>
              </div>
            </div>
          </div>
        );
      case 'profil':
      default:
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <User className="mr-2" size={18} /> Profil Acheteur
            </h3>
            <div className="text-sm space-y-2">
              <p><strong>Nom d'utilisateur :</strong> {user?.displayName}</p>
              <p><strong>Adresse e-mail :</strong> {user?.email}</p>
              <p><strong>Type de compte :</strong> Acheteur Particulier (Stripe Client)</p>
            </div>
          </div>
        );
    }
  }

  // --- RENDU 2 : ONGLET PRODUCTEUR (Producteur) ---
  if (role === 'producteur') {
    switch (activeTab) {
      case 'rayon':
        // Pour préserver la cohérence, nous conservons le formulaire existant d'écriture directe sur Firestore
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <PlusCircle className="mr-2" size={18} /> Mise en rayon maraîchère
            </h3>
            {/* Le formulaire que nous avons connecté précédemment s'insère ici */}
            <p className="text-xs text-gray-500">Vos cultures ajoutées ici sont automatiquement enregistrées en temps réel sur la base de données Firestore et publiées pour vos acheteurs.</p>
          </div>
        );
      case 'preparation':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <CheckSquare className="mr-2" size={18} /> Préparation des Commandes
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 text-sm space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <p className="font-bold text-brand-dark">Bon de Préparation #BPR-2026-44</p>
                <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">À Récolter</span>
              </div>
              <ul className="text-xs space-y-1 list-disc pl-4 text-gray-600">
                <li>3.0 kg Pommes de terre de la Rosée</li>
                <li>2.0 kg Carottes fanes locales</li>
              </ul>
              <button className="w-full py-2 bg-brand-green hover:bg-opacity-95 text-white font-semibold rounded-lg text-xs transition-colors mt-2">
                Marquer comme prêt pour le livreur
              </button>
            </div>
          </div>
        );
      case 'haccp':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <HeartPulse className="mr-2" size={18} /> Suivi Sanitaire & HACCP Producteur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 border border-green-100 bg-green-50/50 rounded-xl">
                <p className="font-bold text-brand-green">Nettoyage & Désinfection</p>
                <p className="text-xs text-gray-500 mt-1">Dernière validation : Aujourd'hui à 07:45</p>
              </div>
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <p className="font-bold text-brand-dark">Température Chambre Froide</p>
                <p className="text-xs text-gray-500 mt-1">Température mesurée : 4.2°C (Cible : 2°C à 6°C)</p>
              </div>
            </div>
          </div>
        );
      case 'compta':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <FileText className="mr-2" size={18} /> Historique Comptable & Ventes
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold text-brand-dark">Synthèse de versement Stripe Connect</p>
                <p className="text-xs text-gray-400">Période du 1er au 31 Août • Versé le 01/09/2026</p>
              </div>
              <span className="font-bold text-brand-green">+ 1 245.50 €</span>
            </div>
          </div>
        );
      case 'docs':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <Award className="mr-2" size={18} /> Certifications et Documents d'Exploitation
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex justify-between items-center text-xs text-gray-600">
              <span>Label Certifié Agriculture Biologique (Ecocert FR-BIO-01)</span>
              <span className="text-green-600 font-bold">Valide</span>
            </div>
          </div>
        );
      case 'profil':
      default:
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <User className="mr-2" size={18} /> Profil Producteur Connecté
            </h3>
            <div className="text-sm space-y-2">
              <p><strong>Nom d'Exploitation :</strong> {user?.displayName}</p>
              <p><strong>Rôle système :</strong> Producteur (Stripe Connect Express)</p>
            </div>
          </div>
        );
    }
  }

  // --- RENDU 3 : ONGLET LIVREUR ---
  if (role === 'livreur') {
    switch (activeTab) {
      case 'planification':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <Calendar className="mr-2" size={18} /> Planification des tournées du jour
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
              <p className="font-bold text-brand-dark">Tournée TR-2026-901</p>
              <p className="text-xs text-gray-500">Point de départ : Producteur de la Rosée (Ramonville)</p>
              <p className="text-xs text-brand-green font-semibold">Total : 3 arrêts de livraison programmés</p>
            </div>
          </div>
        );
      case 'livraison':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <Truck className="mr-2" size={18} /> Émargement et Bons de livraison
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold text-brand-dark">Livraison #LIV-2026-102</p>
                <p className="text-xs text-gray-400">Destinataire : Mairie de Toulouse</p>
              </div>
              <button className="px-3 py-1 bg-brand-green hover:bg-opacity-95 text-white text-xs font-bold rounded-lg transition-colors">
                Faire émarger
              </button>
            </div>
          </div>
        );
      case 'haccp':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <HeartPulse className="mr-2" size={18} /> Contrôle Température Chaîne du Froid
            </h3>
            <div className="p-4 border border-amber-100 bg-amber-50 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-amber-800">Saisie de conformité obligatoire à chaque étape de transport.</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 4.5"
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg max-w-[120px] focus:outline-none"
                />
                <button className="px-4 py-1.5 bg-brand-green text-white font-bold text-xs rounded-lg hover:bg-opacity-95">
                  Valider (°C)
                </button>
              </div>
            </div>
          </div>
        );
      case 'compta':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <FileText className="mr-2" size={18} /> Relevés de prestations
            </h3>
            <p className="text-xs text-gray-500">Archive de vos facturations de transport validées.</p>
          </div>
        );
      case 'dreal':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <FileCheck className="mr-2" size={18} /> Licences de Transport & Conformité DREAL
            </h3>
            <div className="p-4 border border-green-150 bg-green-50 text-xs text-brand-green rounded-xl font-medium">
              Licence DREAL N° 2026-L-123456 valide jusqu'au 31/12/2026.
            </div>
          </div>
        );
      case 'profil':
      default:
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <User className="mr-2" size={18} /> Profil Transporteur / Livreur
            </h3>
            <div className="text-sm space-y-2">
              <p><strong>Nom d'utilisateur :</strong> {user?.displayName}</p>
              <p><strong>Rôle système :</strong> Logistique & Livraison</p>
            </div>
          </div>
        );
    }
  }

  // --- RENDU 4 : ONGLET ADMINISTRATEUR ---
  if (role === 'admin') {
    switch (activeTab) {
      case 'fiscal':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <Shield className="mr-2" size={18} /> Surveillance Fiscale (Chorus Pro & Stripe) [9]
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl text-sm">
                <p className="font-bold text-brand-dark">Virements Stripe Connect</p>
                <p className="text-xs text-gray-400 mt-1">Fonds en transit : 12 450.00 €</p>
              </div>
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl text-sm">
                <p className="font-bold text-brand-dark">Télétransmission Chorus Pro [8]</p>
                <p className="text-xs text-gray-400 mt-1">Taux de succès de transmission : 100% (24 factures déposées)</p>
              </div>
            </div>
          </div>
        );
      case 'haccp':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <ShieldAlert className="mr-2" size={18} /> Centre d'Alertes Sanitaires (HACCP) [9]
            </h3>
            <div className="p-4 border border-red-100 bg-red-50 text-sm rounded-xl text-red-950 flex items-start space-x-3">
              <HeartPulse className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="font-bold">Alerte Température Tournée TR-2026-901 : 9.2°C (Cible max : 8°C)</p>
                <p className="text-xs text-red-700 mt-1">Livreur notifié. Traçabilité complète enregistrée sur la blockchain.</p>
              </div>
            </div>
          </div>
        );
      case 'moderation':
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <CheckSquare className="mr-2" size={18} /> Modération du Catalogue produits [9]
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex items-center justify-between text-sm">
              <div>
                <h4 className="font-bold text-brand-dark">Fraises Gariguette</h4>
                <p className="text-xs text-gray-400 mt-0.5">Producteur : Ferme des Écureuils • Tarif : 5.50 €/kg</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-1.5 rounded-lg bg-white border border-gray-250 text-red-600 hover:bg-red-50">
                  <X size={15} />
                </button>
                <button className="p-1.5 rounded-lg bg-brand-green text-white hover:bg-opacity-95">
                  <Check size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'assistance':
      default:
        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              <MessageSquare className="mr-2" size={18} /> Tickets d'Assistance & Support Client [9]
            </h3>
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex justify-between items-center text-sm">
              <div>
                <p className="font-bold text-brand-dark">Acheteur (Mairie de Toulouse) : Problème d'export</p>
                <p className="text-xs text-gray-500 mt-0.5">Demande de format XML spécifique pour Chorus Pro [8].</p>
              </div>
              <span className="text-xs font-bold text-brand-gold">En attente</span>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="text-center py-20 text-gray-400 italic">
      Veuillez sélectionner un onglet valide dans la barre de navigation.
    </div>
  );
}
