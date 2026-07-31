export function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getDaysRemaining(dueDate: string): number {
  if (!dueDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getTotalDays(createdAt?: string, dueDate?: string): number {
  if (!dueDate) return 60;
  if (!createdAt) return 60;

  try {
    const created = new Date(createdAt);
    created.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    const diffTime = due.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 60;
  } catch {
    return 60;
  }
}

/**
 * Calculates deadline status and color by dividing total days into 4 equal quarters:
 * - Quarter 1 (<= totalDays / 4, e.g. <= 15 days out of 60): RED (Critical/Urgent)
 * - Quarter 2 & 3 (< (3 * totalDays) / 4, e.g. < 45 days out of 60): YELLOW (Warning)
 * - Quarter 4 (45 - 60+ days): GREEN (Safe/On Track)
 */
export function getDeadlineColor(daysRemaining: number, totalDays: number = 60): { text: string; bg: string; border: string; label: string } {
  // Equation dividing total days into 4 equal parts
  const q1 = totalDays / 4;       // 1st part threshold (15 days for 60)
  const q3 = (3 * totalDays) / 4; // 3rd part threshold (45 days for 60)

  if (daysRemaining <= q1) {
    // 15 days left or less -> Red color
    return {
      text: 'text-rose-400',
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/30',
      label: 'Critical (< 1/4th remaining)',
    };
  } else if (daysRemaining < q3) {
    // Less than 45 days left -> Yellow color
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      label: 'Medium (< 3/4ths remaining)',
    };
  } else {
    // Between 45 and 60+ days left -> Green color
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      label: 'On Track (45-60d remaining)',
    };
  }
}
