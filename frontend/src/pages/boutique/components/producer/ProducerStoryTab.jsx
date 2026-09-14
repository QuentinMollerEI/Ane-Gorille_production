import React from "react";
import { BookOpen } from "lucide-react";

export default function ProducerStoryTab({ description }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
        <BookOpen className="text-emerald-700" size={18} />
        <span>Présentation de l'exploitation</span>
      </h2>
      <p className="text-gray-600 leading-relaxed text-xs">
        {description || "Ce producteur n'a pas encore rédigé sa présentation, mais sa production est certifiée conforme au réseau Âne & Gorille."}
      </p>
    </div>
  );
}