import PDFDocument from 'pdfkit';
import type { AssignmentFormData, GeneratedPaper } from '../types';

function difficultyClass(level: string) {
  return level === 'easy' ? 'badge badge-easy' : level === 'medium' ? 'badge badge-medium' : 'badge badge-hard';
}

export function buildPrintablePaperHtml(assignment: AssignmentFormData, paper: GeneratedPaper) {
  const sectionsHtml = paper.sections.map((section) => `
    <section class="section">
      <div class="section-header">
        <div>
          <div class="section-title">${section.title}</div>
          <div class="section-instruction">${section.instruction}</div>
        </div>
      </div>
      <div class="questions">
        ${section.questions.map((question) => `
          <article class="question">
            <div class="question-top">
              <div class="question-number">Q${question.number}.</div>
              <div class="question-text">${question.text}</div>
              <div class="meta">
                <span class="${difficultyClass(question.difficulty)}">${question.difficulty.toUpperCase()}</span>
                <span class="marks">${question.marks}M</span>
              </div>
            </div>
            ${question.options ? `<ul class="options">${question.options.map((option) => `<li>${option}</li>`).join('')}</ul>` : ''}
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page { size: A4; margin: 18mm 14mm; }
          :root {
            color-scheme: light;
          }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #fafaf9;
          }
          .page {
            background: white;
            padding: 18px;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
          }
          .header {
            text-align: center;
            padding-bottom: 14px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 16px;
          }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 6px 0 0; color: #475569; font-size: 13px; }
          .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 13px;
            color: #334155;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
          .section-instruction { font-size: 12px; color: #64748b; }
          .question { page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px 14px; margin-top: 10px; }
          .question-top { display: flex; gap: 8px; align-items: flex-start; }
          .question-number { font-weight: 700; }
          .question-text { flex: 1; line-height: 1.45; }
          .meta { display: flex; gap: 8px; align-items: center; }
          .badge { border-radius: 999px; padding: 4px 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; }
          .badge-easy { background: #dcfce7; color: #166534; }
          .badge-medium { background: #fef3c7; color: #92400e; }
          .badge-hard { background: #fee2e2; color: #991b1b; }
          .marks { font-weight: 700; color: #0f172a; }
          .options { margin: 10px 0 0 18px; color: #334155; padding-left: 10px; }
          .options li { margin: 4px 0; }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="header">
            <h1>${assignment.subject} Assessment</h1>
            <p>${paper.title}</p>
          </header>
          <div class="meta-row">
            <div><strong>Grade:</strong> ${paper.gradeLevel}</div>
            <div><strong>Duration:</strong> ${paper.duration} minutes</div>
            <div><strong>Total Marks:</strong> ${paper.totalMarks}</div>
          </div>
          <div class="meta-row">
            <div><strong>Student Name:</strong> ____________________</div>
            <div><strong>Roll No:</strong> __________</div>
            <div><strong>Section:</strong> __________</div>
          </div>
          ${sectionsHtml}
        </main>
      </body>
    </html>
  `;
}

export async function renderPdfBuffer(assignment: AssignmentFormData, paper: GeneratedPaper) {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const ensureSpace = (height: number) => {
      if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    };

    const drawDivider = () => {
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .lineWidth(1)
        .strokeColor('#e5e7eb')
        .stroke();
      doc.moveDown(1);
    };

    const drawMetaRow = (entries: Array<[string, string]>) => {
      const startY = doc.y;
      const columnWidth = usableWidth / entries.length;
      const rowHeight = 18;
      ensureSpace(rowHeight + 8);

      entries.forEach(([label, value], index) => {
        const x = doc.page.margins.left + index * columnWidth;
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`${label}:`, x, startY, { width: 70, continued: true });
        doc.font('Helvetica').fontSize(11).fillColor('#334155').text(` ${value}`, x + 72, startY, { width: columnWidth - 72 });
      });

      doc.y = startY + rowHeight;
      doc.moveDown(0.8);
    };

    const drawQuestion = (question: GeneratedPaper['sections'][number]['questions'][number]) => {
      const requiredHeight = 54 + (question.options?.length ?? 0) * 14;
      ensureSpace(requiredHeight);

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`Q${question.number}. ${question.text}`, {
        width: usableWidth,
      });
      doc.moveDown(0.15);

      doc.font('Helvetica').fontSize(10).fillColor('#334155').text(`Difficulty: ${question.difficulty.toUpperCase()}   Marks: ${question.marks}`, {
        width: usableWidth,
      });

      if (question.options?.length) {
        doc.moveDown(0.15);
        question.options.forEach((option) => {
          doc.font('Helvetica').fontSize(10).fillColor('#334155').text(`• ${option}`, {
            indent: 12,
            width: usableWidth - 12,
          });
        });
      }

      doc.moveDown(0.5);
    };

    doc.fillColor('#0f172a');
    doc.font('Helvetica-Bold').fontSize(20).text(`${assignment.subject} Assessment`, { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(12).fillColor('#475569').text(paper.title, { align: 'center' });
    doc.moveDown(0.8);
    drawDivider();

    drawMetaRow([
      ['Grade', paper.gradeLevel],
      ['Duration', `${paper.duration} minutes`],
      ['Total Marks', String(paper.totalMarks)],
    ]);

    drawMetaRow([
      ['Student Name', '____________________'],
      ['Roll No', '__________'],
      ['Section', '__________'],
    ]);

    paper.sections.forEach((section) => {
      ensureSpace(48);
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#0f172a').text(section.title, { width: usableWidth });
      doc.moveDown(0.15);
      doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(section.instruction, { width: usableWidth });
      doc.moveDown(0.5);

      section.questions.forEach((question) => drawQuestion(question));

      doc.moveDown(0.4);
    });

    doc.end();
  });
}