import { createReadStream } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { join } from "node:path";

// Local technical evaluation only. Compiler assets are excluded from dist.
export function javaEvaluationPlugin(root, mode) {
  return {
    name: "java-local-evaluation",
    async generateBundle() {
      if (mode !== "cheerpj") return;
      // A static, loopback-only test build to verify the Pages subdirectory layout.
      for (const filename of ["tools.jar", "LICENSE", "ASSEMBLY_EXCEPTION", "THIRD_PARTY_README", "src.zip"]) {
        this.emitFile({ type: "asset", fileName: `__java/${filename}`,
          source: await readFile(join(root, ".local/java-runtime", filename)) });
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split("?")[0] !== "/__java/tools.jar") return next();
        const host = req.headers.host || "";
        if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) ||
            !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress) ||
            !["GET", "HEAD"].includes(req.method)) {
          res.statusCode = 403;
          return res.end();
        }
        try {
          const path = join(root, ".local/java-runtime/tools.jar");
          const info = await stat(path);
          res.setHeader("Content-Type", "application/java-archive");
          res.setHeader("Content-Length", info.size);
          res.setHeader("Cache-Control", "private, max-age=86400");
          if (req.method === "HEAD") return res.end();
          const stream = createReadStream(path);
          stream.on("error", () => res.destroy());
          stream.pipe(res);
        } catch {
          res.statusCode = 404;
          res.end("Run npm run setup:java first.");
        }
      });
    },
  };
}
