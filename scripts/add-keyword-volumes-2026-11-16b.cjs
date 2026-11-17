// Adds 13 land-by-town keyword volumes (Ubersuggest, 2026-11-16). Run: set -a; . ./.env.local; set +a; NODE_PATH=$PWD/node_modules node scripts/add-keyword-volumes-2026-11-16b.cjs
const {Client}=require('pg');
const rows=[["land for sale in homagama",880,9],["land for sale in malabe",720,8],["land for sale in kadawatha",880,12],["land for sale in kaduwela",170,11],["land for sale in piliyandala",720,11],["land for sale in athurugiriya",390,10],["land for sale in kahathuduwa",140,9],["land for sale in horana",320,11],["land for sale in anuradhapura",480,11],["land for sale in kandy",1600,11],["land for sale in galle",720,10],["land for sale in kurunegala",880,10],["land for sale in kurunegala town",720,8]];
(async()=>{const c=new Client({connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:false}});await c.connect();
for(const [k,v,d] of rows){await c.query("insert into keyword_volumes(keyword,country,monthly_searches,seo_difficulty,source,location,checked_at) values($1,'LK',$2,$3,'Ubersuggest','Sri Lanka',now()) on conflict (keyword,country) do update set monthly_searches=excluded.monthly_searches,seo_difficulty=excluded.seo_difficulty,checked_at=now()",[k,v,d]);}
console.log((await c.query("select count(*) from keyword_volumes where country='LK'")).rows[0]);
await c.end();process.exit(0)})().catch(e=>{console.error(e.message);process.exit(1)});
