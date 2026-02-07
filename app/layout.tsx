import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2026 挂历（双薪/三薪标注）',
  description: '2026 年每月一页挂历：标注双倍/三倍工资日期，并支持本地标记。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
