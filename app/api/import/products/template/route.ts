import { NextRequest, NextResponse } from "next/server";
import { generateProductTemplate } from "@/lib/xlsx";

export async function GET(_req: NextRequest) {
  const buffer = generateProductTemplate();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template_produtos.xlsx"',
    },
  });
}
