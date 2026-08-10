// A token writable as %token% in a url or a message body, resolved where it is
// expanded. A null result leaves the token verbatim, so a value that cannot be
// read yet (no one signed in, a field not on the page) shows as itself.
export interface TokenSpec {
  token: string;
  resolve: () => string | null;
}

function quote(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Expand the given tokens, leaving any other %word% verbatim. The pattern is
// built from the token names because a percent-encoded byte opens like a token:
// `%(\w+)%` over `user%3A%username%` matches `%3A%` and strands the name.
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
