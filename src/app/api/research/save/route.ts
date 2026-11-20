import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

async function getOrCreateDefaultUser(): Promise<string> {
  try {
    const existingUser = await prisma.user.findFirst();
    if (existingUser) return existingUser.id;

    const newUser = await prisma.user.upsert({
      where: { email: "physio@peakmotion.com" },
      update: {},
      create: {
        id: "default-user",
        email: "physio@peakmotion.com",
        name: "د. أخصائي العلاج الطبيعي",
        role: "PHYSIOTHERAPIST",
      },
    });
    return newUser.id;
  } catch (error) {
    console.warn("Could not find or create user in DB, using fallback id:", error);
    return "default-user";
  }
}

// GET — list saved papers
export async function GET() {
  try {
    const userId = await getOrCreateDefaultUser();
    const papers = await prisma.savedPaper.findMany({
      where: { userId },
      orderBy: { savedAt: "desc" },
    });
    return NextResponse.json({ papers });
  } catch (error) {
    console.error("Saved papers GET error:", error);
    // Graceful fallback if database table is not ready
    return NextResponse.json({ papers: [], error: "Database unavailable" }, { status: 200 });
  }
}

// POST — save or toggle paper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pmid, title, authors, journal, pubDate, doi, abstract, action } = body;

    if (!pmid) {
      return NextResponse.json({ error: "PMID required" }, { status: 400 });
    }

    const userId = await getOrCreateDefaultUser();

    // Check if paper already saved
    const existing = await prisma.savedPaper.findFirst({
      where: { userId, pmid: String(pmid) },
    });

    if (action === "unsave" || (existing && action === "toggle")) {
      if (existing) {
        await prisma.savedPaper.delete({
          where: { id: existing.id },
        });
      }
      return NextResponse.json({ success: true, saved: false, pmid: String(pmid) });
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        saved: true,
        paper: existing,
        message: "Paper already saved",
      });
    }

    const authorsString = Array.isArray(authors)
      ? authors.join(", ")
      : typeof authors === "string"
      ? authors
      : "";

    const savedPaper = await prisma.savedPaper.create({
      data: {
        userId,
        pmid: String(pmid),
        title: title || "بدون عنوان",
        authors: authorsString,
        journal: journal || "",
        pubDate: pubDate || "",
        doi: doi || "",
        abstract: abstract || "",
      },
    });

    return NextResponse.json({ success: true, saved: true, paper: savedPaper }, { status: 201 });
  } catch (error) {
    console.error("Save paper POST error:", error);
    return NextResponse.json({ error: "Failed to save paper" }, { status: 500 });
  }
}

// DELETE — remove saved paper
export async function DELETE(request: NextRequest) {
  try {
    const pmid = request.nextUrl.searchParams.get("pmid");
    const id = request.nextUrl.searchParams.get("id");

    if (!pmid && !id) {
      return NextResponse.json({ error: "ID or PMID required" }, { status: 400 });
    }

    const userId = await getOrCreateDefaultUser();

    if (id) {
      await prisma.savedPaper.deleteMany({
        where: { id, userId },
      });
    } else if (pmid) {
      await prisma.savedPaper.deleteMany({
        where: { pmid, userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete paper error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
