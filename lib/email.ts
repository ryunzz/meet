/**
 * A canonical form of an email address for per-guest limits, so trivial
 * variations ("+tags", Gmail dots, casing) count as the same person.
 */
export function guestKey(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split("@");
  let user = local.split("+")[0];
  const host = domain === "googlemail.com" ? "gmail.com" : domain;
  if (host === "gmail.com") user = user.replaceAll(".", "");
  return `${user}@${host}`;
}
