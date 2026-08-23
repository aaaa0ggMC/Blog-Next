import { ekey_norm } from './Data'

function getKey(passKey?: string | null): string | null {
  if (typeof localStorage === 'undefined') return passKey ?? null
  return passKey ?? localStorage.getItem(ekey_norm)
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveGcmKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Checks if a string has the valid structure of Base64 ciphertext (Salt 16B + IV 12B + Tag 16B + N)
 */
export function isBase64Cipher(str: string): boolean {
  if (typeof str !== 'string') return false
  const trimmed = str.trim()
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return false
  try {
    const raw = window.atob(trimmed)
    return raw.length >= 44
  } catch (e) {
    return false
  }
}

export function isHexCipher(str: string): boolean {
  if (typeof str !== 'string') return false
  const trimmed = str.trim()
  return /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= 64 && trimmed.length % 2 === 0
}

/**
 * Modern Base64 encryption using Web Crypto API (PBKDF2 + AES-256-GCM)
 */
export async function encrypt(data: string, passKey?: string | null): Promise<string> {
  const key = getKey(passKey)
  if (!key) {
    console.warn('No key found for encryption')
    return data
  }

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return data
  }

  try {
    const enc = new TextEncoder()
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const cryptoKey = await deriveGcmKey(key, salt)

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(data),
    )
    const cipherBytes = new Uint8Array(cipherBuffer)

    const combined = new Uint8Array(salt.length + iv.length + cipherBytes.length)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(cipherBytes, salt.length + iv.length)

    return uint8ArrayToBase64(combined)
  } catch (error) {
    console.error('Encryption failed:', error)
    return data
  }
}

/**
 * Modern Base64 decryption using Web Crypto API (PBKDF2 + AES-256-GCM)
 */
export async function decrypt(data: string, passKey?: string | null): Promise<string> {
  const key = getKey(passKey)
  if (!key || !data) {
    return data
  }

  const trimmed = data.trim()
  if (!isBase64Cipher(trimmed)) {
    return data
  }

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return data
  }

  try {
    const rawBytes = base64ToUint8Array(trimmed)
    if (rawBytes.length < 44) return data

    const salt = rawBytes.subarray(0, 16)
    const iv = rawBytes.subarray(16, 28)
    const ciphertext = rawBytes.subarray(28)

    const cryptoKey = await deriveGcmKey(key, salt)
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext,
    )
    return new TextDecoder().decode(decryptedBuffer)
  } catch (error) {
    // Decryption failed (wrong key or corrupted ciphertext)
    return data
  }
}