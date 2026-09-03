import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, LayoutDashboard, LogOut, UserCheck, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
    }
  };

  // Vérifie quelle page est actuellement active pour appliquer un style visuel "actif"
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-150 sticky top-0 z-40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* LOGO & NOM DE MARQUE */}
        <Link to="/" className="flex items-center space-x-3.5 group">
          {/* Logo officiel servi depuis le dossier public avec bordure jaune de marque */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gold bg-white flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-300">
            <img
              src="/Logo.png"
              alt="Logo Âne & Gorille"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-brand-green tracking-tight leading-tight group-hover:text-opacity-90 transition-opacity">
              Âne et Gorille
            </span>
            {/* Slogan mis en valeur en jaune doré */}
            <span className="text-[10px] text-brand-gold font-extrabold uppercase tracking-widest leading-none mt-0.5">
              L'énergie alimentaire
            </span>
          </div>
        </Link>

        {/* CONTROLES DE NAVIGATION & AUTHENTIFICATION */}
        <div className="flex items-center space-x-6">

          {/* Lien Boutique Public */}
          <Link
            to="/"
            className={`text-sm font-bold flex items-center space-x-2 transition-colors py-2 px-1 border-b-2 ${
              isActive('/')
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-gray-500 hover:text-brand-green'
            }`}
          >
            <ShoppingBag size={16} />
            <span>Boutique</span>
          </Link>

          {user ? (
            <>
              {/* Bouton Tableau de Bord connecté */}
              <Link
                to="/dashboard"
                className={`text-sm font-bold flex items-center space-x-2 transition-all py-2 px-3.5 rounded-xl border ${
                  isActive('/dashboard')
                    ? 'bg-brand-green text-white border-brand-green shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Espace Connecté</span>
              </Link>

              <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />

              {/* COMPOSANT D'IDENTITÉ UTILISATEUR */}
              <div className="flex items-center space-x-4">

                {/* Bloc Informations Profil */}
                <div className="text-right hidden md:block">
                  <div className="flex items-center justify-end space-x-1.5">
                    <p className="text-xs font-bold text-brand-dark">{user.displayName}</p>

                    {/* Indicateur visuel de conformité réglementaire (Étape 2) */}
                    {user.profileComplete ? (
                      <ShieldCheck
                        size={14}
                        className="text-emerald-500"
                        title="Compte certifié conforme aux réglementations"
                      />
                    ) : (
                      <ShieldAlert
                        size={14}
                        className="text-amber-500 animate-pulse"
                        title="Action requise : Complétez vos justificatifs dans l'onglet Mon Profil"
                      />
                    )}
                  </div>

                  {/* Badge de Rôle Métier de l'utilisateur */}
                  <span className="text-[8px] font-extrabold text-brand-green uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-md border border-green-100 inline-block mt-1">
                    {user.role}
                  </span>
                </div>

                {/* Bouton de Déconnexion Épuré */}
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100/75 px-3 py-2.5 rounded-xl transition-all border border-red-100 flex items-center space-x-1.5"
                  title="Se déconnecter"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>

              </div>
            </>
          ) : (
            <>
              {/* LIENS HORS CONNEXION */}
              <Link
                to="/login"
                className="text-sm font-bold text-brand-green hover:text-opacity-80 transition-colors"
              >
                Connexion
              </Link>

              <Link
                to="/register"
                className="text-sm font-extrabold text-white bg-brand-green hover:bg-opacity-95 px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
