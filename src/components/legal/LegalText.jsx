import { Link } from "@tanstack/react-router";
import Markdown from "react-markdown";
import { PLACEHOLDER } from "@/lib/legal";
import { cn } from "@/lib/utils";

// Links allowed in a legal text: web pages, e-mail, phone, and the site's own pages.
const safeUrl = (url = "") => (/^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(url) ? url : "");

// The text's simple formatting (## title, - list, **bold**, [link](/page)) as the site's styles.
// No raw HTML is ever rendered. `node` is react-markdown's own prop, kept off the DOM.
const COMPONENTS = {
  h1: ({ node: _node, ...props }) => <h2 className="mt-12 font-display text-[1.45rem] font-bold leading-snug text-petrol first:mt-0" {...props} />,
  h2: ({ node: _node, ...props }) => <h2 className="mt-12 font-display text-[1.45rem] font-bold leading-snug text-petrol first:mt-0" {...props} />,
  h3: ({ node: _node, ...props }) => <h3 className="mt-8 font-display text-[1.12rem] font-bold leading-snug text-petrol" {...props} />,
  h4: ({ node: _node, ...props }) => <h3 className="mt-8 font-display text-[1.12rem] font-bold leading-snug text-petrol" {...props} />,
  p: ({ node: _node, ...props }) => <p className="mt-4 first:mt-0" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-gold-deep [&_ul]:mt-2" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="mt-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-gold-deep" {...props} />,
  li: ({ node: _node, ...props }) => <li className="pl-1 [&>p]:mt-0" {...props} />,
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-petrol" {...props} />,
  blockquote: ({ node: _node, ...props }) => <blockquote className="mt-4 border-l-2 border-gold pl-4 text-petrol/70" {...props} />,
  // Inline code only comes from a [[passage to fill in]] (drafts, in the administration preview).
  code: ({ node: _node, ...props }) => (
    <mark className="rounded-sm bg-gold/30 px-1 py-0.5 font-body text-[0.95em] text-petrol ring-1 ring-gold/70" {...props} />
  ),
  a: ({ node: _node, href = "", children }) => {
    const className = "text-gold-deep underline decoration-gold/60 underline-offset-4 transition-colors hover:text-petrol";
    if (href.startsWith("/")) {
      return (
        <Link to={href} className={className}>
          {children}
        </Link>
      );
    }
    const external = /^https?:/i.test(href);
    return (
      <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  },
};

// `draft`: the administration preview, where every [[passage to fill in]] is highlighted.
export default function LegalText({ body = "", draft = false, className }) {
  const source = draft
    ? body.replace(PLACEHOLDER, (_, text) => `\`${text.replace(/`/g, "'").trim()}\``)
    : body;

  return (
    <div className={cn("text-[1rem] leading-relaxed text-petrol/80", className)}>
      <Markdown
        components={COMPONENTS}
        urlTransform={safeUrl}
        disallowedElements={["img", "pre", "hr", "table"]}
        unwrapDisallowed
      >
        {source.trim()}
      </Markdown>
    </div>
  );
}
