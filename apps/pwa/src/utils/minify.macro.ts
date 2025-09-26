export function minify(strings: TemplateStringsArray, ...values: any[]): Promise<string> | string;
export function minify(strings: string): Promise<string> | string;
export function minify(strings: TemplateStringsArray | string, ...values: any[]): Promise<string> | string {

    const code = typeof strings === "string"
        ? strings
        : strings.reduce((acc, str, i) => {
            return acc + str + (values[i] || '');
        }, '');

    if ((typeof window === "undefined" && process.platform === "win32") || typeof window !== "undefined" || typeof Bun === "undefined") {
        return code.replaceAll(/(\s{2,}|\n+)/gm, "");
    }

    const transpiler = new Bun.Transpiler({
        minify: true,
        target: "browser",
        language: "ts",
    });

    return transpiler.transform(code);
}