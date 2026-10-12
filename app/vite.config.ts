import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL?.trim();

  let apiOrigin = "";
  if (apiUrl) {
    try {
      apiOrigin = new URL(apiUrl).origin;
    } catch {
      // Ignore if not a valid absolute URL
    }
  }

  // connect-src: 'self' + origin from VITE_API_URL + ws://localhost:* in dev only
  const isDev = command === "serve";
  const connectSources = ["'self'"];
  if (isDev) {
    connectSources.push("ws://localhost:*");
  }
  if (apiOrigin) {
    connectSources.push(apiOrigin);
  }

  // style-src: remove 'unsafe-inline' in production build where CSS is an external bundle
  // in dev, Vite HMR injects inline <style> tags so 'unsafe-inline' is allowed only during dev
  const styleSrc = isDev ? "'self' 'unsafe-inline'" : "'self'";

  const cspContent = [
    "default-src 'self'",
    "script-src 'self'",
    `style-src ${styleSrc}`,
    `connect-src ${connectSources.join(" ")}`,
    "img-src 'self' data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    plugins: [
      react(),
      {
        name: "csp-injector",
        transformIndexHtml(html) {
          return html.replace(
            /<meta http-equiv="Content-Security-Policy"[^>]*\/?>/i,
            `<meta http-equiv="Content-Security-Policy" content="${cspContent}" />`
          );
        },
      },
    ],
    server: {
      port: 5173,
      strictPort: false,
    },
  };
});
