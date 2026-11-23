import { NextRequest, NextResponse } from "next/server";
import {
  getCaseSessionsAsync,
  saveCaseSessionAsync,
  deleteCaseSessionAsync,
} from "@/lib/live-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessions = await getCaseSessionsAsync(id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Get case sessions error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const sessionInput = body.session || body;

    const result = await saveCaseSessionAsync(id, sessionInput, body._baseSnapshot);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create case session error:", error);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const sessionInput = body.session || body;

    if (!sessionInput?.id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const result = await saveCaseSessionAsync(id, sessionInput, body._baseSnapshot);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Update case session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const querySessionId = url.searchParams.get("sessionId") || url.searchParams.get("id");
    const body = await request.json().catch(() => ({}));
    const sessionId = querySessionId || body.sessionId || body.id;

    if (!sessionId) {
      return NextResponse.json({ error: "معرف الجلسة مطلوب للحذف" }, { status: 400 });
    }

    const sessions = await deleteCaseSessionAsync(id, sessionId, body._baseSnapshot);
    return NextResponse.json({ deleted: true, sessions });
  } catch (error) {
    console.error("Delete case session error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
