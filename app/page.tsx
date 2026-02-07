'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { buildMonth, SPECIAL_DAYS, WEEKDAYS, YEAR } from '../lib/calendar';
import { getSupabaseBrowserClient, type SalarySettlement } from '../lib/supabase';

const STORAGE_KEY = 'calendar-2026-marks-v1';
const SALARY_KEY = 'calendar-2026-base-salary-v1';
const TARGET_DAYS_KEY = 'calendar-2026-target-days-v1';
const DEFAULT_BASE_SALARY = 9000;
const DEFAULT_TARGET_DAYS = 26;

type Marks = Record<string, boolean>;
type SettlementByMonth = Record<number, SalarySettlement>;

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

function parsePositiveNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function formatMoney(v: number) {
  return v.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toSettlementByMonth(rows: SalarySettlement[]): SettlementByMonth {
  return rows.reduce<SettlementByMonth>((acc, row) => {
    acc[row.month] = row;
    return acc;
  }, {});
}

export default function Page() {
  const [marks, setMarks] = useState<Marks>({});
  const [baseSalary, setBaseSalary] = useState<number>(DEFAULT_BASE_SALARY);
  const [targetDays, setTargetDays] = useState<number>(DEFAULT_TARGET_DAYS);
  const [settlements, setSettlements] = useState<SettlementByMonth>({});
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [savingMonth, setSavingMonth] = useState<number | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    setMarks(safeParse(localStorage.getItem(STORAGE_KEY)));
    setBaseSalary(parsePositiveNumber(localStorage.getItem(SALARY_KEY), DEFAULT_BASE_SALARY));
    setTargetDays(parsePositiveNumber(localStorage.getItem(TARGET_DAYS_KEY), DEFAULT_TARGET_DAYS));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  }, [marks]);

  useEffect(() => {
    localStorage.setItem(SALARY_KEY, String(baseSalary));
  }, [baseSalary]);

  useEffect(() => {
    localStorage.setItem(TARGET_DAYS_KEY, String(targetDays));
  }, [targetDays]);

  useEffect(() => {
    async function fetchSettlements() {
      if (!supabase) return;
      setLoadingSettlements(true);
      const { data, error } = await supabase
        .from('salary_settlements')
        .select('id, year, month, base_salary, target_days, worked_days, amount, settled_at')
        .eq('year', YEAR)
        .order('month', { ascending: true });

      if (error) {
        alert(`加载已结算记录失败：${error.message}`);
      } else {
        setSettlements(toSettlementByMonth((data || []) as SalarySettlement[]));
      }

      setLoadingSettlements(false);
    }

    fetchSettlements();
  }, [supabase]);

  const counts = useMemo(() => {
    const total = Object.values(marks).filter(Boolean).length;
    const specialMarked = Object.keys(marks).filter((k) => marks[k] && !!SPECIAL_DAYS[k]).length;
    return { total, specialMarked };
  }, [marks]);

  const monthCounts = useMemo(() => {
    const out: Record<number, number> = {};
    for (let m = 1; m <= 12; m += 1) out[m] = 0;

    for (const [ymd, marked] of Object.entries(marks)) {
      if (!marked || !ymd.startsWith(`${YEAR}-`)) continue;
      const month = Number(ymd.slice(5, 7));
      if (month >= 1 && month <= 12) out[month] += 1;
    }

    return out;
  }, [marks]);

  const eligibleMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1).filter(
      (month) => monthCounts[month] >= targetDays && !settlements[month],
    );
  }, [monthCounts, settlements, targetDays]);

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

  async function settleMonth(month: number) {
    const workedDays = monthCounts[month] ?? 0;
    if (workedDays < targetDays) {
      alert(`本月仅 ${workedDays} 天，未达到 ${targetDays} 天，不可结算。`);
      return;
    }
    if (!supabase) {
      alert('请先配置 Supabase 环境变量（NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY）。');
      return;
    }

    const amount = Number(((baseSalary / targetDays) * workedDays).toFixed(2));
    setSavingMonth(month);

    const payload = {
      year: YEAR,
      month,
      base_salary: baseSalary,
      target_days: targetDays,
      worked_days: workedDays,
      amount,
    };

    const { data, error } = await supabase
      .from('salary_settlements')
      .upsert(payload, { onConflict: 'year,month' })
      .select('id, year, month, base_salary, target_days, worked_days, amount, settled_at')
      .single();

    setSavingMonth(null);

    if (error) {
      alert(`结算失败：${error.message}`);
      return;
    }

    const row = data as SalarySettlement;
    setSettlements((prev) => ({ ...prev, [month]: row }));
    alert(`${month} 月已结算：¥${formatMoney(row.amount)}`);
  }

  return (
    <main className="container">
      <div className="header">
        <div>
          <div className="h1">2026 年挂历（工资结算版）</div>
          <div className="sub">
            点击任意日期可“打勾标记”。已标记：{counts.total} 天；其中节假日加班日：{counts.specialMarked} 天。
          </div>
          <div className="legend" style={{ marginTop: 8 }}>
            <span><span className="dot" style={{ background: 'var(--triple)' }} />三薪（春节：除夕-初三）</span>
            <span><span className="dot" style={{ background: 'var(--double)' }} />双薪（其余法定节假日）</span>
            <span><span className="dot" style={{ background: 'rgba(96,165,250,.25)' }} />已标记</span>
          </div>
        </div>

        <div className="row">
          <button className="btn primary" onClick={exportJson}>导出标记</button>
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

      <section className="salaryPanel">
        <div className="salaryGrid">
          <label className="field">
            月工资（元）
            <input
              className="input"
              type="number"
              min={1}
              value={baseSalary}
              onChange={(e) => setBaseSalary(parsePositiveNumber(e.target.value, DEFAULT_BASE_SALARY))}
            />
          </label>
          <label className="field">
            目标天数
            <input
              className="input"
              type="number"
              min={1}
              value={targetDays}
              onChange={(e) => setTargetDays(parsePositiveNumber(e.target.value, DEFAULT_TARGET_DAYS))}
            />
          </label>
        </div>

        <div className="salaryHint">
          {eligibleMonths.length > 0
            ? `发薪提醒：${eligibleMonths.map((m) => `${m} 月`).join('、')}已达到 ${targetDays} 天，可结算发工资。`
            : `发薪提醒：当某月勾选天数达到 ${targetDays} 天时会在这里提示。`}
        </div>

        <div className="settlementInfo">
          {loadingSettlements
            ? '正在加载已结算记录...'
            : `已结算月份：${Object.keys(settlements).length === 0 ? '暂无' : Object.keys(settlements).join('、')} 月`}
        </div>

        {!supabase && (
          <div className="warn">
            当前未连接 Supabase。请在 Vercel 或本地设置 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
          </div>
        )}
      </section>

      <section className="grid">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <MonthCard
            key={m}
            month={m}
            marks={marks}
            targetDays={targetDays}
            workedDays={monthCounts[m] ?? 0}
            settlement={settlements[m]}
            saving={savingMonth === m}
            onToggle={toggle}
            onSettle={settleMonth}
          />
        ))}
      </section>

      <div className="footer">
        <div>说明：</div>
        <div>1) 工资默认按 9000 元 / 26 天计算，支持你手动调整。</div>
        <div>2) 勾选某月天数达到目标后会提示可发薪，并可点击“结算入库”写入 Supabase。</div>
        <div>3) 每个月可独立结算，已结算记录会在页面中显示。</div>
      </div>
    </main>
  );
}

function MonthCard({
  month,
  marks,
  targetDays,
  workedDays,
  settlement,
  saving,
  onToggle,
  onSettle,
}: {
  month: number;
  marks: Marks;
  targetDays: number;
  workedDays: number;
  settlement?: SalarySettlement;
  saving: boolean;
  onToggle: (ymd: string) => void;
  onSettle: (month: number) => Promise<void>;
}) {
  const cells = useMemo(() => buildMonth(YEAR, month), [month]);

  return (
    <div className="card">
      <div className="cardTop">
        <div className="title">
          {monthNameCN(month)} <span>{YEAR}</span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>点击日期打勾</div>
      </div>

      <div className="cal">
        {WEEKDAYS.map((w) => (
          <div key={w} className="wd">{w}</div>
        ))}

        {cells.map((cell, idx) => {
          if (!cell) return <div key={idx} className="cell empty" />;
          const marked = !!marks[cell.ymd];
          const cls = [
            'cell',
            cell.special === '双薪' ? 'double' : '',
            cell.special === '三薪' ? 'triple' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={cell.ymd}
              className={cls}
              onClick={() => onToggle(cell.ymd)}
              title={`${cell.ymd}${cell.special ? ` ${cell.special}` : ''}${marked ? '（已标记）' : ''}`}
              style={{ outline: marked ? '2px solid rgba(96,165,250,.55)' : 'none', outlineOffset: -2 }}
            >
              <div className="day">{cell.day}</div>
              {cell.special && (
                <div className={`tag ${cell.special === '双薪' ? 'double' : 'triple'}`}>{cell.special}</div>
              )}
              {marked && <div className="mark">✓</div>}
            </div>
          );
        })}
      </div>

      <div className="payrollRow">
        <div className="payrollText">本月勾选：{workedDays}/{targetDays} 天</div>
        {settlement ? (
          <div className="paidBadge">已发 ¥{formatMoney(settlement.amount)}</div>
        ) : workedDays >= targetDays ? (
          <button className="btn primary" onClick={() => onSettle(month)} disabled={saving}>
            {saving ? '结算中...' : '结算入库'}
          </button>
        ) : (
          <div className="pendingBadge">未达发薪条件</div>
        )}
      </div>
    </div>
  );
}
