// app/api/parse-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

const EXTRACT_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_resume",
    description: "Extract structured resume data",
    parameters: {
      type: "object",
      properties: {
        currentTitle: { type: "string", description: "The person's most recent job title" },
        yearsExperience: { type: "integer", minimum: 0, maximum: 50, description: "Total years of professional experience" },
        skills: { type: "array", items: { type: "string" }, maxItems: 20, description: "Key professional skills extracted from resume" },
      },
      required: ["currentTitle", "yearsExperience", "skills"],
    },
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
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Extract structured information from this resume. Be conservative: if years of experience is unclear, estimate from work history.\n\n---\n${truncated}\n---`,
          },
        ],
        tools: [EXTRACT_TOOL],
        tool_choice: { type: "function", function: { name: "extract_resume" } },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`OpenRouter ${resp.status}: ${body}`);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool_call in response");
    const args = JSON.parse(toolCall.function.arguments);
    extracted = ResumeSchema.parse(args);
  } catch (err) {
    console.error("Extraction failed:", err);
    return NextResponse.json(
      { error: "Could not extract resume data. Please fill in the form manually." },
      { status: 422 }
    );
  }

  return NextResponse.json(extracted);
}
