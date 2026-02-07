export type SpecialTag = '双薪' | '三薪';

export type SpecialDay = {
  pay: SpecialTag;
  festival: string;
};

export const YEAR = 2026;

// key: YYYY-MM-DD
export const SPECIAL_DAYS: Record<string, SpecialDay> = {
  // 三薪：春节 4 天（除夕、初一、初二、初三）
  '2026-02-16': { pay: '三薪', festival: '春节（除夕）' },
  '2026-02-17': { pay: '三薪', festival: '春节（初一）' },
  '2026-02-18': { pay: '三薪', festival: '春节（初二）' },
  '2026-02-19': { pay: '三薪', festival: '春节（初三）' },

  // 双薪：其余法定节假日
  '2026-01-01': { pay: '双薪', festival: '元旦' },
  '2026-04-05': { pay: '双薪', festival: '清明节' },
  '2026-05-01': { pay: '双薪', festival: '劳动节' },
  '2026-05-02': { pay: '双薪', festival: '劳动节' },
  '2026-06-19': { pay: '双薪', festival: '端午节' },
  '2026-09-25': { pay: '双薪', festival: '中秋节' },
  '2026-10-01': { pay: '双薪', festival: '国庆节' },
  '2026-10-02': { pay: '双薪', festival: '国庆节' },
  '2026-10-03': { pay: '双薪', festival: '国庆节' },
};

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function ymd(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function mondayFirstIndex(date: Date) {
  const js = date.getDay();
  return (js + 6) % 7;
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export type Cell = {
  ymd: string;
  day: number;
  special?: SpecialDay;
};

export function buildMonth(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const startCol = mondayFirstIndex(first);
  const dim = daysInMonth(year, month);

  const cells: (Cell | null)[] = [];
  for (let i = 0; i < startCol; i++) cells.push(null);

  for (let day = 1; day <= dim; day++) {
    const key = ymd(year, month, day);
    cells.push({ ymd: key, day, special: SPECIAL_DAYS[key] });
  }

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}
