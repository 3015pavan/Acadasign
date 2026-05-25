import puppeteer from 'puppeteer';
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

export async function renderPdfBuffer(html: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({ format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}