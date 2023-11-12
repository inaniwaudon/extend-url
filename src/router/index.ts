import { Hono } from "hono";
import { html } from "hono/html";

import { head } from "./utills";

const app = new Hono();

app.get("/", (c) =>
  c.html(
    html`<!DOCTYPE html>
      <html>
        <head>
          ${head}
        </head>
        <body>
          <h1>URL 延長サービス</h1>
          <p>逆に、時代は短縮 URL ではなく延長 URL</p>
          <form action="/extend">
            <label>
              延長したい URL を入力<br />
              <input type="text" name="url" style="width: 20em; height: 2em" />
            </label>
            <input type="submit" value="延長！" />
          </form>
        </body>
      </html>`
  )
);

export default app;
