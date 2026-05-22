import type { PublicCabinetResponse } from "@dtb/api";
import { NextResponse } from "next/server";
import { getPublicCabinetByShareId } from "../../../../lib/data";

interface PublicRouteProps {
  params: Promise<{ shareId: string }>;
}

export async function GET(_request: Request, { params }: PublicRouteProps) {
  const { shareId } = await params;
  const response: PublicCabinetResponse | null = await getPublicCabinetByShareId(shareId);
  if (!response) {
    return NextResponse.json({ error: { code: "not_found", message: "Cabinet not found." } }, { status: 404 });
  }

  return NextResponse.json(response, {
    headers: {
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
    }
  });
}
