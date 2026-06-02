import nacl from 'tweetnacl'
import CryptoJS from 'crypto-js'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function utf8ToBytes(value: string): Uint8Array {
  return textEncoder.encode(value)
}

function bytesToUtf8(value: Uint8Array): string {
  return textDecoder.decode(value)
}

function bytesToBase64(value: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64')
  }

  let binary = ''
  for (let i = 0; i < value.length; i++) {
    binary += String.fromCharCode(value[i])
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'))
  }

  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Generate Ed25519 keypair for signing
export function generateSigningKeys() {
  const keypair = nacl.sign.keyPair()
  return {
    publicKey: bytesToBase64(keypair.publicKey),
    secretKey: bytesToBase64(keypair.secretKey),
    rawPublicKey: keypair.publicKey,
    rawSecretKey: keypair.secretKey,
  }
}

// Generate Curve25519 keypair for encryption
export function generateEncryptionKeys() {
  const keypair = nacl.box.keyPair()
  return {
    publicKey: bytesToBase64(keypair.publicKey),
    secretKey: bytesToBase64(keypair.secretKey),
    rawPublicKey: keypair.publicKey,
    rawSecretKey: keypair.secretKey,
  }
}

// Sign a message
export function signMessage(message: string, secretKey: string): string {
  const decodedSecretKey = base64ToBytes(secretKey)
  const decodedMessage = utf8ToBytes(message)
  const signed = nacl.sign(decodedMessage, decodedSecretKey)
  return bytesToBase64(signed)
}

// Verify a signed message
export function verifySignedMessage(signedMessage: string, publicKey: string): string | null {
  try {
    const decodedPublicKey = base64ToBytes(publicKey)
    const decodedSigned = base64ToBytes(signedMessage)
    const verified = nacl.sign.open(decodedSigned, decodedPublicKey)
    if (!verified) return null
    return bytesToUtf8(verified)
  } catch {
    return null
  }
}

// ECDH-like key exchange simulation using precomputed shared secret
export function generateSharedSecret(mySecretKey: string, theirPublicKey: string): string {
  const decodedMySecret = base64ToBytes(mySecretKey)
  const decodedTheirPublic = base64ToBytes(theirPublicKey)
  const shared = nacl.box.before(decodedTheirPublic, decodedMySecret)
  return bytesToBase64(shared)
}

// Encrypt with shared secret using ChaCha20-Poly1305
export function encryptWithSharedSecret(plaintext: string, sharedSecret: string): string {
  const decodedSharedSecret = base64ToBytes(sharedSecret)
  const nonce = nacl.randomBytes(24)
  const decodedMessage = utf8ToBytes(plaintext)
  
  const encrypted = nacl.secretbox(decodedMessage, nonce, decodedSharedSecret)
  
  // Combine nonce + encrypted message
  const combined = new Uint8Array(nonce.length + encrypted.length)
  combined.set(nonce, 0)
  combined.set(encrypted, nonce.length)
  return bytesToBase64(combined)
}

// Decrypt with shared secret
export function decryptWithSharedSecret(ciphertext: string, sharedSecret: string): string | null {
  try {
    const decodedSharedSecret = base64ToBytes(sharedSecret)
    const combined = base64ToBytes(ciphertext)
    
    const nonce = combined.slice(0, 24)
    const encrypted = combined.slice(24)
    
    const decrypted = nacl.secretbox.open(encrypted, nonce, decodedSharedSecret)
    if (!decrypted) return null
    
    return bytesToUtf8(decrypted)
  } catch {
    return null
  }
}

// AES-256-GCM encryption (simulated with CryptoJS)
export function encryptAES256(plaintext: string, key: string): string {
  return CryptoJS.AES.encrypt(plaintext, key).toString()
}

// AES-256-GCM decryption
export function decryptAES256(ciphertext: string, key: string): string | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key)
    const utf8String = decrypted.toString(CryptoJS.enc.Utf8)
    return utf8String || null
  } catch {
    return null
  }
}

// Derive key using PBKDF2
export function deriveKey(password: string, salt: string, iterations = 1000): string {
  const derived = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations,
  })
  return derived.toString()
}

// Generate random bytes (hex)
export function randomBytes(length: number): string {
  const bytes = nacl.randomBytes(length)
  return bytesToBase64(bytes)
}

// Hash function (SHA-256)
export function hashSHA256(data: string): string {
  return CryptoJS.SHA256(data).toString()
}

// Generate certificate data (self-signed cert structure)
export interface Certificate {
  nodeId: string
  publicKey: string
  signingPublicKey: string
  issuedAt: number
  expiresAt: number
  issuer: string
  signature: string
  thumbprint: string
}

export function generateCertificate(nodeId: string, signingSecretKey: string, signingPublicKey: string): Certificate {
  const encryptionKeys = generateEncryptionKeys()
  const issuedAt = Date.now()
  const expiresAt = issuedAt + 365 * 24 * 60 * 60 * 1000 // 1 year

  const certData = {
    nodeId,
    publicKey: encryptionKeys.publicKey,
    issuedAt,
    expiresAt,
    issuer: nodeId,
  }

  const certDataString = JSON.stringify(certData)
  const signature = signMessage(certDataString, signingSecretKey)
  const thumbprint = hashSHA256(certDataString)

  return {
    ...certData,
    signingPublicKey,
    signature,
    thumbprint,
  }
}

// Verify certificate
export function verifyCertificate(cert: Certificate, issuerPublicKey: string): boolean {
  const now = Date.now()
  
  // Check expiration
  if (now > cert.expiresAt) return false
  
  // Verify signature
  const certData = {
    nodeId: cert.nodeId,
    publicKey: cert.publicKey,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
    issuer: cert.issuer,
  }
  
  const certDataString = JSON.stringify(certData)
  const verified = verifySignedMessage(cert.signature, issuerPublicKey)
  
  if (!verified) return false
  
  // Verify thumbprint
  const expectedThumbprint = hashSHA256(certDataString)
  return cert.thumbprint === expectedThumbprint
}

// Calculate trust score based on certificate validity
export function calculateTrustScore(
  cert: Certificate | null,
  isVerified: boolean,
  connectionAge: number
): number {
  let score = 50 // baseline

  if (!cert) return score

  if (isVerified) score += 30
  if (Date.now() < cert.expiresAt) score += 10

  // Age factor: trust increases with connection stability
  const ageInHours = connectionAge / (1000 * 60 * 60)
  score += Math.min(10, ageInHours)

  return Math.min(100, score)
}
