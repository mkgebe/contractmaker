export const metadata = {
  title: 'Contractmaker',
  description: 'Next.js app for contractmaker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
