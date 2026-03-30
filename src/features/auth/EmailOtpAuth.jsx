import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useAuth, useToast } from "../../App";

function maskEmail(email) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const shortName = name.length <= 2 ? name[0] + "*" : name.slice(0, 2) + "*".repeat(Math.min(6, name.length - 2));
  return `${shortName}@${domain}`;
}

export default function EmailOtpAuth() {
  const [step, setStep] = useState("request"); // request | verify
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    return location.state?.from || "/vault";
  }, [location.state]);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:3001/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast(data.error || "Failed to send OTP.", "error");
        return;
      }

      toast(data.message || `OTP sent to ${maskEmail(email)}.`);
      setStep("verify");
      
      // Demo Mode: If the server returns the OTP directly (e.g. SMTP failed/slow), auto-fill it
      if (data.otp) {
        console.log("DEBUG: Received OTP from server:", data.otp);
        setToken(data.otp);
      } else {
        setToken("");
      }
      
      setCooldown(30);
    } catch (err) {
      toast("Server is unreachable. Check if it's running.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const { login } = useAuth();

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(token)) {
      toast("Enter the 6-digit code.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:3001/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: token }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast(data.error || "Invalid OTP.", "error");
        return;
      }

      toast("Verified successfully!");
      login(email);
      navigate(from, { replace: true });
    } catch (err) {
      toast("Verification failed. Is the server running?", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const title = "Get Started";
  const subtitle = "Enter your email to receive a one-time code and access your vault.";

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: "460px", padding: "2rem" }}>
        <h2 className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.35rem" }}>
          {title}
        </h2>
        <p className="text-muted-foreground" style={{ marginBottom: "1.75rem" }}>
          {subtitle}
        </p>

        {step === "request" ? (
          <form onSubmit={requestOtp}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <input
                className="input-base"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", padding: "0.85rem", fontWeight: 800 }}
              disabled={submitting}
            >
              {submitting ? "Sending OTP…" : "Send Access Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="text-muted-foreground" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                Sent to <strong className="text-foreground">{maskEmail(email)}</strong>
              </div>
              <input
                className="input-base"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={token}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setToken(v.slice(0, 6));
                }}
                placeholder="000000"
                style={{ textAlign: "center", letterSpacing: "0.35em", fontWeight: 800 }}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", padding: "0.85rem", fontWeight: 800 }}
              disabled={submitting}
            >
              {submitting ? "Verifying…" : "Enter Vault"}
            </button>

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: "0.75rem" }}
                onClick={() => setStep("request")}
                disabled={submitting}
              >
                Change email
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ flex: 1, padding: "0.75rem", color: "hsl(var(--primary))", fontWeight: 800 }}
                onClick={() => requestOtp({ preventDefault: () => {} })}
                disabled={submitting || cooldown > 0 || !email}
                title={cooldown > 0 ? `Wait ${cooldown}s` : "Resend OTP"}
              >
                {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

