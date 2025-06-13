export async function getSha(): Promise<string | null> {
  if (typeof window === "undefined" && process?.platform === "win32") return null;

  const fn = async () => (await Bun.$`git rev-parse HEAD`.text()).trim();

  if (import.meta.hot) {
    return (import.meta.hot.data.sha ??= await fn());
  }
  return await fn().catch(() => null);
}
