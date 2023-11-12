export type Result<T, U> =
  | {
      status: "success";
      result: T;
    }
  | {
      status: "error";
      errorType: U;
    };

export const sha256 = async (str: string) => {
  // cf. https://qiita.com/economist/items/768d2f6a10d54d4fa39f
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};
