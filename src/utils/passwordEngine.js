// src/utils/passwordEngine.js

export const PasswordEngine = {
  /**
   * 1. Cryptographically Secure Password Generator
   * Uses the Web Crypto API instead of Math.random() for true randomness.
   */
  generatePassword(
    length = 16,
    options = {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    },
  ) {
    const charSets = {
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
    };

    let pool = "";
    if (options.lowercase) pool += charSets.lowercase;
    if (options.uppercase) pool += charSets.uppercase;
    if (options.numbers) pool += charSets.numbers;
    if (options.symbols) pool += charSets.symbols;

    if (!pool || length <= 0) return "";

    // Create a typed array to hold secure random values
    const randomValues = window.crypto.getRandomValues(new Uint32Array(length));
    let password = "";

    for (let i = 0; i < length; i++) {
      // Map the random values to the available character pool
      password += pool[randomValues[i] % pool.length];
    }

    return password;
  },

  /**
   * 2. Local Password Strength & Entropy Checker
   * Calculates the mathematical "guessability" of the password locally.
   */
  checkStrength(password) {
    if (!password)
      return { score: 0, label: "Empty", entropy: 0, suggestions: [] };

    let score = 0;
    let poolSize = 0;

    // Determine the pool size of characters used
    if (/[a-z]/.test(password)) {
      poolSize += 26;
      score += 1;
    }
    if (/[A-Z]/.test(password)) {
      poolSize += 26;
      score += 1;
    }
    if (/[0-9]/.test(password)) {
      poolSize += 10;
      score += 1;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      poolSize += 32;
      score += 1;
    }

    // Calculate Shannon Entropy: E = L * log2(R)
    // L = password length, R = pool size
    const entropy =
      poolSize > 0 ? Math.floor(password.length * Math.log2(poolSize)) : 0;

    // Boost score based on length and high entropy
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (entropy >= 60) score += 1; // 60+ bits of entropy is highly resistant to brute force

    // Cap the score at 5 for easy UI mapping (0 to 5 scale)
    score = Math.min(score, 5);

    let label = "Weak";
    if (score >= 4) label = "Strong";
    else if (score >= 2) label = "Fair";

    return {
      score,
      label,
      entropy,
      suggestions: this.getSuggestions(password),
    };
  },

  /**
   * Helper: Provides actionable feedback to the user
   */
  getSuggestions(password) {
    const suggestions = [];
    if (password.length < 12)
      suggestions.push("Make it at least 12 characters long.");
    if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters.");
    if (!/[0-9]/.test(password)) suggestions.push("Add numbers.");
    if (!/[^A-Za-z0-9]/.test(password))
      suggestions.push("Add special characters.");
    return suggestions;
  },
};
