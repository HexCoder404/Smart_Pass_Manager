import { useState } from "react";
import { PasswordEngine } from "../../utils/passwordEngine";

export default function PasswordChecker() {
  const [inputData, setInputData] = useState("");
  const [analysis, setAnalysis] = useState({
    score: 0,
    label: "Empty",
    entropy: 0,
    suggestions: [],
  });

  const evaluatePassword = (e) => {
    const val = e.target.value;
    setInputData(val);
    setAnalysis(PasswordEngine.checkStrength(val));
  };

  // Determine colors based on the 0-5 score
  const getScoreColor = () => {
    if (analysis.score >= 4) return "bg-emerald-500";
    if (analysis.score >= 2) return "bg-yellow-500";
    if (analysis.score > 0) return "bg-red-500";
    return "bg-slate-700";
  };

  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-xl text-white font-semibold mb-4">
        Analyze Password Strength
      </h2>

      <input
        type="text"
        value={inputData}
        onChange={evaluatePassword}
        placeholder="Type a password to analyze..."
        className="w-full bg-[#1e293b] border border-slate-600 text-white p-4 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors mb-4 text-lg"
      />

      {/* Strength Meter */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">
            Strength: <strong className="text-white">{analysis.label}</strong>
          </span>
          <span className="text-slate-400">
            Entropy:{" "}
            <strong className="text-white">{analysis.entropy} bits</strong>
          </span>
        </div>
        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden flex">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className={`h-full flex-1 border-r border-slate-800 last:border-0 transition-all duration-300 ${index < analysis.score ? getScoreColor() : "bg-transparent"}`}
            ></div>
          ))}
        </div>
      </div>

      {/* AI/Engine Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-600">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            Suggestions for improvement:
          </h3>
          <ul className="list-disc pl-5 text-slate-400 space-y-1 text-sm">
            {analysis.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.score >= 4 && (
        <div className="mt-4 p-3 bg-emerald-900/30 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm text-center">
          ✓ This password is highly resistant to brute-force attacks.
        </div>
      )}
    </div>
  );
}
