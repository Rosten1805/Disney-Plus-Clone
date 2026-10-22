import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../pages/api/auth/[...nextauth]";
import {
  addToWatchlist,
  isInWatchlist,
  listWatchlist,
  removeFromWatchlist,
} from "../../../library/watchlist";

const getUserEmail = async () => {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
};

export const GET = async (request: NextRequest) => {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mediaId = request.nextUrl.searchParams.get("mediaId");
  const mediaType = request.nextUrl.searchParams.get("mediaType");

  if (mediaId && mediaType) {
    return NextResponse.json({
      isSaved: await isInWatchlist(userEmail, mediaId, mediaType),
    });
  }

  return NextResponse.json({ items: await listWatchlist(userEmail) });
};

export const POST = async (request: NextRequest) => {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mediaId, mediaType, title, posterPath } = body ?? {};

  if (!mediaId || !mediaType || !title) {
    return NextResponse.json(
      { error: "mediaId, mediaType and title are required" },
      { status: 400 }
    );
  }

  await addToWatchlist({
    userEmail,
    mediaId: String(mediaId),
    mediaType: String(mediaType),
    title: String(title),
    posterPath: posterPath ? String(posterPath) : null,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
};

export const DELETE = async (request: NextRequest) => {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mediaId = request.nextUrl.searchParams.get("mediaId");
  const mediaType = request.nextUrl.searchParams.get("mediaType");

  if (!mediaId || !mediaType) {
    return NextResponse.json(
      { error: "mediaId and mediaType are required" },
      { status: 400 }
    );
  }

  await removeFromWatchlist(userEmail, mediaId, mediaType);
  return NextResponse.json({ ok: true });
};
