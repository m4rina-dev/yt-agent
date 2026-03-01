import { NextRequest, NextResponse } from "next/server";
import { parseScript } from "@/lib/claude";
import { z } from "zod";

const requestSchema = z.object({
  script: z.string().min(10, "Script must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script } = requestSchema.parse(body);

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const scenes = await parseScript(script);

    return NextResponse.json({ scenes });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Parse script error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to parse script",
      },
      { status: 500 }
    );
  }
}
