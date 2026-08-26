import { VoiceProvider } from "./types";
export function voiceProvider():VoiceProvider{
  const key=process.env.VOICE_API_KEY, url=process.env.VOICE_PROVIDER_BASE_URL;
  if(!key||!url) throw new Error("VOICE_PROVIDER_NOT_CONFIGURED");
  return {
    async synthesize(text,language,voice){
      const r=await fetch(`${url}/speech`,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${key}`},body:JSON.stringify({text,language,voice})});
      if(!r.ok) throw new Error(`VOICE_PROVIDER_HTTP_${r.status}`);
      return r.json() as Promise<{url:string}>;
    }
  };
}
