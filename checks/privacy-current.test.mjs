import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('both privacy languages disclose Meta media processing and optional foreground Guide location',async()=>{
 const html=await readFile(new URL('../public/privacy.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/OpenAI|\uFFFD/);
 for(const lang of ['id','en']){
  const article=html.split(`data-policy-lang="${lang}"`)[1].split('</article>')[0];
  assert.match(article,/Meta Model API/);assert.match(article,/Muse Spark/);assert.match(article,/video/);
  assert.match(article,lang==='en'?/browser permission/:/izin browser/);
  assert.match(article,lang==='en'?/not saved as itinerary location history/:/tidak disimpan sebagai riwayat lokasi/);
 }
});
