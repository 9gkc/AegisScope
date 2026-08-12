export type VerifiedCredential = {
  name: string;
  issuer: string;
  issuedAt: string;
  verificationUrl: string;
};

/**
 * Publish entries only after the owner supplies an issuer-verifiable URL.
 * Keeping this empty is intentional: AegisScope never invents credentials.
 */
export const verifiedCredentials: VerifiedCredential[] = [];
