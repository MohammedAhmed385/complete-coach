import { NextRequest, NextResponse } from "next/server";
import { extractGeoFromHeaders, getCloudflareRequestCf } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const cf = await getCloudflareRequestCf();
  const geo = extractGeoFromHeaders(
    request.headers,
    cf || ((request as any).cf as Record<string, any> | undefined)
  );

  return NextResponse.json(geo, {
    status: 200,
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
