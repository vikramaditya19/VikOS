// vikOS crypto utility: native WebCrypto only, no libraries.
//
// Payload format (all binary fields are base64 strings):
// { v: 1, alg: 'AES-GCM-256', kdf: 'PBKDF2-SHA256', iterations, salt, iv, ciphertext }

export const KDF_ITERATIONS = 600000
const SALT_BYTES = 16
const IV_BYTES = 12 // the recommended IV size for AES-GCM

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export class CryptoError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CryptoError'
  }
}

// WebCrypto exists only in secure contexts (https:// or localhost)
export function isCryptoAvailable() {
  return typeof window !== 'undefined' && window.isSecureContext === true && Boolean(window.crypto?.subtle)
}

function assertAvailable() {
  if (!isCryptoAvailable()) {
    throw new CryptoError('WebCrypto is unavailable. Open vikOS on localhost or over HTTPS.')
  }
}

/* ---------------------------- base64 helpers ---------------------------- */

export function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000 // build in chunks so large inputs don't overflow the call stack
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/* ------------------------------ key handling ----------------------------- */

export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES))
}

// Turns a passphrase + salt into a non-extractable AES-GCM key.
export async function deriveKey(passphrase, salt, iterations = KDF_ITERATIONS) {
  assertAvailable()
  if (typeof passphrase !== 'string' || passphrase.length === 0) {
    throw new CryptoError('A passphrase is required.')
  }

  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false, // the key itself can never be exported
    ['encrypt', 'decrypt'],
  )
}

/* ------------------------- encrypt / decrypt text ------------------------ */

export async function encryptText(plaintext, passphrase) {
  assertAvailable()
  const salt = generateSalt()
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES)) // fresh IV every time
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS)

  const buffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    v: 1,
    alg: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: KDF_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(buffer)),
  }
}

export async function decryptText(payload, passphrase) {
  assertAvailable()
  if (
    !payload ||
    payload.v !== 1 ||
    typeof payload.salt !== 'string' ||
    typeof payload.iv !== 'string' ||
    typeof payload.ciphertext !== 'string'
  ) {
    throw new CryptoError('This payload is not a valid vikOS encrypted file.')
  }

  const key = await deriveKey(passphrase, base64ToBytes(payload.salt), payload.iterations)

  try {
    const buffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
      key,
      base64ToBytes(payload.ciphertext),
    )
    return decoder.decode(buffer)
  } catch {
    // AES-GCM authentication failed: wrong passphrase, or the data was altered
    throw new CryptoError('Wrong passphrase, or the data has been altered.')
  }
}