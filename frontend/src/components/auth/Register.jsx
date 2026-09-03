import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('acheteur_prive'); // Par défaut : acheteur privé
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName, role);
      // Après l'inscription, redirection automatique vers le Dashboard
      // où une alerte guidera l'utilisateur vers l'Étape 2 (Mon Profil)
      navigate('/dashboard');
    } catch (err) {
      setError("Erreur de création de compte : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md border border-gray-150">
        <div className="text-center mb-8">
          <img src="/Logo.png" alt="Logo" className="w-16 h-16 mx-auto rounded-full border-2 border-brand-gold mb-3" />
          <h2 className="text-2xl font-bold text-brand-green">Créer un compte</h2>
          <p className="text-xs text-gray-500 mt-1">Rejoignez la coopérative de la Rosée</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nom / Enseigne d'exploitation</label>
            <input
              type="text"
              required
              placeholder="Ex: Ferme de Ramonville / Mairie de Toulouse"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email professionnel</label>
            <input
              type="email"
              required
              placeholder="votre-adresse@domaine.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Votre Profil Métier</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white text-gray-700"
            >
              <option value="acheteur_prive">Acheteur Établissement Privé (Hôtel, Resto, Cantine Privée)</option>
              <option value="acheteur_public">Acheteur Établissement Public (Mairie, Hôpital, École - Chorus Pro)</option>
              <option value="producteur">Producteur Local (Producteur, Agriculteur - Stripe Connect)</option>
              <option value="livreur">Livreur Coopératif (Logistique - Agrément DREAL)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-green hover:bg-opacity-95 text-white font-semibold rounded-lg text-sm shadow transition-all disabled:opacity-50"
          >
            {loading ? "Création en cours..." : "Créer mon compte (Étape 1/2)"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-brand-green font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
