"use client";

import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// framer-motion removed for stability during quick verification
import { CalendarDays, Check, GripVertical, Image as ImageIcon, Plus, UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { assignmentSchema, assignmentDefaults, type AssignmentFormValues, toAssignmentFormData } from '@/lib/validators';
import { createAssignment } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useToast } from '@/context/ToastContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const questionTypeOptions = [
  { label: 'MCQ', value: 'multiple_choice' },
  { label: 'Short', value: 'short_answer' },
  { label: 'Long', value: 'long_answer' },
  { label: 'True/False', value: 'true_false' },
  { label: 'Fill Blank', value: 'fill_in_blank' },
] as const;

const presets: Array<{
  label: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  totalMarks: number;
  duration: number;
}> = [];

function SectionCard({ index, field, remove, control, register }: any) {
  const section = useWatch({ control, name: `sections.${index}` });

  return (
    <div>
      <Card className="glass border-slate-200/80 bg-white/90 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-2xl bg-slate-100 p-2 text-slate-500"><GripVertical className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-base font-semibold text-slate-900">Section {String.fromCharCode(65 + index)}</div>
              <div className="text-sm text-slate-500">Define question mix, weight, and marks</div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => remove(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Section Name</Label>
            <Input {...register(`sections.${index}.name`)} placeholder={`Section ${String.fromCharCode(65 + index)}`} />
          </div>
          <div>
            <Label>Question Count</Label>
            <Input type="number" min={1} defaultValue={field?.numberOfQuestions} {...register(`sections.${index}.numberOfQuestions`, { valueAsNumber: true })} />
          </div>
          <div className="md:col-span-2">
            <Label>Marks per Question</Label>
            <Input type="number" min={1} defaultValue={field?.marksPerQuestion} {...register(`sections.${index}.marksPerQuestion`, { valueAsNumber: true })} />
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>Preview: {section?.numberOfQuestions ?? 0} questions · {section?.marksPerQuestion ?? 0} marks each</span>
            <Badge variant="muted">Section {String.fromCharCode(65 + index)}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AssignmentForm() {
  const router = useRouter();
  const toast = useToast();
  const setJobId = useAssignmentStore((state) => state.setJobId);
  const setAssignmentId = useAssignmentStore((state) => state.setAssignmentId);
  const setStatus = useAssignmentStore((state) => state.setStatus);
  const setProgress = useAssignmentStore((state) => state.setProgress);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isValid, isSubmitting } } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    mode: 'onChange',
    defaultValues: assignmentDefaults,
  });

  const sectionsFieldArray = useFieldArray({ control, name: 'sections' });
  const values = watch();
  const watchedSections = useWatch({ control, name: 'sections' }) ?? values.sections;
  const totalQuestions = useMemo(() => watchedSections.reduce((sum, section) => sum + Number(section.numberOfQuestions || 0), 0), [watchedSections]);
  const totalSectionMarks = useMemo(() => watchedSections.reduce((sum, section) => sum + Number(section.numberOfQuestions || 0) * Number(section.marksPerQuestion || 0), 0), [watchedSections]);
  const difficultyTotal = values.difficulty.easy + values.difficulty.medium + values.difficulty.hard;

  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      setStatus('pending');
      setProgress(5);
      const response = await createAssignment(data, uploadedFile);
      setAssignmentId(response.assignmentId);
      setJobId(response.jobId);
      router.push(`/output/${response.assignmentId}`);
      toast.success('Assignment created — generating in background');
    } catch (error: any) {
      console.error('Create assignment failed', error);
      setStatus('failed');
      setProgress(0);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create assignment');
    }
  };

  const handlePreset = (preset: typeof presets[number]) => {
    setValue('subject', preset.subject, { shouldValidate: true });
    setValue('topic', preset.topic, { shouldValidate: true });
    setValue('gradeLevel', preset.gradeLevel, { shouldValidate: true });
    setValue('totalMarks', preset.totalMarks, { shouldValidate: true });
    setValue('duration', preset.duration, { shouldValidate: true });
  };

  const handleFile = (file: File | null) => {
    setUploadedFile(file);
    if (uploadedPreview) {
      URL.revokeObjectURL(uploadedPreview);
    }
    setUploadedPreview(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const uploadHint = uploadedFile
    ? uploadedFile.type.startsWith('image/')
      ? 'Image detected. A preview is shown here, and the uploaded image can be used as reference material.'
      : 'Reference file loaded. The text will be extracted to ground the generated paper.'
    : 'PDF, TXT, or image files can be attached as source material.';

  useEffect(() => {
    return () => {
      if (uploadedPreview) {
        URL.revokeObjectURL(uploadedPreview);
      }
    };
  }, [uploadedPreview]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <Card className="glass overflow-hidden border-slate-200/70 bg-white/88 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.72))]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Ready to generate
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Create Assignment</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">Set up a polished exam paper with section control, weighted difficulty, and AI-assisted generation.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button key={preset.label} type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => handlePreset(preset)}>
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Assignment Title</Label>
                <Input {...register('title')} placeholder="Quiz on Electricity" />
                {errors.title ? <p className="mt-1 text-xs text-slate-500">{errors.title.message}</p> : null}
              </div>
              <div>
                <Label>Subject</Label>
                <Input {...register('subject')} placeholder="Science" />
                {errors.subject ? <p className="mt-1 text-xs text-slate-500">{errors.subject.message}</p> : null}
              </div>
              <div>
                <Label>Topic / Chapter</Label>
                <Input {...register('topic')} placeholder="Electricity" />
                {errors.topic ? <p className="mt-1 text-xs text-slate-500">{errors.topic.message}</p> : null}
              </div>
              <div>
                <Label>Grade Level</Label>
                <Input {...register('gradeLevel')} placeholder="Grade 5" />
                {errors.gradeLevel ? <p className="mt-1 text-xs text-slate-500">{errors.gradeLevel.message}</p> : null}
              </div>
              <div>
                <Label>Due Date</Label>
                <div className="relative">
                  <Input type="date" {...register('dueDate')} />
                  <CalendarDays className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-slate-400" />
                </div>
                {errors.dueDate ? <p className="mt-1 text-xs text-slate-500">{errors.dueDate.message}</p> : null}
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" min={1} {...register('duration', { valueAsNumber: true })} />
                {errors.duration ? <p className="mt-1 text-xs text-slate-500">{errors.duration.message}</p> : null}
              </div>
              <div>
                <Label>Total Marks</Label>
                <Input type="number" min={1} {...register('totalMarks', { valueAsNumber: true })} />
                {errors.totalMarks ? <p className="mt-1 text-xs text-slate-500">{errors.totalMarks.message}</p> : null}
              </div>
              <div>
                <Label>Question Types</Label>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2">
                  {questionTypeOptions.map((option) => {
                    const checked = values.questionTypes.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const next = checked ? values.questionTypes.filter((item) => item !== option.value) : [...values.questionTypes, option.value];
                          setValue('questionTypes', next, { shouldValidate: true });
                        }}
                        className={cn(
                          'rounded-full px-3 py-2 text-xs font-semibold transition-all',
                          checked ? 'bg-slate-900 text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                      >
                        {checked ? <Check className="mr-1 inline h-3 w-3" /> : null}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {errors.questionTypes ? <p className="mt-1 text-xs text-slate-500">{errors.questionTypes.message}</p> : null}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Label>Upload Reference File</Label>
                  <p className="text-xs text-slate-500">PDF, TXT, or image reference material for the AI generator</p>
                </div>
                {uploadedFile ? <Badge variant="muted">{uploadedFile.name}</Badge> : null}
              </div>
              <label
                className={cn(
                  'glass flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-6 py-8 text-center transition-all',
                  isDragging ? 'border-slate-300 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.08)]' : 'border-white/80 bg-white/70 hover:bg-white',
                )}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) {
                    setUploadedFile(file);
                  }
                }}
              >
                <UploadCloud className="mb-3 h-8 w-8 text-slate-400" />
                  <div className="text-sm font-semibold text-slate-700">Drag & drop a file here</div>
                  <div className="text-xs text-slate-500">Support for .pdf, .txt, and image files</div>
                  <div className="mt-3 text-xs text-slate-500">{uploadHint}</div>
                <input
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </label>
              {uploadedPreview ? (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-soft">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ImageIcon className="h-4 w-4 text-[#7c5c46]" />
                    Uploaded image preview
                  </div>
                  <img src={uploadedPreview} alt="Uploaded preview" className="max-h-64 w-full rounded-[18px] object-contain bg-[#f7f2ed]" />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <Label>Additional Instructions</Label>
                <Textarea {...register('additionalInstructions')} placeholder="Generate a balanced paper with a formal tone and real-world scenarios." />
              </div>
              <div className="glass space-y-3 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="flex items-center justify-between text-sm text-slate-500"><span>Section total</span><strong className="text-slate-900">{totalSectionMarks} marks</strong></div>
                <div className="flex items-center justify-between text-sm text-slate-500"><span>Total questions</span><strong className="text-slate-900">{totalQuestions}</strong></div>
                <div className="flex items-center justify-between text-sm text-slate-500"><span>Difficulty balance</span><strong className="text-slate-700">{difficultyTotal}%</strong></div>
                <Progress value={(difficultyTotal / 100) * 100} />
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  <div className="rounded-2xl bg-white p-3 text-slate-700 ring-1 ring-slate-200">Easy {values.difficulty.easy}%</div>
                  <div className="rounded-2xl bg-white p-3 text-slate-700 ring-1 ring-slate-200">Medium {values.difficulty.medium}%</div>
                  <div className="rounded-2xl bg-white p-3 text-slate-700 ring-1 ring-slate-200">Hard {values.difficulty.hard}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {sectionsFieldArray.fields.map((field, index) => (
            <SectionCard key={field.id} index={index} field={field} remove={sectionsFieldArray.remove} control={control} register={register} />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" className="rounded-full px-4" onClick={() => sectionsFieldArray.append({ name: `Section ${String.fromCharCode(65 + sectionsFieldArray.fields.length)}`, questionType: 'short_answer', numberOfQuestions: 3, marksPerQuestion: 2 })}>
            <Plus className="h-4 w-4" /> Add Section
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Submit when the form is valid</span>
            <Button type="button" onClick={handleSubmit(onSubmit)} disabled={!isValid || isSubmitting} className="rounded-full px-5">
              {isSubmitting ? 'Generating...' : 'Create Assignment'}
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Card className="glass sticky top-4 overflow-hidden border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,250,249,0.82))] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Live Summary</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Exam paper snapshot</div>
            <p className="mt-1 text-sm text-slate-500">A quick view of how your generated assessment will feel.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] bg-slate-900 p-5 text-white shadow-soft">
              <div className="mb-2 text-sm uppercase tracking-[0.18em] text-white/60">{values.subject || 'Subject'}</div>
              <div className="text-2xl font-semibold leading-tight">{values.title || 'Assignment Title'}</div>
              <div className="mt-3 text-sm text-white/70">{values.topic || 'Topic'} · {values.gradeLevel || 'Grade level'} · {values.duration || 0} min</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white p-4 text-slate-700 ring-1 ring-slate-200"><div className="text-xs uppercase tracking-wide text-slate-400">Marks</div><div className="mt-1 text-xl font-semibold text-slate-900">{values.totalMarks}</div></div>
              <div className="rounded-2xl bg-slate-50 p-4 text-slate-700"><div className="text-xs uppercase tracking-wide text-slate-500">Sections</div><div className="mt-1 text-xl font-semibold">{values.sections.length}</div></div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">Question Mix</div>
              <div className="flex flex-wrap gap-2">
                {values.questionTypes.map((type) => <Badge key={type} variant="muted">{type.replace('_', ' ')}</Badge>)}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>Remaining checks</span><span className="font-semibold text-slate-900">{isValid ? 'Ready' : 'Incomplete'}</span></div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className={values.title ? 'text-slate-600' : 'text-slate-400'}>●</span> Assignment details</div>
                <div className="flex items-center gap-2"><span className={values.sections.length ? 'text-slate-600' : 'text-slate-400'}>●</span> Section configuration</div>
                <div className="flex items-center gap-2"><span className={difficultyTotal === 100 ? 'text-slate-600' : 'text-slate-400'}>●</span> Difficulty balance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}