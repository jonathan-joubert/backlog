// Shared SAPS scraping logic used by both the Vite dev middleware and the
// production Node server. Mirrors the original PHP/Express behaviour but
// works around the SAPS site's untrusted TLS chain (Node's fetch rejects it
// with UNABLE_TO_VERIFY_LEAF_SIGNATURE — curl/PHP silence it too).
import { Agent } from "undici";

const SAPS_URL = "https://www.saps.gov.za/services/firearm_status_enquiry.php";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// The SAPS server presents an incomplete cert chain. curl (used by the old
// PHP proxy) ignored it via CURLOPT_SSL_VERIFYPEER=false; we do the same
// here for outbound scraping only.
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });
const fetchOpts = (extra = {}) => ({
  ...extra,
  // @ts-expect-error undici dispatcher is accepted by Node's global fetch
  dispatcher: insecureAgent,
});

export async function readJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

export async function handleHealthcheck(_req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const r = await fetch(
      SAPS_URL,
      fetchOpts({ headers: { "User-Agent": UA }, method: "GET" }),
    );
    res.end(JSON.stringify({ isUp: r.ok }));
  } catch {
    res.end(JSON.stringify({ isUp: false }));
  }
}

export async function handleCheckStatus(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  const body = await readJsonBody(req);
  const fsref = String(body.fsref || "").trim();
  const fserial = String(body.fserial || "").trim();
  if (!fsref || !fserial) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        error: "Reference and Serial numbers are required",
      }),
    );
    return;
  }
  try {
    const getRes = await fetch(
      SAPS_URL,
      fetchOpts({ headers: { "User-Agent": UA } }),
    );
    const setCookie = getRes.headers.get("set-cookie") || "";
    const cookies = setCookie
      .split(/,(?=[^ ]+=)/)
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
    const html = await getRes.text();
    let csrf = "";
    const cookieMatch = cookies.match(/csrf_token=([^;]+)/);
    if (cookieMatch) csrf = cookieMatch[1];
    if (!csrf) {
      const m = html.match(/name="csrf_token"\s+value="([^"]+)"/i);
      if (m) csrf = m[1];
    }

    const params = new URLSearchParams({ csrf_token: csrf, fsref, fserial });
    const postRes = await fetch(
      SAPS_URL + "#result",
      fetchOpts({
        method: "POST",
        headers: {
          "User-Agent": UA,
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
          Referer: SAPS_URL,
        },
        body: params.toString(),
      }),
    );
    const resHtml = await postRes.text();
    const tableMatch = resHtml.match(
      /<table[^>]*class="[^"]*table-bordered[^"]*"[\s\S]*?<\/table>/i,
    );
    const rowMatch = tableMatch?.[0].match(
      /<tr[^>]*class="[^"]*active[^"]*"[^>]*>([\s\S]*?)<\/tr>/i,
    );
    if (!rowMatch) {
      res.statusCode = 404;
      res.end(
        JSON.stringify({
          error:
            "No status found. Please check your Reference and Serial numbers.",
        }),
      );
      return;
    }
    const cells = Array.from(
      rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
    ).map((m) =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
    res.end(
      JSON.stringify({
        applicationType: cells[0] || "",
        applicationNumber: cells[1] || "",
        calibre: cells[2] || "",
        make: cells[3] || "",
        serialNumber: cells[4] || "",
        statusDate: cells[5] || "",
        status: cells[6] || "",
        statusDescription: cells[7] || "",
        nextStep: cells[8] || "",
      }),
    );
  } catch (err) {
    console.error("[saps] check-status error:", err);
    res.statusCode = 500;
    res.end(
      JSON.stringify({ error: "Failed to communicate with SAPS server." }),
    );
  }
}
