import { html } from "hono/html";

// export const APP_URL = "http://localhost:8787";
export const APP_URL = "http://extend-url.yokohama.dev";

export const head = html`<meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>URL 延長サービス</title>`;

export const footer = html`<footer>
  <small>本サービスによって生じた結果について、一切の責任を負いかねます</small
  ><br />
  <a href="/">トップに戻る</a>
</footer>`;

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
