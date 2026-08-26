import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./prisma";
import { env } from "./config";
import { refundCredits } from "./credits";
import { videoProvider } from "./providers/video";

const connection=new IORedis(env.REDIS_URL,{maxRetriesPerRequest:null});
const worker=new Worker("generation",async job=>{
  const id=job.data.jobId;
  const j=await prisma.generationJob.findUniqueOrThrow({where:{id}});
  try{
    await prisma.generationJob.update({where:{id},data:{status:"PROCESSING",stage:"ai_video",progress:10}});
    const provider=videoProvider();
    const created=await provider.create({prompt:job.data.prompt,durationSec:job.data.durationSec,aspectRatio:job.data.aspectRatio,style:job.data.style,camera:job.data.camera,quality:job.data.quality});
    await prisma.generationJob.update({where:{id},data:{providerJobId:created.jobId,stage:"ai_video",progress:20}});
    let result:any;
    for(let i=0;i<60;i++){
      result=await provider.get(created.jobId);
      if(result.status==="completed"||result.status==="failed") break;
      await new Promise(r=>setTimeout(r,5000));
      await prisma.generationJob.update({where:{id},data:{progress:Math.min(85,20+i)}});
    }
    if(result?.status!=="completed") throw new Error(result?.error||"AI_VIDEO_FAILED_OR_TIMEOUT");
    // Production pipeline: download provider output, run FFmpeg/subtitle/mix pipeline,
    // upload final artifact to S3, then issue a temporary signed URL.
    await prisma.$transaction([
      prisma.generationJob.update({where:{id},data:{status:"COMPLETED",stage:"completed",progress:100,outputKey:result.url}}),
      prisma.project.update({where:{id:j.projectId},data:{status:"COMPLETED",outputUrl:result.url}})
    ]);
  }catch(e:any){
    await prisma.generationJob.update({where:{id},data:{status:"FAILED",stage:"failed",progress:100,error:e.message}});
    await refundCredits(j.userId,j.reservedCredits,j.id);
    await prisma.project.update({where:{id:j.projectId},data:{status:"FAILED"}});
    throw e;
  }
});
worker.on("failed",(job,err)=>console.error("generation failed",job?.id,err));
