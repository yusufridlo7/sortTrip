export function mediaDataURL(file:File):Promise<string>;
export function prepareAssistantFiles(files:File[]):Promise<{kind:string;mime:string;data:string;name:string}[]>;
