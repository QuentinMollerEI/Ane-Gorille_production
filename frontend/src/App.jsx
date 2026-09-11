import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import Workspace from "./components/Workspace";
import DashboardLayout from "./layouts/DashboardLayout";
import RequireProfileCompleted from "./components/auth/RequireProfileCompleted";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-600">
            Chargement de votre session...
          </p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-600">
            Vérification de la session...
          </p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
          {/* En-tête de navigation universel */}
          <Navbar />

          {/* Zone de contenu dynamic principale */}
          <main className="flex-1 w-full">
            <Routes>
              {/* 🏠 Page d'accueil publique : Bandeau Hero */}
              <Route path="/" element={<Hero />} />

              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />

              {/* 🔒 Route Protégée + Validation de Conformité Profil */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <RequireProfileCompleted>
                      <DashboardLayout>
                        <Workspace />
                      </DashboardLayout>
                    </RequireProfileCompleted>
                  </PrivateRoute>
                }
              />

              {/* Redirection automatique pour routes inconnues vers la page d'accueil */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* 🦶 Footer universel (Accessible sur TOUTES les pages) */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
