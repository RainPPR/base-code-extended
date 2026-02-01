/*
 * BaseXXX Encoder/Decoder
 * Logic for converting between UTF-8 text and various Base encodings.
 */

// Algorithms
const Algorithms = {
    // Standard Stream-based
    BASE16: 'base16',
    BASE64: 'base64',
    BASE85: 'base85', // Ascii85
    
    // Large Integer Conversion
    BIGINT: 'bigint'
};

class BaseConverter {
    constructor() {
        this.decoder = new TextDecoder();
        this.encoder = new TextEncoder();
    }

    // Helper: String/Bytes Conversions
    stringToBytes(str) {
        return this.encoder.encode(str);
    }

    bytesToString(bytes) {
        return this.decoder.decode(bytes);
    }
    
    // Helper: BigInt to/from Bytes
    // We treat the byte array as a big-endian number
    bytesToBigInt(bytes) {
        let ret = 0n;
        for (const byte of bytes) {
            ret = (ret << 8n) + BigInt(byte);
        }
        return ret;
    }

    bigIntToBytes(bi) {
        if (bi === 0n) return new Uint8Array([]);
        const bytes = [];
        while (bi > 0n) {
            bytes.unshift(Number(bi & 0xFFn));
            bi >>= 8n;
        }
        return new Uint8Array(bytes);
    }

    // Generic Base Encoded Integer Algorithm
    encodeBigInt(inputStr, alphabet) {
        if (!inputStr) return '';
        const bytes = this.stringToBytes(inputStr);
        let value = this.bytesToBigInt(bytes);
        
        if (value === 0n) return alphabet[0];

        let result = '';
        const base = BigInt(alphabet.length);
        
        while (value > 0n) {
            const remainder = value % base;
            result = alphabet[Number(remainder)] + result;
            value /= base;
        }
        
        // Handle leading null bytes from original input? 
        // Standard BigInt Logic usually ignores leading zeros of the number.
        // But for file encoding, leading zeros (null bytes) might be important.
        // Base58 (Bitcoin) handles leading zeros by adding '1's.
        // For generic "BaseXXX", we will follow a simple BigInt conversion for now.
        // If users want strictly reversible text-to-text, leading nulls in UTF-8 are rare unless using manual byte inputs.
        
        return result;
    }

    decodeBigInt(inputStr, alphabet) {
        if (!inputStr) return '';
        let value = 0n;
        const base = BigInt(alphabet.length);
        
        // Create a lookup map for speed
        const charMap = new Map();
        for(let i=0; i<alphabet.length; i++) {
            // Check if alphabet is array of strings or simple string
            // Chinese bases might be arrays
            charMap.set(alphabet[i], BigInt(i)); 
        }

        for (const char of inputStr) {
            if (!charMap.has(char)) {
                throw new Error(`Invalid character '${char}' for current base.`);
            }
            value = value * base + charMap.get(char);
        }

        const bytes = this.bigIntToBytes(value);
        return this.bytesToString(bytes);
    }
    
    // Base85 (Ascii85) Implementation
    encode85(inputStr) {
        const bytes = this.stringToBytes(inputStr);
        let padding = 0;
        let pBytes = bytes;
        
        if (bytes.length % 4 !== 0) {
            padding = 4 - (bytes.length % 4);
            const temp = new Uint8Array(bytes.length + padding);
            temp.set(bytes);
            pBytes = temp;
        }

        let result = '';
        for (let i = 0; i < pBytes.length; i += 4) {
            let val = (pBytes[i] << 24) | (pBytes[i+1] << 16) | (pBytes[i+2] << 8) | pBytes[i+3];
            // Treat as uint32
            val = val >>> 0;
            
            if (val === 0 && i < pBytes.length /* - padding? Standard Ascii85 uses 'z' for 0 chunks, but we can stick to full encoded if not optimizing */) {
                // Adobe Ascii85: 0x00000000 -> "z"
                result += 'z';
                continue;
            }
            
            let chunk = '';
            for (let j = 0; j < 5; j++) {
                chunk = String.fromCharCode((val % 85) + 33) + chunk;
                val = Math.floor(val / 85);
            }
            result += chunk;
        }
        
        // Remove padding
        if (padding > 0) {
             // In Ascii85, we remove the last 'padding' characters
             result = result.substring(0, result.length - padding);
        }
        
        return "<~" + result + "~>";
    }

    decode85(inputStr) {
        // Strip delimiters
        let data = inputStr.replace(/^<~/, '').replace(/~>$/, '').replace(/\s/g, '');
        if (data.endsWith('z')) {
           // z expansion
           // tricky if 'z' is inside. 
           // Ascii85 'z' replaces '!!!!!' (5 chars) which corresponds to 4 null bytes.
        }
        // Basic 'z' handling: replace 'z' with '!!!!!'
        data = data.replace(/z/g, '!!!!!');
        
        const padding = (5 - (data.length % 5)) % 5;
        if (padding) {
            data += 'u'.repeat(padding);
        }
        
        const bytes = [];
        for (let i = 0; i < data.length; i += 5) {
            let val = 0;
            for (let j = 0; j < 5; j++) {
                val = val * 85 + (data.charCodeAt(i + j) - 33);
            }
            
            bytes.push((val >>> 24) & 0xFF);
            bytes.push((val >>> 16) & 0xFF);
            bytes.push((val >>> 8) & 0xFF);
            bytes.push(val & 0xFF);
        }
        
        // Remove padding bytes
        const resultBytes = new Uint8Array(bytes.slice(0, bytes.length - padding));
        return this.bytesToString(resultBytes);
    }
}

// Alphabets
const ALPHABETS = {
    // 10
    BASE10: "0123456789",
    // 16
    BASE16: "0123456789ABCDEF",
    // 26
    BASE26: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    // 36
    BASE36: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    // 52
    BASE52: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    // 62
    BASE62: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    // 94
    BASE94: "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
};

// Generate Chinese Alphabets
function generateRange(startHex, endHex) {
    const start = parseInt(startHex, 16);
    const end = parseInt(endHex, 16);
    let str = "";
    for (let i = start; i <= end; i++) {
        str += String.fromCodePoint(i);
    }
    return str;
}

// Base Custom 1: \u4E00-\u9FFF + U+3007
const CHINESE_1_RANGE = generateRange("4E00", "9FFF") + "\u3007";
// Sort? "Default character sorting according to ASCII/Unicode number size"
// Generated in order, so sorted. \u3007 is 12295. 4E00 is 19968. 
// So 3007 should be first.
const CHINESE_1_SORTED = Array.from("\u3007" + generateRange("4E00", "9FFF"));

// Base Custom 2: \u4E00-\u9FFF + \u3400-\u4DBF + U+3007
// 3007 (12295), 3400-4DBF (13312-19903), 4E00-9FFF (19968-40959)
const CHINESE_2_SORTED = Array.from(
    "\u3007" + 
    generateRange("3400", "4DBF") + 
    generateRange("4E00", "9FFF")
);


const converter = new BaseConverter();

// Global Functions for UI
function convert(type, mode, text) {
    if (!text) return "";
    try {
        if (mode === 'decode') {
            switch(type) {
                case 'base10': return converter.decodeBigInt(text, ALPHABETS.BASE10);
                case 'base16': return (() => {
                    if (!text) return '';
                    // Simple Hex Decode
                    const bytes = new Uint8Array(text.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                    return converter.decoder.decode(bytes);
                })();
                case 'base26': return converter.decodeBigInt(text.toUpperCase(), ALPHABETS.BASE26);
                case 'base36': return converter.decodeBigInt(text.toUpperCase(), ALPHABETS.BASE36);
                case 'base52': return converter.decodeBigInt(text, ALPHABETS.BASE52);
                case 'base62': return converter.decodeBigInt(text, ALPHABETS.BASE62);
                case 'base64': return decodeURIComponent(escape(window.atob(text)));
                case 'base85': return converter.decode85(text);
                case 'base94': return converter.decodeBigInt(text, ALPHABETS.BASE94);
                case 'chinese1': return converter.decodeBigInt(text, CHINESE_1_SORTED);
                case 'chinese2': return converter.decodeBigInt(text, CHINESE_2_SORTED);
                default: return "Unknown Type";
            }
        } else {
            switch(type) {
                case 'base10': return converter.encodeBigInt(text, ALPHABETS.BASE10);
                case 'base16': return (() => {
                    const bytes = converter.stringToBytes(text);
                    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
                })();
                case 'base26': return converter.encodeBigInt(text, ALPHABETS.BASE26);
                case 'base36': return converter.encodeBigInt(text, ALPHABETS.BASE36);
                case 'base52': return converter.encodeBigInt(text, ALPHABETS.BASE52);
                case 'base62': return converter.encodeBigInt(text, ALPHABETS.BASE62);
                case 'base64': return window.btoa(unescape(encodeURIComponent(text)));
                case 'base85': return converter.encode85(text);
                case 'base94': return converter.encodeBigInt(text, ALPHABETS.BASE94);
                case 'chinese1': return converter.encodeBigInt(text, CHINESE_1_SORTED);
                case 'chinese2': return converter.encodeBigInt(text, CHINESE_2_SORTED);

                default: return "Unknown Type";
            }
        }
    } catch (e) {
        console.error(e);
        return "Error: " + e.message;
    }
}
