import type { ArchiveSearchResponse } from "@dtb/api";
import { localArchiveSearch } from "@dtb/core";
import { NextRequest, NextResponse } from "next/server";
import { searchArchiveForUser } from "../../../../lib/data";
import { getDemoCabinet } from "../../../../lib/demo-data";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "Login is required." } },
        { status: 401 }
      );
    }

    const response: ArchiveSearchResponse = {
      items: await searchArchiveForUser(user.id, query)
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer"
      }
    });
  }

  const data = getDemoCabinet();
  const archived = data.items.filter((item) => item.visibility === "archived");
  const response: ArchiveSearchResponse = {
    items: localArchiveSearch(archived, query)
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer"
    }
  });
}
