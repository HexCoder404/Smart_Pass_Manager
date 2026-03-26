import { useState } from "react";
import { PasswordEngine } from "../../utils/passwordEngine";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [length, setLength]     = useState(22);
  const [upper, setUpper]       = useState(true);
  const [lower, setLower]       = useState(true);
  const [numbers, setNumbers]   = useState(true);
  const [symbols, setSymbols]   = useState(true);
  const [strength, setStrength] = useState({ score: 0, label: "" });
  const [copied, setCopied]     = useState(false);

  const generate = () => {
    if (!upper && !lower && !numbers && !symbols) return;
    const newPass = PasswordEngine.generatePassword(length, { uppercase: upper, lowercase: lower, numbers, symbols });
    setPassword(newPass);
    const a = PasswordEngine.checkStrength(newPass);
    setStrength({ score: (a.score / 5) * 100, label: a.label });
  };

  const copy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strengthColor = (s) => {
    if (s === 0)  return "hsl(var(--border))";
    if (s < 25)   return "#ef4444";
    if (s < 50)   return "#f97316";
    if (s < 75)   return "#eab308";
    return              "#10b981";
  };
  const sc = strengthColor(strength.score);

  const Option = ({ label, checked, onChange }) => (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0.7rem 1rem",
      border: `1px solid ${checked ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
      borderRadius: "var(--radius)",
      cursor: "pointer",
      transition: "border-color 0.15s",
      backgroundColor: "hsl(var(--background))",
    }}>
      <span style={{
        fontSize: "0.875rem", fontWeight: "500",
        color: checked ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
        transition: "color 0.15s",
      }}>
        {label}
      </span>
      <input
        type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: "hsl(var(--primary))", width: "16px", height: "16px" }}
      />
    </label>
  );

  return (
    <div className="card" style={{ padding: "2rem" }}>
      <h2 className="text-foreground" style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "0.35rem" }}>
        Password Generator
      </h2>
      <p className="text-muted-foreground" style={{ fontSize: "0.875rem", marginBottom: "1.75rem" }}>
        Generate strong, unique passwords with customisable options.
      </p>

      {/* Generated password display */}
      <div style={{
        backgroundColor: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius)",
        padding: "1rem 1rem 0.75rem",
        marginBottom: "1.5rem",
        position: "relative",
      }}>
        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "1rem",
          wordBreak: "break-all",
          minHeight: "2.5rem",
          paddingRight: "2.5rem",
          color: password ? sc : "hsl(var(--muted-foreground))",
          display: "flex", alignItems: "center",
        }}>
          {password || <span style={{ color: "hsl(var(--muted-foreground))" }}>Click Generate…</span>}
        </div>

        {/* Copy button */}
        <button
          onClick={copy}
          className="btn-ghost"
          style={{ position: "absolute", top: "0.75rem", right: "0.5rem", padding: "0.3rem", lineHeight: 0 }}
          title="Copy to clipboard"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            </svg>
          )}
        </button>

        {/* Strength bar */}
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
            <span className="text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: "600" }}>Strength</span>
            {strength.score > 0 && (
              <span style={{ fontSize: "0.75rem", fontWeight: "600", color: sc }}>
                {strength.score}% — {strength.label}
              </span>
            )}
          </div>
          <div style={{ height: "5px", borderRadius: "999px", backgroundColor: "hsl(var(--border))", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${strength.score}%`,
              backgroundColor: sc, borderRadius: "999px",
              transition: "width 0.4s ease, background-color 0.3s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Length slider */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <span className="text-foreground" style={{ fontWeight: "600", fontSize: "0.9rem" }}>Length</span>
          <span style={{
            padding: "0.2rem 0.65rem", borderRadius: "var(--radius)",
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
            fontWeight: "700", fontSize: "0.875rem",
          }}>
            {length}
          </span>
        </div>
        <input
          type="range" min="6" max="64" value={length}
          onChange={e => setLength(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "hsl(var(--primary))", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
          <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>6</span>
          <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>64</span>
        </div>
      </div>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "1.75rem" }}>
        <Option label="Uppercase (A-Z)" checked={upper}   onChange={setUpper} />
        <Option label="Lowercase (a-z)" checked={lower}   onChange={setLower} />
        <Option label="Numbers (0-9)"   checked={numbers} onChange={setNumbers} />
        <Option label="Symbols (!@#)"   checked={symbols} onChange={setSymbols} />
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        className="btn-primary"
        style={{ width: "100%", padding: "0.8rem", fontSize: "0.95rem" }}
      >
        ⚡ Generate
      </button>
    </div>
  );
}
