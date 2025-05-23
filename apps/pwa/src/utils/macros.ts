const defaultSvgl = {
  "emailthing.app": "https://pwa.emailthing.app/icon.svg",
  "gmail.com": null,
  "googlemail.com": null,
  "outlook.com": null,
  "yahoo.com": null,
  "icloud.com": null,
  "zoho.com": null,
  "hotmail.com": null,
  "live.com": null,
  "msn.com": null,
  "protonmail.com": null,
  "mail.com": null,
  "emailthing.xyz": null,
};

export async function getSvgl(): Promise<Record<string, string | null>> {
  if (typeof window === "undefined" && process?.platform === "win32") return defaultSvgl;

  const fn = async () => {
    try {
      const res = await (await fetch("https://api.svgl.app/")).json();
      const svgl = res.filter(
        (svgl: any) => svgl.url.match(/^https?:\/\/[^\/]+\/?$/) && svgl.route,
      );
      const mapping = svgl.reduce((acc: any, svgl: any) => {
        const url = svgl.url.replace("https://", "").replace("/", "").replace("www.", "");
        acc[url] =
          typeof svgl.route === "string" ? svgl.route : (svgl.route.dark ?? svgl.route.light);
        // acc[url] = svgl.route
        if (acc[url].startsWith("https://svgl.app/library/")) {
          acc[url] = `:${acc[url].slice("https://svgl.app/library/".length, -".svg".length)}`;
        }
        return acc;
      }, {});
      return { ...mapping, ...defaultSvgl };
    } catch (e) {
      console.error(e);
      return defaultSvgl;
    }
  };

  if (import.meta.hot) {
    return (import.meta.hot.data.svgl ??= await fn());
  }
  return await fn();
}
