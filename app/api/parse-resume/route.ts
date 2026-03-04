// app/api/parse-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const ResumeSchema = z.object({
  currentTitle: z.string().describe("The person's most recent job title"),
  yearsExperience: z.number().int().min(0).max(50).describe("Total years of professional experience"),
  skills: z.array(z.string()).max(20).describe("Key professional skills extracted from resume"),
});

type ResumeData = z.infer<typeof ResumeSchema>;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const uint8 = new Uint8Array(buffer);
  const { text } = await extractText(uint8, { mergePages: true });
  return text;
}

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value;
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("resume") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
  }

  // Validate file type and size (max 5 MB)
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
    return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  // Extract text
  let resumeText: string;
  try {
    const buffer = await file.arrayBuffer();
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    resumeText = isPdf
      ? await extractTextFromPdf(buffer)
      : await extractTextFromDocx(buffer);
  } catch (err) {
    console.error("Text extraction failed:", err);
    return NextResponse.json(
      { error: "Could not read file. Ensure it is a valid PDF or DOCX." },
      { status: 422 }
    );
  }

  if (resumeText.trim().length < 50) {
    return NextResponse.json(
      { error: "Resume appears to be empty or unreadable." },
      { status: 422 }
    );
  }

  // Truncate to first 6000 chars (enough for Haiku, avoids token waste)
  const truncated = resumeText.slice(0, 6000);

  // JSON schema for structured extraction (inlined to avoid Zod v4 compat issues)
  const extractResumeSchema: Anthropic.Tool["input_schema"] = {
    type: "object",
    properties: {
      currentTitle: { type: "string", description: "The person's most recent job title" },
      yearsExperience: { type: "integer", minimum: 0, maximum: 50, description: "Total years of professional experience" },
      skills: { type: "array", items: { type: "string" }, maxItems: 20, description: "Key professional skills extracted from resume" },
    },
    required: ["currentTitle", "yearsExperience", "skills"],
  };

  // Call Claude Haiku with forced tool use (structured output)
  let extracted: ResumeData;
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Extract structured information from this resume. Be conservative: if years of experience is unclear, estimate from work history.\n\n---\n${truncated}\n---`,
        },
      ],
      tools: [
        {
          name: "extract_resume",
          description: "Extract structured resume data",
          input_schema: extractResumeSchema,
        },
      ],
      tool_choice: { type: "tool", name: "extract_resume" },
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("No tool_use block in response");
    }
    extracted = ResumeSchema.parse(toolUse.input);
  } catch (err) {
    console.error("Claude extraction failed:", err);
    return NextResponse.json(
      { error: "Could not extract resume data. Please fill in the form manually." },
      { status: 422 }
    );
  }

  return NextResponse.json(extracted);
}
