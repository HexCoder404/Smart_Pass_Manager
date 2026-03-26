import { useState } from "react";
import { PasswordEngine } from "../../utils/passwordEngine";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(22);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [strength, setStrength] = useState({ score: 0, label: "" });

  const generatePassword = () => {
    if (!upper && !lower && !numbers && !symbols) return;

    // Use the object directly and pass the options it expects
    const newPass = PasswordEngine.generatePassword(length, {
      uppercase: upper,
      lowercase: lower,
      numbers: numbers,
      symbols: symbols,
    });

    setPassword(newPass);

    // Convert the engine's 0-5 score to a 0-100 percentage for your UI
    const analysis = PasswordEngine.checkStrength(newPass);
    setStrength({
      score: (analysis.score / 5) * 100,
      label: analysis.label,
    });
  };

  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
    }
  };

  // Dynamic color logic
  const getColor = (score) => {
    if (score === 0) return { text: "text-slate-500", bg: "bg-slate-700" };
    if (score < 25) return { text: "text-red-500", bg: "bg-red-500" };
    if (score < 50) return { text: "text-orange-500", bg: "bg-orange-500" };
    if (score < 75) return { text: "text-yellow-500", bg: "bg-yellow-500" };
    return { text: "text-emerald-500", bg: "bg-emerald-500" };
  };

  const colors = getColor(strength.score);

  return (
    <div className="bg-[#111827] border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">Password Generator</h2>
      <p className="text-sm text-slate-400 mb-6">
        Generate strong, unique passwords with customizable options
      </p>

      <div className="bg-[#0f172a] border border-slate-700 p-4 rounded-xl mb-6 relative group">
        <div
          className={`font-mono text-lg break-all pr-10 min-h-14 flex items-center ${password ? colors.text : "text-slate-600"}`}
        >
          {password || <span>Click Generate...</span>}
        </div>

        <button
          onClick={copyToClipboard}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        </button>

        <div
          className={`mt-4 flex justify-between items-center text-xs font-bold mb-1 ${colors.text}`}
        >
          <span>Strength</span>
          <span>
            {strength.score > 0 ? `${strength.score}% — ${strength.label}` : ""}
          </span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`${colors.bg} h-full transition-all duration-300`}
            style={{ width: `${strength.score}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-white font-medium mb-2">
          <span>Length</span>
          <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
            {length}
          </span>
        </div>
        <input
          type="range"
          min="6"
          max="64"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>6</span>
          <span>64</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <label
          className={`flex items-center justify-between p-3 border ${upper ? "border-emerald-500" : "border-slate-700"} bg-[#0f172a] rounded-lg cursor-pointer transition`}
        >
          <span
            className={`${upper ? "text-emerald-400" : "text-slate-400"} text-sm`}
          >
            Uppercase (A-Z)
          </span>
          <input
            type="checkbox"
            checked={upper}
            onChange={(e) => setUpper(e.target.checked)}
            className="accent-emerald-500 w-4 h-4"
          />
        </label>
        <label
          className={`flex items-center justify-between p-3 border ${lower ? "border-emerald-500" : "border-slate-700"} bg-[#0f172a] rounded-lg cursor-pointer transition`}
        >
          <span
            className={`${lower ? "text-emerald-400" : "text-slate-400"} text-sm`}
          >
            Lowercase (a-z)
          </span>
          <input
            type="checkbox"
            checked={lower}
            onChange={(e) => setLower(e.target.checked)}
            className="accent-emerald-500 w-4 h-4"
          />
        </label>
        <label
          className={`flex items-center justify-between p-3 border ${numbers ? "border-emerald-500" : "border-slate-700"} bg-[#0f172a] rounded-lg cursor-pointer transition`}
        >
          <span
            className={`${numbers ? "text-emerald-400" : "text-slate-400"} text-sm`}
          >
            Numbers (0-9)
          </span>
          <input
            type="checkbox"
            checked={numbers}
            onChange={(e) => setNumbers(e.target.checked)}
            className="accent-emerald-500 w-4 h-4"
          />
        </label>
        <label
          className={`flex items-center justify-between p-3 border ${symbols ? "border-emerald-500" : "border-slate-700"} bg-[#0f172a] rounded-lg cursor-pointer transition`}
        >
          <span
            className={`${symbols ? "text-emerald-400" : "text-slate-400"} text-sm`}
          >
            Symbols (!@#)
          </span>
          <input
            type="checkbox"
            checked={symbols}
            onChange={(e) => setSymbols(e.target.checked)}
            className="accent-emerald-500 w-4 h-4"
          />
        </label>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={generatePassword}
          className="flex-1 py-3 bg-linear-to-r from-fuchsia-500 to-pink-500 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition"
        >
          🔄 Generate
        </button>
      </div>
    </div>
  );
}
