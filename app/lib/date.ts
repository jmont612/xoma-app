export const toLocalYYYYMMDD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

export const fromYYYYMMDDLocal = (s: string) => {
  const [y, m, d] = s.split('-').map(n => Number(n));
  return new Date(y, (m || 1) - 1, d || 1);
};

export const isSameLocalDay = (a: Date | string | number, b: Date | string | number) => {
  const da = typeof a === 'string' ? fromYYYYMMDDLocal(a) : new Date(a);
  const db = typeof b === 'string' ? fromYYYYMMDDLocal(b) : new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const formatLocalDayEs = (date: Date) => {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

export const toDateFromUnknown = (raw: any) => {
  if (!raw) return new Date();
  if (typeof raw === 'number') return new Date(raw);
  if (raw instanceof Date) return raw as Date;
  const s = String(raw);
  // YYYY-MM-DD -> tratar como local
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return fromYYYYMMDDLocal(s);
  }
  // ISO u otros -> confiar en Date para convertir con zona
  return new Date(s);
};