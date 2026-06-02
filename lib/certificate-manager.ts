import { 
  generateSigningKeys, 
  generateEncryptionKeys, 
  generateCertificate, 
  verifyCertificate, 
  hashSHA256,
  Certificate 
} from './crypto-utils'

export interface NodeSecrets {
  nodeId: string
  signingPublicKey: string
  signingSecretKey: string
  encryptionPublicKey: string
  encryptionSecretKey: string
  certificate: Certificate
  trustedCertificates: Map<string, Certificate>
  secretsVersion: number
  rotatedAt: number
}

export interface CertificateChain {
  chain: Certificate[]
  isValid: boolean
  trustScore: number
}

// Initialize node secrets on startup
export function initializeNodeSecrets(nodeId: string): NodeSecrets {
  const signingKeys = generateSigningKeys()
  const encryptionKeys = generateEncryptionKeys()
  const certificate = generateCertificate(nodeId, signingKeys.secretKey, signingKeys.publicKey)

  return {
    nodeId,
    signingPublicKey: signingKeys.publicKey,
    signingSecretKey: signingKeys.secretKey,
    encryptionPublicKey: encryptionKeys.publicKey,
    encryptionSecretKey: encryptionKeys.secretKey,
    certificate,
    trustedCertificates: new Map(),
    secretsVersion: 1,
    rotatedAt: Date.now(),
  }
}

// Store a trusted certificate
export function trustCertificate(secrets: NodeSecrets, cert: Certificate): boolean {
  const isValid = verifyCertificate(cert, cert.signingPublicKey)
  if (isValid) {
    secrets.trustedCertificates.set(cert.nodeId, cert)
  }
  return isValid
}

// Check if certificate is trusted
export function isCertificateTrusted(secrets: NodeSecrets, cert: Certificate): boolean {
  return secrets.trustedCertificates.has(cert.nodeId)
}

// Verify certificate chain
export function verifyCertificateChain(chain: Certificate[]): CertificateChain {
  if (chain.length === 0) {
    return { chain: [], isValid: false, trustScore: 0 }
  }

  let isValid = true
  let trustScore = 0

  for (let i = 0; i < chain.length; i++) {
    const cert = chain[i]

    // Check expiration
    if (Date.now() > cert.expiresAt) {
      isValid = false
      break
    }

    // Verify signature (self-signed for simplicity)
    if (i === 0) {
      // Root certificate
      if (!verifyCertificate(cert, cert.signingPublicKey)) {
        isValid = false
        break
      }
    } else {
      // Intermediate or leaf
      const issuerCert = chain[i - 1]
      if (!verifyCertificate(cert, issuerCert.signingPublicKey)) {
        isValid = false
        break
      }
    }

    trustScore += 20
  }

  if (isValid) trustScore += 10

  return {
    chain,
    isValid,
    trustScore: Math.min(100, trustScore),
  }
}

// Rotate keys (security best practice)
export function rotateKeys(secrets: NodeSecrets): NodeSecrets {
  const newSigningKeys = generateSigningKeys()
  const newEncryptionKeys = generateEncryptionKeys()
  const newCertificate = generateCertificate(secrets.nodeId, newSigningKeys.secretKey, newSigningKeys.publicKey)

  return {
    ...secrets,
    signingPublicKey: newSigningKeys.publicKey,
    signingSecretKey: newSigningKeys.secretKey,
    encryptionPublicKey: newEncryptionKeys.publicKey,
    encryptionSecretKey: newEncryptionKeys.secretKey,
    certificate: newCertificate,
    secretsVersion: secrets.secretsVersion + 1,
    rotatedAt: Date.now(),
  }
}

// Check if key rotation is due (every 30 days in simulation, every rotation-interval in real use)
export function isKeyRotationDue(secrets: NodeSecrets, intervalMs: number = 30 * 24 * 60 * 60 * 1000): boolean {
  return Date.now() - secrets.rotatedAt > intervalMs
}

// Securely revoke a certificate
export interface RevokedCertificate {
  thumbprint: string
  revokedAt: number
  reason: string
}

export class CertificateRevocationList {
  private revoked: Set<string> = new Set()
  private revocationRecords: Map<string, RevokedCertificate> = new Map()

  revoke(thumbprint: string, reason: string = 'unspecified'): void {
    const record: RevokedCertificate = {
      thumbprint,
      revokedAt: Date.now(),
      reason,
    }
    this.revoked.add(thumbprint)
    this.revocationRecords.set(thumbprint, record)
  }

  isRevoked(thumbprint: string): boolean {
    return this.revoked.has(thumbprint)
  }

  getRevocationReason(thumbprint: string): string | null {
    return this.revocationRecords.get(thumbprint)?.reason || null
  }

  export(): RevokedCertificate[] {
    return Array.from(this.revocationRecords.values())
  }

  import(records: RevokedCertificate[]): void {
    for (const record of records) {
      this.revoke(record.thumbprint, record.reason)
    }
  }
}

// Session key management
export interface SessionKey {
  keyId: string
  sharedSecret: string
  createdAt: number
  expiresAt: number
  connectionId: string
  used: number
}

export class SessionKeyStore {
  private keys: Map<string, SessionKey> = new Map()

  createSessionKey(connectionId: string, sharedSecret: string, ttlMs: number = 3600000): SessionKey {
    const key: SessionKey = {
      keyId: `sk-${connectionId}-${Date.now()}`,
      sharedSecret,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      connectionId,
      used: 0,
    }
    this.keys.set(key.keyId, key)
    return key
  }

  getSessionKey(keyId: string): SessionKey | null {
    const key = this.keys.get(keyId)
    if (!key) return null

    // Check expiration
    if (Date.now() > key.expiresAt) {
      this.keys.delete(keyId)
      return null
    }

    return key
  }

  useKey(keyId: string): boolean {
    const key = this.getSessionKey(keyId)
    if (!key) return false
    key.used++
    return true
  }

  revokeSessionKey(keyId: string): void {
    this.keys.delete(keyId)
  }

  revokeConnectionKeys(connectionId: string): void {
    for (const [keyId, key] of this.keys.entries()) {
      if (key.connectionId === connectionId) {
        this.keys.delete(keyId)
      }
    }
  }

  expireOldKeys(): void {
    const now = Date.now()
    for (const [keyId, key] of this.keys.entries()) {
      if (now > key.expiresAt) {
        this.keys.delete(keyId)
      }
    }
  }

  getAllKeys(): SessionKey[] {
    return Array.from(this.keys.values())
  }
}

// Secret derivation utilities
export function deriveConnectionSecret(
  masterSecret: string,
  connectionId: string,
  purpose: string
): string {
  // Simple HKDF-like derivation
  const material = `${masterSecret}|${connectionId}|${purpose}`
  return hashSHA256(material)
}

// Secure random challenge for authentication
export function generateChallenge(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Response to challenge (proof of private key ownership)
export function createChallengeResponse(challenge: string, secretKey: string): string {
  const { signMessage } = require('./crypto-utils')
  return signMessage(challenge, secretKey)
}

// Verify challenge response
export function verifyChallengeResponse(
  challenge: string,
  response: string,
  publicKey: string
): boolean {
  const { verifySignedMessage } = require('./crypto-utils')
  const verified = verifySignedMessage(response, publicKey)
  return verified === challenge
}
