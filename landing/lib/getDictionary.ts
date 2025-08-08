import "server-only";

const dictionaries: Record<string, () => Promise<Record<string, any>>> = {
  "en-US": () => import("../messages/en-US.json").then(m => m.default),
  "en-UK": () => import("../messages/en-UK.json").then(m => m.default),
  ja: () => import("../messages/ja.json").then(m => m.default),
  zh: () => import("../messages/zh.json").then(m => m.default),
  es: () => import("../messages/es.json").then(m => m.default),
  ar: () => import("../messages/ar.json").then(m => m.default)
};

export async function getDictionary(locale: string) {
  const load = dictionaries[locale] || dictionaries["en-US"];
  return load();
}
