import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../pages/api/auth/[...nextauth]";
import { searchWatchlistByTitle } from "../../../../library/watchlist";

// INTENTIONAL FLAW (kept on purpose for a DevSecOps/CI-CD pipeline demo —
// see SECURITY_NOTES.md): this route exists to exercise the SQL-injectable
// searchWatchlistByTitle() query so SAST/DAST tooling has a real finding.
export const GET = async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = request.nextUrl.searchParams.get("name") ?? "";
  return NextResponse.json({
    items: await searchWatchlistByTitle(userEmail, name),
  });
};
