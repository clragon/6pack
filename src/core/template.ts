export interface TokenSpec {
  token: string;
  resolve: () => string | null;
}

function quote(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function expandTokens(
  text: string,
  tokens: readonly TokenSpec[],
): string {
  if (tokens.length === 0) return text;
  const names = tokens.map((spec) => quote(spec.token)).join('|');
  return text.replace(
    new RegExp(`%(${names})%`, 'g'),
    (whole: string, name: string) =>
      tokens.find((spec) => spec.token === name)?.resolve() ?? whole,
  );
}
