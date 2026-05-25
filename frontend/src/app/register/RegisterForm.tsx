"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { getApiBaseUrl } from '@/lib/runtime';

export default function RegisterForm() {
  const router = useRouter();
  const { refresh } = useUser();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form) as any);

    const API = getApiBaseUrl();
    let json: any;
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
        credentials: 'include',
      });

      json = await res.json();
    } catch (e: any) {
      toast.error('Network error while registering: ' + (e?.message || e));
      return;
    }

    if (!json || !json.success) {
      toast.error((json && json.error) || 'Registration failed');
      return;
    }

    try { localStorage.setItem('vedaai_token', json.token); } catch (e) {}
    await refresh();
    toast.success('Account created');
    router.push('/create');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.85),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] p-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/85 p-8 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">Create your VedaAI account</h2>
        <p className="mt-2 text-sm text-slate-600">Register to start generating assessments for your classroom.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700">Full name</label>
            <input name="name" type="text" placeholder="Your full name" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Email</label>
            <input name="email" type="email" placeholder="you@school.edu" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Password</label>
            <input name="password" type="password" placeholder="••••••••" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2" />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-white">Create account</button>
            <a href="/login" className="text-sm text-slate-700">Already have an account?</a>
          </div>
        </form>
      </div>
    </div>
  );
}
