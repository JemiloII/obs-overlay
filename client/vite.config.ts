import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const defaultClientPort = 4242;

// Maps file extensions to Content-Type values for the dev-time
// external-assets middleware.
const externalAssetsMimeTypes: Record<string, string> = {
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function pickMimeType(filePath: string): string {
  return (
    externalAssetsMimeTypes[extname(filePath).toLowerCase()] ??
    "application/octet-stream"
  );
}

/**
 * Serves files from the repo-root `external-assets/` directory at
 * `/external-assets/<sub-path>` during `vite dev`. The folder lives outside
 * the client package on purpose — end users drop their purchased pack folder
 * into it and the contents are gitignored (`.gitkeep` keeps the directory
 * itself in version control so the path always exists after cloning).
 *
 * The middleware is dev-only. For production builds you would either bundle
 * the assets into your deploy artifact or have the Hono server serve them.
 */
function externalAssetsServer(externalAssetsAbsolutePath: string): Plugin {
  return {
    name: "twitch-overlay:serve-external-assets",
    configureServer(viteDevServer) {
      viteDevServer.middlewares.use(
        "/external-assets",
        async (incomingRequest, serverResponse, callNextMiddleware) => {
          const requestUrl = incomingRequest.url ?? "/";
          if (incomingRequest.method !== "GET" && incomingRequest.method !== "HEAD") {
            callNextMiddleware();
            return;
          }
          let decodedSubPath: string;
          try {
            const parsedUrl = new URL(requestUrl, "http://placeholder");
            decodedSubPath = decodeURIComponent(parsedUrl.pathname);
          } catch {
            serverResponse.statusCode = 400;
            serverResponse.end("Invalid path");
            return;
          }
          // Strip the leading slash so join() doesn't treat it as absolute.
          const relativeSubPath = decodedSubPath.replace(/^\/+/, "");
          const candidatePath = resolve(
            join(externalAssetsAbsolutePath, relativeSubPath),
          );
          // Path-traversal guard: candidate must stay inside the root.
          const isInsideRoot =
            candidatePath === externalAssetsAbsolutePath ||
            candidatePath.startsWith(externalAssetsAbsolutePath + sep);
          if (!isInsideRoot) {
            serverResponse.statusCode = 403;
            serverResponse.end("Forbidden");
            return;
          }
          try {
            const fileStats = await stat(candidatePath);
            if (!fileStats.isFile()) {
              callNextMiddleware();
              return;
            }
            serverResponse.setHeader(
              "Content-Type",
              pickMimeType(candidatePath),
            );
            serverResponse.setHeader("Content-Length", fileStats.size);
            serverResponse.setHeader("Cache-Control", "public, max-age=3600");
            if (incomingRequest.method === "HEAD") {
              serverResponse.end();
              return;
            }
            createReadStream(candidatePath).pipe(serverResponse);
          } catch {
            callNextMiddleware();
          }
        },
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, "../", "");
  const rawPort = environment.CLIENT_PORT ?? environment.VITE_CLIENT_PORT;
  const parsedPort = rawPort ? Number.parseInt(rawPort, 10) : defaultClientPort;
  const clientPort =
    Number.isFinite(parsedPort) && parsedPort > 0
      ? parsedPort
      : defaultClientPort;

  const externalAssetsAbsolutePath = resolve(__dirname, "..", "external-assets");

  return {
    plugins: [react(), externalAssetsServer(externalAssetsAbsolutePath)],
    envDir: "../",
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
    server: {
      port: clientPort,
      strictPort: true,
      fs: {
        // Allow serving from the repo root (above the client package) so the
        // external-assets middleware can read files outside Vite's root.
        allow: [resolve(__dirname, "..")],
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
