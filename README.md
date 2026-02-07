# 2026 挂历（双薪/三薪标注）网页版

- 12 个月一起展示（每月一张卡片）
- 标注双薪/三薪日期
- 点击日期可打勾标记（保存在浏览器 localStorage）
- 支持导出/导入标记 JSON（方便跨设备）

## 本地运行

```bash
pnpm install
pnpm dev
```

打开：<http://localhost:3000>

## 部署到 Vercel

1. 把本项目推到 GitHub（或直接上传到 Vercel）
2. Vercel 新建项目，选择该仓库
3. Build 命令：`pnpm build`
4. Output：Next.js 自动识别

> 如需指定 Node 版本，可在 Vercel Project Settings 里选 Node 20+（建议 20 或 22）。

## 规则说明

页面里只标注你给的“法定节假日加班双薪/三薪日期”（不显示周末/调休）。
如果以后你想改日期或新增规则，改 `lib/calendar.ts` 的 `SPECIAL_DAYS` 即可。
