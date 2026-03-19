import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { TravelFormSchema } from "@/lib/schemas";
import { buildHaikuPrompt, buildSonnetPrompt, HAIKU_PROMPT_VERSION, SONNET_PROMPT_VERSION } from "@/lib/prompts";
import type { ApiResponse, HaikuOutput, TravelReport } from "@/types/travel";

function extractText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response content type");
  return block.text;
}

function safeParseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Strip markdown code fences if model wrapped output despite instructions
    const stripped = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    return JSON.parse(stripped) as T;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const parsed = TravelFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  try {
    // Stage 1: Haiku — validate & summarize (deterministic)
    const haikuResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      temperature: 0,
      messages: [{ role: "user", content: buildHaikuPrompt(parsed.data) }],
    });

    console.log(`[/api/travel] haiku prompt=${HAIKU_PROMPT_VERSION} input_tokens=${haikuResponse.usage.input_tokens} output_tokens=${haikuResponse.usage.output_tokens}`);

    const haiku = safeParseJSON<HaikuOutput>(extractText(haikuResponse));

    if (!haiku.valid) {
      return NextResponse.json(
        {
          success: false,
          error: haiku.reason ?? "Destination not recognized. Try a more specific city or country name.",
          code: "INVALID_DESTINATION",
        },
        { status: 422 }
      );
    }

    // Stage 2: Sonnet — generate full travel report (creative)
    const sonnetResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: "user", content: buildSonnetPrompt(parsed.data, haiku) }],
    });

    console.log(`[/api/travel] sonnet prompt=${SONNET_PROMPT_VERSION} input_tokens=${sonnetResponse.usage.input_tokens} output_tokens=${sonnetResponse.usage.output_tokens}`);

    const report = safeParseJSON<TravelReport>(extractText(sonnetResponse));

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("[/api/travel] pipeline error:", err);

    if (err instanceof Error && err.message.includes("rate_limit")) {
      return NextResponse.json(
        { success: false, error: "Too many requests — please wait a moment and try again.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: "AI processing failed. Please try again.", code: "AI_ERROR" },
      { status: 500 }
    );
  }
}
