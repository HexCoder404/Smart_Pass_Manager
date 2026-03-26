import { useState, createContext, useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import PasswordGenerator from './features/passwordgenerator/PasswordGenerator';
import PasswordChecker from './features/passwordchecker/PasswordChecker';
import VaultDashboard from './features/vault/AddPasswordForm';

/* ── Toast Context ──────────────────────────────────────────────────────── */
export const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = (message, type = "default") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed", bottom: "1.5rem", right: "1.5rem",
        display: "flex", flexDirection: "column", gap: "0.75rem", zIndex: 9999
      }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-enter" style={{
            backgroundColor: t.type === "error" ? "hsl(var(--destructive))" : "hsl(var(--card))",
            color: t.type === "error" ? "hsl(var(--destructive-foreground))" : "hsl(var(--foreground))",
            padding: "0.6rem 1.1rem", borderRadius: "100px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: t.type === "error" ? "none" : "1px solid hsl(var(--border))",
            fontWeight: "500", fontSize: "0.85rem",
            display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── Theme Context ──────────────────────────────────────────────────────── */
export const ThemeContext = createContext(null);
export function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("hs-theme") || "dark");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("hs-theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function VaultIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9v-3M12 18v-3M9 12H6M18 12h-3"/>
    </svg>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        style={{
          color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
          fontWeight: active ? "600" : "500",
          padding: "0.45rem 0.85rem",
          borderRadius: "var(--radius)",
          backgroundColor: active ? "hsl(var(--muted))" : "transparent",
          transition: "all 0.15s",
          fontSize: "0.875rem",
          textDecoration: "none",
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className="navbar-glass"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
      }}
    >
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 1.5rem",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        {/* Logo on the left */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "hsl(var(--primary))" }}>
            <LockIcon />
          </span>
          <span style={{
            fontWeight: "800",
            fontSize: "1.15rem",
            color: "hsl(var(--foreground))",
            letterSpacing: "-0.02em",
          }}>
            Hash<span style={{ color: "hsl(var(--primary))" }}>Secure</span>
          </span>
        </Link>
        
        {/* Nav Links and Theme Toggle on the right */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <nav style={{ display: "flex", gap: "0.25rem" }}>
            {navLink("/", "Vault")}
            {navLink("/tools", "Tools")}
          </nav>

          <button
            onClick={toggle}
            className="btn-ghost"
            style={{ padding: "0.45rem", lineHeight: 0 }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Main Tools (tab page) ─────────────────────────────────────────────── */
function MainTools() {
  const [activeTab, setActiveTab] = useState("checker");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* Tab switcher */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.35rem",
        backgroundColor: "hsl(var(--muted))",
        borderRadius: "calc(var(--radius) + 4px)",
        marginBottom: "2rem",
        width: "100%",
        maxWidth: "500px",
      }}>
        {[
          { key: "checker", label: "🔍 Strength Checker" },
          { key: "generator", label: "⚡ Password Generator" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "0.55rem 1rem",
              borderRadius: "var(--radius)",
              fontWeight: "600",
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
              transition: "all 0.18s",
              backgroundColor: activeTab === tab.key ? "hsl(var(--card))" : "transparent",
              color: activeTab === tab.key ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {activeTab === "checker" ? <PasswordChecker /> : <PasswordGenerator />}
      </div>
    </div>
  );
}

/* ── App Root ────────────────────────────────────────────────────────────── */
function AppContent() {
  const location = useLocation();
  return (
    <div className="bg-background" style={{ minHeight: "100vh" }}>
      <Navbar />
      <main style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "2.5rem 1.5rem",
      }}>
        <div key={location.pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<VaultDashboard />} />
            <Route path="/tools" element={<MainTools />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}
