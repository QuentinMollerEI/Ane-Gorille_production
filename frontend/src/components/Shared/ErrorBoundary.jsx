// frontend/src/components/Shared/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour afficher l'interface de secours au prochain rendu.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Tu pourras brancher ici un outil comme Firebase Crashlytics ou Sentry plus tard
    console.error("Erreur capturée par l'Error Boundary :", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oups, un problème est survenu.</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            L'interface a rencontré une erreur inattendue. Nos équipes ont été notifiées.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;