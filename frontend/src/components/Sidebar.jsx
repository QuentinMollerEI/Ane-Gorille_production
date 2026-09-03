import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft, ChevronRight, ShoppingBag, ListOrdered, FileText, BarChart3,
  User, PlusCircle, CheckSquare, HeartPulse, ShieldAlert, Award,
  Calendar, Truck, FileCheck, Shield, MessageSquare, LogOut
} from 'lucide-react';

// Configuration de la matrice des onglets par rôle selon les spécifications d'architecture [1]
const MENU_ITEMS = {
  acheteur: [
    { id: 'boutique', label: 'Accès boutique', icon: ShoppingBag },
    { id: 'suivi', label: 'Suivi de commande', icon: ListOrdered },
    { id: 'compta', label: 'Archive & Compta', icon: FileText },
    { id: 'stats', label: "Statistiques d'achat", icon: BarChart3 },
    { id: 'profil', label: 'Mon Profil', icon: User },
  ],
  producteur: [
    { id: 'rayon', label: 'Mise en rayon', icon: PlusCircle },
    { id: 'preparation', label: 'Préparation', icon: CheckSquare },
    { id: 'haccp', label: 'Récolte / HACCP', icon: HeartPulse },
    { id: 'compta', label: 'Archive / Compta', icon: FileText },
    { id: 'docs', label: 'Docs & Certifs', icon: Award },
    { id: 'profil', label: 'Profil Producteur', icon: User },
  ],
  livreur: [
    { id: 'planification', label: 'Planification', icon: Calendar },
    { id: 'livraison', label: 'Ramassage / Livraison', icon: Truck },
    { id: 'haccp', label: 'Traçabilité HACCP', icon: HeartPulse },
    { id: 'compta', label: 'Archive / Compta', icon: FileText },
    { id: 'dreal', label: 'Document DREAL', icon: FileCheck },
    { id: 'profil', label: 'Profil Livreur', icon: User },
  ],
  admin: [
    { id: 'fiscal', label: 'Surveillance Fiscale', icon: Shield },
    { id: 'haccp', label: 'Contrôle HACCP', icon: ShieldAlert },
    { id: 'moderation', label: 'Modération', icon: CheckSquare },
    { id: 'assistance', label: 'Assistance / Support', icon: MessageSquare },
  ]
};

export default function Sidebar({ isCollapsed, setIsCollapsed, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'acheteur';
  const menuList = MENU_ITEMS[role] || [];

  return (
    <aside
      className={`bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Partie Haute : Bouton de repli (Flèche) et Liste d'onglets */}
      <div className="p-3">
        {/* En-tête de la Sidebar avec la flèche de bascule demandée */}
        <div className={`flex items-center mb-6 ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!isCollapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Espace {role}
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-brand-green border border-gray-200 transition-colors"
            title={isCollapsed ? "Déplier le menu" : "Replier le menu"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation dynamique */}
        <nav className="space-y-1">
          {menuList.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-brand-green'
                }`}
              >
                <IconComponent
                  size={18}
                  className={`flex-shrink-0 transition-colors ${
                    isActive ? 'text-brand-gold' : 'text-gray-400 group-hover:text-brand-green'
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Partie Basse : Déconnexion */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className={`w-full flex items-center p-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Se déconnecter"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="ml-3 font-semibold">Déconnexion</span>
          )}
        </button>
      </div>
    </aside>
  );
}
