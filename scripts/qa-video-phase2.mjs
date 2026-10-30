// Evidence only: inspect fixed non-secret source paths; never environment files.
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='docs/hackathon-2026/phase-2/';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const allowed=new Set(['app/ai-planner.tsx','app/flight-search.tsx','app/travel-data.ts','app/i18n/index.ts','app/travel-app.tsx','app/verified-places.ts','checks/day-settings.test.mjs','checks/i18n-loader.mjs','scripts/i18n-coverage.mjs','worker/index.js','worker/itinerary.js','worker/ai-draft.js','docs/PROJECT_CONTEXT.md','docs/PROJECT_PROGRESS.md','docs/NEXT_ACTIONS.md','docs/DECISIONS.md','docs/ARCHITECTURE.md']);
const manifest=JSON.parse(await readFile('docs/hackathon-2026/phase-1/evidence/tracked-baseline-manifest.json','utf8'));
let unchanged=0;const differences=[],unexpected=[];
for(const row of manifest){if(/(?:^|\/)\.env|\.dev\.vars|secret|credential/i.test(row.file))continue;let hash=null;try{hash=createHash('sha256').update(await readFile(row.file)).digest('hex')}catch{}
 if(hash===row.sha256)unchanged++;else{differences.push(row.file);if(!allowed.has(row.file)&&row.file!=='WORKFLOW.md')unexpected.push(row.file);}}
const reports=['IMPLEMENTATION_SUMMARY','VIDEO_INPUT_AND_ACCESS','META_AI_INTEGRATION','DESTINATION_EXTRACTION','LOCATION_VERIFICATION','ITINERARY_INTEGRATION','SECURITY_REVIEW','QA_RESULTS','API_COST_REPORT','OWNER_ACTION_REQUIRED','PHASE_3_READINESS'];
for(const report of reports)await access(root+report+'.md');
const testLog=await readFile(root+'evidence/unit-tests.log','utf8'),buildLog=await readFile(root+'evidence/build.log','utf8'),i18n=JSON.parse(await readFile(root+'evidence/i18n.json','utf8'));
const pass=Number(testLog.match(/tests (\d+)/)?.[1]),failed=Number(testLog.match(/fail (\d+)/)?.[1]);
const result={date:'2026-10-27',status:'PARTIAL',branch:git('branch','--show-current'),startingCommit:'737fbc5636145fc27a0bf4ac41be831835dfbd44',endingCommit:git('rev-parse','HEAD'),committed:false,deployed:false,metaPaidRequests:0,metaSpendingUSD:0,actualModelUsed:null,plannedModel:'muse-spark-1.3',reports:reports.length,tests:{total:pass,failed},buildPassed:/built in/.test(buildLog)&&!/Build failed|error TS\d/.test(buildLog),i18n:{keys:i18n.keys,errors:i18n.errors.length,literals:i18n.literalTexts.length},baseline:{unchangedTrackedFiles:unchanged,differences,unexpected},stagedPaths:git('diff','--cached','--name-only').split('\n').filter(Boolean),limitations:['No real Meta result or billing/account cap verification','Budget SQL not applied','Container-only MP4 inspection; native video/ASR/deletion not implemented','No live Save/RLS or partner/financial E2E test']};
await writeFile(root+'evidence/completion.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
if(unexpected.length||failed||!result.buildPassed||i18n.errors.length||i18n.literalTexts.length)process.exitCode=1;
