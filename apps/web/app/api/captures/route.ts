import type { CreateCaptureRequest, CreateCaptureResponse } from "@dtb/api";
import { buildProviderMetadata, parsePublicUrl, type CabinetItem } from "@dtb/core";
import { NextRequest, NextResponse } from "next/server";
import { createCaptureForUser, getUserCabinet } from "../../../lib/data";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateCaptureRequest;
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "Login is required to capture items." } },
        { status: 401 }
      );
    }

    try {
      const cabinet = await getUserCabinet(user.id);
      const input = {
        userId: user.id,
        cabinetId: cabinet.cabinetId,
        url: body.url ?? ""
      } as {
        userId: string;
        cabinetId: string;
        url: string;
        title?: string;
        note?: string;
        tags?: string[];
        sourceApp?: string;
      };

      if (body.title) {
        input.title = body.title;
      }
      if (body.note) {
        input.note = body.note;
      }
      if (body.tags) {
        input.tags = body.tags;
      }
      if (body.sourceApp) {
        input.sourceApp = body.sourceApp;
      }

      const item = await createCaptureForUser(input);

      const response: CreateCaptureResponse = {
        capture: {
          id: crypto.randomUUID(),
          status: "ready",
          payload: body,
          item
        }
      };

      return NextResponse.json(response, { status: 202 });
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: "capture_failed",
            message: error instanceof Error ? error.message : "Capture failed."
          }
        },
        { status: 400 }
      );
    }
  }

  const parsed = parsePublicUrl(body.url);

  if (!parsed.ok) {
    return NextResponse.json(
      { error: { code: parsed.reason, message: "The submitted URL cannot be captured." } },
      { status: 400 }
    );
  }

  const metadata = buildProviderMetadata(parsed.normalizedUrl);
  const now = new Date().toISOString();
  const item: CabinetItem = {
    id: crypto.randomUUID(),
    userId: "demo-user",
    cabinetId: "demo-cabinet",
    sourceType: parsed.provider,
    visibility: "inbox",
    position: null,
    originalUrl: parsed.normalizedUrl,
    canonicalUrl: metadata.canonicalUrl,
    title: body.title || metadata.title || parsed.url.hostname,
    tags: body.tags ?? [],
    metadata,
    createdAt: now,
    updatedAt: now
  };

  if (body.note) {
    item.note = body.note;
  }

  if (metadata.embed) {
    item.embed = metadata.embed;
  }

  const response: CreateCaptureResponse = {
    capture: {
      id: crypto.randomUUID(),
      status: "ready",
      payload: body,
      item
    }
  };

  return NextResponse.json(response, { status: 202 });
}
