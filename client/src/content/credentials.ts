export type VerifiedCredential = {
  name: string;
  issuer: string;
  issuedAt: string;
  verificationUrl: string;
};

/**
 * Entries are published only after the owner supplies an issuer-verifiable URL.
 * These records were verified against their supplied public issuer sources.
 */
export const verifiedCredentials: VerifiedCredential[] = [
  {
    name: "Hacker Holidays Completion Certificate",
    issuer: "TryHackMe",
    issuedAt: "August 2026",
    verificationUrl: "https://tryhackme-certificates.s3-eu-west-1.amazonaws.com/THM-3LYUJZA1UG.pdf",
  },
  {
    name: "Certified Cybersecurity Foundations",
    issuer: "Hackviser",
    issuedAt: "July 2026",
    verificationUrl: "https://hackviser.com/verify?id=HV-CORE-JHJMRHB7",
  },
  {
    name: "Advent of Cyber 2025 Certificate",
    issuer: "TryHackMe",
    issuedAt: "December 2025",
    verificationUrl: "https://tryhackme-certificates.s3-eu-west-1.amazonaws.com/THM-ZFVLWNOUOA.pdf",
  },
];
