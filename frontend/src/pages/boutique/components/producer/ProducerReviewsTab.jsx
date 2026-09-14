import React from "react";
import { Star } from "lucide-react";

export default function ProducerReviewsTab({ reviews }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
        <Star className="text-amber-500" size={18} />
        <span>Avis des acheteurs</span>
      </h2>
      {reviews.length === 0 ? (
        <p className="text-gray-500 italic">Aucun avis n'a encore été déposé pour ce producteur.</p>
      ) : (
        <div className="space-y-3 divide-y divide-gray-100">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{rev.buyerName || "Acheteur Pro"}</span>
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {rev.rating}/5
                </span>
              </div>
              <p className="text-gray-600">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}