import { useState } from "react";
import { PasswordEngine } from "../../utils/passwordEngine";

export default function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const engine = new PasswordEngine();
  const strength = engine.checkStrength(password);
  const { details } = strength;

  const strokeDasharray = 283;
  const strokeDashoffset =
    strokeDasharray - (strokeDasharray * strength.score) / 100;

  // Dynamic color logic for HEX (SVG) and Tailwind classes
  const getColor = (score) => {
    if (score === 0 || !password)
      return { hex: "transparent", bg: "bg-slate-700", text: "text-slate-400" };
    if (score < 25)
      return { hex: "#ef4444", bg: "bg-red-500", text: "text-red-500" }; // red
    if (score < 50)
      return { hex: "#f97316", bg: "bg-orange-500", text: "text-orange-500" }; // orange
    if (score < 75)
      return { hex: "#eab308", bg: "bg-yellow-500", text: "text-yellow-500" }; // yellow
    return { hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500" }; // green
  };

  const colors = getColor(strength.score);

  return (
    <div className="bg-[#111827] border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">
        Password Strength Checker
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Enter a password to analyze its strength across multiple security
        parameters
      </p>

      <div className="relative mb-8">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full bg-[#0f172a] border border-slate-700 text-white text-lg rounded-xl p-4 pr-12 focus:outline-none transition ${password ? `focus:border-[${colors.hex}]` : "focus:border-slate-500"}`}
          placeholder="Type a password..."
          style={{ outlineColor: colors.hex }}
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          {showPassword ? (
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
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          ) : (
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
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg
            className="transform -rotate-90 w-full h-full"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1e293b"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={colors.hex}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span
              className={`text-4xl font-bold ${password ? colors.text : "text-slate-500"}`}
            >
              {strength.score}
            </span>
            <span
              className={`text-xs ${password ? colors.text : "text-slate-500"}`}
            >
              {strength.label || "Awaiting Input"}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden mb-8">
        <div
          className={`${colors.bg} h-full transition-all duration-500 ease-out`}
          style={{ width: `${strength.score}%` }}
        ></div>
      </div>

      <h3 className="text-white font-bold mb-4">Analysis</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0f172a] border border-slate-700 p-4 rounded-xl">
          <div className="text-slate-400 text-sm mb-1">Length</div>
          <div className="text-emerald-400 text-xl font-bold">
            {details.length}
          </div>
        </div>
        <div className="bg-[#0f172a] border border-slate-700 p-4 rounded-xl">
          <div className="text-slate-400 text-sm mb-1">Uppercase</div>
          <div className="text-emerald-400 text-xl font-bold">
            {details.uppercase}
          </div>
        </div>
        <div className="bg-[#0f172a] border border-slate-700 p-4 rounded-xl">
          <div className="text-slate-400 text-sm mb-1">Lowercase</div>
          <div className="text-emerald-400 text-xl font-bold">
            {details.lowercase}
          </div>
        </div>
        <div className="bg-[#0f172a] border border-slate-700 p-4 rounded-xl">
          <div className="text-slate-400 text-sm mb-1">Numbers</div>
          <div className="text-emerald-400 text-xl font-bold">
            {details.numbers}
          </div>
        </div>
      </div>
    </div>
  );
}
