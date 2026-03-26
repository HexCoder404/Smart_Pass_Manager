import { useState, useEffect, useCallback, useRef } from "react";
import { CryptoService } from "../../utils/crypto";
import { supabase } from "../../utils/supabase";
import { PasswordEngine } from "../../utils/passwordEngine"; 

const DEMO_SALT = new Uint8Array([
  15, 82, 193, 44, 55, 66, 77, 88, 99, 10, 11, 12, 13, 14, 15, 16,
]);
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const AUTH_LOCK_STRING = "VERIFIED_VAULT_ACCESS";

export default function VaultDashboard() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterKey, setMasterKey] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [isPinSuccess, setIsPinSuccess] = useState(false);
  const [isNewVault, setIsNewVault] = useState(null);
  const [vaultData, setVaultData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedItems, setRevealedItems] = useState({});
  const [challengingId, setChallengingId] = useState(null);
  const [challengeInput, setChallengeInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [copyingId, setCopyingId] = useState(null);

  const [formData, setFormData] = useState({
    platform_title: "",
    url: "",
    account_label: "",
    password: "",
    description: "",
    platform_type: "Website",
  });

  const pinRef = useRef(null);

  const lockVault = useCallback(() => {
    setMasterKey(null);
    setVaultData([]);
    setRevealedItems({});
    setChallengingId(null);
    setEditingId(null);
    setIsUnlocked(false);
    setIsModalOpen(false);
    setPinInput("");
    setIsPinSuccess(false);
  }, []);

  useEffect(() => {
    const checkVaultStatus = async () => {
      const { data, error } = await supabase
        .from("vault_settings")
        .select("*")
        .limit(1);
      if (!error) setIsNewVault(data.length === 0);
    };
    checkVaultStatus();
  }, []);

  const handlePinChange = (e) => {
    const val = e.target.value;
    if (/^\d{0,4}$/.test(val)) {
      setPinInput(val);
      if (val.length === 4) attemptUnlock(val);
    }
  };

  const attemptUnlock = async (finalPin) => {
    try {
      const key = await CryptoService.deriveKey(finalPin, DEMO_SALT);
      if (isNewVault) {
        const { ciphertext, iv } = await CryptoService.encryptData(
          key,
          AUTH_LOCK_STRING,
        );
        await supabase
          .from("vault_settings")
          .insert([{ pin_hash: JSON.stringify({ ciphertext, iv }) }]);
        finishUnlock(key, []);
      } else {
        const { data } = await supabase
          .from("vault_settings")
          .select("pin_hash")
          .single();
        const { ciphertext, iv } = JSON.parse(data.pin_hash);
        const decrypted = await CryptoService.decryptData(key, ciphertext, iv);
        if (decrypted === AUTH_LOCK_STRING) {
          const { data: entries } = await supabase
            .from("vault_entries")
            .select("*")
            .order("created_at", { ascending: false });
          finishUnlock(key, entries || []);
        }
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Invalid Access PIN.");
      setPinInput("");
    }
  };

  const finishUnlock = (key, data) => {
    setIsPinSuccess(true);
    setTimeout(() => {
      setMasterKey(key);
      setVaultData(data);
      setIsUnlocked(true);
      setIsNewVault(false);
      setPinInput("");
    }, 300);
  };

  const handleRevealChallenge = async (e, entry) => {
    e.preventDefault();
    if (challengeInput.length !== 4) return;
    try {
      const key = await CryptoService.deriveKey(challengeInput, DEMO_SALT);
      const plaintextJson = await CryptoService.decryptData(
        key,
        entry.ciphertext,
        entry.iv,
      );
      setRevealedItems((prev) => ({
        ...prev,
        [entry.id]: JSON.parse(plaintextJson),
      }));
      setChallengingId(null);
      setChallengeInput("");
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Wrong PIN!");
      setChallengeInput("");
    }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    const sensitiveData = JSON.stringify({
      password: formData.password,
      description: formData.description,
    });
    const { ciphertext, iv } = await CryptoService.encryptData(
      masterKey,
      sensitiveData,
    );
    const payload = {
      platform_title: formData.platform_title,
      url: formData.platform_type === "Website" ? formData.url : null,
      account_label: formData.account_label,
      ciphertext,
      iv,
      platform_type: formData.platform_type,
    };

    if (editingId) {
      await supabase.from("vault_entries").update(payload).eq("id", editingId);
      setVaultData(
        vaultData.map((item) =>
          item.id === editingId ? { ...item, ...payload } : item,
        ),
      );
    } else {
      const { data } = await supabase
        .from("vault_entries")
        .insert([payload])
        .select();
      if (data) setVaultData([data[0], ...vaultData]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      platform_title: "",
      url: "",
      account_label: "",
      password: "",
      description: "",
      platform_type: "Website",
    });
  };

  const filteredData = vaultData.filter(
    (item) => activeFilter === "All" || item.platform_type === activeFilter,
  );

  return (
    <div className="min-h-screen bg-[#060912] text-slate-200 font-sans tracking-tight antialiased">
      {!isUnlocked ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-in fade-in duration-700">
          <div
            className="bg-[#0f172a] border border-slate-800 p-12 rounded-[2.5rem] shadow-2xl text-center w-full max-w-sm cursor-text"
            onClick={() => pinRef.current?.focus()}
          >
            <h2 className="text-xl text-white font-bold tracking-[0.2em] uppercase mb-2">
              {isNewVault ? "Set PIN" : "Unlock Vault"}
            </h2>
            <div className="relative flex justify-center gap-6 my-12">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    isPinSuccess
                      ? "bg-[#00f5d4] border-[#00f5d4] shadow-[0_0_20px_#00f5d4]"
                      : pinInput.length > i
                        ? "bg-white border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                        : "border-slate-700"
                  }`}
                />
              ))}
              <input
                ref={pinRef}
                type="text"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={handlePinChange}
                className="absolute inset-0 opacity-0"
              />
            </div>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Secure PIN Protocol
            </p>
          </div>
        </div>
      ) : (
        /* VAULT UI */
        <div className="w-full max-w-7xl mx-auto p-6 md:p-12">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-16 h-14">
            <button
              onClick={() => {
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="px-8 h-full bg-[#2df500] hover:bg-[#a9e363] text-[#060912] rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(0,245,212,0.2)] active:scale-95"
            >
              NEW
            </button>

            <div className="flex bg-[#0f172a] p-1.5 rounded-2xl border border-slate-800/50">
              {["All", "Website", "App", "Desktop"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeFilter === f ? "bg-slate-700 text-white shadow-md" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={lockVault}
              className="px-8 h-full bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white rounded-2xl font-bold transition uppercase text-xs tracking-widest"
            >
              LOCK VAULT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredData.map((entry) => {
              const isRevealed = !!revealedItems[entry.id];
              const isChallenging = challengingId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="bg-[#0f172a] border border-slate-800/60 p-8 rounded-4xl hover:border-slate-600 transition-all flex flex-col min-h-70"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-[#060912] rounded-xl flex items-center justify-center text-xl border border-slate-800">
                        {entry.platform_type === "Website"
                          ? "🌐"
                          : entry.platform_type === "App"
                            ? "📱"
                            : "💻"}
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete?"))
                            supabase
                              .from("vault_entries")
                              .delete()
                              .eq("id", entry.id)
                              .then(() =>
                                setVaultData((v) =>
                                  v.filter((i) => i.id !== entry.id),
                                ),
                              );
                        }}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-[#00f5d4] uppercase tracking-widest mb-2 block">
                      {entry.platform_type}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {entry.platform_title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-8">
                      {entry.account_label}
                    </p>
                  </div>

                  {!isRevealed && !isChallenging && (
                    <button
                      onClick={() => setChallengingId(entry.id)}
                      className="w-full py-4 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all"
                    >
                      Reveal Password
                    </button>
                  )}

                  {isChallenging && (
                    <form
                      onSubmit={(e) => handleRevealChallenge(e, entry)}
                      className="flex flex-col gap-2"
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="PIN"
                        autoFocus
                        value={challengeInput}
                        onChange={(e) =>
                          /^\d{0,4}$/.test(e.target.value) &&
                          setChallengeInput(e.target.value)
                        }
                        className="w-full bg-[#060912] border border-[#00f5d4]/30 text-white text-center p-3 rounded-xl outline-none focus:border-[#00f5d4]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-[#00f5d4] text-[#060912] rounded-xl text-[10px] font-bold uppercase"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setChallengingId(null)}
                          className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl"
                        >
                          ✕
                        </button>
                      </div>
                    </form>
                  )}

                  {isRevealed && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <div className="bg-[#060912] p-4 rounded-xl border border-slate-800 flex justify-between items-center mb-4">
                        <code className="text-[#00f5d4] font-mono text-lg font-bold tracking-widest select-all">
                          {revealedItems[entry.id].password}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              revealedItems[entry.id].password,
                            );
                            setCopyingId(entry.id);
                            setTimeout(() => setCopyingId(null), 2000);
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-white uppercase"
                        >
                          {copyingId === entry.id ? "Done" : "Copy"}
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            /* Edit trigger */
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-[#00f5d4] uppercase tracking-widest transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const n = { ...revealedItems };
                            delete n[entry.id];
                            setRevealedItems(n);
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL (FORM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#060912]/95 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <form
            onSubmit={handleSaveEntry}
            className="relative bg-[#0f172a] border-t-4 border-t-[#00f5d4] border-x border-b border-slate-800 p-10 rounded-[2.5rem] w-full max-w-xl space-y-8 shadow-2xl animate-in zoom-in-95"
          >
            <h3 className="text-2xl text-white font-black uppercase tracking-tight">
              {editingId ? "Edit Account" : "New Account"}
            </h3>

            <div className="flex bg-[#060912] p-1.5 rounded-2xl border border-slate-800/50">
              {["Website", "App", "Desktop"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, platform_type: t })}
                  className={`flex-1 py-3 text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all ${formData.platform_type === t ? "bg-slate-700 text-white shadow-inner" : "text-slate-500 hover:text-slate-400"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Platform Name"
                required
                value={formData.platform_title}
                onChange={(e) =>
                  setFormData({ ...formData, platform_title: e.target.value })
                }
                className="w-full bg-[#060912] border border-slate-800 p-4 rounded-2xl text-white focus:border-[#00f5d4] outline-none transition-all"
              />
              <input
                type="text"
                placeholder="Email/Login ID"
                required
                value={formData.account_label}
                onChange={(e) =>
                  setFormData({ ...formData, account_label: e.target.value })
                }
                className="w-full bg-[#060912] border border-slate-800 p-4 rounded-2xl text-white focus:border-[#00f5d4] outline-none transition-all"
              />
            </div>

            {formData.platform_type === "Website" && (
              <input
                type="url"
                placeholder="Website URL"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full bg-[#060912] border border-slate-800 p-4 rounded-2xl text-white focus:border-[#00f5d4] outline-none transition-all animate-in slide-in-from-top-2"
              />
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Access Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newPass = PasswordEngine.generatePassword(22);
                    setFormData({ ...formData, password: newPass });
                  }}
                  className="text-[9px] font-black text-[#00f5d4] hover:text-white uppercase transition-colors"
                >
                  ⚡ Generate Secure
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-[#060912] border border-slate-800 p-4 rounded-2xl text-white focus:border-[#00f5d4] outline-none transition-all"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-5 bg-slate-800/50 text-slate-500 rounded-2xl font-bold uppercase text-xs tracking-widest hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-5 bg-[#00f5d4] text-[#060912] rounded-2xl font-bold uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(0,245,212,0.2)]"
              >
                Encrypt & Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
