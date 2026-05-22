import { NextRequest, NextResponse } from "next/server";
import { moveItemForUser } from "../../../../../lib/data";
import { createSupabaseServerClient } from "../../../../../lib/supabase-server";

interface MoveRouteProps {
  params: Promise<{ itemId: string }>;
}

export async function POST(request: NextRequest, { params }: MoveRouteProps) {
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
  const body = (await request.json()) as { direction?: "up" | "down" };
  if (body.direction !== "up" && body.direction !== "down") {
    return NextResponse.json(
      { error: { code: "invalid_direction", message: "Direction must be up or down." } },
      { status: 400 }
    );
  }

  try {
    const items = await moveItemForUser(user.id, itemId, body.direction);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "item_move_failed",
          message: error instanceof Error ? error.message : "Item move failed."
        }
      },
      { status: 400 }
    );
  }
}
