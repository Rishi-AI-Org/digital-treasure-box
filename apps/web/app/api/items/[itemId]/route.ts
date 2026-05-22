import { NextRequest, NextResponse } from "next/server";
import { updateItemForUser } from "../../../../lib/data";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

interface ItemRouteProps {
  params: Promise<{ itemId: string }>;
}

export async function PATCH(request: NextRequest, { params }: ItemRouteProps) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: { code: "persistence_unconfigured", message: "Supabase is not configured." } },
      { status: 501 }
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Login is required." } }, { status: 401 });
  }

  const { itemId } = await params;
  const body = (await request.json()) as {
    title?: string;
    note?: string;
    tags?: string[];
    visibility?: "visible" | "archived" | "inbox";
  };

  try {
    const item = await updateItemForUser(user.id, itemId, body);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "item_update_failed",
          message: error instanceof Error ? error.message : "Item update failed."
        }
      },
      { status: 400 }
    );
  }
}
