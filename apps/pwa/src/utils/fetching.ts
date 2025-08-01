import { gravatar } from "@/utils/tools";
import swr from "swr";
import { getSvgl } from "./macros" with { type: "macro" };

export const useGravatar = (email: string) => {
  const { data } = swr(`/api/gravatar?email=${email}&`, () => gravatar(email), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    // revalidateOnMount: false,
  });

  return data;
};

export const useGravatars = (emails: string[]) => {
  const { data } = swr(
    `/api/gravatars?emails=${emails.join(",")}`,
    () => Promise.all(emails.map(gravatar)),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      // revalidateOnMount: false,
    },
  );

  return data;
};

const svgl = await getSvgl();

const imgExists = async (url: string) => {
  try {
    const img = new Image();
    // svgl doesn't like crossOrigin=anonymous
    // img.crossOrigin = "anonymous"
    img.src = url;
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
};

// these could have gravatar, but brand icon would look better (or don't want to whitelist whole domain)
const forceIndividual = {
  "support@npmjs.com": "https://svgl.app/library/npm.svg",
  "postmaster@outlook.com": "https://svgl.app/library/outlook.svg",
  "mailer-daemon@googlemail.com": "https://svgl.app/library/gmail.svg",
  "mailer@emailthing.xyz": "/icon.svg",
  "system@emailthing.app": "/icon.svg",
} as Record<string, string>;

export const useEmailImage = (email: string) => {
  const domain = email.split("@")[1];
  let match = svgl[domain] as string | null | undefined;
  if (!match) {
    // maybe try to match if ending with (like abc.emailthing.xyz should match emailthing.xyz)
    const m = Object.keys(svgl).find((k) => domain.endsWith(`.${k}`));
    if (m) match = svgl[m];
  }
  if (match?.startsWith(":")) {
    match = `https://svgl.app/library/${match.slice(1)}.svg`;
  }

  const { data } = swr(
    `/api/email-image?email=${email}`,
    async () => {
      if (forceIndividual[email]) {
        if (await imgExists(forceIndividual[email])) return forceIndividual[email];
      }

      const g = await gravatar(email);
      if (await imgExists(g)) return g;

      if (match && (await imgExists(match))) return match;

      // just be gravatar if all else fails
      return g;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      // revalidateOnMount: false,
    },
  );

  // assume it's company logo as fallback, and then for rare time with gravatar use it
  return data || ((match || forceIndividual[email] || undefined) as string | undefined);
};
