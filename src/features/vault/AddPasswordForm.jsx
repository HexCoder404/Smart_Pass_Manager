import { useState, useEffect, useCallback, useRef } from "react";
import { CryptoService } from "../../utils/crypto";
import { supabase } from "../../utils/supabase";

const DEMO_SALT = new Uint8Array([
  15, 82, 193, 44, 55, 66, 77, 88, 99, 10, 11, 12, 13, 14, 15, 16,
]);
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

export default function VaultDashboard() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterKey, setMasterKey] = useState(null);
  const [masterPasswordInput, setMasterPasswordInput] = useState("");

  // Vault Initialization State
  const [isNewVault, setIsNewVault] = useState(null); // null = loading, true = empty db, false = has data

  // Database Data
  const [vaultData, setVaultData] = useState([]);

  // Reveal Logic State
  const [revealedItems, setRevealedItems] = useState({}); // Stores { id: { password, description } }
  const [challengingId, setChallengingId] = useState(null); // Which item is asking for a password
  const [challengeInput, setChallengeInput] = useState(""); // The password typed into the challenge box

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    platform_title: "",
    url: "",
    account_label: "",
    password: "",
    description: "",
  });

  const timeoutRef = useRef(null);

  const lockVault = useCallback(() => {
    setMasterKey(null);
    setVaultData([]);
    setRevealedItems({});
    setChallengingId(null);
    setEditingId(null);
    setIsUnlocked(false);
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isUnlocked) {
      timeoutRef.current = setTimeout(() => {
        lockVault();
        alert("Vault locked due to inactivity.");
      }, SESSION_TIMEOUT_MS);
    }
  }, [isUnlocked, lockVault]);

  // Check if vault is new on mount
  useEffect(() => {
    const checkVaultStatus = async () => {
      const { count, error } = await supabase
        .from("vault_entries")
        .select("*", { count: "exact", head: true });

      if (!error) {
        setIsNewVault(count === 0);
      }
    };
    checkVaultStatus();
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  // --- ACTIONS ---

  // 1. Create a brand new vault
  const handleCreateVault = async (e) => {
    e.preventDefault();
    try {
      const key = await CryptoService.deriveKey(masterPasswordInput, DEMO_SALT);
      setMasterKey(key);
      setIsUnlocked(true);
      setIsNewVault(false);
      resetTimer();
      setMasterPasswordInput("");
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Failed to create Master Key.");
    }
  };

  // 2. Unlock existing vault
  const handleUnlock = async (e) => {
    e.preventDefault();
    try {
      const key = await CryptoService.deriveKey(masterPasswordInput, DEMO_SALT);

      const { data, error } = await supabase
        .from("vault_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Verify password by attempting to decrypt the first item
      if (data.length > 0) {
        await CryptoService.decryptData(key, data[0].ciphertext, data[0].iv);
      }

      setMasterKey(key);
      setVaultData(data); // Store ENCRYPTED data in state!
      setIsUnlocked(true);
      resetTimer();
      setMasterPasswordInput("");
    } catch (error) {
      console.error(error);
      alert("Incorrect Master Password.");
    }
  };

  // 3. Challenge user to view a specific password
  const handleReveal = async (e, entry) => {
    e.preventDefault();
    try {
      // Derive key from what they JUST typed into the challenge box
      const key = await CryptoService.deriveKey(challengeInput, DEMO_SALT);

      // Decrypt just this one item
      const plaintextJson = await CryptoService.decryptData(
        key,
        entry.ciphertext,
        entry.iv,
      );
      const plaintext = JSON.parse(plaintextJson);

      // Save it to revealed state and close the challenge box
      setRevealedItems((prev) => ({ ...prev, [entry.id]: plaintext }));
      setChallengingId(null);
      setChallengeInput("");
      resetTimer();
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Incorrect Master Password!");
      setChallengeInput("");
    }
  };

  // 4. Save new password OR Update existing
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!masterKey) return alert("Vault is locked!");

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
      url: formData.url,
      account_label: formData.account_label,
      ciphertext,
      iv,
    };

    if (editingId) {
      // UPDATE EXISTING ENTRY
      const { error } = await supabase
        .from("vault_entries")
        .update(payload)
        .eq("id", editingId);

      if (error) return alert("Failed to update entry.");

      // Update Local State
      setVaultData(
        vaultData.map((item) =>
          item.id === editingId ? { ...item, ...payload } : item,
        ),
      );

      // Update Revealed Items if it was currently revealed
      if (revealedItems[editingId]) {
        setRevealedItems((prev) => ({
          ...prev,
          [editingId]: {
            password: formData.password,
            description: formData.description,
          },
        }));
      }

      setEditingId(null);
    } else {
      // INSERT NEW ENTRY
      const { data, error } = await supabase
        .from("vault_entries")
        .insert([payload])
        .select();

      if (error) return alert("Failed to save entry.");

      if (data && data.length > 0) {
        setVaultData([data[0], ...vaultData]);
        // Auto-reveal the one they just created
        setRevealedItems((prev) => ({
          ...prev,
          [data[0].id]: {
            password: formData.password,
            description: formData.description,
          },
        }));
      }
    }

    setFormData({
      platform_title: "",
      url: "",
      account_label: "",
      password: "",
      description: "",
    });
  };

  // 5. Setup Edit Form
  const handleEdit = (entry) => {
    // Make sure the password is decrypted and visible first!
    if (!revealedItems[entry.id]) {
      return alert(
        "Please click 'Reveal' and enter your Master Password before editing this entry.",
      );
    }

    setEditingId(entry.id);
    setFormData({
      platform_title: entry.platform_title,
      url: entry.url || "",
      account_label: entry.account_label,
      password: revealedItems[entry.id].password,
      description: revealedItems[entry.id].description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 6. Delete Entry
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const { error } = await supabase
        .from("vault_entries")
        .delete()
        .eq("id", id);

      if (error) return alert("Failed to delete entry.");

      // Update UI
      setVaultData(vaultData.filter((item) => item.id !== id));
      const newRevealed = { ...revealedItems };
      delete newRevealed[id];
      setRevealedItems(newRevealed);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  // --- RENDER ---
  if (isNewVault === null)
    return (
      <div className="text-white text-center mt-20">
        Loading Secure Vault...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-300 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-700">
          <h1 className="text-3xl text-white font-bold">🔐 Secure Vault</h1>
          {isUnlocked && (
            <button
              onClick={lockVault}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium transition"
            >
              Lock Vault
            </button>
          )}
        </div>

        {!isUnlocked ? (
          <div className="bg-[#0f172a] p-8 rounded-xl border border-slate-700 shadow-xl max-w-md mx-auto">
            <h2 className="text-xl text-white mb-4 text-center">
              {isNewVault ? "Create Your Master Password" : "Unlock Your Vault"}
            </h2>
            <p className="text-slate-400 text-sm mb-6 text-center">
              {isNewVault
                ? "Your database is empty. Create a strong Master Password to initialize your vault."
                : "Enter your Master Password to access your saved credentials."}
            </p>
            <form
              onSubmit={isNewVault ? handleCreateVault : handleUnlock}
              className="space-y-4"
            >
              <input
                type="password"
                value={masterPasswordInput}
                onChange={(e) => setMasterPasswordInput(e.target.value)}
                placeholder="Master Password"
                className="w-full bg-[#1e293b] border border-slate-600 text-white p-3 rounded focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition"
              >
                {isNewVault ? "Initialize Vault" : "Unlock"}
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ADD / EDIT ENTRY FORM */}
            <div className="lg:col-span-1 bg-[#0f172a] p-6 rounded-xl border border-slate-700 h-fit">
              <h3 className="text-lg text-white font-semibold mb-4">
                {editingId ? "Edit Entry" : "Add New Entry"}
              </h3>
              <form onSubmit={handleSaveEntry} className="space-y-4">
                <input
                  type="text"
                  placeholder="Platform Title (e.g. Netflix)"
                  required
                  value={formData.platform_title}
                  onChange={(e) =>
                    setFormData({ ...formData, platform_title: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded text-white outline-none focus:border-cyan-500"
                />
                <input
                  type="url"
                  placeholder="URL (e.g. https://netflix.com)"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded text-white outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Account Label (e.g. user@email.com)"
                  required
                  value={formData.account_label}
                  onChange={(e) =>
                    setFormData({ ...formData, account_label: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded text-white outline-none focus:border-cyan-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded text-white outline-none focus:border-cyan-500"
                />
                <textarea
                  placeholder="Notes/Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded text-white outline-none focus:border-cyan-500 h-24"
                ></textarea>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                  >
                    {editingId ? "Update Entry" : "Save Entry"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          platform_title: "",
                          url: "",
                          account_label: "",
                          password: "",
                          description: "",
                        });
                      }}
                      className="px-4 bg-slate-600 hover:bg-slate-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* VAULT DISPLAY */}
            <div className="lg:col-span-2 space-y-4">
              {vaultData.length === 0 ? (
                <p className="text-slate-500 italic p-6 text-center border border-dashed border-slate-700 rounded-xl">
                  Your vault is empty.
                </p>
              ) : (
                vaultData.map((entry) => {
                  const isRevealed = !!revealedItems[entry.id];
                  const isChallenging = challengingId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="bg-[#0f172a] p-5 rounded-xl border border-slate-700 flex flex-col items-start gap-4"
                    >
                      <div className="w-full flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold text-white flex items-center space-x-2">
                            <span>{entry.platform_title}</span>
                            <span className="text-xs px-2 py-1 bg-slate-800 rounded text-cyan-400 font-normal">
                              {entry.account_label}
                            </span>
                          </h4>
                          {entry.url && (
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:underline"
                            >
                              {entry.url}
                            </a>
                          )}
                        </div>

                        {isRevealed && (
                          <button
                            onClick={() => {
                              const newRevealed = { ...revealedItems };
                              delete newRevealed[entry.id];
                              setRevealedItems(newRevealed);
                            }}
                            className="text-sm text-slate-500 hover:text-white transition"
                          >
                            Hide
                          </button>
                        )}
                      </div>

                      {/* Password Challenge/Reveal Section */}
                      <div className="w-full bg-[#1e293b] p-3 rounded border border-slate-700">
                        {isRevealed ? (
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-emerald-400 text-lg tracking-wide select-all">
                              {revealedItems[entry.id].password}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  revealedItems[entry.id].password,
                                )
                              }
                              className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition"
                            >
                              📋 Copy
                            </button>
                          </div>
                        ) : isChallenging ? (
                          <form
                            onSubmit={(e) => handleReveal(e, entry)}
                            className="flex space-x-2"
                          >
                            <input
                              type="password"
                              autoFocus
                              placeholder="Confirm Master Password..."
                              value={challengeInput}
                              onChange={(e) =>
                                setChallengeInput(e.target.value)
                              }
                              className="flex-1 bg-[#0b1120] border border-cyan-500/50 text-white px-3 py-2 rounded outline-none focus:border-cyan-500"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition"
                            >
                              Reveal
                            </button>
                            <button
                              type="button"
                              onClick={() => setChallengingId(null)}
                              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-slate-500 tracking-widest text-lg">
                              ••••••••••••
                            </span>
                            <button
                              onClick={() => setChallengingId(entry.id)}
                              className="px-4 py-1.5 border border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 rounded transition flex items-center space-x-2"
                            >
                              <span>🔒</span>
                              <span>Reveal</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isRevealed && revealedItems[entry.id].description && (
                        <p className="text-sm text-slate-400 w-full mt-2 bg-[#1e293b] p-3 rounded border-l-2 border-slate-600">
                          {revealedItems[entry.id].description}
                        </p>
                      )}

                      {/* EDIT AND DELETE BUTTONS */}
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-xs px-3 py-1 bg-red-900/40 hover:bg-red-600 border border-red-800/50 rounded text-slate-300 hover:text-white transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
