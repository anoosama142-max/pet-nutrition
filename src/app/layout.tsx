import "./globals.css";

export const metadata = {
  title: "FEDIAF Pet Nutrition Engine",
  description: "Clinical Veterinary Formulation Layer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 antialiased">{children}</body>
    </html>
  );
}
