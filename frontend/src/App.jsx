import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

import Navbar from "./components/navigation/Navbar.jsx";
import Footer from "./components/navigation/Footer.jsx";
import Workspace from "./components/navigation/Workspace.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import Register from "./components/auth/Register.jsx";
import Login from "./components/auth/Login.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
            <Navbar />
            <main className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}