import { site } from "@/lib/config";

/**
 * The owner's intro line with its links, for placing inside a paragraph.
 * A parenthetical never breaks across lines.
 */
export function OwnerIntro() {
  return site.owner.intro.map((part, i) =>
    typeof part === "string" ? (
      part.split(/(\([^)]*\))/).map((text, j) =>
        text.startsWith("(") ? (
          <span key={`${i}-${j}`} className="whitespace-nowrap">
            {text}
          </span>
        ) : (
          text
        )
      )
    ) : (
      <a
        key={i}
        href={part.href}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-accent underline-offset-2 hover:underline"
      >
        {part.text}
      </a>
    )
  );
}
