const LINK_PATTERN =
  /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+|00|0)(?:[\s().-]*\d){9,14})/gi;

function trimUrlPunctuation(value: string) {
  return value.replace(/[.,!?;:]+$/, "").replace(/[)]+$/, "");
}

/** Turns plain-text contact details and URLs into safe, actionable links. */
export function LinkifiedText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));

    const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
    const isPhone = /^(?:\+|00|0)/.test(value) && !isEmail;
    if (isEmail) {
      nodes.push(
        <a key={index} href={`mailto:${value}`} className="text-primary underline underline-offset-4">
          {value}
        </a>,
      );
    } else if (isPhone) {
      const number = value.replace(/[^+\d]/g, "").replace(/^00/, "+");
      nodes.push(
        <a key={index} href={`tel:${number}`} className="text-primary underline underline-offset-4">
          {value}
        </a>,
      );
    } else {
      const url = trimUrlPunctuation(value);
      const href = url.startsWith("www.") ? `https://${url}` : url;
      nodes.push(
        <React.Fragment key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4"
          >
            {url}
          </a>
          {value.slice(url.length)}
        </React.Fragment>,
      );
    }
    cursor = index + value.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}
