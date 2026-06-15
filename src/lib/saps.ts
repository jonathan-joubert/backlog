export interface FirearmApplication {
  id: string;
  alias: string;
  fsref: string;
  fserial: string;
  submittedAt: string; // ISO date
  lastResult?: StatusResult;
  lastCheckedAt?: string;
}

export interface StatusResult {
  applicationType: string;
  applicationNumber: string;
  calibre: string;
  make: string;
  serialNumber: string;
  statusDate: string;
  status: string;
  statusDescription: string;
  nextStep: string;
}

export interface Firearm {
  id: string;
  alias: string;
  serial?: string;
  issueDate: string; // ISO
  fcaSection: string; // section code
  createdAt: string;
}

const API_BASE =
  (typeof window !== "undefined" && (window as any).__SAPS_API__) ||
  "http://localhost:3001/api";

export async function checkSapsHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/healthcheck`, { method: "GET" });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.isUp);
  } catch {
    return false;
  }
}

export async function checkApplicationStatus(
  fsref: string,
  fserial: string,
): Promise<StatusResult> {
  const res = await fetch(`${API_BASE}/check-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fsref, fserial }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to fetch status");
  }
  return res.json();
}

export const SAPS_PORTAL_URL =
  "https://www.saps.gov.za/services/firearm_status_enquiry.php";
