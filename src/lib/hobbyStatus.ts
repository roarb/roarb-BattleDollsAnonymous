export const HOBBY_STATUSES = ['Unbuilt', 'Assembled', 'Primed', 'Basic Paint', 'Completed'] as const;

export type HobbyStatus = typeof HOBBY_STATUSES[number];

export const PAINTED_STATUSES: HobbyStatus[] = ['Basic Paint', 'Completed'];

export const STATUS_COLORS: Record<HobbyStatus, string> = {
  Unbuilt: '#f87171',
  Assembled: '#d4d4d8',
  Primed: '#fbbf24',
  'Basic Paint': '#3b82f6',
  Completed: '#60a5fa',
};

export interface ProgressSummary {
  unbuilt: number;
  assembled: number;
  primed: number;
  basicPaint: number;
  completed: number;
  total: number;
}

export function isForwardProgress(fromStatus: string, toStatus: string) {
  const fromIndex = HOBBY_STATUSES.indexOf(fromStatus as HobbyStatus);
  const toIndex = HOBBY_STATUSES.indexOf(toStatus as HobbyStatus);

  return fromIndex >= 0 && toIndex > fromIndex;
}

export function isPaintedStatus(status: string) {
  return PAINTED_STATUSES.includes(status as HobbyStatus);
}

export function summarizeProgress(models: { qty: number; status: string }[]): ProgressSummary {
  const summary: ProgressSummary = {
    unbuilt: 0,
    assembled: 0,
    primed: 0,
    basicPaint: 0,
    completed: 0,
    total: 0,
  };

  models.forEach((model) => {
    const qty = Number(model.qty) || 0;
    summary.total += qty;

    switch (model.status) {
      case 'Unbuilt':
        summary.unbuilt += qty;
        break;
      case 'Assembled':
        summary.assembled += qty;
        break;
      case 'Primed':
        summary.primed += qty;
        break;
      case 'Basic Paint':
        summary.basicPaint += qty;
        break;
      case 'Completed':
        summary.completed += qty;
        break;
    }
  });

  return summary;
}

export function getBestProgressImage(images?: Record<string, string | null>) {
  if (!images) return null;

  return [...HOBBY_STATUSES].reverse().reduce<string | null>((found, status) => {
    return found || images[status] || null;
  }, null);
}

