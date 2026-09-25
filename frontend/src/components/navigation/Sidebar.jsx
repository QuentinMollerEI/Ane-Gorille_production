import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
// ⚠️ CORRECTION : ../../context au lieu de ../context[cite: 6, 7]
import { useAuth } from "../../context/AuthContext";
import { 
  ShoppingCart, Layers, ListTodo, Route, 
  PackageSearch, Calculator, UserCog, ChevronLeft, 
  ChevronRight
} from "lucide-react";

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentModule = params.get("module") || "default";

  const role = userProfile?.role || user?.role || "acheteur_prive";

  const handleNav = (module) => {
    navigate(`/dashboard?module=${module}`);
  };

  const getDefaultModule = (r) => {
    if (r === "producteur" || r === "producer") return "rayon";
    if (r === "livreur" || r === "carrier") return "route";
    return "boutique";
  };

  const NavItem = ({ module, icon: Icon, label }) => {
    const isActive = currentModule === module || (currentModule === "default" && module === getDefaultModule(role));
    
    return (
      <button
        onClick={() => handleNav(module)}
        title={isCollapsed ? label : ""}
        className={`w-full flex items-center relative transition-all duration-200 group ${
          isCollapsed ? "justify-center px-0 py-3" : "justify-start px-3.5 py-2.5"
        } rounded-xl text-[13px] font-medium ${
          isActive 
            ? "bg-emerald-50/80 text-emerald-800 font-bold border-l-4 border-emerald-800 rounded-l-none shadow-xs" 
            : "text-gray-500 hover:bg-gray-50 hover:text-emerald-800"
        }`}
      >
        <Icon 
          size={18} 
          strokeWidth={isActive ? 2.2 : 1.5} 
          className={`shrink-0 transition-transform duration-200 ${
            isActive 
              ? "text-emerald-800" 
              : "text-gray-400 group-hover:text-emerald-800 group-hover:scale-105"
          }`} 
        />
        {!isCollapsed && <span className="ml-3 truncate tracking-wide">{label}</span>}
      </button>
    );
  };

  return (
        <aside 
  className={`bg-white border-r border-slate-200 h-[calc(100vh-4rem)] flex flex-col gap-1 sticky top-16 transition-all duration-300 z-30 shadow-xs ${
    isCollapsed ? "w-20 p-3 pt-5" : "w-64 p-4 pt-5"
  }`}
>
      {/* Bouton de rétraction de la Sidebar */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 bg-white border border-gray-200 text-gray-400 hover:text-emerald-800 hover:border-emerald-600 hover:shadow-sm rounded-full p-1.5 transition-all z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={2} /> : <ChevronLeft size={14} strokeWidth={2} />}
      </button>
      {/* Deuxième Bouton de rétraction de la Sidebar */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 bottom-7 bg-white border border-gray-200 text-gray-400 hover:text-emerald-800 hover:border-emerald-600 hover:shadow-sm rounded-full p-1.5 transition-all z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={2} /> : <ChevronLeft size={14} strokeWidth={2} />}
      </button>

      {/* En-tête simplifié : Uniquement "MENU" */}
      <div className={`flex items-center mb-6 mt-1 transition-all ${isCollapsed ? "justify-center" : "px-3"}`}>
        <span className={`font-black uppercase tracking-widest text-gray-400 ${isCollapsed ? "text-[10px]" : "text-xs"}`}>
          Menu
        </span>
      </div>
      
      {/* Liste des modules selon le rôle */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {(role.includes("acheteur") || role.includes("client") || role === "admin") && (
          <NavItem module="boutique" icon={ShoppingCart} label="Boutique & Achats" />
        )}

        {(role === "producteur" || role === "producer" || role === "admin") && (
          <>
            <NavItem module="rayon" icon={Layers} label="Gestion des Stocks" />
            <NavItem module="prep" icon={ListTodo} label="Ordres de Préparation" />
          </>
        )}

        {(role === "livreur" || role === "carrier" || role === "admin") && (
          <NavItem module="route" icon={Route} label="Tournées & Logistique" />
        )}

        {(role.includes("acheteur") || role.includes("client") || role === "admin") && (
          <NavItem module="suivi" icon={PackageSearch} label="Suivi des Commandes" />
        )}
        
        {role !== "livreur" && role !== "carrier" && (
          <NavItem module="compta" icon={Calculator} label="Facturation & Compta" />
        )}
      </div>

      {/* Accès Profil */}
      <div className="mt-auto border-t border-gray-100 pt-3 pb-1">
        <NavItem module="profil" icon={UserCog} label="Paramètres du Profil" />
      </div>
    </aside>
  );
}