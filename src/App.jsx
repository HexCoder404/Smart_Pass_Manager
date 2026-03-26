import { useState } from "react";
import PasswordGenerator from "./features/passwordgenerator/PasswordGenerator";
import PasswordChecker from "./features/passwordchecker/PasswordChecker";
import AddPasswordForm from "./features/vault/AddPasswordForm";

function App() {
  const [activeTab, setActiveTab] = useState("generator");

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 font-sans">
      {/* Tab Navigation */}
      <div className="w-full max-w-2xl mb-8 flex space-x-4">
        <button
          onClick={() => setActiveTab("checker")}
          className={`flex-1 py-3 rounded-lg shadow font-medium transition-all duration-200 ${
            activeTab === "checker"
              ? "bg-[#1e293b] text-emerald-400 border border-slate-600"
              : "bg-[#0f172a] text-slate-400 hover:bg-[#1e293b]"
          }`}
        >
          🔍 Strength Checker
        </button>

        <button
          onClick={() => setActiveTab("generator")}
          className={`flex-1 py-3 rounded-lg shadow font-medium transition-all duration-200 ${
            activeTab === "generator"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              : "bg-[#0f172a] text-slate-400 hover:bg-[#1e293b]"
          }`}
        >
          ⚡ Generator
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex-1 py-3 rounded-lg shadow font-medium transition-all duration-200 ${
            activeTab === "vault"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
              : "bg-[#0f172a] text-slate-400 hover:bg-[#1e293b]"
          }`}
        >
          🔐 Secure Vault
        </button>
      </div>

      {/* Component Rendering */}
      <div className="w-full max-w-2xl">
        {activeTab === "checker" && <PasswordChecker />}
        {activeTab === "generator" && <PasswordGenerator />}
        {activeTab === "vault" && <AddPasswordForm />}
      </div>
    </div>
  );
}

export default App;
