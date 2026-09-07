/** A blank or whitespace-only secret cannot make the Tavily fallback usable. */
export function kinfolkTavilyApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const apiKey = env.TAVILY_API_KEY?.trim();
  return apiKey || null;
}
