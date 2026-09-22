import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

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
    <div className="flex w-full min-h-screen bg-gray-50 items-stretch">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {/* 🛠️ Marge dynamique ml-20 / ml-64 + min-w-0 pour l'adaptation écran */}
      <main 
        className={`flex-1 min-w-0 transition-all duration-300 p-6 md:p-8 bg-gray-50/50 ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {childrenWithProps}
      </main>
    </div>
  );
}