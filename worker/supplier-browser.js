// A fresh, non-persistent context for every supplier request; never import owner sessions.
export async function openSupplierBrowser(binding,launchBrowser){
 if(!launchBrowser)({launch:launchBrowser}=await import('@cloudflare/playwright'));
 const browser=await launchBrowser(binding);
 try{
  const context=await browser.newContext({locale:'en-US'});
  return {context,async close(){try{await context.close();}finally{await browser.close();}}};
 }catch(error){await browser.close().catch(()=>{});throw error;}
}
