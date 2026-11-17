import Markdown from "react-markdown";
import { cn } from "@/lib/utils";

// A paragraph made of one italic sentence only (« *…* » on its own line): a highlighted quote.
const isQuote = (node) => {
  const children = (node?.children ?? []).filter((child) => !(child.type === "text" && !child.value.trim()));
  return children.length === 1 && children[0].tagName === "em";
};

// The story's simple formatting: paragraphs, *italic* (a highlighted sentence), **bold** and
// lists. Titles are cut out beforehand (src/lib/histoire.js); links and raw HTML are never
// rendered. `node` is react-markdown's own prop, kept off the DOM.
const COMPONENTS = {
  p: ({ node, ...props }) =>
    isQuote(node) ? (
      <p
        className="my-8 border-l-2 border-gold pl-5 font-display text-[clamp(1.2rem,2vw,1.42rem)] leading-snug text-petrol [&>em]:font-normal"
        {...props}
      />
    ) : (
      <p className="mt-5 first:mt-0" {...props} />
    ),
  em: ({ node: _node, ...props }) => <em className="font-semibold text-petrol" {...props} />,
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-petrol" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="mt-5 list-disc space-y-2 pl-6 marker:text-gold-deep" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="mt-5 list-decimal space-y-2 pl-6 marker:text-gold-deep" {...props} />,
};

export default function StoryText({ body = "", className }) {
  return (
    <div className={cn("text-[1.05rem] leading-[1.8] text-petrol/80", className)}>
      <Markdown
        components={COMPONENTS}
        allowedElements={["p", "em", "strong", "ul", "ol", "li", "br"]}
        unwrapDisallowed
      >
        {body}
      </Markdown>
    </div>
  );
}
