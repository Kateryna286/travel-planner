import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { TravelFormSchema } from "@/lib/schemas";
import { buildExperiencesPrompt, buildPracticalitiesPrompt, PROMPT_VERSION } from "@/lib/prompts";
import type { ApiResponse, TravelReport } from "@/types/travel";

function extractText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response content type");
  return block.text;
}

function safeParseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const stripped = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    return JSON.parse(stripped) as T;
  }
}

async function callSonnet(
  prompt: string,
  opts: { label: string; temperature: number; maxTokens: number }
): Promise<Record<string, unknown>> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    messages: [{ role: "user", content: prompt }],
  });
  console.log(
    `[/api/travel] ${opts.label} prompt=${PROMPT_VERSION} in=${response.usage.input_tokens} out=${response.usage.output_tokens}`
  );
  return safeParseJSON<Record<string, unknown>>(extractText(response));
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
    const [experiencesRaw, practicalitiesRaw] = await Promise.all([
      callSonnet(buildExperiencesPrompt(parsed.data), {
        label: "experiences",
        temperature: 0.7,
        maxTokens: 12000,
      }),
      callSonnet(buildPracticalitiesPrompt(parsed.data), {
        label: "practicalities",
        temperature: 0.3,
        maxTokens: 6000,
      }),
    ]);

    // Check destination validation from both calls
    if (experiencesRaw.valid === false) {
      return NextResponse.json(
        {
          success: false,
          error: (experiencesRaw.reason as string | undefined) ?? "Destination not recognized. Try a more specific city or country name.",
          code: "INVALID_DESTINATION",
        },
        { status: 422 }
      );
    }
    if (practicalitiesRaw.valid === false) {
      return NextResponse.json(
        {
          success: false,
          error: (practicalitiesRaw.reason as string | undefined) ?? "Destination not recognized. Try a more specific city or country name.",
          code: "INVALID_DESTINATION",
        },
        { status: 422 }
      );
    }

    // Merge the two results into a single TravelReport
    const report: TravelReport = {
      safety:      experiencesRaw.safety      as TravelReport["safety"],
      attractions: experiencesRaw.attractions as TravelReport["attractions"],
      cuisine:     experiencesRaw.cuisine     as TravelReport["cuisine"],
      practical:   practicalitiesRaw.practical as TravelReport["practical"],
      ...(experiencesRaw.accommodationSuggestions
        ? { accommodationSuggestions: experiencesRaw.accommodationSuggestions as TravelReport["accommodationSuggestions"] }
        : {}),
      ...(Array.isArray(practicalitiesRaw.destinationFacts)
        ? { destinationFacts: practicalitiesRaw.destinationFacts as string[] }
        : {}),
    };

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
