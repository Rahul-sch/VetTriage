import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { setApiKey, hasApiKey } from "../services/groq";

interface ApiKeyModalProps {
  onKeySet: () => void;
}

export function ApiKeyModal({ onKeySet }: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!key.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (!key.startsWith("gsk_")) {
      setError("Invalid key format. Groq keys start with 'gsk_'");
      return;
    }

    setApiKey(key.trim());
    onKeySet();
  };

  // If key already exists, don't show modal
  if (hasApiKey()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Welcome to VetTriage
        </h2>
        <p className="text-slate-600 mb-4">
          To analyze transcripts, please enter your Groq API key. Your key is
          stored locally and never sent to any server except Groq.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Groq API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setKey(e.target.value);
              setError("");
            }}
            placeholder="gsk_..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Save Key
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-500 mt-4">
          Get your free API key at{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:underline"
          >
            console.groq.com/keys
          </a>
        </p>
      </div>
    </div>
  );
}
