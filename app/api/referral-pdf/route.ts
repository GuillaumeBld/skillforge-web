// app/api/referral-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { match, form } = body as {
    match: {
      noc_code: string;
      title: string;
      composite_score: number;
      skill_similarity: number;
      demand_score: number;
    };
    form: {
      jobTitle: string;
      province: string;
      isYouth: boolean;
      isNewcomer: boolean;
    };
  };

  const { renderToBuffer, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
  const React = (await import("react")).default;

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
    title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
    subtitle: { fontSize: 12, color: "#666", marginBottom: 20 },
    section: { marginBottom: 16 },
    heading: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
    row: { flexDirection: "row" as const, marginBottom: 3 },
    label: { width: 160, color: "#555" },
    value: { flex: 1 },
    checkItem: { flexDirection: "row" as const, marginBottom: 4, alignItems: "flex-start" as const },
    box: { width: 10, height: 10, border: "1pt solid #999", marginRight: 6, marginTop: 1 },
    checkText: { flex: 1 },
  });

  const checklistItems = [
    "Proof of identity (SIN + government photo ID)",
    "Record of Employment (ROE) from last employer",
    "EI application (if EI-eligible)",
    `Proof of residence in ${form.province}`,
    ...(form.isYouth ? ["Proof of age (youth 15-29)"] : []),
    ...(form.isNewcomer ? ["Permanent Resident card / proof of landing date"] : []),
  ];

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.title }, "SkillForge Referral Package"),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `${form.jobTitle} → ${match.title} (NOC ${match.noc_code}) · ${form.province}`
        )
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.heading }, "Match Summary"),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, "Composite score"),
          React.createElement(Text, { style: styles.value }, `${Math.round(match.composite_score * 100)}/100`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, "Skill transfer"),
          React.createElement(Text, { style: styles.value }, `${Math.round(match.skill_similarity * 100)}%`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, "Market demand"),
          React.createElement(Text, { style: styles.value }, `${Math.round(match.demand_score * 100)}%`)
        )
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.heading }, "LMDA Referral Checklist"),
        ...checklistItems.map((item) =>
          React.createElement(
            View,
            { style: styles.checkItem },
            React.createElement(View, { style: styles.box }),
            React.createElement(Text, { style: styles.checkText }, item)
          )
        )
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  // NextResponse requires a BodyInit — convert Node Buffer to Uint8Array
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="skillforge-referral-${match.noc_code}.pdf"`,
    },
  });
}
