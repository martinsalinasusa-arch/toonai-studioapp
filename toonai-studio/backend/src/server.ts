import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { z } from "zod";
import { env } from "./config";
import { prisma } from "./prisma";
import { getOrCreateUserForEmail, verifyPassword } from "./auth";
import { getBalance, reserveCredits } from "./credits";
import { generationQueue } from "./queue";

const app=Fastify({logger:true});
await app.register(cors,{origin:true});
await app.register(jwt,{secret:env.JWT_SECRET});
await app.register(multipart,{limits:{fileSize:20*1024*1024}});
const auth=async(req:any,reply:any)=>{try{await req.jwtVerify()}catch{return reply.code(401).send({error:"UNAUTHORIZED"})}};

app.get("/health",async()=>({ok:true,service:"toonai-api"}));

app.post("/auth/signup",async(req,reply)=>{
  const b=z.object({email:z.string().email(),password:z.string().min(8),name:z.string().min(1).max(80).optional()}).parse(req.body);
  const user=await getOrCreateUserForEmail(b.email,b.password,b.name);
  const token=await app.jwt.sign({sub:user.id,role:user.role});
  return {token,user:{id:user.id,email:user.email,name:user.name}};
});
app.post("/auth/login",async(req,reply)=>{
  const b=z.object({email:z.string().email(),password:z.string()}).parse(req.body);
  const user=await prisma.user.findUnique({where:{email:b.email}});
  if(!user?.passwordHash || !(await verifyPassword(b.password,user.passwordHash))) return reply.code(401).send({error:"INVALID_CREDENTIALS"});
  return {token:await app.jwt.sign({sub:user.id,role:user.role}),user:{id:user.id,email:user.email,name:user.name}};
});

app.get("/me", {preHandler:auth}, async(req:any)=> {
  const id=req.user.sub; const u=await prisma.user.findUniqueOrThrow({where:{id},select:{id:true,email:true,phone:true,name:true,role:true}});
  return {...u,credits:await getBalance(id)};
});
app.get("/projects",{preHandler:auth},async(req:any)=>prisma.project.findMany({where:{userId:req.user.sub},orderBy:{createdAt:"desc"}}));

const durationCost=(s:number)=>({5:1,10:2,15:3,30:5}[s]??0);

app.post("/projects/text-to-video",{preHandler:auth},async(req:any,reply)=>{
  const b=z.object({title:z.string().min(1).max(120),prompt:z.string().min(3).max(4000),durationSec:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(30)]),aspectRatio:z.enum(["9:16","16:9","1:1"]),style:z.string().max(60),camera:z.string().max(60),quality:z.string().max(30)}).parse(req.body);
  const cost=durationCost(b.durationSec);
  const project=await prisma.project.create({data:{userId:req.user.sub,title:b.title,prompt:b.prompt,durationSec:b.durationSec,aspectRatio:b.aspectRatio,style:b.style,status:"GENERATING"}});
  try{
    await reserveCredits(req.user.sub,cost,project.id);
    const job=await prisma.generationJob.create({data:{userId:req.user.sub,projectId:project.id,reservedCredits:cost,stage:"queued",progress:0}});
    await generationQueue.add("text-to-video",{jobId:job.id,prompt:b.prompt,durationSec:b.durationSec,aspectRatio:b.aspectRatio,style:b.style,camera:b.camera,quality:b.quality},{jobId:job.id});
    return {projectId:project.id,jobId:job.id,cost};
  }catch(e:any){
    await prisma.project.update({where:{id:project.id},data:{status:"FAILED"}});
    return reply.code(400).send({error:e.message});
  }
});

app.get("/jobs/:id",{preHandler:auth},async(req:any,reply)=>{
  const j=await prisma.generationJob.findFirst({where:{id:req.params.id,userId:req.user.sub}});
  if(!j) return reply.code(404).send({error:"NOT_FOUND"});
  return j;
});

app.delete("/projects/:id",{preHandler:auth},async(req:any,reply)=>{
  const p=await prisma.project.findFirst({where:{id:req.params.id,userId:req.user.sub}});
  if(!p) return reply.code(404).send({error:"NOT_FOUND"});
  await prisma.project.delete({where:{id:p.id}}); return {ok:true};
});

app.post("/payments/google-play/verify",{preHandler:auth},async(req:any,reply)=>{
  const b=z.object({productSku:z.string(),purchaseToken:z.string().min(10)}).parse(req.body);
  // Production: call Google Play Developer API with service-account credentials here.
  // Never grant credits from a client "success" flag.
  if(!process.env.GOOGLE_PLAY_PACKAGE_NAME || !process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)
    return reply.code(503).send({error:"GOOGLE_PLAY_NOT_CONFIGURED"});
  return reply.code(501).send({error:"GOOGLE_PLAY_VERIFIER_REQUIRED","message":"Connect the official Google Play Developer API verifier before granting credits."});
});

app.post("/account/delete",{preHandler:auth},async(req:any)=>{
  const id=req.user.sub;
  await prisma.user.delete({where:{id}});
  return {ok:true};
});

app.listen({port:env.PORT,host:"0.0.0.0"});
