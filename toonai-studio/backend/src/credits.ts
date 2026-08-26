import { prisma } from "./prisma";

export async function getBalance(userId:string){
  const row=await prisma.creditLedger.findFirst({where:{userId},orderBy:{createdAt:"desc"}});
  return row?.balance ?? 0;
}
export async function reserveCredits(userId:string, amount:number, referenceId:string){
  if(amount<=0) throw new Error("Invalid credit amount");
  return prisma.$transaction(async tx=>{
    const row=await tx.creditLedger.findFirst({where:{userId},orderBy:{createdAt:"desc"}});
    const balance=row?.balance??0;
    if(balance<amount) throw new Error("INSUFFICIENT_CREDITS");
    return tx.creditLedger.create({data:{userId,amount:-amount,type:"RESERVE",referenceId,balance:balance-amount}});
  });
}
export async function refundCredits(userId:string, amount:number, referenceId:string){
  return prisma.$transaction(async tx=>{
    const row=await tx.creditLedger.findFirst({where:{userId},orderBy:{createdAt:"desc"}});
    const balance=row?.balance??0;
    return tx.creditLedger.create({data:{userId,amount,type:"REFUND",referenceId,balance:balance+amount}});
  });
}
