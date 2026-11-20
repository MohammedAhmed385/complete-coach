import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const paper = await prisma.savedPaper.create({
      data: {
        userId: body.userId || "default-user",
        pmid: body.pmid,
        title: body.title,
        authors: body.authors || null,
        journal: body.journal || null,
        pubDate: body.pubDate || null,
        abstract: body.abstract || null,
        doi: body.doi || null,
        aiSummary: body.aiSummary || null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
      },
    });

    return NextResponse.json(paper, { status: 201 });
  } catch (error) {
    console.error("Save paper error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const papers = await prisma.savedPaper.findMany({
      orderBy: { savedAt: "desc" },
    });
    return NextResponse.json(papers);
  } catch (error) {
    console.error("Get papers error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
