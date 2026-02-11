import { AnsiCode, AnsiFg, colors } from "@/utils/colors";

export function markdownHighlight(text: string): string {
  const dimWrapper = (text: string) => colors.dim + text + colors.reset;
  const linkAnsi = (text: string, href: string) => `\x1b]8;;${href}\x1b\\${text}\x1b]8;;\x1b\\`;
  const bodyMarkdowned = Bun.markdown.render(text, {
    heading: (children, { level }) => `${AnsiCode.BRIGHT}${"#".repeat(level)} ${children.replaceAll(AnsiCode.RESET, AnsiCode.RESET + AnsiCode.BRIGHT)}${AnsiCode.RESET}\n\n`,
    paragraph: children => children + "\n\n",
    strong: children => `${AnsiCode.BRIGHT}${children}${AnsiCode.RESET}`,
    emphasis: children => `${AnsiCode.ITALIC}${children}${AnsiCode.RESET}`,
    strikethrough: children => `${AnsiCode.STRIKETHROUGH}${children}${AnsiCode.RESET}`,
    link: (children, { href, title }) =>
      `${AnsiFg.BLUE}${""}${linkAnsi(children || "", href)}${AnsiCode.RESET}`,
    blockquote: (children) => {
      const content = children.trimEnd().split("\n").map(line => colors.fg.blue + "> " + line.replaceAll(AnsiCode.RESET, AnsiCode.RESET + colors.fg.blue) + colors.reset).join("\n");
      return content + "\n\n";
    },
    code: (children, meta) => dimWrapper("```" + (meta?.language || "") + "\n") + children.split("\n").map(line => colors.fg.cyan + line.replaceAll(AnsiCode.RESET, AnsiCode.RESET + colors.fg.cyan)).join("\n") + colors.reset + dimWrapper("```\n\n"),
    codespan: (children) => dimWrapper("`") + colors.fg.cyan + children + colors.reset + dimWrapper("`"),
    hr: () => dimWrapper("---\n\n"),
    image: (children, { src, title }) => `${AnsiFg.BLUE}${linkAnsi((children || src) + ` ${colors.dim}(image)`, src)}${colors.reset}`,
    list: (children, { ordered, start }) => (children).split("\n").slice(0, -1).map((line, idx) => {
      if (line.startsWith("- ")) {
        const bullet = ordered ? `${start! + idx}.` : "•";
        return `${colors.dim}${bullet}${colors.reset} ${line.slice('- '.length)}`;
      } else {
        return (ordered ? "   " : "  ") + line;
      }
    }).join("\n") + "\n\n",
    listItem: (children, meta) => {
      const bullet = meta?.checked === true ? "[x]" : meta?.checked === false ? "[ ]" : "-";
      return `${bullet} ${children}\n`;
    },
    text: (children) => children,
    html: (children) => colors.dim + children + colors.reset,
  }, {
    autolinks: true,
    hardSoftBreaks: true,
    // collapseWhitespace: false,
    tables: false, // im too lazy
  });
  return bodyMarkdowned;
}



