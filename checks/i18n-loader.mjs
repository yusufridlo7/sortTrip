import {readFile} from 'node:fs/promises';
import ts from 'typescript';
// Existing TS fixture loaders use temp modules. Resolve the real i18n module there.
let source=await readFile(new URL('../app/i18n/index.ts',import.meta.url),'utf8');
let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
for(const pkg of ['i18next','react-i18next'])code=code.replaceAll(`'${pkg}'`,JSON.stringify(import.meta.resolve(pkg)));
for(const lang of ['id','en','support'])code=code.replace(`'./locales/${lang}.json'`,JSON.stringify(new URL(`../app/i18n/locales/${lang}.json`,import.meta.url).href)+" with {type:'json'}");
export const i18nUrl='data:text/javascript;base64,'+Buffer.from(code).toString('base64');
export const actualI18n=await import(i18nUrl);
await actualI18n.default.changeLanguage('id');
export const resolveI18n=code=>code.replace(/(['"])\.\/i18n\1/g,JSON.stringify(i18nUrl));
