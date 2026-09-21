import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isProfileComplete } from "@/lib/profile-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });

  const { complete, missing } = isProfileComplete(client);

  return NextResponse.json({
    hasProfile: !!client,
    profileComplete: complete,
    missing,
    client: client
      ? {
          companyName: client.companyName,
          representativeName: client.representativeName,
          phone: client.phone,
        }
      : null,
  });
}
