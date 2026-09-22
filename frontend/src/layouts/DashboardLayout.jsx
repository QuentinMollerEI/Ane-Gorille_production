import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

/**
 * 🧭 COMPOSANT ARCHITECTURE : DashboardLayout.jsx
 * Emplacement : src/layouts/DashboardLayout.jsx
 * 
 * Agencement Flexbox équilibré et centré :
 * - Sidebar (Gauche) : occupe sa largeur naturelle (w-64 / w-20).
 * - Écran Central (main) : occupe 100 % de la largeur restante (flex-1 min-w-0) sans marge artificielle.
 * - Contenu Centré (max-w-7xl mx-auto) : s'adapte et reste parfaitement centré et visible.
 */
export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("boutique");

  // Injecte activeTab, isCollapsed et setIsCollapsed aux composants enfants
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        activeTab,
        isCollapsed,
        setIsCollapsed
      });
    }
    return child;
  });

  return (
    <div className="flex w-full min-h-screen bg-slate-50 relative">
      {/* 1. BARRE LATÉRALE (SIDEBAR DANS LE FLUX FLEXBOX) */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. ÉCRAN CENTRAL ADAPTATIF ET CENTRÉ (SANS DOUBLON DE MARGE) */}
      <main className="flex-1 min-w-0 transition-all duration-300 p-4 sm:p-6 lg:p-8 bg-slate-50/50 flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {childrenWithProps}
        </div>
      </main>
    </div>
  );
}
