// src/utils/crypto.js

export const CryptoService = {
  /**
   * 1. Derives a secure Master Key from the user's Master Password.
   */
  async deriveKey(password, salt) {
    const enc = new TextEncoder();

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 600000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  },

  /**
   * 2. Encrypts a saved password (e.g., Netflix) before sending to the backend.
   */
  async encryptData(masterKey, plaintextData) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      enc.encode(plaintextData),
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  },

  /**
   * 3. Decrypts the ciphertext retrieved from the backend.
   */
  async decryptData(masterKey, ciphertextBase64, ivBase64) {
    const dec = new TextDecoder();

    const ciphertext = new Uint8Array(
      atob(ciphertextBase64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );
    const iv = new Uint8Array(
      atob(ivBase64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      ciphertext,
    );

    return dec.decode(decryptedBuffer);
  },

  /**
   * Helper: Generates a random salt for new users.
   */
  generateSalt() {
    return window.crypto.getRandomValues(new Uint8Array(16));
  },
};
