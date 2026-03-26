import { useState, useEffect, useCallback, useRef } from "react";
import { CryptoService } from "../../utils/crypto";
import { supabase } from "../../utils/supabase";
import { PasswordEngine } from "../../utils/passwordEngine";

const DEMO_SALT = new Uint8Array([15, 82, 193, 44, 55, 66, 77, 88, 99, 10, 11, 12, 13, 14, 15, 16]);
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const AUTH_LOCK_STRING   = "VERIFIED_VAULT_ACCESS";

/* ── Icon helpers ────────────────────────────────────────────────────────── */
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  );
}
function FormIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}

/* ── Input style helper ──────────────────────────────────────────────────── */
const inp = {
  width: "100%",
  backgroundColor: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))",
  borderRadius: "var(--radius)",
  padding: "0.7rem 1rem",
  outline: "none",
  fontSize: "0.9rem",
  transition: "border-color 0.15s",
};

export default function VaultDashboard() {
  const [isUnlocked, setIsUnlocked]     = useState(false);
  const [masterKey, setMasterKey]       = useState(null);
  const [pinInput, setPinInput]         = useState("");
  const [isPinSuccess, setIsPinSuccess] = useState(false);
  const [isNewVault, setIsNewVault]     = useState(null);
  const [vaultData, setVaultData]       = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [revealedItems, setRevealedItems] = useState({});
  const [challengingId, setChallengingId] = useState(null);
  const [challengeInput, setChallengeInput] = useState("");
  const [editingId, setEditingId]         = useState(null);
  const [copyingId, setCopyingId]         = useState(null);

  const [formData, setFormData] = useState({
    platform_title: "", url: "", account_label: "",
    password: "", description: "", platform_type: "Website",
  });

  const pinRef = useRef(null);

  const lockVault = useCallback(() => {
    setMasterKey(null); setVaultData([]); setRevealedItems({});
    setChallengingId(null); setEditingId(null); setIsUnlocked(false);
    setIsModalOpen(false); setPinInput(""); setIsPinSuccess(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("vault_settings").select("*").limit(1);
      if (!error) setIsNewVault(data.length === 0);
    })();
  }, []);

  const handlePinChange = (e) => {
    const val = e.target.value;
    if (/^\d{0,4}$/.test(val)) { setPinInput(val); if (val.length === 4) attemptUnlock(val); }
  };

  const attemptUnlock = async (finalPin) => {
    try {
      const key = await CryptoService.deriveKey(finalPin, DEMO_SALT);
      if (isNewVault) {
        const { ciphertext, iv } = await CryptoService.encryptData(key, AUTH_LOCK_STRING);
        await supabase.from("vault_settings").insert([{ pin_hash: JSON.stringify({ ciphertext, iv }) }]);
        finishUnlock(key, []);
      } else {
        const { data } = await supabase.from("vault_settings").select("pin_hash").single();
        const { ciphertext, iv } = JSON.parse(data.pin_hash);
        const decrypted = await CryptoService.decryptData(key, ciphertext, iv);
        if (decrypted === AUTH_LOCK_STRING) {
          const { data: entries } = await supabase.from("vault_entries").select("*").order("created_at", { ascending: false });
          finishUnlock(key, entries || []);
        }
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) { alert("Invalid Access PIN."); setPinInput(""); }
  };

  const finishUnlock = (key, data) => {
    setIsPinSuccess(true);
    setTimeout(() => { setMasterKey(key); setVaultData(data); setIsUnlocked(true); setIsNewVault(false); setPinInput(""); }, 300);
  };

  const handleRevealChallenge = async (e, entry) => {
    e.preventDefault();
    if (challengeInput.length !== 4) return;
    try {
      const key = await CryptoService.deriveKey(challengeInput, DEMO_SALT);
      const plaintextJson = await CryptoService.decryptData(key, entry.ciphertext, entry.iv);
      setRevealedItems(prev => ({ ...prev, [entry.id]: JSON.parse(plaintextJson) }));
      setChallengingId(null); setChallengeInput("");
    // eslint-disable-next-line no-unused-vars
    } catch (error) { alert("Wrong PIN!"); setChallengeInput(""); }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    const sensitiveData = JSON.stringify({ password: formData.password, description: formData.description });
    const { ciphertext, iv } = await CryptoService.encryptData(masterKey, sensitiveData);
    const payload = {
      platform_title: formData.platform_title,
      url: formData.platform_type === "Website" ? formData.url : null,
      account_label: formData.account_label,
      ciphertext, iv,
      platform_type: formData.platform_type,
    };
    if (editingId) {
      await supabase.from("vault_entries").update(payload).eq("id", editingId);
      setVaultData(vaultData.map(item => item.id === editingId ? { ...item, ...payload } : item));
    } else {
      const { data } = await supabase.from("vault_entries").insert([payload]).select();
      if (data) setVaultData([data[0], ...vaultData]);
    }
    setIsModalOpen(false); setEditingId(null);
    setFormData({ platform_title: "", url: "", account_label: "", password: "", description: "", platform_type: "Website" });
  };

  const filteredData = vaultData.filter(item => activeFilter === "All" || item.platform_type === activeFilter);
  const platformIcon = (type) => type === "Website" ? "🌐" : type === "App" ? "📱" : "💻";

  /* ── PIN Screen ─── */
  if (!isUnlocked) {
    const StepCard = ({ icon, title, desc }) => (
      <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.75rem", flex: "1 1 200px" }}>
        <div style={{ color: "hsl(var(--primary))", backgroundColor: "hsla(var(--primary) / 0.1)", padding: "0.75rem", borderRadius: "50%" }}>
          {icon}
        </div>
        <h4 style={{ fontWeight: "700", fontSize: "0.95rem", color: "hsl(var(--foreground))" }}>{title}</h4>
        <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", lineHeight: "1.4" }}>{desc}</p>
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "3rem" }}>
        
        {/* How it works cards */}
        <div style={{ width: "100%", marginBottom: "3rem" }}>
          <h3 style={{ textAlign: "center", fontSize: "1.3rem", fontWeight: "800", marginBottom: "1.5rem", color: "hsl(var(--foreground))" }}>
            How Secure Vault Works
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            <StepCard 
              icon={<LockIcon />} 
              title="1. Master PIN" 
              desc="Set or enter your unique 4-digit Master PIN to unlock the vault. This encrypts all your data locally." 
            />
            <StepCard 
              icon={<FormIcon />} 
              title="2. Add Accounts" 
              desc="Fill out a simple form for the website, app, or desktop service you are saving the password for." 
            />
            <StepCard 
              icon={<KeyIcon />} 
              title="3. Reveal Details" 
              desc="Need to see a password? Just re-enter your Master PIN to decrypt and reveal the item instantly." 
            />
            <StepCard 
              icon={<EditIcon />} 
              title="4. Manage Everything" 
              desc="Easily copy, edit, or delete your credentials. Add optional descriptions to remember important details." 
            />
          </div>
        </div>

        {/* PIN Entry Box */}
        <div className="card" style={{
          padding: "3rem 2.5rem", width: "100%", maxWidth: "380px",
          textAlign: "center", cursor: "text",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        }} onClick={() => pinRef.current?.focus()}>
          <div className="text-primary" style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
            <LockIcon />
          </div>
          <h2 className="text-foreground" style={{ fontSize: "1.1rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
            {isNewVault ? "Set PIN" : "Unlock Vault"}
          </h2>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem", marginBottom: "2.5rem" }}>
            {isNewVault ? "Choose a 4-digit PIN for your vault." : "Enter your 4-digit vault PIN."}
          </p>

          {/* PIN dots */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: "1.25rem", marginBottom: "2.5rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                width: "14px", height: "14px", borderRadius: "50%",
                border: `2px solid ${isPinSuccess ? "hsl(var(--success))" : pinInput.length > i ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                backgroundColor: isPinSuccess ? "hsl(var(--success))" : pinInput.length > i ? "hsl(var(--primary))" : "transparent",
                transform: pinInput.length > i ? "scale(1.15)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                boxShadow: isPinSuccess ? "0 0 12px hsla(var(--success) / 0.5)" : "none",
              }} />
            ))}
            <input ref={pinRef} type="text" inputMode="numeric" maxLength={4} autoFocus
              value={pinInput} onChange={handlePinChange}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "text" }}
            />
          </div>

          <p className="text-muted-foreground" style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "700" }}>
            AES-GCM Encryption
          </p>
        </div>
      </div>
    );
  }

  /* ── Vault Dashboard ─── */
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2rem" }}>
        <button
          onClick={() => { setEditingId(null); setIsModalOpen(true); }}
          className="btn-primary"
          style={{ padding: "0.6rem 1.75rem", fontWeight: "700" }}
        >
          + New
        </button>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: "0.25rem", padding: "0.3rem",
          backgroundColor: "hsl(var(--muted))", borderRadius: "calc(var(--radius) + 4px)",
        }}>
          {["All", "Website", "App", "Desktop"].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "var(--radius)",
              fontWeight: "600", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em",
              border: "none", cursor: "pointer", transition: "all 0.15s",
              backgroundColor: activeFilter === f ? "hsl(var(--card))" : "transparent",
              color: activeFilter === f ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: activeFilter === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>
              {f}
            </button>
          ))}
        </div>

        <button onClick={lockVault} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.8rem", fontSize: "0.85rem", fontWeight: "600", letterSpacing: "0.02em" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Lock Vault
        </button>
      </div>

      {/* Empty state */}
      {filteredData.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>No entries yet. Click <strong>+ New</strong> to add one.</p>
        </div>
      )}

      {/* Vault cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {filteredData.map(entry => {
          const isRevealed   = !!revealedItems[entry.id];
          const isChallenging = challengingId === entry.id;
          return (
            <div key={entry.id} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0" }}>
              {/* Card header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                <div style={{
                  width: "42px", height: "42px",
                  backgroundColor: "hsl(var(--muted))",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.15rem", border: "1px solid hsl(var(--border))",
                }}>
                  {platformIcon(entry.platform_type)}
                </div>
                <button onClick={() => {
                  if (window.confirm("Delete this entry?"))
                    supabase.from("vault_entries").delete().eq("id", entry.id)
                      .then(() => setVaultData(v => v.filter(i => i.id !== entry.id)));
                }} className="btn-ghost" style={{ padding: "0.3rem", lineHeight: 0, color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--destructive))"}
                  onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
                >
                  <TrashIcon />
                </button>
              </div>

              <span className="badge" style={{
                backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))",
                marginBottom: "0.4rem", width: "fit-content",
              }}>
                {entry.platform_type}
              </span>
              <h3 className="text-foreground" style={{ fontWeight: "700", fontSize: "1.05rem", marginBottom: "0.25rem" }}>
                {entry.platform_title}
              </h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
                {entry.account_label}
              </p>

              {/* Reveal / Challenge / Revealed */}
              {!isRevealed && !isChallenging && (
                <button onClick={() => setChallengingId(entry.id)} className="btn-secondary"
                  style={{ width: "100%", letterSpacing: "0.06em", fontSize: "0.78rem", padding: "0.55rem" }}>
                  Reveal Password
                </button>
              )}

              {isChallenging && (
                <form onSubmit={e => handleRevealChallenge(e, entry)} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <input type="text" inputMode="numeric" maxLength={4} placeholder="Enter PIN"
                    autoFocus value={challengeInput}
                    onChange={e => /^\d{0,4}$/.test(e.target.value) && setChallengeInput(e.target.value)}
                    style={{ ...inp, textAlign: "center", letterSpacing: "0.3em" }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: "0.5rem", fontSize: "0.82rem" }}>
                      Confirm
                    </button>
                    <button type="button" className="btn-ghost"
                      onClick={() => { setChallengingId(null); setChallengeInput(""); }}
                      style={{ padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}>
                      ✕
                    </button>
                  </div>
                </form>
              )}

              {isRevealed && (
                <div>
                  <div style={{
                    backgroundColor: "hsl(var(--muted))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    padding: "0.65rem 0.9rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: "0.6rem",
                  }}>
                    <code style={{ color: "hsl(var(--accent))", fontFamily: "monospace", fontSize: "0.9rem", fontWeight: "700", wordBreak: "break-all" }}>
                      {revealedItems[entry.id].password}
                    </code>
                    <button onClick={() => {
                      navigator.clipboard.writeText(revealedItems[entry.id].password);
                      setCopyingId(entry.id);
                      setTimeout(() => setCopyingId(null), 2000);
                    }} className="btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.05em" }}>
                      {copyingId === entry.id ? "✓ Done" : "Copy"}
                    </button>
                  </div>
                  <button onClick={() => { const n = { ...revealedItems }; delete n[entry.id]; setRevealedItems(n); }}
                    className="btn-ghost" style={{ width: "100%", fontSize: "0.78rem", padding: "0.35rem" }}>
                    Hide
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
          backgroundColor: "hsla(var(--background) / 0.85)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ position: "absolute", inset: 0 }} onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSaveEntry} className="card" style={{
            position: "relative",
            padding: "2rem",
            width: "100%", maxWidth: "520px",
            borderTop: "3px solid hsl(var(--primary))",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          }}>
            <h3 className="text-foreground" style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "1.5rem" }}>
              {editingId ? "Edit Account" : "New Account"}
            </h3>

            {/* Platform type tabs */}
            <div style={{
              display: "flex", gap: "0.25rem", padding: "0.3rem",
              backgroundColor: "hsl(var(--muted))", borderRadius: "calc(var(--radius) + 2px)", marginBottom: "1.25rem",
            }}>
              {["Website", "App", "Desktop"].map(t => (
                <button key={t} type="button" onClick={() => setFormData({ ...formData, platform_type: t })} style={{
                  flex: 1, padding: "0.5rem",
                  borderRadius: "var(--radius)",
                  fontWeight: "600", fontSize: "0.82rem",
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  backgroundColor: formData.platform_type === t ? "hsl(var(--card))" : "transparent",
                  color: formData.platform_type === t ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <input type="text" placeholder="Platform Name" required value={formData.platform_title}
                onChange={e => setFormData({ ...formData, platform_title: e.target.value })}
                style={inp} onFocus={e => e.target.style.borderColor = "hsl(var(--ring))"} onBlur={e => e.target.style.borderColor = "hsl(var(--border))"}
              />
              <input type="text" placeholder="Email / Login ID" required value={formData.account_label}
                onChange={e => setFormData({ ...formData, account_label: e.target.value })}
                style={inp} onFocus={e => e.target.style.borderColor = "hsl(var(--ring))"} onBlur={e => e.target.style.borderColor = "hsl(var(--border))"}
              />
            </div>

            {formData.platform_type === "Website" && (
              <div style={{ marginBottom: "0.75rem" }}>
                <input type="url" placeholder="https://example.com" value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  style={inp} onFocus={e => e.target.style.borderColor = "hsl(var(--ring))"} onBlur={e => e.target.style.borderColor = "hsl(var(--border))"}
                />
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label className="text-muted-foreground" style={{ fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Password
                </label>
                <button type="button" className="btn-ghost" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", fontWeight: "700", color: "hsl(var(--primary))" }}
                  onClick={() => setFormData({ ...formData, password: PasswordEngine.generatePassword(22) })}>
                  ⚡ Generate
                </button>
              </div>
              <input type="password" placeholder="••••••••" required value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                style={inp} onFocus={e => e.target.style.borderColor = "hsl(var(--ring))"} onBlur={e => e.target.style.borderColor = "hsl(var(--border))"}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="text-muted-foreground" style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                Description / Notes (Optional)
              </label>
              <textarea placeholder="Any additional notes..." value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{ ...inp, resize: "vertical" }} onFocus={e => e.target.style.borderColor = "hsl(var(--ring))"} onBlur={e => e.target.style.borderColor = "hsl(var(--border))"}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: "0.75rem" }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: "0.75rem" }}>
                Encrypt &amp; Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
