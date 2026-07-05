import { useEffect } from 'react';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';

export default function RootLayout({ children }) {
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}