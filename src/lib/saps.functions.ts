import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SAPS_URL = "https://www.saps.gov.za/services/firearm_status_enquiry.php";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
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

// The SAPS server does not send its intermediate certificate, so strict TLS
// verification fails. On Node (dev/self-hosted) we relax it for this process;
// on edge runtimes this is a harmless no-op.
function relaxTls() {
  try {
    if (typeof process !== "undefined" && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }
  } catch {
    /* not available on edge runtimes */
  }
}

export const checkSapsHealth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    relaxTls();
    const res = await fetch(SAPS_URL, { headers: BROWSER_HEADERS });
    return { isUp: res.ok };
  } catch {
    return { isUp: false };
  }
});

export const checkFirearmStatus = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ fsref: z.string().min(1), fserial: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<StatusResult> => {
    relaxTls();
    const getRes = await fetch(SAPS_URL, { headers: BROWSER_HEADERS });
    const getHtml = await getRes.text();

    const rawCookies = getRes.headers.get("set-cookie") ?? "";
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

    const postRes = await fetch(SAPS_URL, {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
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
  });
