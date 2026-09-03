import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function NavbarAuth() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Logo Âne & Gorille */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-full border-2 border-brand-gold overflow-hidden">
          <img src="/Logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base text-brand-green leading-none">Âne & Gorille</span>
          <span className="text-[10px] text-brand-gold font-medium">L'énergie alimentaire</span>
        </div>
      </div>

      {/* Infos Utilisateur & Déconnexion */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 border-r border-gray-200 pr-6">
          <div className="w-8 h-8 rounded-full bg-brand-green bg-opacity-10 flex items-center justify-center text-brand-green">
            <User size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-none">{user?.displayName}</p>
            <p className="text-[10px] text-gray-500 capitalize mt-1">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut size={16} className="mr-2" />
          Se déconnecter
        </button>
      </div>
    </nav>
  );
}
