import { useState, useEffect, useCallback } from "react";
import { PasswordEngine } from "../../utils/passwordEngine";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  // Wrap generate in useCallback to safely use it in useEffect
  const generate = useCallback(() => {
    // Ensure at least one option is selected to prevent infinite loops/empty pools
    const activeOptions = Object.values(options).some((val) => val);
    if (!activeOptions) {
      setPassword("Select at least one option");
      return;
    }
    const newPass = PasswordEngine.generatePassword(length, options);
    setPassword(newPass);
  }, [length, options]);

  // Generate a password as soon as the component loads
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  }, [generate]);

  const handleToggle = (option) => {
    setOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    alert("Copied to clipboard!");
  };

  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-xl text-white font-semibold mb-4">
        Generate Secure Password
      </h2>

      {/* Password Display */}
      <div className="bg-[#1e293b] p-4 rounded-lg flex justify-between items-center mb-6 border border-slate-600">
        <span className="text-2xl text-emerald-400 font-mono tracking-wider break-all">
          {password}
        </span>
        <button
          onClick={copyToClipboard}
          className="ml-4 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
          title="Copy to clipboard"
        >
          📋
        </button>
      </div>

      {/* Length Slider */}
      <div className="mb-6">
        <label className="text-slate-400 flex justify-between mb-2">
          <span>Password Length</span>
          <span className="text-white font-bold">{length}</span>
        </label>
        <input
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* Options Toggles */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.keys(options).map((opt) => (
          <label
            key={opt}
            className="flex items-center space-x-3 text-slate-300 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={options[opt]}
              onChange={() => handleToggle(opt)}
              className="w-5 h-5 rounded accent-indigo-500 bg-slate-700 border-slate-600"
            />
            <span className="capitalize">{opt}</span>
          </label>
        ))}
      </div>

      <button
        onClick={generate}
        className="w-full py-3 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold shadow-lg transition-all"
      >
        Generate New Password
      </button>
    </div>
  );
}
