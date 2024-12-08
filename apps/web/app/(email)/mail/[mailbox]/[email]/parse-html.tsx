import "server-only";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const DOMPurify = createDOMPurify((globalThis as any).window || new JSDOM("").window);

function isElement(node: Node): node is Element {
    return node.nodeType === node.ELEMENT_NODE;
}

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!isElement(node)) return;

    // set all elements owning target to target=_blank
    if ("target" in node) {
        node.setAttribute("target", "_blank");
        // prevent https://www.owasp.org/index.php/Reverse_Tabnabbing
        node.setAttribute("rel", "noopener noreferrer");
    }
    // set non-HTML/MathML links to xlink:show=new
    if (!node.hasAttribute("target") && (node.hasAttribute("xlink:href") || node.hasAttribute("href"))) {
        node.setAttribute("xlink:show", "new");
    }
});

export async function parseHTML(content: string, moreTrusted = false) {
    const clean = DOMPurify.sanitize(content, {
        WHOLE_DOCUMENT: moreTrusted,
        ALLOWED_TAGS: [
            "a",
            "b",
            "br",
            "big",
            "blockquote",
            "caption",
            "code",
            "del",
            "div",
            "dt",
            "dd",
            "font",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "hr",
            "i",
            "img",
            "ins",
            "li",
            "map",
            "ol",
            "p",
            "pre",
            "s",
            "small",
            "strong",
            "span",
            "sub",
            "table",
            "tbody",
            "td",
            "tfoot",
            "th",
            "thead",
            "tr",
            "u",
            "ul",
            "center",
            "em",
            ...(moreTrusted ? ["style", "body", "head"] : []),
        ],
        ALLOWED_ATTR: [
            ...(moreTrusted ? ["style", "class"] : []),
            "href",
            "align",
            "valign",
            "role",
            "cellspacing",
            "cellpadding",
            "colspan",
            "rowspan",
            "height",
            "width",
            "bgcolor",
            "border",
            "src",
            // 'alt',
            "constrain",
            "type",
            "title",
            "hidden",
        ],
    });

    return clean;
}

export default async function ParseHTML({ body, className }: { body: string; className?: string }) {
    const clean = await parseHTML(body);

    // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
    return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
