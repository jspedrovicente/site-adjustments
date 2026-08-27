import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = { title: { default: "Zé-landia", template: "%s · Zé-landia" }, description: "Backlog e Prioridades do Site 2026" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body className={inter.variable}>{children}</body></html>; }
