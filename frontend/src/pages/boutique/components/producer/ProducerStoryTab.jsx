import React from "react";
import { BookOpen } from "lucide-react";

export default function ProducerStoryTab({ producerProfile, profileData, story, description }) {
  // 🔍 Récupération dynamique et flexible du profil fournisseur
  const profile = producerProfile || profileData || {};

  // Extraction automatique du texte renseigné dans Firestore (description, bio, story, etc.)
  const storyText =
    description ||
    story ||
    profile.description ||
    profile.bio ||
    profile.story ||
    profile.presentation;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs space-y-3 animate-fade-in">
      {/* En-tête de section épuré */}
      <div className="flex items-center gap-2 border-b border-gray-100/60 pb-2.5">
        <div className="w-6.5 h-6.5 bg-emerald-50/80 border border-emerald-100/60 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
          <BookOpen size={14} className="stroke-[1.3]" />
        </div>
        <h2 className="text-xs font-bold text-gray-900 tracking-tight">
          Présentation & Récit de l'exploitation
        </h2>
      </div>

      {/* Rendu dynamique de la description saisie par le maraîcher */}
      {storyText ? (
        <p className="text-[11px] text-gray-600 font-normal leading-relaxed whitespace-pre-line">
          {storyText}
        </p>
      ) : (
        <div className="p-3.5 bg-gray-50/40 border border-gray-100/80 rounded-xl">
          <p className="text-[11px] text-gray-400 font-normal italic">
            Chargement des informations de l'exploitation...
          </p>
        </div>
      )}
    </div>
  );
}