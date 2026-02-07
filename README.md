# 2026 挂历（农历 + 双薪/三薪）网页版

- 从 2 月开始显示到 12 月
- 每天显示公历 + 中国农历
- 双薪/三薪日期显示具体节日名称（春节/清明/劳动节/端午/中秋/国庆等）
- 点击日期可打勾标记（保存在浏览器 localStorage）
- 支持导出/导入标记 JSON
- 支持浏览器打印，打印时每页固定 2 个月

## 本地运行

```bash
corepack pnpm install
corepack pnpm dev
```

打开：<http://localhost:3000>

## 部署到 Vercel

1. 推送到 GitHub
2. Vercel 新建项目并选择仓库
3. Framework 选择 Next.js（通常自动识别）
4. 直接 Deploy

## 打印说明

- 页面右上角点击“打印（日历每页 2 个月）”
- 或使用浏览器打印（`Ctrl/Cmd + P`）
- 推荐纸张：A4 纵向
