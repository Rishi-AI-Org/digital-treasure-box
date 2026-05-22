import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "../../../lib/supabase-server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    shareId?: string;
    reason?: string;
    details?: string;
    reporterContact?: string;
  };

  if (!body.shareId || !body.reason) {
    return NextResponse.json(
      { error: { code: "missing_report_fields", message: "Share ID and reason are required." } },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServiceClient();
  const reportId = crypto.randomUUID();

  if (supabase) {
    const { error } = await supabase.from("reports").insert({
      id: reportId,
      share_id: body.shareId,
      reason: body.reason,
      details: body.details,
      reporter_contact: body.reporterContact,
      status: "open"
    });

    if (error) {
      return NextResponse.json(
        { error: { code: "report_insert_failed", message: "Report could not be saved." } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      report: {
        id: reportId,
        status: "open",
        shareId: body.shareId
      }
    },
    {
      status: 202,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer"
      }
    }
  );
}
