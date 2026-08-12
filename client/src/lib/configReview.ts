export type ConfigObservation = { id: string; title: string; severity: "high" | "medium" | "low"; detail: string; line: number };

const rules: Array<Omit<ConfigObservation, "line"> & { pattern: RegExp }> = [
  { id: "privileged", title: "Privileged workload", severity: "high", detail: "Avoid privileged containers unless a narrowly documented exception exists.", pattern: /^\s*privileged\s*:\s*true\s*$/im },
  { id: "host-network", title: "Host network namespace", severity: "high", detail: "hostNetwork removes network isolation for the workload.", pattern: /^\s*hostNetwork\s*:\s*true\s*$/im },
  { id: "host-pid", title: "Host PID namespace", severity: "high", detail: "hostPID exposes host process visibility to the workload.", pattern: /^\s*hostPID\s*:\s*true\s*$/im },
  { id: "host-path", title: "Host path mount", severity: "high", detail: "Review hostPath mounts and restrict them to the minimum required path and access mode.", pattern: /^\s*hostPath\s*:/im },
  { id: "privilege-escalation", title: "Privilege escalation allowed", severity: "medium", detail: "Set allowPrivilegeEscalation to false where the workload does not require it.", pattern: /^\s*allowPrivilegeEscalation\s*:\s*true\s*$/im },
  { id: "run-as-root", title: "Non-root enforcement missing", severity: "medium", detail: "Set runAsNonRoot to true and use a non-root image user.", pattern: /^\s*runAsNonRoot\s*:\s*false\s*$/im },
  { id: "admin-capability", title: "Sensitive Linux capability", severity: "medium", detail: "Remove NET_ADMIN or SYS_ADMIN unless the capability is explicitly required and approved.", pattern: /\b(NET_ADMIN|SYS_ADMIN)\b/im },
  { id: "public-cidr", title: "Public ingress CIDR", severity: "medium", detail: "Review 0.0.0.0/0 access and replace it with narrowly scoped CIDRs where possible.", pattern: /0\.0\.0\.0\/0/im },
  { id: "public-resource", title: "Publicly accessible resource", severity: "medium", detail: "Confirm this public exposure is intentional and protected by the appropriate controls.", pattern: /publicly[_-]?accessible\s*=\s*true/im },
];

export function reviewConfigText(text: string): ConfigObservation[] {
  return rules.flatMap(rule => {
    const match = rule.pattern.exec(text);
    if (!match || match.index === undefined) return [];
    return [{ id: rule.id, title: rule.title, severity: rule.severity, detail: rule.detail, line: text.slice(0, match.index).split("\n").length }];
  });
}
