import { PageHeading } from "@/components/AegisLayout";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const descriptions: Record<string, { eyebrow: string; title: string; description: string; limit: string }> = {
  Programs: { eyebrow: "Engagement management", title: "Programs", description: "Define your authorized bug bounty or penetration-testing work before adding an asset or recording a finding.", limit: "Each record is private to its owner; program scope is captured as a first-class control." },
  Assets: { eyebrow: "Allowlist inventory", title: "Authorized assets", description: "Record only public domains, public IP addresses, and HTTP(S) applications for which you have testing authorization.", limit: "Private, loopback, link-local, custom-port, and malformed targets are rejected." },
  Findings: { eyebrow: "Evidence lifecycle", title: "Security findings", description: "Document severity, CVSS, impact, safe reproduction narrative, remediation, and retest evidence in one accountable workflow.", limit: "Sensitive credentials and unredacted personal data must never be saved as evidence." },
  Reports: { eyebrow: "Responsible disclosure", title: "Report generator", description: "Compose consistent Markdown reports with test environment, impact, safe PoC narrative, CVSS, remediation, and evidence references.", limit: "The report workflow preserves a safe narrative; it is not an exploit generator." },
  "Header review": { eyebrow: "Low-impact verification", title: "Security headers", description: "Review defensive HTTP response headers for an explicitly verified, allowlisted web asset.", limit: "The reviewer is rate-limited, no-redirect, and limited to low-impact HTTP(S) requests." },
  "Local review": { eyebrow: "Client-side privacy", title: "Configuration review", description: "Review Terraform, Docker Compose, and Kubernetes configurations locally in the browser for defensive misconfiguration patterns.", limit: "Configuration content is never uploaded, persisted, or transmitted to the server." },
};

export default function WorkspaceComingSoon({ section }: { section: string }) {
  const content = descriptions[section];
  return <><PageHeading eyebrow={content.eyebrow} title={content.title} description={content.description} /><Card className="border-white/[0.08] bg-white/[0.035] p-6 shadow-none"><div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-300/15 bg-sky-400/10 text-sky-200"><ShieldCheck size={20} /></div><h2 className="mt-5 font-display text-xl font-semibold text-slate-100">Module is being secured before release.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{content.limit}</p></Card></>;
}
