import { Hono } from "hono";
import type { HealthResponse } from "@toolbox/shared";

const app = new Hono();

/**
 * GET /api/health - 健康检查
 * 返回：{ "status": "ok" }
 */
app.get("/api/health", (c) => {
  const body: HealthResponse = { status: "ok" };
  return c.json(body);
});

export default app;
