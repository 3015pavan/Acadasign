import { AppShell } from '@/components/layout/app-shell';
import { AssignmentForm } from '@/components/forms/assignment-form';

export function CreateAssignmentScreen() {
  return (
    <AppShell title="Create Assignment" backHref="/">
      <div className="h-full overflow-y-auto pr-1">
        <AssignmentForm />
      </div>
    </AppShell>
  );
}