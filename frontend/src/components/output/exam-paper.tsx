"use client";

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { GeneratedPaper } from '@/types';

function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  return <Badge variant={difficulty}>{difficulty.toUpperCase()}</Badge>;
}

export function ExamPaper({ paper }: { paper: GeneratedPaper }) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafaf9_100%)] shadow-[0_28px_100px_rgba(15,23,42,0.10)] glass">
      <div className="border-b border-slate-200 px-6 py-5 text-center">
        <div className="text-sm uppercase tracking-[0.28em] text-slate-400">VedaAI Generated Paper</div>
        <h1 className="mt-2 font-serif text-3xl font-bold text-slate-900">{paper.title}</h1>
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm text-slate-600">
          <Badge variant="muted">{paper.subject}</Badge>
          <Badge variant="muted">{paper.gradeLevel}</Badge>
          <Badge variant="muted">{paper.duration} min</Badge>
          <Badge variant="muted">{paper.totalMarks} marks</Badge>
        </div>
      </div>

      <div className="border-b border-slate-200 px-6 py-4 text-sm text-slate-700">
        <div className="grid gap-3 md:grid-cols-3">
          <div><span className="font-semibold">Name:</span> __________________</div>
          <div><span className="font-semibold">Roll No:</span> __________________</div>
          <div><span className="font-semibold">Section:</span> __________________</div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-5 sm:px-6">
        {paper.sections.map((section, sectionIndex) => (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: sectionIndex * 0.04 }}
            className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-serif text-2xl font-semibold text-slate-900">{section.title}</div>
                <div className="mt-1 text-sm text-slate-500">{section.instruction}</div>
                {section.questions?.[0]?.type === 'multiple_choice' ? (
                  <div className="mt-2 text-sm text-slate-600">Choose the best answer for each question. ({section.questions?.[0]?.marks ?? 1} mark each)</div>
                ) : null}
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Section {String.fromCharCode(65 + sectionIndex)}</div>
            </div>

            <div className="space-y-4">
              {section.questions.map((question) => (
                <div key={question.id} className="rounded-[22px] bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="font-semibold text-slate-900">Q{question.number}.{question.difficulty.toUpperCase()}</span>
                      </div>
                      <p className="mt-2 text-[1.03rem] leading-7 text-slate-800">{question.text}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-800">
                      <Badge variant="muted">{question.marks}M</Badge>
                    </div>
                  </div>
                  {question.options ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, idx) => {
                        const label = option.match(/^\s*[A-D][)\.]\s*/i) ? '' : `${String.fromCharCode(65 + idx)}) `;
                        return (
                          <div key={idx} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{label}{option.replace(/^\s*[A-D][)\.]\s*/i, '')}</div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </Card>
  );
}