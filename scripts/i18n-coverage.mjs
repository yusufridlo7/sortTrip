import fs from 'node:fs';import ts from 'typescript';
const support=JSON.parse(fs.readFileSync('app/i18n/locales/support.json','utf8'));
const id={...JSON.parse(fs.readFileSync('app/i18n/locales/id.json','utf8')),...support.id},en={...JSON.parse(fs.readFileSync('app/i18n/locales/en.json','utf8')),...support.en};
const errors=[],literalTexts=[];let used=0;
if(JSON.stringify(Object.keys(id).sort())!==JSON.stringify(Object.keys(en).sort()))errors.push('Language keys differ');
for(const [key,value] of Object.entries(id)){if(!en[key])errors.push('Empty English '+key);const slots=s=>[...s.matchAll(/\{\{([^}]+)\}\}/g)].map(m=>m[1]).sort().join(',');if(slots(value)!==slots(en[key]))errors.push('Interpolation mismatch '+key);}
for(const f of fs.readdirSync('app').filter(n=>n.endsWith('.tsx'))){const source=fs.readFileSync('app/'+f,'utf8'),ast=ts.createSourceFile(f,source,99,true,4);function walk(n){if(ts.isCallExpression(n)&&n.expression.getText(ast)==='tr'&&ts.isStringLiteral(n.arguments[0])){used++;const key=n.arguments[0].text;if(!id[key]&&!(id[key+'_one']&&id[key+'_other']))errors.push(f+': missing '+key);}if(ts.isJsxText(n)&&/[A-Za-z]{2}/.test(n.text))literalTexts.push({file:f,text:n.text.trim()});ts.forEachChild(n,walk);}walk(ast);}
console.log(JSON.stringify({keys:Object.keys(id).length,staticCalls:used,errors,literalTexts},null,2));if(errors.length||literalTexts.length)process.exitCode=1;
