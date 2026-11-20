import { NextRequest, NextResponse } from "next/server";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query") || "";
    const dateFrom = request.nextUrl.searchParams.get("dateFrom") || "";
    const dateTo = request.nextUrl.searchParams.get("dateTo") || "";
    const studyType = request.nextUrl.searchParams.get("studyType") || "";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "0");
    const pageSize = 10;

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    let searchQuery = query;
    if (studyType) searchQuery += ` AND ${studyType}[pt]`;

    const apiKey = process.env.PUBMED_API_KEY || "";
    const params = new URLSearchParams({
      db: "pubmed",
      term: searchQuery,
      retstart: (page * pageSize).toString(),
      retmax: pageSize.toString(),
      sort: "relevance",
      retmode: "json",
    });

    if (dateFrom) params.set("mindate", dateFrom);
    if (dateTo) params.set("maxdate", dateTo);
    if (dateFrom || dateTo) params.set("datetype", "pdat");
    if (apiKey) params.set("api_key", apiKey);

    // Search
    const searchRes = await fetch(
      `${PUBMED_BASE}/esearch.fcgi?${params.toString()}`
    );
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    const totalCount = parseInt(searchData.esearchresult?.count || "0");

    if (ids.length === 0) {
      return NextResponse.json({ articles: [], total: 0 });
    }

    // Fetch summaries
    const summaryParams = new URLSearchParams({
      db: "pubmed",
      id: ids.join(","),
      retmode: "json",
    });
    if (apiKey) summaryParams.set("api_key", apiKey);

    const summaryRes = await fetch(
      `${PUBMED_BASE}/esummary.fcgi?${summaryParams.toString()}`
    );
    const summaryData = await summaryRes.json();

    // Fetch abstracts
    const fetchParams = new URLSearchParams({
      db: "pubmed",
      id: ids.join(","),
      rettype: "abstract",
      retmode: "xml",
    });
    if (apiKey) fetchParams.set("api_key", apiKey);

    const articles = ids.map((pmid: string) => {
      const doc = summaryData.result?.[pmid];
      return {
        pmid,
        title: doc?.title || "",
        authors:
          doc?.authors?.map(
            (a: { name: string }) => a.name
          ) || [],
        journal: doc?.fulljournalname || doc?.source || "",
        pubDate: doc?.pubdate || "",
        doi: doc?.elocationid || "",
        sortDate: doc?.sortpubdate || "",
      };
    });

    return NextResponse.json({
      articles,
      total: totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("PubMed search error:", error);
    return NextResponse.json(
      { error: "Failed to search PubMed" },
      { status: 500 }
    );
  }
}
