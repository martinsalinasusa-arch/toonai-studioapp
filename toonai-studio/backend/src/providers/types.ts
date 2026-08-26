export type VideoRequest={prompt:string;durationSec:number;aspectRatio:string;style:string;camera:string;quality:string};
export type ImageVideoRequest={inputKey:string;prompt:string;durationSec:number;aspectRatio:string;style:string};
export interface VideoProvider { create(req:VideoRequest):Promise<{jobId:string}>; get(jobId:string):Promise<{status:"processing"|"completed"|"failed";url?:string;error?:string}>; }
export interface ImageToVideoProvider { create(req:ImageVideoRequest):Promise<{jobId:string}>; get(jobId:string):Promise<{status:"processing"|"completed"|"failed";url?:string;error?:string}>; }
export interface TextProvider { generate(prompt:string):Promise<string>; }
export interface VoiceProvider { synthesize(text:string,language:string,voice:string):Promise<{url:string}>; }
export interface StorageProvider { put(key:string,body:Buffer,contentType:string):Promise<string>; signedGet(key:string,seconds:number):Promise<string>; }
