import { test, expect } from "bun:test";
import { markdownHighlight } from "./markdown-highlight";

test("markdown ansi highligher", () => {
  const demo = `# Header 1

**Bold text** and *italic text* and ~~strikethrough~~.

A [link](https://example.com) and an autolink: https://example.com

> A blockquote
 lol

\`Inline code\`

\`\`\`ts
Code block
with multiple lines
\`\`\`

1. hi
2. hello
   HIII

lol

* abc

hi
---
hi

![Image](https://example.com/image.png)

## hi **hi** WOO ~~no~~
`

  const md = markdownHighlight(demo);
  expect(md).toMatchInlineSnapshot(`
    "\x1B[1m# Header 1\x1B[0m

    \x1B[1mBold text\x1B[0m and \x1B[3mitalic text\x1B[0m and \x1B[9mstrikethrough\x1B[0m.

    A \x1B[34m\x1B]8;;https://example.com\x1B\\link\x1B]8;;\x1B\\\x1B[0m and an autolink: \x1B[34m\x1B]8;;https://example.com\x1B\\https://example.com\x1B]8;;\x1B\\\x1B[0m

    \x1B[34m> A blockquote\x1B[0m
    \x1B[34m> lol\x1B[0m

    \x1B[2m\`\x1B[0m\x1B[36mInline code\x1B[0m\x1B[2m\`\x1B[0m

    \x1B[2m\`\`\`ts
    \x1B[0m\x1B[36mCode block
    \x1B[36mwith multiple lines
    \x1B[36m\x1B[0m\x1B[2m\`\`\`

    \x1B[0m\x1B[2m1.\x1B[0m hi
    \x1B[2m2.\x1B[0m hello
       HIII

    lol

    \x1B[2m•\x1B[0m abc

    \x1B[1m## hi\x1B[0m

    hi

    \x1B[34m\x1B]8;;https://example.com/image.png\x1B\\Image \x1B[2m(image)\x1B]8;;\x1B\\\x1B[0m

    \x1B[1m## hi \x1B[1mhi\x1B[0m\x1B[1m WOO \x1B[9mno\x1B[0m\x1B[1m\x1B[0m

    "
  `);
});