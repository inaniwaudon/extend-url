import { connect } from "cloudflare:sockets";
import { domainSuffixes } from "./domain";
import { Result } from "./utils";

const minnaTld = "xn--q9jyb4c" as const;

const tldList = ["jp", "com", "org", "dev", "io", minnaTld] as const;

type Tld = (typeof tldList)[number];

const googleWhoisHost = "whois.nic.google";
const commonHead = "Admin Organization:";

const whoisHostList: { [key in Tld]: string } = {
  jp: "whois.jprs.jp",
  com: "whois.verisign-grs.com",
  org: "whois.publicinterestregistry.org",
  dev: googleWhoisHost,
  io: "whois.nic.io",
  [minnaTld]: googleWhoisHost, // みんな
};

const headList: { [key in Tld]: string } = {
  jp: "g. [Organization]",
  com: commonHead,
  org: commonHead,
  dev: commonHead,
  io: commonHead,
  [minnaTld]: commonHead,
};

const supportsTld = (tld: string): tld is Tld =>
  (tldList as readonly string[]).includes(tld);

// Whois サーバに TCP で接続
const connectWhoisServer = async (host: string, whoisHost: string) => {
  const address: SocketAddress = {
    hostname: whoisHost,
    port: 43,
  };
  const socket = connect(address);

  const writer = socket.writable.getWriter();
  const encoder = new TextEncoder();
  const encoded = encoder.encode(host + "\n");
  await writer.write(encoded);

  const decoder = new TextDecoder();
  const reader = socket.readable.getReader();
  let response = "";

  while (true) {
    const result = await reader.read();
    response += decoder.decode(result.value);
    if (result.done) {
      break;
    }
  }

  socket.close();
  return response;
};

// Whois 情報をパース
const parseWhois = (
  response: string,
  tld: Tld
):
  | { organization: string | null }
  | {
      registrarWhois: string;
    } => {
  const lines = response.split("\n");
  const head = headList[tld];
  const orgLine = lines.find((line) => line.startsWith(head));

  if (orgLine) {
    return { organization: orgLine.replace(head, "").trim() };
  } else {
    // Registrar Whois が設定されていた場合は、その値を返す
    const registrarWhois = response.match(
      /Registrar WHOIS Server: +([a-zA-Z.]+)/
    );
    if (registrarWhois) {
      return {
        registrarWhois: registrarWhois[1],
      };
    }
    return { organization: null };
  }
};

export const whois = async (
  host: string,
  whoisHost?: string
): Promise<
  Result<{ organization: string | null }, "unsupportedTld" | "internal">
> => {
  // TLD を抽出
  const tld = host.split(".").at(-1);
  if (!tld || !supportsTld(tld)) {
    return {
      status: "error",
      errorType: "unsupportedTld",
    };
  }
  // 問い合わせる Whois サーバを取得
  if (!whoisHost) {
    whoisHost = whoisHostList[tld];
  }

  try {
    const response = await connectWhoisServer(host, whoisHost);
    const parsed = parseWhois(response, tld);

    // registrarWhois が指定された場合は再帰的に問い合わせ
    if ("registrarWhois" in parsed) {
      return whois(host, parsed.registrarWhois);
    }
    // 成功
    else {
      return {
        status: "success",
        result: parsed,
      };
    }
  } catch (e: any) {
    console.log(e);
    return {
      status: "error",
      errorType: "internal",
    };
  }
};

export const getDomain = (hostname: string) => {
  // www.tsukuba.ac.jp -> tsukuba.ac.jp
  // www.yokohama.dev -> yokohama.dev
  let end = hostname.lastIndexOf(".");
  let suffixLength = 0;

  for (const suffix of domainSuffixes) {
    if (suffix.length > suffixLength && hostname.endsWith(suffix)) {
      end = hostname.lastIndexOf(".", hostname.length - suffix.length - 1);
      suffixLength = suffix.length;
    }
  }

  const dotStart = hostname.lastIndexOf(".", end - 1);
  const start = dotStart === -1 ? 0 : dotStart + 1;
  return hostname.substring(start);
};
