import { VideoProvider, VideoRequest } from "./types";
export class ConfiguredVideoProvider implements VideoProvider {
  constructor(private apiKey:string, private baseUrl:string){}
  async create(req:VideoRequest){
    const r=await fetch(`${this.baseUrl}/videos`,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${this.apiKey}`},body:JSON.stringify(req)});
    if(!r.ok) throw new Error(`VIDEO_PROVIDER_HTTP_${r.status}`);
    return r.json() as Promise<{jobId:string}>;
  }
  async get(jobId:string){
    const r=await fetch(`${this.baseUrl}/videos/${encodeURIComponent(jobId)}`,{headers:{authorization:`Bearer ${this.apiKey}`}});
    if(!r.ok) throw new Error(`VIDEO_PROVIDER_HTTP_${r.status}`);
    return r.json() as Promise<any>;
  }
}
export function videoProvider():VideoProvider{
  const key=process.env.VIDEO_API_KEY, url=process.env.VIDEO_PROVIDER_BASE_URL;
  if(!key||!url) throw new Error("VIDEO_PROVIDER_NOT_CONFIGURED");
  return new ConfiguredVideoProvider(key,url);
}
