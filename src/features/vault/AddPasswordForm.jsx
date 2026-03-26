import { useState, useEffect, useCallback, useRef } from "react";
import { CryptoService } from "../../utils/crypto";
import { supabase } from "../../utils/supabase";

const DEMO_SALT = new Uint8Array([
  15, 82, 193, 44, 55, 66, 77, 88, 99, 10, 11, 12, 13, 14, 15, 16,
]);
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function VaultDashboard() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterKey, setMasterKey] = useState(null);
  const [masterPassword, setMasterPassword] = useState("");

  // State for vault data
  const [vaultData, setVaultData] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    platform_title: "",
    url: "",
    account_label: "",
    password: "",
    description: "",
  });

  // --- SESSION TIMER LOGIC ---
  const timeoutRef = useRef(null);

  const lockVault = useCallback(() => {
    setMasterKey(null);
    setVaultData([]);
    setIsUnlocked(false);
    alert("Vault locked due to inactivity.");
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isUnlocked) {
      timeoutRef.current = setTimeout(lockVault, SESSION_TIMEOUT_MS);
    }
  }, [isUnlocked, lockVault]);

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

  const handleUnlock = async (e) => {
    e.preventDefault();
    try {
      const key = await CryptoService.deriveKey(masterPassword, DEMO_SALT);
      setMasterKey(key);

      // FETCH FROM SUPABASE
      const { data, error } = await supabase
        .from("vault_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Decrypt the fetched items
      const decryptedItems = await Promise.all(
        data.map(async (item) => {
          const plaintextJson = await CryptoService.decryptData(
            key,
            item.ciphertext,
            item.iv,
          );
          const plaintext = JSON.parse(plaintextJson);
          return { ...item, plaintext };
        }),
      );

      setVaultData(decryptedItems);
      setIsUnlocked(true);
      resetTimer(); // Start the session timer
      setMasterPassword("");
    } catch (error) {
      console.error(error);
      alert("Failed to unlock. Check password or connection.");
    }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!masterKey) return alert("Vault is locked!");

    // Package sensitive data into a single JSON object
    const sensitiveData = JSON.stringify({
      password: formData.password,
      description: formData.description,
    });

    const { ciphertext, iv } = await CryptoService.encryptData(
      masterKey,
      sensitiveData,
    );

    // Prepare database payload
    const payload = {
      platform_title: formData.platform_title,
      url: formData.url,
      account_label: formData.account_label,
      ciphertext,
      iv,
    };

    if (editingId) {
      // UPDATE IN SUPABASE
      const { error } = await supabase
        .from("vault_entries")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Update error:", error);
        return alert("Failed to update entry.");
      }

      setVaultData(
        vaultData.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...payload,
                plaintext: {
                  password: formData.password,
                  description: formData.description,
                },
              }
            : item,
        ),
      );
      setEditingId(null);
    } else {
      // INSERT INTO SUPABASE
      const { data, error } = await supabase
        .from("vault_entries")
        .insert([payload])
        .select();

      if (error) {
        console.error("Insert error:", error);
        return alert("Failed to save entry.");
      }

      if (data && data.length > 0) {
        const newEntry = {
          ...data[0],
          plaintext: {
            password: formData.password,
            description: formData.description,
          },
        };
        setVaultData([newEntry, ...vaultData]);
      }
    }

    // Reset Form
    setFormData({
      platform_title: "",
      url: "",
      account_label: "",
      password: "",
      description: "",
    });
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setFormData({
      platform_title: entry.platform_title,
      url: entry.url,
      account_label: entry.account_label,
      password: entry.plaintext.password,
      description: entry.plaintext.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      // DELETE FROM SUPABASE
      const { error } = await supabase
        .from("vault_entries")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        return alert("Failed to delete entry.");
      }

      setVaultData(vaultData.filter((item) => item.id !== id));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-300 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-700">
          <h1 className="text-3xl text-white font-bold">🔐 Secure Vault</h1>
          {isUnlocked && (
            <button
              onClick={() => {
                lockVault();
                alert("Vault Locked manually.");
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium transition"
            >
              Lock Vault
            </button>
          )}
        </div>

        {!isUnlocked ? (
          <div className="bg-[#0f172a] p-8 rounded-xl border border-slate-700 shadow-xl max-w-md mx-auto">
            <h2 className="text-xl text-white mb-4">Unlock Your Vault</h2>
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Enter Master Password"
                className="w-full bg-[#1e293b] border border-slate-600 text-white p-3 rounded focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition"
              >
                Unlock
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FORM SECTION */}
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
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded focus:border-cyan-500 outline-none"
                />
                <input
                  type="url"
                  placeholder="URL (e.g. https://netflix.com)"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded focus:border-cyan-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Account Label (e.g. user@email.com)"
                  required
                  value={formData.account_label}
                  onChange={(e) =>
                    setFormData({ ...formData, account_label: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded focus:border-cyan-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded focus:border-cyan-500 outline-none"
                />
                <textarea
                  placeholder="Notes/Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-600 p-2 rounded focus:border-cyan-500 outline-none h-24"
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

            {/* DISPLAY SECTION */}
            <div className="lg:col-span-2 space-y-4">
              {vaultData.length === 0 ? (
                <p className="text-slate-500 italic p-6 text-center border border-dashed border-slate-700 rounded-xl">
                  No passwords saved yet.
                </p>
              ) : (
                vaultData.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-[#0f172a] p-5 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-cyan-500/50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg font-bold text-white">
                          {entry.platform_title}
                        </h4>
                        <span className="text-xs px-2 py-1 bg-slate-800 rounded text-cyan-400">
                          {entry.account_label}
                        </span>
                      </div>

                      {entry.url && (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:underline mb-2 block"
                        >
                          🔗 {entry.url}
                        </a>
                      )}

                      <div className="items-center space-x-3 bg-[#1e293b] p-2 rounded inline-flex">
                        <span className="font-mono text-emerald-400 tracking-wider">
                          ••••••••
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(entry.plaintext.password)
                          }
                          className="text-slate-400 hover:text-white"
                          title="Copy Password"
                        >
                          📋
                        </button>
                      </div>

                      {entry.plaintext.description && (
                        <p className="text-sm text-slate-400 mt-2 bg-[#1e293b] p-2 rounded border-l-2 border-slate-600">
                          {entry.plaintext.description}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="flex-1 sm:flex-none px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex-1 sm:flex-none px-3 py-1 bg-red-900/40 hover:bg-red-600 border border-red-800/50 rounded text-sm text-white transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
