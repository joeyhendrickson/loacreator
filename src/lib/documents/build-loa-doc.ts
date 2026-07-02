import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
} from "docx";

import type { LOAGenerationResult } from "@/lib/types";

function textParagraph(
  text: string,
  options?: { bold?: boolean; heading?: IParagraphOptions["heading"] },
): Paragraph {
  if (options?.heading) {
    return new Paragraph({
      text,
      heading: options.heading,
    });
  }

  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: options?.bold,
      }),
    ],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: { level: 0 },
  });
}

export async function buildLoaDocBlob(
  result: LOAGenerationResult,
): Promise<Blob> {
  const sections: (Paragraph | Table)[] = [
    textParagraph("Letter of Authorization", {
      heading: HeadingLevel.HEADING_1,
    }),
    textParagraph("AT&T to CallTower Porting"),
    new Paragraph({ text: "" }),
    textParagraph("Completed LOA", { heading: HeadingLevel.HEADING_2 }),
  ];

  for (const line of result.completedLoa.split("\n")) {
    sections.push(new Paragraph({ text: line.trim() || " " }));
  }

  if (result.fields.length > 0) {
    sections.push(
      new Paragraph({ text: "" }),
      textParagraph("Extracted Fields", { heading: HeadingLevel.HEADING_2 }),
    );

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [textParagraph("Field", { bold: true })],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [textParagraph("Value", { bold: true })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [textParagraph("Source", { bold: true })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [textParagraph("Confidence", { bold: true })],
          }),
        ],
      }),
      ...result.fields.map(
        (field) =>
          new TableRow({
            children: [
              new TableCell({
                children: [textParagraph(field.fieldName)],
              }),
              new TableCell({
                children: [textParagraph(field.value || "—")],
              }),
              new TableCell({
                children: [textParagraph(field.sourceDocument || "—")],
              }),
              new TableCell({
                children: [textParagraph(field.confidence)],
              }),
            ],
          }),
      ),
    ];

    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      }),
    );
  }

  if (result.missingFields.length > 0) {
    sections.push(
      new Paragraph({ text: "" }),
      textParagraph("Missing Fields", { heading: HeadingLevel.HEADING_2 }),
    );
    for (const field of result.missingFields) {
      sections.push(bulletParagraph(field));
    }
  }

  if (result.notes.length > 0) {
    sections.push(
      new Paragraph({ text: "" }),
      textParagraph("Notes", { heading: HeadingLevel.HEADING_2 }),
    );
    for (const note of result.notes) {
      sections.push(bulletParagraph(note));
    }
  }

  const doc = new Document({
    sections: [{ children: sections }],
  });

  return Packer.toBlob(doc);
}

export async function buildLoaDocBuffer(
  result: LOAGenerationResult,
): Promise<Buffer> {
  const blob = await buildLoaDocBlob(result);
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
