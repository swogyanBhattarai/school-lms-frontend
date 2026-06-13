import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "./_components/QueryProvider";
import { ToastNotificationProvider } from "./_components/ToastNotificationProvider";

export const metadata: Metadata = {
  title: "Gyan Jyoti LMS",
  description: "School operations, attendance, and academic planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastNotificationProvider>
          <QueryProvider>{children}</QueryProvider>
        </ToastNotificationProvider>
      </body>
    </html>
  );
}
