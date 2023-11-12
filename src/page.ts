import { Result } from "./utils";

const unescapeHTML = (str: string) =>
  str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#13;/g, "\r")
    .replace(/&#10;/g, "\n")
    .replace(/&x27;/g, "\\")
    .replace(/&x60;/g, "`");

export const getPageTitle = async (
  url: URL
): Promise<Result<string | null, "notfound" | "network" | "internal">> => {
  try {
    const response = await fetch(url);

    // 404 Not found
    if (response.status === 404) {
      return {
        status: "error",
        errorType: "notfound",
      };
    }
    // ネットワークエラー
    if (!response.ok) {
      return {
        status: "error",
        errorType: "network",
      };
    }

    const responseText = await response.text();
    const result = responseText.match(/<title>(.+?)<\/title>/);
    return {
      status: "success",
      result: result ? unescapeHTML(result[1]) : null,
    };
  } catch (e: any) {
    console.log(e);
    return {
      status: "error",
      errorType: "internal",
    };
  }
};
