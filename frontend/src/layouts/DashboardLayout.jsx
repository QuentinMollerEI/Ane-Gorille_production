import React, { useState, useEffect } from 'react';
// ⚠️ IMPORTS CORRIGÉS : Chemin exact vers le sous-dossier "navigation"
import Sidebar from '../components/navigation/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('boutique');

  // Injecte activeTab aux composants enfants...
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { activeTab });
    }
    return child;
  });

  return (
    <div className="flex flex-grow items-stretch">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main className="flex-grow p-6 md:p-8 bg-gray-50/50">
        {childrenWithProps}
      </main>
    </div>
  );
}