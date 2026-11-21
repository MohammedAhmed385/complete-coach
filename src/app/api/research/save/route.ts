import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";

// In-memory saved papers
let memorySavedPapers: any[] = [];

async function getOrCreateDefaultUser(): Promise<string> {
  if (!isDbConfigured()) return "default-user";
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
  if (isDbConfigured()) {
    try {
      const userId = await getOrCreateDefaultUser();
      const papers = await prisma.savedPaper.findMany({
        where: { userId },
        orderBy: { savedAt: "desc" },
      });
      return NextResponse.json({ papers });
    } catch (error) {
      console.warn("Saved papers GET fallback to memory:", error);
    }
  }
  return NextResponse.json({ papers: memorySavedPapers });
}

// POST — save or toggle paper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pmid, title, authors, journal, pubDate, doi, abstract, action } = body;

    if (!pmid) {
      return NextResponse.json({ error: "PMID required" }, { status: 400 });
    }

    const pmidStr = String(pmid);

    if (action === "unsave") {
      memorySavedPapers = memorySavedPapers.filter((p) => String(p.pmid) !== pmidStr);
      if (isDbConfigured()) {
        try {
          const userId = await getOrCreateDefaultUser();
          await prisma.savedPaper.deleteMany({ where: { userId, pmid: pmidStr } });
        } catch {}
      }
      return NextResponse.json({ success: true, saved: false, pmid: pmidStr });
    }

    const existingMemIndex = memorySavedPapers.findIndex((p) => String(p.pmid) === pmidStr);
    if (action === "toggle" && existingMemIndex >= 0) {
      memorySavedPapers.splice(existingMemIndex, 1);
      if (isDbConfigured()) {
        try {
          const userId = await getOrCreateDefaultUser();
          await prisma.savedPaper.deleteMany({ where: { userId, pmid: pmidStr } });
        } catch {}
      }
      return NextResponse.json({ success: true, saved: false, pmid: pmidStr });
    }

    const authorsString = Array.isArray(authors)
      ? authors.join(", ")
      : typeof authors === "string"
      ? authors
      : "";

    const paperObj = {
      id: `paper-${Date.now()}`,
      pmid: pmidStr,
      title: title || "بدون عنوان",
      authors: authorsString,
      journal: journal || "",
      pubDate: pubDate || "",
      doi: doi || "",
      abstract: abstract || "",
      savedAt: new Date().toISOString(),
    };

    if (existingMemIndex === -1) {
      memorySavedPapers.unshift(paperObj);
    }

    if (isDbConfigured()) {
      try {
        const userId = await getOrCreateDefaultUser();
        const existing = await prisma.savedPaper.findFirst({
          where: { userId, pmid: pmidStr },
        });
        if (!existing) {
          const savedPaper = await prisma.savedPaper.create({
            data: {
              userId,
              pmid: pmidStr,
              title: title || "بدون عنوان",
              authors: authorsString,
              journal: journal || "",
              pubDate: pubDate || "",
              doi: doi || "",
              abstract: abstract || "",
            },
          });
          return NextResponse.json({ success: true, saved: true, paper: savedPaper }, { status: 201 });
        }
      } catch (err) {
        console.warn("DB savedPaper create skipped:", err);
      }
    }

    return NextResponse.json({ success: true, saved: true, paper: paperObj }, { status: 201 });
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

    if (pmid) {
      memorySavedPapers = memorySavedPapers.filter((p) => String(p.pmid) !== String(pmid));
    }
    if (id) {
      memorySavedPapers = memorySavedPapers.filter((p) => p.id !== id);
    }

    if (isDbConfigured()) {
      try {
        const userId = await getOrCreateDefaultUser();
        if (id) {
          await prisma.savedPaper.deleteMany({ where: { id, userId } });
        } else if (pmid) {
          await prisma.savedPaper.deleteMany({ where: { pmid: String(pmid), userId } });
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete paper error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
