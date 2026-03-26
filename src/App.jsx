import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PasswordGenerator from "./features/passwordgenerator/PasswordGenerator";
import PasswordChecker from "./features/passwordchecker/PasswordChecker";
import VaultDashboard from "./features/vault/VaultDashboard"; // Adjust path if needed

// 1. We isolate your exact tab logic into its own component for the home page
function MainTools() {
  const [activeTab, setActiveTab] = useState("generator");

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-2xl mb-8 flex space-x-4">
        <button
          onClick={() => setActiveTab("checker")}
          className={`flex-1 py-3 rounded-lg shadow font-medium ${activeTab === "checker" ? "bg-[#1e293b] text-emerald-400 border border-slate-600" : "bg-[#0f172a] text-slate-400"}`}
        >
          🔍 Strength Checker
        </button>
        <button
          onClick={() => setActiveTab("generator")}
          className={`flex-1 py-3 rounded-lg shadow font-medium ${activeTab === "generator" ? "bg-linear-to-r from-purple-600 to-indigo-600 text-white" : "bg-[#0f172a] text-slate-400"}`}
        >
          ⚡ Password Generator
        </button>
      </div>

      <div className="w-full max-w-2xl">
        {activeTab === "generator" ? (
          <PasswordGenerator />
        ) : (
          <PasswordChecker />
        )}
      </div>
    </div>
  );
}

// 2. The main App now handles the Top Navigation and Routing
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0b1120] flex flex-col p-6 font-sans">
        {/* Top Navigation Bar */}
        <div className="w-full max-w-4xl mx-auto flex justify-between items-center mb-12 pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-indigo-500 tracking-wide">
            Smart Pass Manager
          </h1>
          <nav className="flex space-x-4 items-center">
            <Link
              to="/"
              className="px-4 py-2 text-slate-300 hover:text-white transition font-medium"
            >
              Tools
            </Link>
            <Link
              to="/vault"
              className="px-5 py-2.5 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition"
            >
              🔐 Secure Vault
            </Link>
          </nav>
        </div>

        {/* Page Routing */}
        <div className="flex-1 flex flex-col items-center">
          <Routes>
            {/* The home page renders your exact tab setup */}
            <Route path="/" element={<MainTools />} />

            {/* The vault page renders completely independently */}
            <Route path="/vault" element={<VaultDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
