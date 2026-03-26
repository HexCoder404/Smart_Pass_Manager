import { useState } from "react";
import { PasswordEngine } from "../../utils/passwordEngine";

export default function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const analysis = PasswordEngine.checkStrength(password);
  const scorePercentage = (analysis.score / 5) * 100;

  const details = {
    length:    password.length,
    uppercase: (password.match(/[A-Z]/g) || []).length,
    lowercase: (password.match(/[a-z]/g) || []).length,
    numbers:   (password.match(/[0-9]/g) || []).length,
  };

  const strokeDasharray  = 283;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * scorePercentage) / 100;

  const getColor = (score) => {
    if (score === 0 || !password) return { hex: "transparent", ring: "hsl(var(--border))", textClass: "text-muted-foreground" };
    if (score < 25)  return { hex: "#ef4444", ring: "#ef4444", textClass: "text-destructive" };
    if (score < 50)  return { hex: "#f97316", ring: "#f97316", textClass: "" };
    if (score < 75)  return { hex: "#eab308", ring: "#eab308", textClass: "" };
    return                  { hex: "#10b981", ring: "#10b981", textClass: "text-accent" };
  };
  const col = getColor(scorePercentage);

  const statCard = (label, value) => (
    <div key={label} className="card" style={{ padding: "1rem 1.25rem" }}>
      <div className="text-muted-foreground" style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: col.hex !== "transparent" ? col.hex : "hsl(var(--muted-foreground))" }}>
        {value}
      </div>
    </div>
  );

  return (
    <div className="card" style={{ padding: "2rem" }}>
      <h2 className="text-foreground" style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "0.35rem" }}>
        Password Strength Checker
      </h2>
      <p className="text-muted-foreground" style={{ fontSize: "0.875rem", marginBottom: "1.75rem" }}>
        Analyze your password across multiple security parameters.
      </p>

      {/* Input */}
      <div style={{ position: "relative", marginBottom: "2rem" }}>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input-base"
          placeholder="Type a password…"
          style={{ paddingRight: "3rem", fontSize: "1rem" }}
        />
        <button
          onClick={() => setShowPassword(v => !v)}
          className="btn-ghost"
          style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", padding: "0.35rem", lineHeight: 0 }}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
              <line x1="2" x2="22" y1="2" y2="22"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Score ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem" }}>
        <div style={{ position: "relative", width: "140px", height: "140px" }}>
          <svg className="transform -rotate-90" style={{ width: "100%", height: "100%" }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="7"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke={col.hex} strokeWidth="7"
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "1.9rem", fontWeight: "800", color: col.hex !== "transparent" ? col.hex : "hsl(var(--muted-foreground))", lineHeight: 1 }}>
              {scorePercentage}
            </span>
            <span style={{ fontSize: "0.7rem", color: col.hex !== "transparent" ? col.hex : "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>
              {analysis.label || "Empty"}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", height: "6px", borderRadius: "999px",
        backgroundColor: "hsl(var(--border))", overflow: "hidden", marginBottom: "1.75rem",
      }}>
        <div style={{
          height: "100%", width: `${scorePercentage}%`,
          backgroundColor: col.hex, borderRadius: "999px",
          transition: "width 0.5s ease, background-color 0.4s ease",
        }} />
      </div>

      {/* Analysis grid */}
      <h3 className="text-foreground" style={{ fontWeight: "700", marginBottom: "0.85rem" }}>Analysis</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {statCard("Length",    details.length)}
        {statCard("Uppercase", details.uppercase)}
        {statCard("Lowercase", details.lowercase)}
        {statCard("Numbers",   details.numbers)}
      </div>
    </div>
  );
}
