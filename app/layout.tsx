import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = { title: { default: "Ajustes do site", template: "%s · Ajustes do site" }, description: "Gestão interna de demandas e ajustes do site" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body className={inter.variable}>{children}</body></html>; }
