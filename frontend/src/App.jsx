import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import des éléments de structure globaux (qui gèrent désormais leur propre visuel)
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DashboardLayout from "./layouts/DashboardLayout";

// Import de vos vues applicatives
import Hero from "./components/Hero";
import ShopContainer from "./components/ShopContainer";
import Workspace from "./components/Workspace";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// 🛒 IMPORT DU PANIER FLOTTANT MODERNE
// (Note : Ajustez légèrement le chemin relatif si votre fichier App.jsx n'est pas à la racine de /src)
import CartFloatingWidget from "./pages/boutique/components/CartFloatingWidget";

/**
 * Gardien de sécurité (PrivateRoute)
 * Bloque l'accès si déconnecté et affiche un écran de chargement propre.
 */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

/**
 * Vue Publique de la Boutique
 */
function PublicHome() {
  return (
    <>
      <Hero />
      <ShopContainer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen flex flex-col bg-brand-light relative">
          {/* Navbar universelle : sa structure visuelle est gérée uniquement dans son fichier */}
          <Navbar />

          {/* Zone de contenu dynamique */}
          <div className="flex-grow flex flex-col">
            <Routes>
              {/* Routes Publiques */}
              <Route path="/" element={<PublicHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Route Privée Connectée */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Workspace />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              {/* Redirection automatique de secours */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Footer universel : sa structure visuelle est gérée uniquement dans son fichier */}
          <Footer />

          {/* 🛒 LE PANIER FLOTTANT GLOBAL
              Placé ici, il reste visible et réactif sur toutes les pages publiques (Boutique, Login, Register...)
              et se met à jour automatiquement dès qu'un produit est ajouté ! */}
          <CartFloatingWidget />
        </div>
      </Router>
    </AuthProvider>
  );
}
