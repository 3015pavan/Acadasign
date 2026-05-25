"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter, Search, Plus, MoreVertical, FileText } from 'lucide-react';
import api from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Assignment = {
  _id: string;
  title: string;
  subject: string;
  status: string;
  createdAt: string;
};

export default function AnalyticsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/api/assignments')
      .then((r) => setAssignments(r.data.assignments || []))
      .catch(() => setAssignments([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((assignment) => [assignment.title, assignment.subject, assignment.status].join(' ').toLowerCase().includes(q));
  }, [assignments, query]);

  return (
    <AppShell title="Assignments" backHref="/" showCreateButton>
      <div className="h-full overflow-y-auto pr-1">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-10">
          <Card className="glass-gray border-slate-200/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-600"><span className="h-3 w-3 rounded-full bg-slate-400" /> Assignments</div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Manage and create assignments for your classes.</h1>
              </div>
              <Link href="/create">
                <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                  <Plus className="h-4 w-4" /> Create Assignment
                </Button>
              </Link>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-slate-200/70 bg-white/85 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500"><Filter className="h-4 w-4" /> Filter By</div>
              <label className="flex w-full max-w-xl items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm sm:ml-auto">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Assignment"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
            </div>
          </Card>

          {filtered.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((assignment) => (
                <Card key={assignment._id} className="glass-gray group border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-semibold text-slate-900">{assignment.title}</h2>
                        <Badge variant={assignment.status === 'completed' ? 'muted' : 'default'}>{assignment.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                        <Badge variant="muted">{assignment.subject}</Badge>
                        <Badge variant="muted">{new Date(assignment.createdAt).toLocaleDateString()}</Badge>
                      </div>
                    </div>
                    <button className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-900" title="More actions" aria-label="More actions">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link href={`/output/${assignment._id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                      View Assignment
                    </Link>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/results/${assignment._id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <FileText className="h-4 w-4" /> Open JSON
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-gray border-slate-200/70 p-10 text-center">
              <div className="mx-auto mb-5 grid h-40 w-40 place-items-center rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.96),rgba(226,232,240,0.48))] shadow-inner">
                <div className="relative h-28 w-28 rounded-full border border-slate-200 bg-white/80 shadow-lg">
                  <div className="absolute left-1/2 top-4 h-16 w-3 -translate-x-1/2 rounded-full bg-slate-100" />
                  <div className="absolute left-1/2 top-8 h-2 w-14 -translate-x-1/2 rounded-full bg-slate-900" />
                  <div className="absolute left-1/2 top-14 h-2 w-14 -translate-x-1/2 rounded-full bg-slate-300" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-slate-200 bg-white/40" />
                  <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-lg bg-slate-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">No assignments yet</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
                Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>
              <div className="mt-6">
                <Link href="/create" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
                  <Plus className="h-4 w-4" /> Create Your First Assignment
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <Link href="/create" className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] ring-1 ring-white/70">
          <Plus className="h-5 w-5 text-[#7c5c46]" />
        </Link>
      </div>
    </AppShell>
  );
}
