// Overseas keyword volumes from competitor lankapropertyweb.com (Ubersuggest, 2026-11-19). Run: set -a; . ./.env.local; set +a; NODE_PATH=$PWD/node_modules node scripts/add-keyword-volumes-2026-11-19.cjs
const {Client}=require('pg');
const L={GB:'United Kingdom',AU:'Australia',CA:'Canada'};
const rows=[
["GB","houses in sri lanka colombo",880,20],["GB","houses for sale sri lanka",590,32],["GB","homes for sale in sri lanka",590,39],["GB","sri lanka house",320,51],["GB","housing in sri lanka",320,32],
["GB","flats for sale in colombo",260,28],["GB","houses for sale colombo",260,23],["GB","land to buy in sri lanka",170,37],["GB","buy land in sri lanka",170,18],["GB","buying land in sri lanka",170,14],
["GB","property sri lanka",140,37],["GB","apartments colombo sri lanka",140,24],["GB","houses for sale in sri lanka kandy",110,13],["GB","houses for sale in sri lanka negombo",90,27],
["AU","sri lanka home for sale",390,40],["AU","sri lanka house for sale",390,26],["AU","sri lanka apartments for sale in colombo",260,11],["AU","sri lanka property for sale",260,35],["AU","colombo apartments for sale",260,29],
["AU","property for sale sri lanka",210,35],["AU","galle house for sale",210,16],["AU","buy lands in sri lanka",210,34],["AU","colombo apartments rent",170,18],["AU","house for sale in kandy",140,13],["AU","apartments in sri lanka",140,28],["AU","hotels for sale sri lanka",70,13],
["CA","sri lanka home for sale",260,31],["CA","apartments in colombo for sale",110,17],["CA","house for sale in colombo",140,17],["CA","house for sale in jaffna",90,17],["CA","buying land in sri lanka",70,16],["CA","colombo apartments for rent",90,18],["CA","sri lanka property for sale",90,37]
];
(async()=>{const c=new Client({connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:false}});await c.connect();
for(const [cc,k,v,d] of rows){await c.query("insert into keyword_volumes(keyword,country,monthly_searches,seo_difficulty,source,location,checked_at) values($1,$2,$3,$4,'Ubersuggest',$5,now()) on conflict (keyword,country) do update set monthly_searches=excluded.monthly_searches,seo_difficulty=excluded.seo_difficulty,checked_at=now()",[k,cc,v,d,L[cc]]);}
console.log((await c.query("select country,count(*) from keyword_volumes group by 1 order by 1")).rows);
await c.end();process.exit(0)})().catch(e=>{console.error(e.message);process.exit(1)});
