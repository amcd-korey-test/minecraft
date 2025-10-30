import { serve } from "bun";
import index from './src/index.html';

const outdir = "dist";

const server = serve({
  port: Number(process.env.PORT || 7777),

  routes: {
    "/": index,
  }
  // async fetch(req) {
  //   const url = new URL(req.url);
  //   if (url.pathname === "/" || url.pathname === "/index.html") {
  //     const build = await Bun.build({
  //       entrypoints: ["./src/main.ts"],
  //       outdir,
  //       target: "browser",
  //       format: "esm",
  //       sourcemap: "inline",
  //       minify: false,
  //       splitting: false,
  //     });

  //     if (!build.success) {
  //       return new Response("Build failed", { status: 500 });
  //     }

  //     return new Response(Bun.file("index.html"), {
  //       headers: { "Content-Type": "text/html; charset=utf-8" },
  //     });
  //   }

  //   if (url.pathname.startsWith("/dist/")) {
  //     const file = Bun.file(`.${url.pathname}`);
  //     if (!(await file.exists())) return new Response("Not found", { status: 404 });
  //     return new Response(file);
  //   }

  //   return new Response("Not found", { status: 404 });
  // },
});

console.log(`Dev server running at ${server.url}`);
