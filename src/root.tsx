import { ThemeProvider, Global, css } from '@emotion/react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import { useAuthListener } from '@/features/auth/hooks';
import { theme } from '@/theme';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <Meta />
        <Links />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    background: ${theme.colors.bg};
    color: ${theme.colors.text};
    font-family: ${theme.typography.fontFamily.base};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
  }

  button {
    font-family: inherit;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
  }

  input,
  textarea {
    font-family: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;

export default function App() {
  useAuthListener();

  return (
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      <Outlet />
    </ThemeProvider>
  );
}
