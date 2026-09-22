// Client-side SAPS firearm status checker.
//
// The SAPS portal does not send CORS headers, so a direct browser fetch is
// blocked. Point VITE_SAPS_PROXY_URL at the small proxy.php helper (see
// README.md) uploaded next to the app on the same hosting account, e.g.:
//   VITE_SAPS_PROXY_URL=https://backlog.fibco.co.za/proxy.php
// The proxy simply forwards the request to SAPS and returns the HTML.

const SAPS_URL = "https://www.saps.gov.za/services/firearm_status_enquiry.php";
const PROXY_URL = import.meta.env.VITE_SAPS_PROXY_URL as string | undefined;

const BROWSER_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export type StatusResult = {
  applicationType: string;
  applicationNumber: string;
  calibre: string;
  make: string;
  serialNumber: string;
  statusDate: string;
  status: string;
  statusDescription: string;
  nextStep: string;
};

function stripTags(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseResultRow(html: string): string[] | null {
  const rowMatch = html.match(/<tr[^>]*class="[^"]*active[^"]*"[^>]*>([\s\S]*?)<\/tr>/i);
  if (!rowMatch) return null;
  const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
    stripTags(m[1]),
  );
  return cells.length ? cells : null;
}

function requireProxy(): string {
  if (!PROXY_URL) {
    throw new Error(
      "Status checks need the proxy helper. Ask the site owner to upload proxy.php " +
        "and set VITE_SAPS_PROXY_URL (see README).",
    );
  }
  return PROXY_URL;
}

async function fetchPage(target: string, init?: RequestInit): Promise<Response> {
  const url = `${requireProxy()}?url=${encodeURIComponent(target)}`;
  return fetch(url, init);
}

export async function checkSapsHealth(): Promise<{ isUp: boolean }> {
  try {
    if (!PROXY_URL) return { isUp: false };
    const res = await fetchPage(SAPS_URL, { headers: BROWSER_HEADERS });
    return { isUp: res.ok };
  } catch {
    return { isUp: false };
  }
}

export async function checkFirearmStatus(data: {
  fsref: string;
  fserial: string;
}): Promise<StatusResult> {
  const getRes = await fetchPage(SAPS_URL, { headers: BROWSER_HEADERS });
  const getHtml = await getRes.text();

  const rawCookies = getRes.headers.get("x-proxy-set-cookie") ?? "";
  const cookieHeader = rawCookies
    .split(/,(?=[^;]+?=)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");

  let csrfToken = cookieHeader.match(/csrf_token=([^;]+)/)?.[1] ?? "";
  if (!csrfToken) {
    csrfToken =
      getHtml.match(/name="csrf_token"[^>]*value="([^"]*)"/i)?.[1] ??
      getHtml.match(/value="([^"]*)"[^>]*name="csrf_token"/i)?.[1] ??
      "";
  }

  const body = new URLSearchParams({
    csrf_token: csrfToken,
    fsref: data.fsref,
    fserial: data.fserial,
  });

  const postRes = await fetchPage(SAPS_URL, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(cookieHeader ? { "x-proxy-cookie": cookieHeader } : {}),
    },
    body,
  });

  const cells = parseResultRow(await postRes.text());
  if (!cells) {
    throw new Error("No status found. Please check your reference and serial numbers.");
  }

  return {
    applicationType: cells[0] ?? "",
    applicationNumber: cells[1] ?? "",
    calibre: cells[2] ?? "",
    make: cells[3] ?? "",
    serialNumber: cells[4] ?? "",
    statusDate: cells[5] ?? "",
    status: cells[6] ?? "",
    statusDescription: cells[7] ?? "",
    nextStep: cells[8] ?? "",
  };
}
