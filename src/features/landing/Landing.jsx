import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <div className="card" style={{ padding: "2.5rem", marginBottom: "1.25rem" }}>
          <span
            className="badge"
            style={{
              backgroundColor: "hsla(var(--primary) / 0.12)",
              color: "hsl(var(--primary))",
              marginBottom: "0.75rem",
              width: "fit-content",
            }}
          >
            SMART PASS MANAGER
          </span>

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
            HashSecure is a simple password manager-style app built with React and Supabase. Your sensitive fields
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
            <h3 className="text-foreground" style={{ fontWeight: 800, marginBottom: "0.5rem" }}>
              Encrypted Vault
            </h3>
            <p className="text-muted-foreground" style={{ lineHeight: 1.65, margin: 0 }}>
              Sensitive data is encrypted client-side using modern primitives like <strong>AES-256</strong> and{" "}
              <strong>SHA-256</strong>-based key derivation before it reaches the database.
            </p>
          </div>

          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 className="text-foreground" style={{ fontWeight: 800, marginBottom: "0.5rem" }}>
              Password Tools
            </h3>
            <p className="text-muted-foreground" style={{ lineHeight: 1.65, margin: 0 }}>
              Built-in password generator and strength checker to help you create unique, stronger passwords.
            </p>
          </div>

          <div className="card" style={{ padding: "1.5rem" }}>
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

