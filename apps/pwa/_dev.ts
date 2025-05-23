// patch next imports
const nextPatchdata = `
      "next/link": [
        "../pwa/src/components/next-link.tsx"
      ],
      "next/navigation": [
        "../pwa/src/components/next-pathname.tsx"
      ],
      "next/form": [
        "../pwa/src/components/next-form.tsx"
      ],
      "@/(home)/components.client": [
       "../pwa/src/home/layout.tsx"
      ],
      "@/components/user-navbar": [
        "../pwa/src/components/user-navbar"
      ],
      "@/*": [
        "../pwa/src/*",
        "./app/*"
      ],
`;

const nextUnpatchdata = `"@/*": ["./app/*"],`;

const tsconfig = Bun.file("../web/tsconfig.json");
const fileText = await tsconfig.text();

if (process.argv[2] === "patch")
  await tsconfig.write(fileText.replace(nextUnpatchdata, nextPatchdata));
else if (process.argv[2] === "revert")
  await tsconfig.write(fileText.replace(nextPatchdata, nextUnpatchdata));
else throw "??";

export {};
