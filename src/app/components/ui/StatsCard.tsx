import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-6 rounded-3xl">
      <div className={`p-3 rounded-2xl bg-[var(--bg-input)] inline-block mb-4 ${color}`}>
        <Icon size={20} />
      </div>
      <h4 className="text-3xl font-semibold mb-1">{value}</h4>
      <p className="text-sm text-[var(--text-muted)] font-medium">{label}</p>
    </div>
  );
}