export class PasswordEngine {
    constructor() {
        this.charSets = {
            upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            lower: "abcdefghijklmnopqrstuvwxyz",
            numbers: "0123456789",
            symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
        };
    }

    generate(length = 24, useUpper = true, useLower = true, useNumbers = true, useSymbols = true) {
        let pool = "";
        let guaranteed = [];
        
        if (useUpper) {
            pool += this.charSets.upper;
            guaranteed.push(this.charSets.upper[Math.floor(Math.random() * this.charSets.upper.length)]);
        }
        if (useLower) {
            pool += this.charSets.lower;
            guaranteed.push(this.charSets.lower[Math.floor(Math.random() * this.charSets.lower.length)]);
        }
        if (useNumbers) {
            pool += this.charSets.numbers;
            guaranteed.push(this.charSets.numbers[Math.floor(Math.random() * this.charSets.numbers.length)]);
        }
        if (useSymbols) {
            pool += this.charSets.symbols;
            guaranteed.push(this.charSets.symbols[Math.floor(Math.random() * this.charSets.symbols.length)]);
        }
            
        if (!pool) throw new Error("At least one character set must be selected.");

        let remainingLength = length - guaranteed.length;
        let passwordArray = [...guaranteed];
        
        for (let i = 0; i < remainingLength; i++) {
            passwordArray.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        
        // Shuffle the array
        for (let i = passwordArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
        }
        
        return passwordArray.join("");
    }

    checkStrength(password) {
        let analysis = {
            length: password.length,
            uppercase: (password.match(/[A-Z]/g) || []).length,
            lowercase: (password.match(/[a-z]/g) || []).length,
            numbers: (password.match(/[0-9]/g) || []).length,
            symbols: (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length
        };

        let poolSize = 0;
        if (analysis.uppercase > 0) poolSize += 26;
        if (analysis.lowercase > 0) poolSize += 26;
        if (analysis.numbers > 0) poolSize += 10;
        if (analysis.symbols > 0) poolSize += this.charSets.symbols.length;

        let entropy = 0;
        if (poolSize > 0 && analysis.length > 0) {
            entropy = analysis.length * Math.log2(poolSize);
        }

        let score = Math.min(100, Math.max(0, Math.floor((entropy / 100) * 100)));
        
        let label = "Weak";
        if (score >= 25 && score < 50) label = "Fair";
        else if (score >= 50 && score < 75) label = "Strong";
        else if (score >= 75) label = "Very Strong";

        return { score, label, entropyBits: entropy.toFixed(2), details: analysis };
    }
}