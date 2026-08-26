import { FastifyRequest } from "fastify";
export function userId(req:FastifyRequest){ return (req.user as any)?.sub as string; }
