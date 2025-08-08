import "../globals.css";
import { ReactNode } from "react";

export default function RootLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale} dir={params.locale === "ar" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
