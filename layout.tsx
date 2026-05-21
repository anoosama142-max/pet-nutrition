import React from 'react';

export const metadata = {
  title: 'Pet Nutrition Engine',
  description: 'Clinical Pet Nutrition Engine for dogs and cats',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
