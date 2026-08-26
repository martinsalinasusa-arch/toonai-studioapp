import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function hashPassword(p:string){ return bcrypt.hash(p,12); }
export async function verifyPassword(p:string,h:string){ return bcrypt.compare(p,h); }

export async function getOrCreateUserForEmail(email:string,password?:string,name?:string){
  const existing=await prisma.user.findUnique({where:{email}});
  if(existing) return existing;
  const user=await prisma.user.create({data:{
    email, name, passwordHash:password?await hashPassword(password):undefined,
    verifiedAt:new Date()
  }});
  // Exactly once: welcome grant is created in the same transaction.
  await prisma.$transaction(async tx=>{
    const u=await tx.user.findUniqueOrThrow({where:{id:user.id}});
    if(!u.freeCreditsGranted){
      await tx.creditLedger.create({data:{userId:u.id,amount:10,type:"WELCOME",balance:10}});
      await tx.user.update({where:{id:u.id},data:{freeCreditsGranted:true}});
    }
  });
  return user;
}
