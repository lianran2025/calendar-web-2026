'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { buildMonth, SPECIAL_DAYS, WEEKDAYS, YEAR } from '../lib/calendar';

const STORAGE_KEY = 'calendar-2026-marks-v1';

type Marks = Record<string, boolean>;

function monthNameCN(m: number) {
  return `${m} 月`;
}

function safeParse(json: string | null): Marks {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    if (!v || typeof v !== 'object') return {};
    return v as Marks;
  } catch {
    return {};
  }
}

function shortFestivalName(name: string) {
  if (name.startsWith('春节（') && name.endsWith('）')) {
    return name.slice(3, -1);
  }
  return name;
}

export default function Page() {
  const [marks, setMarks] = useState<Marks>({});
  const months = useMemo(() => Array.from({ length: 11 }, (_, i) => i + 2), []);
  const monthPages = useMemo(() => {
    const pages: number[][] = [];
    for (let i = 0; i < months.length; i += 2) {
      pages.push(months.slice(i, i + 2));
    }
    return pages;
  }, [months]);

  useEffect(() => {
    setMarks(safeParse(localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  }, [marks]);

  const counts = useMemo(() => {
    const total = Object.values(marks).filter(Boolean).length;
    const specialMarked = Object.keys(marks).filter((k) => marks[k] && !!SPECIAL_DAYS[k]).length;
    return { total, specialMarked };
  }, [marks]);

  function toggle(ymd: string) {
    setMarks((prev) => ({ ...prev, [ymd]: !prev[ymd] }));
  }

  function resetAll() {
    if (!confirm('确认清空所有标记？（仅影响本浏览器）')) return;
    setMarks({});
  }

  function exportJson() {
    const data = {
      version: 1,
      year: YEAR,
      exportedAt: new Date().toISOString(),
      marks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2026挂历标记-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const next = parsed?.marks;
      if (!next || typeof next !== 'object') throw new Error('格式不对');
      setMarks(next);
      alert('导入成功（已覆盖本地标记）');
    } catch (e: any) {
      alert(`导入失败：${e?.message || '未知错误'}`);
    }
  }

  return (
    <main className="container">
      <div className="header no-print">
        <div>
          <div className="h1">2026 年挂历（双薪/三薪）</div>
          <div className="sub">
            日历从 2 月开始显示。点击任意日期可“打勾标记”。已标记：{counts.total} 天；其中节假日加班日：{counts.specialMarked} 天。
          </div>
          <div className="legend" style={{ marginTop: 8 }}>
            <span><span className="dot" style={{ background: 'var(--triple)' }} />三薪（春节：除夕-初三）</span>
            <span><span className="dot" style={{ background: 'var(--double)' }} />双薪（元旦/清明/劳动节/端午/中秋/国庆）</span>
            <span><span className="dot" style={{ background: 'rgba(96,165,250,.25)' }} />已标记</span>
          </div>
        </div>

        <div className="row">
          <button className="btn primary" onClick={() => window.print()}>打印（日历每页 2 个月）</button>
          <button className="btn" onClick={exportJson}>导出标记</button>
          <label className="btn" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            导入标记
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => importJson(e.target.files?.[0] ?? null)}
            />
          </label>
          <button className="btn" onClick={resetAll}>清空标记</button>
        </div>
      </div>

      <section className="grid print-grid">
        {monthPages.map((pageMonths, pageIndex) => (
          <div key={pageIndex} className="print-page">
            {pageMonths.map((m) => (
              <MonthCard key={m} month={m} marks={marks} onToggle={toggle} />
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

function MonthCard({
  month,
  marks,
  onToggle,
}: {
  month: number;
  marks: Marks;
  onToggle: (ymd: string) => void;
}) {
  const cells = useMemo(() => buildMonth(YEAR, month), [month]);
  const monthHolidayNote = useMemo(() => {
    const grouped: Record<'双薪' | '三薪', string[]> = { 双薪: [], 三薪: [] };
    for (const cell of cells) {
      if (!cell?.special) continue;
      const festival = shortFestivalName(cell.special.festival);
      if (!grouped[cell.special.pay].includes(festival)) {
        grouped[cell.special.pay].push(festival);
      }
    }
    const sections: string[] = [];
    if (grouped['三薪'].length > 0) sections.push(`三薪：${grouped['三薪'].join('、')}`);
    if (grouped['双薪'].length > 0) sections.push(`双薪：${grouped['双薪'].join('、')}`);
    return sections.join(' ｜ ');
  }, [cells]);

  return (
    <div className="card print-card">
      <div className="cardTop">
        <div className="title">
          {monthNameCN(month)} <span>{YEAR}</span>
        </div>
        <div className="monthNote">{monthHolidayNote}</div>
      </div>

      <div className="cal">
        {WEEKDAYS.map((w) => (
          <div key={w} className="wd">{w}</div>
        ))}

        {cells.map((cell, idx) => {
          if (!cell) return <div key={idx} className="cell empty" />;
          const marked = !!marks[cell.ymd];
          const payType = cell.special?.pay;
          const cls = [
            'cell',
            payType === '双薪' ? 'double' : '',
            payType === '三薪' ? 'triple' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={cell.ymd}
              className={cls}
              onClick={() => onToggle(cell.ymd)}
              title={`${cell.ymd}${cell.special ? ` ${cell.special.pay} ${cell.special.festival}` : ''}${marked ? '（已标记）' : ''}`}
              style={{ outline: marked ? '2px solid rgba(96,165,250,.55)' : 'none', outlineOffset: -2 }}
            >
              <div className="day">{cell.day}</div>
              {cell.special && (
                <div className={`tag ${cell.special.pay === '双薪' ? 'double' : 'triple'}`}>
                  {cell.special.pay}
                </div>
              )}
              {marked && <div className="mark">✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
