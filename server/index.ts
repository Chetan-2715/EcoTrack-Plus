import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
// Increase body size limits to handle base64 image payloads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const basePort = parseInt(process.env.PORT || '5000', 10);
  const maxAttempts = 10;

  async function listenWithRetry(): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidatePort = basePort + attempt;
      const listenOptions: any = {
        port: candidatePort,
        host: "0.0.0.0",
      };
      if (process.platform !== "win32") {
        listenOptions.reusePort = true;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const onError = (err: any) => {
            server.off("listening", onListening);
            reject(err);
          };
          const onListening = () => {
            server.off("error", onError);
            resolve();
          };
          server.once("error", onError);
          server.once("listening", onListening);
          server.listen(listenOptions);
        });

        log(`serving on http://localhost:${candidatePort}`);
        return;
      } catch (err: any) {
        if (err && err.code === "EADDRINUSE") {
          log(`port ${candidatePort} in use, trying ${candidatePort + 1}`);
          continue;
        }
        throw err;
      }
    }

    throw new Error(
      `Could not bind to a port starting at ${basePort} after ${maxAttempts} attempts`,
    );
  }

  await listenWithRetry();
})();
