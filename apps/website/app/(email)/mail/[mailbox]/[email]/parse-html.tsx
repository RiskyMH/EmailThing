
import { sanitize, addHook } from "isomorphic-dompurify";

export async function parseHTML(content: string, moreTrusted = false) {
    addHook('afterSanitizeAttributes', function (node) {
        // set all elements owning target to target=_blank
        if ('target' in node) {
            node.setAttribute('target', '_blank');
            // prevent https://www.owasp.org/index.php/Reverse_Tabnabbing
            node.setAttribute('rel', 'noopener noreferrer');
        }
        // set non-HTML/MathML links to xlink:show=new
        if (!node.hasAttribute('target')
            && (node.hasAttribute('xlink:href')
                || node.hasAttribute('href'))) {
            node.setAttribute('xlink:show', 'new');
        }
    })

    let clean = sanitize(content, {
        WHOLE_DOCUMENT: moreTrusted,
        ALLOWED_TAGS: [
            'a',
            'b',
            'br',
            'big',
            'blockquote',
            'caption',
            'code',
            'del',
            'div',
            'dt',
            'dd',
            'font',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'hr',
            'i',
            'img',
            'ins',
            'li',
            'map',
            'ol',
            'p',
            'pre',
            's',
            'small',
            'strong',
            'span',
            'sub',
            'table',
            'tbody',
            'td',
            'tfoot',
            'th',
            'thead',
            'tr',
            'u',
            'ul',
            'center',
            ...(moreTrusted ? ["style", 'body', 'head'] : []),
        ],
        ALLOWED_ATTR: [
            ...(moreTrusted ? ['style', 'href', 'class'] : []),
            'align',
            'valign',
            'role',
            'cellspacing',
            'cellpadding',
            'colspan',
            'rowspan',
            'height',
            'width',
            'bgcolor',
            'border',
            'src',
            // 'alt',
            'constrain',
            'type',
            'title'
        ],

    });

    return clean
}

export default async function ParseHTML({ body, className }: { body: string, className?: string }) {

    const clean = await parseHTML(body)

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    )

}