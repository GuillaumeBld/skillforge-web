// app/api/parse-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const ResumeSchema = z.object({
  currentTitle: z.string(),
  yearsExperience: z.number().int().min(0).max(50),
  skills: z.array(z.string()).max(20),
});

type ResumeData = z.infer<typeof ResumeSchema>;

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

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_resume",
  description: "Extract structured resume data",
  input_schema: {
    type: "object",
    properties: {
      currentTitle: { type: "string", description: "The person's most recent job title" },
      yearsExperience: { type: "integer", minimum: 0, maximum: 50, description: "Total years of professional experience" },
      skills: { type: "array", items: { type: "string" }, maxItems: 20, description: "Key professional skills extracted from resume" },
    },
    required: ["currentTitle", "yearsExperience", "skills"],
  },
};

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

  const truncated = resumeText.slice(0, 6000);

  let extracted: ResumeData;
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_resume" },
      messages: [
        {
          role: "user",
          content: `Extract structured information from this resume. Be conservative: if years of experience is unclear, estimate from work history.\n\n---\n${truncated}\n---`,
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool_use block in response");
    extracted = ResumeSchema.parse(toolUse.input);
  } catch (err) {
    console.error("Extraction failed:", err);
    return NextResponse.json(
      { error: "Could not extract resume data. Please fill in the form manually." },
      { status: 422 }
    );
  }

  return NextResponse.json(extracted);
}
