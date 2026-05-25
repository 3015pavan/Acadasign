"use client";
import { useUser } from '@/context/UserContext';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading } = useUser();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">Not signed in.</div>;

  return (
    <div className="p-6 max-w-3xl">
      <Card className="p-6 glass">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
        <div className="space-y-2 text-sm text-slate-700">
          <div>
            <strong className="mr-2">Name:</strong> {user.name}
          </div>
          <div>
            <strong className="mr-2">Email:</strong> {user.email}
          </div>
          <div>
            <strong className="mr-2">Role:</strong> {user.role}
          </div>
          <div className="mt-4">
            <Link href="/settings" className="text-[#7c5c46] hover:underline">Edit settings</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
