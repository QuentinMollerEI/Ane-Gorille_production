import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // 👈 Ajout indispensable pour le panier global

// Import des éléments de structure globaux
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DashboardLayout from "./layouts/DashboardLayout";

// Import de vos vues applicatives
import Hero from "./components/Hero";
import Workspace from "./components/Workspace";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

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
 * Vue Publique de la Boutique / Accueil
 */
function PublicHome() {
  return (
    <>
      <Hero />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        {" "}
        {/* 👈 Enveloppe le Router pour fournir le contexte du panier à toute l'application */}
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <div className="min-h-screen flex flex-col bg-brand-light relative">
            {/* Navbar universelle */}
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

            {/* Footer universel */}
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
