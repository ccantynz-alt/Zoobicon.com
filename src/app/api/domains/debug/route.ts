import { NextResponse } from "next/server";

/**
 * GET /api/domains/debug
 * Temporary diagnostic endpoint to test OpenSRS connectivity.
 * Remove after confirming credentials work.
 */
export async function GET() {
  const hasKey = !!process.env.OPENSRS_API_KEY;
  const hasUser = !!process.env.OPENSRS_RESELLER_USER;
  const env = process.env.OPENSRS_ENV || "not set";

  // If no credentials, stop here
  if (!hasKey || !hasUser) {
    return NextResponse.json({
      status: "missing_credentials",
      hasKey,
      hasUser,
      env,
    });
  }

  // Try a single LOOKUP call to OpenSRS test API
  const { createHash } = require("crypto");
  const domain = "example.com";

  const xml = `<?xml version='1.0' encoding='UTF-8' standalone='no' ?>
<!DOCTYPE OPS_envelope SYSTEM 'ops.dtd'>
<OPS_envelope>
  <header><version>0.9</version></header>
  <body>
    <data_block>
      <dt_assoc>
        <item key="protocol">XCP</item>
        <item key="action">LOOKUP</item>
        <item key="object">DOMAIN</item>
        <item key="attributes">
          <dt_assoc>
            <item key="domain">${domain}</item>
          </dt_assoc>
        </item>
      </dt_assoc>
    </data_block>
  </body>
</OPS_envelope>`;

  const apiKey = process.env.OPENSRS_API_KEY!;
  const inner = createHash("md5").update(xml + apiKey).digest("hex");
  const signature = createHash("md5").update(inner + apiKey).digest("hex");

  const baseUrl =
    env === "live"
      ? "https://rr-n1-tor.opensrs.net:55443"
      : "https://horizon.opensrs.net:55443";

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "X-Username": process.env.OPENSRS_RESELLER_USER!,
        "X-Signature": signature,
        "Content-Length": String(Buffer.byteLength(xml)),
      },
      body: xml,
    });

    const text = await response.text();

    return NextResponse.json({
      status: "api_called",
      httpStatus: response.status,
      env,
      baseUrl,
      // Show the raw response (first 2000 chars)
      rawResponse: text.slice(0, 2000),
    });
  } catch (err) {
    return NextResponse.json({
      status: "api_error",
      env,
      baseUrl,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
