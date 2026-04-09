import './globals.css';

export const metadata = {
  title: 'Contractmaker | Service Contract Builder',
  description: 'Draft, send, and sign branded service contracts online.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-color-theme="midnight">
      <body>{children}</body>
    </html>
  );
}
