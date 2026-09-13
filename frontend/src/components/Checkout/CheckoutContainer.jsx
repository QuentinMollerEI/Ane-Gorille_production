// Chemin : src/components/Checkout/CheckoutContainer.jsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Truck, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/profile.service";
import CheckoutCartSummary from "./CheckoutCartSummary";
import CheckoutPaymentMethod from "./CheckoutPaymentMethod";
import CartContainer from "../pages/boutique/CartContainer"; // Réutilisation du panier
import RequireCompleteProfile from "../auth/RequireCompleteProfile";

/**
 * 🛒 COMPOSANT : CheckoutContainer.jsx
 * Orchestrateur du processus de commande final.
 * Protégé par le Guard `RequireCompleteProfile` pour garantir la conformité B2B/B2G.
 */
export default function CheckoutContainer({ 
  onBackToShop, 
  cartItems, 
  totalAmount,
  onClearCart 
}) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Chargement des données de facturation/logistique de l'acheteur
  useEffect(() => {
    if (!user?.uid) return;
    
    async function loadProfile() {
      try {
        const data = await profileService.getUserProfile(user.uid);
        setProfileData(data);
      } catch (err) {
        console.error("Erreur de récupération du profil :", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [user?.uid]);

  // Simulation de la validation de la commande
  const handleConfirmOrder = () => {
    // 1. Simulation d'un appel API (ex: creation du document 'orders' et 'sub_orders')
    // 2. Génération d'un faux ID de commande pour la démonstration
    const newOrderId = `CMD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    setOrderId(newOrderId);
    setOrderConfirmed(true);
    
    if(onClearCart) {
        onClearCart();
    }
  };

  // VUE 1 : COMMANDE RÉUSSIE
  if (orderConfirmed) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white border border-emerald-200 rounded-3xl p-10 text-center shadow-lg animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-100 text-emerald-700 p-4 rounded-full">
            <CheckCircle2 size={48} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Commande Validée !
        </h2>
        <p className="text-gray-600 font-medium mb-8">
          Votre engagement d'achat a été enregistré sous la référence <span className="font-mono font-bold text-gray-900">{orderId}</span>. Les bons de préparation ont été envoyés aux maraîchers partenaires.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
             <Truck className="text-emerald-700 shrink-0 mt-1" size={20} />
             <div>
               <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Logistique</p>
               <p className="text-xs font-semibold text-gray-900 mt-0.5">Tournée de collecte planifiée</p>
             </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
             <Clock className="text-emerald-700 shrink-0 mt-1" size={20} />
             <div>
               <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Suivi</p>
               <p className="text-xs font-semibold text-gray-900 mt-0.5">Disponible dans votre espace</p>
             </div>
          </div>
        </div>

        <button
          onClick={onBackToShop}
          className="px-8 py-3 bg-gray-900 hover:bg-black text-white font-black rounded-xl transition-all"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  // VUE 2 : TUNNEL DE PAIEMENT (Protégé)
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <button 
        onClick={onBackToShop}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-xs transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        <span>Retourner au catalogue</span>
      </button>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
          <ShieldCheck size={28} className="text-emerald-700" />
          <div>
            <h2 className="text-xl font-black text-gray-900">Validation de votre Commande</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Étape finale sécurisée B2B/B2G</p>
          </div>
        </div>

        {/* 🔒 GUARD DE SÉCURITÉ : Bloque l'affichage si le profil n'est pas 100% complet */}
        <RequireCompleteProfile actionName="valider votre commande définitivement">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Colonne Gauche : Données de facturation et mode de paiement */}
            <div className="lg:col-span-7 space-y-6">
              
              <CheckoutPaymentMethod 
                profileData={profileData} 
                loading={loading} 
              />
              
              {/* Résumé des informations logistiques (en lecture seule ici) */}
              {!loading && profileData && (
                <div className="p-5 border border-gray-200 bg-gray-50 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider">Point de Livraison</h4>
                  <p className="text-[11px] font-medium text-gray-700">{profileData.companyName}</p>
                  <p className="text-[11px] font-medium text-gray-700">{profileData.address}, {profileData.postalCode} {profileData.city}</p>
                  <p className="text-[10px] text-gray-500 italic mt-2">Pour modifier cette adresse, veuillez retourner dans vos paramètres de profil.</p>
                </div>
              )}
            </div>

            {/* Colonne Droite : Récapitulatif du panier et bouton d'action final */}
            <div className="lg:col-span-5">
              <CheckoutCartSummary 
                cartItems={cartItems} 
                totalAmount={totalAmount} 
                onConfirmOrder={handleConfirmOrder}
              />
            </div>

          </div>
        </RequireCompleteProfile>
      </div>
    </div>
  );
}