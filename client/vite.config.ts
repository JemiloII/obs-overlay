import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const defaultClientPort = 4242;

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, "../", "");
  const rawPort = environment.CLIENT_PORT ?? environment.VITE_CLIENT_PORT;
  const parsedPort = rawPort ? Number.parseInt(rawPort, 10) : defaultClientPort;
  const clientPort =
    Number.isFinite(parsedPort) && parsedPort > 0
      ? parsedPort
      : defaultClientPort;

  return {
    plugins: [react()],
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
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
