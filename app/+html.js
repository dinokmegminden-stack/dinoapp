import { ScrollViewStyleReset } from 'expo-router/html';

export default function Html({ children }) {
  return (
    <html lang="hu">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Dínó Tudós</title>
        <ScrollViewStyleReset />
        
        {/* Ez a stílusblokk takarítja ki a maradék CSS hibákat a képről */}
        <style dangerouslySetInnerHTML={{ __html: dinoStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const dinoStyles = `
  html, body {
    text-size-adjust: 100% !important;
    -webkit-text-size-adjust: 100% !important;
    user-select: auto !important;
    -webkit-user-select: auto !important;
  }
`;