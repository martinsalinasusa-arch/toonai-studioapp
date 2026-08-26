import { z } from "zod";
export const env = z.object({
  DATABASE_URL:z.string(), REDIS_URL:z.string().default("redis://localhost:6379"),
  JWT_SECRET:z.string().min(32), PORT:z.coerce.number().default(4000),
  FRONTEND_URL:z.string().default("http://localhost:5173")
}).parse(process.env);
