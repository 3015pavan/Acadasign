"use client";
import { useEffect, useState } from 'react';
import { updateProfile } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user, setUser } = useUser();
  const [name, setName] = useState('');
  const [role, setRole] = useState('teacher');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setName(user?.name || '');
      setRole(user?.role || 'teacher');
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({ name, role });
      setUser(res.user);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <div className="p-6">Please sign in to edit settings.</div>;

  return (
    <div className="p-6 max-w-3xl">
      <Card className="p-6 glass">
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-sm font-medium text-slate-700">Name</label>
            <input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="mt-1 block w-full rounded border p-2 text-slate-700" />
          </div>
          <div>
            <label htmlFor="settings-role" className="block text-sm font-medium text-slate-700">Role</label>
            <select id="settings-role" value={role} onChange={(e) => setRole(e.target.value)} title="Choose your role" className="mt-1 block w-full rounded border p-2 text-slate-700">
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
