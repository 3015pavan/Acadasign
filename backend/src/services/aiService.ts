import type { AssignmentFormData, GeneratedPaper, GeneratedSection } from '../types';
import { generatedPaperSchema, type GeneratedPaperInput } from '../lib/schemas';

function buildDifficultySchedule(totalQuestions: number, distribution: AssignmentFormData['difficulty']) {
  const easyCount = Math.max(0, Math.round((distribution.easy / 100) * totalQuestions));
  const mediumCount = Math.max(0, Math.round((distribution.medium / 100) * totalQuestions));
  const hardCount = Math.max(0, totalQuestions - easyCount - mediumCount);

  return [
    ...Array.from({ length: easyCount }, () => 'easy' as const),
    ...Array.from({ length: mediumCount }, () => 'medium' as const),
    ...Array.from({ length: hardCount }, () => 'hard' as const),
  ].slice(0, totalQuestions);
}

function buildOptions(questionType: AssignmentFormData['sections'][number]['questionType'], topic: string) {
  if (questionType === 'multiple_choice') {
    return [
      `A) ${topic} as a definition`,
      `B) ${topic} as a process`,
      `C) ${topic} as an application`,
      `D) ${topic} as an exception`,
    ];
  }

  if (questionType === 'true_false') {
    return ['A) True', 'B) False'];
  }

  return undefined;
}

function extractSourceHints(fileContent?: string | null) {
  if (!fileContent) {
    return [] as string[];
  }

  const stripBoilerplate = (snippet: string) => snippet
    .replace(/^(this document|the document|it|the text|the passage)(\s+(also)?)?\s+(explains|describes|shows|states|says|compares|covers|discusses|includes)?\s*/i, '')
    .replace(/^(this document|the document|it|the text|the passage)\s*/i, '')
    .replace(/^(and|or|but)\s+/i, '')
    .replace(/^(gives|shows|includes|covers|explains|describes|discusses|compares)\s+/i, '')
    .replace(/^about\s+/i, '')
    .replace(/[\s,;:.-]+$/g, '')
    .trim();

  const hints = fileContent
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|[\n\r]+/)
    .flatMap((snippet) => snippet.split(/[,;]\s+/))
    .map((snippet) => stripBoilerplate(snippet))
    .filter((snippet) => snippet.length >= 8);

  return Array.from(new Set(hints)).slice(0, 12);
}

function extractSourceConcepts(fileContent?: string | null) {
  const hints = extractSourceHints(fileContent);
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'your', 'their', 'they', 'there',
    'what', 'which', 'when', 'where', 'why', 'how', 'are', 'was', 'were', 'will', 'shall', 'does', 'did',
    'has', 'have', 'had', 'notes', 'document', 'text', 'passage', 'material', 'main', 'type', 'types', 'mentioned',
    'explain', 'explains', 'describe', 'describes', 'show', 'shows', 'state', 'states', 'say', 'says',
    'compare', 'compares', 'cover', 'covers', 'discuss', 'discusses', 'include', 'includes', 'give', 'gives',
    'list', 'lists', 'present', 'presents', 'tell', 'tells', 'teach', 'teaches', 'learn', 'learns', 'showing',
  ]);

  const concepts = hints.map((hint) => {
    const words = hint
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4 && !stopWords.has(word.toLowerCase()));

    const phrase = words.slice(0, 6).join(' ').trim();
    return phrase || hint;
  });

  return Array.from(new Set(concepts)).slice(0, 12);
}

function pickSourceHint(sourceHints: string[], sectionIndex: number, localIndex: number) {
  if (!sourceHints.length) {
    return undefined;
  }

  return sourceHints[(sectionIndex * 3 + localIndex) % sourceHints.length];
}

function buildSourceAwareQuestionText(
  sectionName: string,
  questionType: AssignmentFormData['sections'][number]['questionType'],
  topic: string,
  index: number,
  sectionIndex: number,
  localIndex: number,
  sourceHint?: string,
) {
  const sourceFragment = sourceHint ? ` from the source material about ${sourceHint.slice(0, 90)}` : ` about ${topic}`;
  const variant = (sectionIndex + localIndex) % 3;
  const concept = sourceHint ? sourceHint.slice(0, 90) : topic;

  const prompts: Record<string, string> = {
    multiple_choice: [
      `Which statement best matches the document's explanation of ${concept} in ${sectionName}?`,
      `According to the source material, which option is most accurate about ${concept}?`,
      `Which choice is directly supported by the document's details on ${concept}?`,
    ][variant],
    short_answer: [
      `In 2-3 sentences, explain ${concept} as described in the document.`,
      `Briefly describe the role of ${concept} in the source material.`,
      `Summarize the document's point about ${concept}.`,
    ][variant],
    long_answer: [
      `Discuss how the document explains ${concept}, and support your answer with details from the source material.`,
      `Analyze the source's treatment of ${concept} and include examples or facts from the uploaded material.`,
      `Explain the main ideas related to ${concept} and show how they connect using evidence from the text.`,
    ][variant],
    true_false: [
      `State whether this statement is true or false according to the document: ${concept}`,
      `Read the statement below and decide if it matches the source material: ${concept}`,
      `Judge whether the following claim is supported by the document: ${concept}`,
    ][variant],
    fill_in_blank: [
      `Complete the statement using information from the document about ${concept}.`,
      `Fill in the blank using the idea described in the source material about ${concept}.`,
      `Use the uploaded document to complete the statement about ${concept}.`,
    ][variant],
  };

  return `${index}. ${prompts[questionType]}`;
}

function buildPaperFromAssignment(assignment: AssignmentFormData, fileContent?: string | null): GeneratedPaper {
  const totalQuestions = assignment.sections.reduce((sum, section) => sum + section.numberOfQuestions, 0);
  const schedule = buildDifficultySchedule(totalQuestions, assignment.difficulty);
  let questionIndex = 0;
  const sourceHints = extractSourceHints(fileContent);
  const sourceConcepts = extractSourceConcepts(fileContent);

  const sections: GeneratedSection[] = assignment.sections.map((section, sectionIndex) => {
    const questions = Array.from({ length: section.numberOfQuestions }, (_, localIndex) => {
      const difficulty = schedule[questionIndex] ?? 'medium';
      const sourceHint = pickSourceHint(sourceConcepts.length ? sourceConcepts : sourceHints, sectionIndex, localIndex);
      questionIndex += 1;

      return {
        id: `q-${sectionIndex + 1}-${localIndex + 1}`,
        number: localIndex + 1,
        text: buildSourceAwareQuestionText(section.name, section.questionType, assignment.topic, localIndex + 1, sectionIndex, localIndex, sourceHint),
        type: section.questionType,
        difficulty,
        marks: section.marksPerQuestion,
        options: buildOptions(section.questionType, sourceHint ? sourceHint : assignment.topic),
      };
    });

    return {
      id: `section-${sectionIndex + 1}`,
      title: section.name || `Section ${String.fromCharCode(65 + sectionIndex)}`,
      instruction: 'Attempt all questions',
      questions,
    };
  });

  return generatedPaperSchema.parse({
    title: assignment.title,
    subject: assignment.subject,
    topic: assignment.topic,
    gradeLevel: assignment.gradeLevel,
    totalMarks: assignment.totalMarks,
    duration: assignment.duration,
    sections,
  });
}

function extractJsonCandidate(rawResponse: string) {
  const trimmed = rawResponse.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstObject = trimmed.match(/\{[\s\S]*\}/);
  return firstObject?.[0] ?? trimmed;
}

function trimSourceMaterial(fileContent?: string | null) {
  if (!fileContent) {
    return null;
  }

  const cleaned = fileContent.replace(/\u0000/g, '').trim();
  if (!cleaned) {
    return null;
  }

  return cleaned.length > 12000 ? `${cleaned.slice(0, 12000)}\n\n[Truncated source material]` : cleaned;
}

async function callAnthropic(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text ?? null;
}

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!response.ok) {
    console.warn(`Gemini request failed for model ${model}: ${response.status} ${response.statusText}`);
    return null;
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') || null;
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: prompt,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as { output_text?: string };
  return data.output_text ?? null;
}

export function buildPrompt(assignment: AssignmentFormData, fileContent?: string | null) {
  const sourceMaterial = trimSourceMaterial(fileContent);

  return `You are an expert educator creating a formal examination paper.

Create a structured question paper based on the following specifications:

Subject: ${assignment.subject}
Topic: ${assignment.topic}
Grade Level: ${assignment.gradeLevel}
Total Marks: ${assignment.totalMarks}
Duration: ${assignment.duration} minutes

Sections to generate:
${assignment.sections.map((section, index) => `- Section ${String.fromCharCode(65 + index)} (${section.name}):\n  - Question Type: ${section.questionType}\n  - Number of Questions: ${section.numberOfQuestions}\n  - Marks per Question: ${section.marksPerQuestion}`).join('\n')}

Difficulty Distribution:
- Easy: ${assignment.difficulty.easy}%
- Medium: ${assignment.difficulty.medium}%
- Hard: ${assignment.difficulty.hard}%

Additional Instructions: ${assignment.additionalInstructions || 'None'}

${sourceMaterial ? `Uploaded reference material:
${sourceMaterial}

Use the uploaded material as the primary source. Generate questions that directly reference the concepts, facts, examples, terminology, and structure present in the document. Avoid generic or repeated templates. Vary the wording, stems, and distractors so the paper feels tailored to the source.` : 'Uploaded reference material: None provided.'}

Important question-writing rules:
- Do not generate broad template questions like "What are the two main types mentioned in the notes?" or similar summary prompts.
- Do not use the phrase "mentioned in the notes".
- Prefer concrete facts, named concepts, examples, definitions, and processes that appear in the source material.
- For multiple choice questions, ask about one specific idea and make distractors plausible but clearly related to the source.
- For short and long answers, ask for explanation, comparison, application, or inference grounded in the uploaded material.
- If the source is thin, still avoid generic note-style wording and keep the question specific to the assignment topic.

Respond only with valid JSON in this structure:
{
  "title": "string",
  "subject": "string",
  "topic": "string",
  "gradeLevel": "string",
  "totalMarks": number,
  "duration": number,
  "sections": [
    {
      "id": "section-a",
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "id": "q1",
          "number": 1,
          "text": "Question text here",
          "type": "multiple_choice",
          "difficulty": "easy",
          "marks": 2,
          "options": ["A) ...", "B) ...", "C) ...", "D) ..."]
        }
      ]
    }
  ]
}

Rules:
- Only return valid JSON, no markdown, no explanation
- options field only for multiple_choice and true_false types
- difficulty must be exactly: easy, medium, or hard
- Make questions relevant, clear, educationally appropriate, and grounded in the uploaded material when provided
- Avoid repeated question stems within a section
- Avoid asking how many types, what are the main types, or other generic survey-style questions
- Do not reuse the same wording pattern across a section unless the source material genuinely demands it
- Ensure total marks across all sections equals ${assignment.totalMarks}`;
}

export async function generatePaper(assignment: AssignmentFormData, fileContent?: string | null) {
  const prompt = buildPrompt(assignment, fileContent);

  const rawResponse = await callGemini(prompt) ?? await callAnthropic(prompt) ?? await callOpenAI(prompt);
  if (!rawResponse) {
    return buildPaperFromAssignment(assignment, fileContent);
  }

  try {
    const parsed = JSON.parse(extractJsonCandidate(rawResponse)) as GeneratedPaperInput;
    return generatedPaperSchema.parse(parsed);
  } catch {
    return buildPaperFromAssignment(assignment, fileContent);
  }
}

export function createFallbackPaper(assignment: AssignmentFormData, fileContent?: string | null) {
  return buildPaperFromAssignment(assignment, fileContent);
}