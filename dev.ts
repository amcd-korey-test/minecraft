import { serve } from "bun";
import { build } from "bun";

const outdir = "dist";

await build({
  entrypoints: ["./src/main.ts", "./src/worldGenerator.worker.ts"],
  outdir,
  target: "browser",
  format: "esm",
  sourcemap: "inline",
  minify: false,
  splitting: true,
});

const server = serve({
  port: Number(process.env.PORT || 7777),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("src/index.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const filePath = `${outdir}${url.pathname.replace("/src", "").replace(".ts", ".js")}`;
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file, {
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
