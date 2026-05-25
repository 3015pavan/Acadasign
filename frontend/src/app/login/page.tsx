"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form) as any);

    const result = await login(data.email, data.password);
    if (!result.success) {
      toast.error(result.error || 'Login failed');
      return;
    }
    toast.success('Signed in');
    router.push('/create');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.85),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] p-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/85 p-8 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">Sign in to VedaAI</h2>
        <p className="mt-2 text-sm text-slate-600">Use your account to access the assessment workspace.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm text-slate-700">Email</label>
            <input id="login-email" name="email" type="email" placeholder="name@school.edu" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm text-slate-700">Password</label>
            <input id="login-password" name="password" type="password" placeholder="Enter your password" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200" />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-white">Sign In</button>
            <Link href="/register" className="text-sm text-slate-700">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
