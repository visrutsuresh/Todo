import './globals.css';
import { GeistMono } from 'geist/font/mono';

export const metadata = {
  title: 'Todo',
  description: 'A Notion-style task manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* className rather than the CSS variable: it sets font-family directly,
          so nothing depends on remembering geist's variable name. */}
      <body className={GeistMono.className}>{children}</body>
    </html>
  );
}
