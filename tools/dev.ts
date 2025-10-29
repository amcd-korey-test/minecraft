const outdir = "dist";

const build = await Bun.build({
  entrypoints: ["./src/main.ts"],
  outdir,
  target: "browser",
  format: "esm",
  sourcemap: "inline",
  minify: false,
  splitting: false,
  watch: true,
});

if (!build.success) {
  console.error("Initial build failed");
  for (const log of build.logs) console.error(log);
  process.exit(1);
}

console.log("Watching files and bundling with Bun...");

const port = Number(process.env.PORT || 5173);
const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("index.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname.startsWith("/dist/")) {
      const file = Bun.file(`.${url.pathname}`);
      if (!(await file.exists())) return new Response("Not found", { status: 404 });
      return new Response(file);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Dev server running at http://localhost:${server.port}`);
