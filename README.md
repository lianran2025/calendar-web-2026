# 2026 挂历（双薪/三薪标注）网页版

- 12 个月一起展示（每月一张卡片）
- 标注双薪/三薪日期
- 点击日期可打勾标记（保存在浏览器 localStorage）
- 支持导出/导入标记 JSON（方便跨设备）
- 支持每月工资结算并记录到 Supabase（默认 9000 元、26 天）

## 本地运行

```bash
pnpm install
pnpm dev
```

打开：<http://localhost:3000>

## 接入 Supabase

1. 在 Supabase 新建项目，打开 SQL Editor 执行：

```sql
create table if not exists public.salary_settlements (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  base_salary numeric(10,2) not null,
  target_days int not null,
  worked_days int not null,
  amount numeric(10,2) not null,
  settled_at timestamptz not null default now(),
  unique (year, month)
);

alter table public.salary_settlements enable row level security;

create policy "allow read salary_settlements"
on public.salary_settlements
for select
to anon
using (true);

create policy "allow insert salary_settlements"
on public.salary_settlements
for insert
to anon
with check (true);

create policy "allow update salary_settlements"
on public.salary_settlements
for update
to anon
using (true)
with check (true);
```

2. 在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
```

3. 重新启动开发服务：`pnpm dev`

## 部署到 Vercel

1. 把本项目推到 GitHub（或直接上传到 Vercel）
2. Vercel 新建项目，选择该仓库
3. 在 Vercel Project Settings -> Environment Variables 中添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Build 命令：`pnpm build`
5. Output：Next.js 自动识别

> 如需指定 Node 版本，可在 Vercel Project Settings 里选 Node 20+（建议 20 或 22）。

## 规则说明

页面里只标注你给的“法定节假日加班双薪/三薪日期”（不显示周末/调休）。
如果以后你想改日期或新增规则，改 `lib/calendar.ts` 的 `SPECIAL_DAYS` 即可。
