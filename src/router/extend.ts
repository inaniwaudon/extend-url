import { Hono } from "hono";
import { html } from "hono/html";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { APP_URL, footer, getError, head } from "./utills";
import { getPageTitle } from "../page";
import { getDomain, whois } from "../whois";

const app = new Hono();

const extendSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  organization: z.string().optional(),
});

app.get(
  "/extend",
  zValidator("query", extendSchema, (value, c) => {
    if (!value.success) {
      return c.text("Bad request", 400);
    }
  }),
  async (c) => {
    const {
      url: queryUrl,
      title: queryTitle,
      organization: queryOrganization,
    } = c.req.valid("query");

    let url: URL;
    try {
      url = new URL(queryUrl);
    } catch {
      return c.html(
        getError(
          "不正な URL です. URL は http:// または https:// から始めてください"
        ),
        400
      );
    }

    // ページタイトルを取得
    const pageTitleResult = await getPageTitle(url);
    if (pageTitleResult.status === "error") {
      if (pageTitleResult.errorType === "notfound") {
        return c.html(getError("URL が存在しません（404）"), 404);
      }
      if (pageTitleResult.errorType === "network") {
        return c.html(getError("ネットワークエラーです"), 500);
      }
      return c.html(getError("内部エラーです. ドメインは正しいですか？"), 500);
    }
    const pageTitle = pageTitleResult.result ?? "名称未設定";

    // ドメインの所有者を取得
    const domain = getDomain(url.hostname);
    const whoisResult = await whois(domain);
    if (whoisResult.status === "error") {
      if (whoisResult.errorType === "unsupportedTld") {
        return c.html(getError("サポートしていない TLD です"), 400);
      }
      return c.html(getError("内部エラーです"), 500);
    }

    const organization = whoisResult.result.organization ?? "不明";

    const extendedUrl = `${APP_URL}/extend?url=${url}&title=${encodeURIComponent(
      pageTitle
    )}&organization=${encodeURIComponent(organization)}`;

    // クエリのタイトルまたは所有者が欠如していた場合はリダイレクト
    if (!queryTitle || !queryOrganization) {
      return c.redirect(extendedUrl);
    }

    // 不正なパラメータが指定された場合は、改竄されている旨を表示
    if (queryTitle !== pageTitle || queryOrganization !== organization) {
      return c.html(getError("改竄された URL です"));
    }

    return c.html(
      html`<!DOCTYPE html>
        <html>
          <head>
            ${head}
          </head>
          <body>
            <h1>URL 延長サービス</h1>
            <p>
              ${url} が延長されています –
              <a href="${url}">このサイトに遷移する</a>
            </p>
            延長された URL<br />
            <input
              type="${url}"
              readonly
              value=${extendedUrl}
              style="width: 20em; height: 2em"
            />

            <h2>各種情報</h2>
            <dl>
              <dt>ページタイトル</dt>
              <dd>${pageTitle}</dd>
              <dt>${domain} の所有者</dt>
              <dd>${organization}</dd>
            </dl>

            ${footer}
          </body>
        </html>`
    );
  }
);

export default app;
