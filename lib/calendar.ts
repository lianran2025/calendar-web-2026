export type SpecialTag = '双薪' | '三薪';

export const YEAR = 2026;

// 你的规则（图里“国家法定13天节假日”的双倍/三倍）落到 2026 的具体日期
// key: YYYY-MM-DD
export const SPECIAL_DAYS: Record<string, SpecialTag> = {
  // 三薪：春节 4 天（除夕、初一、初二、初三）
  '2026-02-16': '三薪',
  '2026-02-17': '三薪',
  '2026-02-18': '三薪',
  '2026-02-19': '三薪',

  // 双薪：元旦、清明、劳动节 2 天、端午、中秋、国庆 3 天
  '2026-01-01': '双薪',
  '2026-04-05': '双薪',
  '2026-05-01': '双薪',
  '2026-05-02': '双薪',
  '2026-06-19': '双薪',
  '2026-09-25': '双薪',
  '2026-10-01': '双薪',
  '2026-10-02': '双薪',
  '2026-10-03': '双薪'
};

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function ymd(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

// Monday-first index: 0..6
export function mondayFirstIndex(date: Date) {
  const js = date.getDay(); // 0 Sun..6 Sat
  return (js + 6) % 7; // Mon->0 ... Sun->6
}

export function daysInMonth(year: number, month: number /*1-12*/) {
  return new Date(year, month, 0).getDate();
}

export type Cell = {
  ymd: string;
  day: number;
  special?: SpecialTag;
};

export function buildMonth(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const startCol = mondayFirstIndex(first);
  const dim = daysInMonth(year, month);

  const cells: (Cell | null)[] = [];
  for (let i = 0; i < startCol; i++) cells.push(null);

  for (let day = 1; day <= dim; day++) {
    const key = ymd(year, month, day);
    const special = SPECIAL_DAYS[key];
    cells.push({ ymd: key, day, special });
  }

  // pad to full weeks (6 rows max: 42 cells)
  while (cells.length % 7 !== 0) cells.push(null);
  if (cells.length < 42) {
    while (cells.length < 42) cells.push(null);
  }

  return cells;
}
