import React from "react";

export default function ConfirmModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg text-center">
        <img
          src="/impact-iq-mascot.png"
          alt="Mascotte"
          className="w-20 mx-auto mb-4 drop-shadow"
        />
        <h2 className="text-xl font-bold text-impactTurquoise mb-2">Chats verwijderd</h2>
        <p className="text-gray-600 mb-4">
          De geselecteerde gesprekken zijn succesvol verwijderd.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-impactTurquoise text-white font-semibold hover:bg-impactTurquoise/80 transition"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}