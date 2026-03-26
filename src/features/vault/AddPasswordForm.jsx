import { useState } from "react";
import { CryptoService } from "../utils/crypto";

export default function AddPasswordForm() {
  const [websitePass, setWebsitePass] = useState("");

  const handleSavePassword = async (e) => {
    e.preventDefault();

    // In a real app, the userSalt and masterPassword would be managed by an Auth Context
    // after the user logs in. For this test, we simulate it:
    const mockUserSalt = CryptoService.generateSalt();
    const mockMasterPassword = "MySuperSecretMasterPass123!";

    try {
      // 1. Re-derive the user's master key locally
      const myMasterKey = await CryptoService.deriveKey(
        mockMasterPassword,
        mockUserSalt,
      );

      // 2. Encrypt the password they just typed in
      const encryptedPayload = await CryptoService.encryptData(
        myMasterKey,
        websitePass,
      );

      console.log("SEND THIS TO YOUR FRIEND'S MONGODB:", encryptedPayload);
      alert("Encrypted successfully! Check console.");

      // 3. (Next step): Make a fetch() call here to send encryptedPayload to the backend
    } catch (error) {
      console.error("Encryption failed", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add New Vault Entry</h2>
      <form onSubmit={handleSavePassword}>
        <input
          type="password"
          value={websitePass}
          onChange={(e) => setWebsitePass(e.target.value)}
          placeholder="Enter Netflix Password"
        />
        <button type="submit">Encrypt & Save</button>
      </form>
    </div>
  );
}
