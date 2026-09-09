import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
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
  ShieldCheck,
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
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

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

  // 📡 Écoute en temps réel des demandes d'inscription en attente (pour l'admin)
  useEffect(() => {
    if (role !== "admin") return;
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const pendingUsers = snapshot.docs.filter((docSnap) => {
          const data = docSnap.data();
          return (
            data.accountStatus === "PENDING" ||
            (!data.accountStatus && data.isApproved === false)
          );
        });
        setPendingApprovalsCount(pendingUsers.length);
      },
      (err) => {
        console.error("Erreur d'écoute des demandes d'approbation :", err);
      },
    );
    return () => unsubscribe();
  }, [role]);

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
      {
        id: "moderation",
        label: "Centre de Modération",
        icon: ShieldCheck,
        badge: pendingApprovalsCount,
      },
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
      className={`bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="space-y-6">
        {/* 1. SECTION DU HAUT (Titre, Rôle & Bouton Rétracter) */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-150">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-amber-400 p-0.5 bg-white shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="/Logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-black text-[#2d5a3f] text-sm tracking-tight leading-tight truncate">
                  {user?.displayName || user?.companyName || user?.email}
                </span>
                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                  Espace {role}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full border border-amber-400 p-0.5 bg-white shadow-sm flex items-center justify-center mx-auto">
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            title={
              isCollapsed ? "Déplier la navigation" : "Réduire la navigation"
            }
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* 2. LISTE DES LIENS DE NAVIGATION DYNAMIQUES */}
        <nav className="space-y-1 text-xs font-bold">
          {activeMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const hasBadge = Boolean(item.badge && item.badge > 0);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#2d5a3f] text-white shadow-md font-extrabold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <IconComponent
                    size={18}
                    className={isActive ? "text-amber-400" : "text-gray-400"}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {hasBadge && !isCollapsed && (
                  <span className="ml-auto bg-amber-400 text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. SECTION DU BAS (Déconnexion) */}
      <div className="pt-4 border-t border-gray-150">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </aside>
  );
}
