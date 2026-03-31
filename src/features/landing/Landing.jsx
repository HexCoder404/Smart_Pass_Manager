import { Link } from "react-router-dom";

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--primary))", marginBottom: "0.75rem" }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const KeyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--primary))", marginBottom: "0.75rem" }}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6" />
    <path d="M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);

const LayoutIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--primary))", marginBottom: "0.75rem" }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

export default function Landing() {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <div className="card" style={{ padding: "2.5rem", marginBottom: "1.25rem" }}>

          <h1
            className="text-foreground"
            style={{
              fontSize: "2.2rem",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              marginBottom: "0.75rem",
              lineHeight: 1.1,
            }}
          >
            Store credentials securely.
            <br />
            Generate strong passwords fast.
          </h1>

          <p
            className="text-muted-foreground"
            style={{ fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}
          >
            HashSecure keeps your credentials safe and organized. Your sensitive fields
            (passwords and notes) are encrypted in the browser before being stored.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/auth" className="btn-primary" style={{ textDecoration: "none", padding: "0.85rem 1.75rem" }}>
              Get Started
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <ShieldIcon />
            <h3 className="text-foreground" style={{ fontWeight: 800, marginBottom: "0.5rem" }}>
              Encrypted Vault
            </h3>
            <p className="text-muted-foreground" style={{ lineHeight: 1.65, margin: 0 }}>
              Sensitive data is encrypted client-side using modern primitives like <strong>AES-256</strong> and{" "}
              <strong>SHA-256</strong>-based key derivation before it reaches the database.
            </p>
          </div>

          <div className="card" style={{ padding: "1.5rem" }}>
            <KeyIcon />
            <h3 className="text-foreground" style={{ fontWeight: 800, marginBottom: "0.5rem" }}>
              Password Tools
            </h3>
            <p className="text-muted-foreground" style={{ lineHeight: 1.65, margin: 0 }}>
              Built-in password generator and strength checker to help you create unique, stronger passwords.
            </p>
          </div>

          <div className="card" style={{ padding: "1.5rem" }}>
            <LayoutIcon />
            <h3 className="text-foreground" style={{ fontWeight: 800, marginBottom: "0.5rem" }}>
              Clean UI
            </h3>
            <p className="text-muted-foreground" style={{ lineHeight: 1.65, margin: 0 }}>
              Simple navigation, fast search/filtering by platform type, and one-click copy for passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

