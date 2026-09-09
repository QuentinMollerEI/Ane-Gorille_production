import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingBag,
  ListOrdered,
  FileText,
  BarChart3,
  User,
  Calendar,
  Truck,
  ShieldAlert,
  Award,
  FileCheck,
  Shield,
  PlusCircle,
  CheckSquare,
  HeartPulse,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Scale,
} from "lucide-react";

/**
 * ≡ COMPOSANT : Sidebar.jsx (v2 - Navigation RBAC Dynamique & Rétractable)
 * Gère le menu de navigation connecté de la marketplace Âne et Gorille.
 * Modulée entièrement selon le rôle de l'utilisateur avec normalisation
 * pour garantir que les acheteurs (pro, public, particuliers) accèdent tous
 * à leurs outils de suivi et profil sans aucun bug d'aiguillage.
 */
export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🛡️ NORMALISATION DES RÔLES (Robustesse RBAC identique au Workspace-v3)
  let role = user?.role || "acheteur";
  if (
    role === "client_pro" ||
    role === "client_public" ||
    role === "acheteur_prive" ||
    role === "acheteur_public" ||
    role === "acheteur"
  ) {
    role = "acheteur";
  }

  // 🎨 CONFIGURATION DES ONGLETS PAR RÔLE (Icônes unifiées avec Workspace)
  const menuConfig = {
    acheteur: [
      { id: "boutique", label: "Boutique du Marché", icon: ShoppingBag },
      { id: "suivi", label: "Suivi des Commandes", icon: ListOrdered },
      { id: "compta", label: "Pièces Comptables", icon: FileText },
      { id: "stats", label: "Mes Statistiques", icon: BarChart3 },
      { id: "profil", label: "Mon Profil Acheteur", icon: User },
    ],
    producteur: [
      { id: "rayon", label: "Mise en Rayon", icon: PlusCircle },
      { id: "preparation", label: "Préparation", icon: CheckSquare },
      { id: "haccp", label: "Suivi Sanitaire (HACCP)", icon: HeartPulse },
      { id: "compta", label: "Compta & Reversements", icon: FileText },
      { id: "docs", label: "Mes Certifications", icon: Award },
      { id: "profil", label: "Profil Exploitation", icon: User },
    ],
    livreur: [
      { id: "planification", label: "Feuille de Route", icon: Calendar },
      { id: "haccp", label: "Chaîne du Froid", icon: HeartPulse },
      { id: "compta", label: "Relevés Prestations", icon: FileText },
      { id: "dreal", label: "Conformité DREAL", icon: FileCheck },
      { id: "profil", label: "Mon Profil Livreur", icon: User },
    ],
    admin: [
      { id: "fiscal", label: "Surveillance Fiscale", icon: Shield },
      { id: "haccp", label: "Alertes Sanitaires", icon: ShieldAlert },
      { id: "moderation", label: "Modération Catalogue", icon: CheckSquare },
      { id: "assistance", label: "Support & Tickets", icon: MessageSquare },
      { id: "profil", label: "Profil Administrateur", icon: User },
      { id: "legal", label: "Cadre Légal & Dev", icon: Scale },
    ],
  };

  const activeMenuItems = menuConfig[role] || menuConfig["acheteur"];

  const handleLogout = async () => {
    try {
      if (logout) await logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <aside
      className={`bg-white border-r border-gray-200 h-full flex flex-col justify-between transition-all duration-300 shadow-sm relative ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* 1. SECTION DU HAUT (Titre & Rôle) */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          {!isCollapsed ? (
            <div>
              <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Espace {role}
              </span>
              <p className="text-[9px] text-gray-400 mt-1 font-medium truncate max-w-[150px]">
                {user?.displayName || user?.email || "Utilisateur"}
              </p>
            </div>
          ) : (
            <span className="text-center w-full text-lg">-</span>
          )}

          {/* Bouton pour rétracter la sidebar */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors border border-gray-100 cursor-pointer"
            title={isCollapsed ? "Déployer le menu" : "Rétracter le menu"}
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>

        {/* 2. LISTE DES LIENS DE NAVIGATION DYNAMIQUES */}
        <nav className="p-3 space-y-1">
          {activeMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-green-700 text-white shadow-md shadow-green-700/10"
                    : "text-gray-600 hover:text-green-700 hover:bg-green-50/50"
                }`}
              >
                <IconComponent
                  size={18}
                  className={
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-green-700"
                  }
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. SECTION DU BAS (Profil & Déconnexion) */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
        >
          <LogOut size={18} className="text-red-500" />
          {!isCollapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </aside>
  );
}
