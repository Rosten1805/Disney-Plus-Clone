import { NextRequest, NextResponse } from "next/server";
import { consumeVerificationToken } from "../../../../library/users";

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(
      new URL("/?verified=0", process.env.NEXTAUTH_URL)
    );
  }

  const user = await consumeVerificationToken(token);

  return NextResponse.redirect(
    new URL(user ? "/?verified=1" : "/?verified=0", process.env.NEXTAUTH_URL)
  );
};
