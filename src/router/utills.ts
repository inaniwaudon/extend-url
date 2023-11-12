import { html } from "hono/html";

export const APP_URL = "http://localhost:8787";

export const head = html`<meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>URL 延長サービス</title>`;

export const footer = html`<footer><a href="/">トップに戻る</a></footer>`;

export const getError = (message: string) =>
  html` <!DOCTYPE html>
    <html>
      <head>
        ${head}
      </head>
      <body>
        <p>${message}</p>
        ${footer}
      </body>
    </html>`;
