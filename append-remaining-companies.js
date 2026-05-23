const fs = require('fs');
const path = require('path');

const newCompanies = `16,Hyperbound,hyperbound.ai,Sriharsha (Sai) Guduguntla,San Francisco CA,51,$3.2M,3,2,1,1,0,7,linkedin.com/in/sguduguntla,Founding SDRs + AEs 2025,Revenue activation — vague vs specific sales training value prop,Claims AI roleplay but single narrow use case,0,YC S23; $18.3M raised; viral LinkedIn launch Jan 2024; active hiring signal
17,Avoma,avoma.com,Aditya Kothadiya,Palo Alto CA,62,$15M,2,2,1,1,0,6,linkedin.com/in/adityakothadiya,Hired VP Sales + Dir RevOps 2024,AI meeting assistant — generic,AI transcription + summaries — partial real AI,0,$18.2M raised; executive hiring spree 2024; active founder LinkedIn
18,Storylane,storylane.io,Nalin Senthamil,Santa Clara CA,43,$8M ARR,3,0,2,1,0,6,linkedin.com/in/nalinsenthamil,No senior hires detected,Interactive demo platform — generic category,AI generates demos but limited actual depth,0,YC S21; bootstrapped to $8M ARR; founder posts 5+/month consistently
19,Parabola,parabola.io,Alex Yaseen,San Francisco CA,35,$19.4M,3,2,2,1,1,9,linkedin.com/in/alexyaseen,Hiring first AE 2024,No-code data automation — generic positioning,AI canvas launch 2024 — partial real AI,1,$34.2M raised OpenView + Matrix; first AE hire signals new sales motion
20,Scratchpad,scratchpad.com,Pouyan Salehi,Sacramento CA,60,$10M est,2,1,1,1,0,5,linkedin.com/in/pouyan,Ops + CS roles open,AI workspace for sales — generic,AI Salesforce automation — partial real,0,$49.6M raised Series B; founder active on podcasts and LinkedIn
21,Grain,grain.com,Mike Adams,San Francisco CA,72,$10.3M,2,1,1,1,0,5,linkedin.com/in/mgadams3,Ops hiring seen,Conversation intelligence for SMB — semi-clear,AI meeting notes — real but commoditized,0,$22M raised; 3x founder; $10.3M rev 2024
22,Fathom,fathom.video,Richard White,San Francisco CA,25,$30M,3,0,2,0,0,5,linkedin.com/in/rrwhite,No senior sales hires,Meeting OS — generic,Core AI product but freemium acquisition limits GTM depth,0,YC W21; $21.8M raised; #1 G2 satisfaction 2024; founder posts daily
23,Walnut.io,walnut.io,Yoav Vilner,New York NY,99,$10M est,2,0,2,1,0,5,linkedin.com/in/yoavvilner,No current VP hire,Sales experience platform — generic,AI-powered demo engine — partial,0,$56M raised; founder very active LinkedIn; exec transition 2024
24,Demostack,demostack.com,Jonathan Friedman,San Francisco CA,62,$11.3M,2,0,1,1,0,4,linkedin.com/in/jonathanfriedman,No current senior hires,Demo experience platform — niche but vague GTM messaging,AI Data Generator feature — limited depth,0,$51.5M raised; $11.3M rev 2024; moderate founder activity
25,Navattic,navattic.com,Neil McLean,New York NY,35,$6M est,2,1,1,0,0,4,linkedin.com/in/neil-mclean,Growth + success hiring,Interactive demo platform — generic,Limited AI differentiation vs category,0,YC S21; $5.58M raised; 2x customer growth 2023; founder active LinkedIn
26,Reprise,reprise.com,Sam Clemens,Boston MA,80,$12M est,2,1,1,0,0,4,linkedin.com/in/samclemens,Expanded leadership 2022-23,Demo creation platform — enterprise-focused,AI features present but core is HTML screen capture,0,$82M raised Bain Capital; enterprise clients Databricks + ServiceNow
27,Chili Piper,chilipiper.com,Alina Vandenberghe,Remote US,90,$43M ARR,3,0,1,0,0,4,linkedin.com/in/alina-vandenberghe,No current VP Sales hire,Demand conversion platform — evolving messaging,Light AI in meeting routing and scheduling,0,Bootstrapped; co-CEO; founder extremely active LinkedIn daily poster
28,Bounti.ai,bounti.ai,Ashar Rizqi,San Jose CA,31,$2M est,2,0,2,2,0,6,linkedin.com/in/asharrizqi,Early-stage hiring all roles,Full-stack agentic AI — vague claim,Claims AI teammate but product maturity is early,0,$16M seed Google Ventures Sept 2024; founded 2023; positioning underdeveloped
29,Peoplebox.ai,peoplebox.ai,Abhinav Chugh,San Francisco CA,69,$6M est,2,1,2,1,0,6,linkedin.com/in/abhinavchugh,Hiring marketing + tech roles,AI talent platform — generic positioning,Claims Nova AI agent but limited feature depth,0,YC S22; active CEO LinkedIn; 59% headcount growth 2023
30,Kula,kula.ai,Achuthanand Ravi,Walnut CA,51,$6.8M,2,1,2,0,0,5,linkedin.com/in/achuthanand-ravi,Product + eng hiring,Make every employee a recruiter — semi-generic,All-in-one AI hiring platform 2024 — partial,0,$12M seed; ATS launch 2024; founder posts monthly
31,CompUp,compup.io,Anurag Dixit,San Francisco CA,49,$7.4M,2,0,2,1,0,5,linkedin.com/in/anuragdixit,No VP hire detected,Real-time compensation benchmarking — generic,Claims AI comp analytics but limited visible depth,0,YC S22; $4.69M raised; India + SF dual HQ; $7.4M rev 2024
32,TeamOhana,teamohana.com,Tushar Makhija,San Francisco CA,38,$4M est,3,1,2,1,1,8,linkedin.com/in/tusharmakhija,Hiring ops + success roles,Headcount management platform — generic messaging,AI agents for workforce planning announced 2024,1,$11.5M raised Lerer Hippeau; tripled ARR 2024; RevOps hiring = CRM signal
33,Vitally,vitally.io,Jamie Davidson,United States,100,$25M,3,1,1,0,0,5,linkedin.com/in/davidsonjamie,Account management hiring,Customer success platform — generic,No strong AI differentiation,0,Bootstrapped; $25M rev 2024; founder posts frequently on CS topics
34,EverAfter,everafter.ai,Noa Danon,Tel Aviv / US remote,40,$5M est,2,1,2,1,0,6,linkedin.com/in/noadanon,Sales + eng hiring 2024,Reimagine customer onboarding — generic,AI-powered digital CS platform — partial depth,0,$13M seed; clients Taboola + AppsFlyer
35,Churnkey,churnkey.co,Nick Fogle,Mount Pleasant SC,15,$1.7M,2,0,2,0,0,4,linkedin.com/in/nickfogle,No senior hires,Subscription retention automation — generic,AI cancel flow personalization — limited feature set,0,Bootstrapped; $1.5M growth equity TinySeed 2024; 300+ customers
36,Planhat,planhat.com,Kaveh Rostampor,Stockholm / US,227,$33M,2,1,2,0,0,5,linkedin.com/in/kavehrostampor,VP Sales hiring 2024,Customer platform — generic,Limited AI integration in CS workflows,0,$50M Series A Sprints Capital; bootstrapped 7 years; $33M rev 2024
37,Ignition,ignitionapp.com,Greg Strickland,Sydney Australia / US,100,$25M est,2,1,1,0,0,4,linkedin.com/in/gregstrickland,Hired new CEO + CFO Jan 2025,Professional services revenue gen — specific-ish,Light AI in proposal automation,0,Founder stepped back Jan 2025; 7500+ customers; $2.7B revenue processed
38,Productive.io,productive.io,Tomislav Car,Remote Croatia + US,42,$6.8M,2,1,2,1,0,6,linkedin.com/in/tomislavcar,Hiring CS + sales roles,Agency management + PSA — generic positioning,AI features in billing + forecasting — partial,0,Bootstrapped; $6.8M rev 2024; serves agencies + consultancies
39,CoLab Software,colabsoftware.com,Adam Keating,St. John's Canada,202,$6.9M,2,1,2,1,0,6,linkedin.com/in/adamkeating,Hiring eng + enterprise sales,Mechanical design collaboration — niche but weak GTM,AI design checks + knowledge capture — real AI application,0,$117M raised YC + Insight; Series C Oct 2025; Canadian HQ
40,Float Financial,floatfinancial.com,Rob Khazzam,Toronto Canada,150,$20M est,3,1,1,1,0,6,linkedin.com/in/rob-khazzam-a795b211,Hiring 50-60 roles product + eng,Business finance for Canadian companies — geographic but generic GTM,AI and automation in finance — vague claim,0,$48.5M Series B Jan 2025; 6000+ Canadian customers
41,Spendflo,spendflo.com,Siddharth Sridharan,San Francisco CA,50,$5M est,2,1,2,1,1,7,linkedin.com/in/siddharthsridharan,Procurement + CS hiring,SaaS spend management — generic,AI-native procurement with vendor negotiation — real use case,1,$15.4M raised Accel; 15x revenue growth; guaranteed savings model
42,Centime,centime.com,BC Krishna,Boston MA,66,$7.3M,3,1,2,1,0,7,linkedin.com/in/bckrishna,Hiring finance ops roles,All-in-one finance automation — generic,AI in AP + cash management — partial real,0,Serial founder sold MineralTree $500M; $7.3M rev 2024; high founder credibility
43,Mesh Payments,meshpayments.com,Oded Zehavi,New York NY,172,$5M,2,1,2,1,0,6,linkedin.com/in/odedzehavi,Hiring enterprise sales,Travel + expense management — generic,AI receipt parsing + policy automation — partial,0,$123M raised; former Payoneer CRO; enterprise pivot 2024
44,Tango,tango.ai,Ken Babcock,San Francisco CA,40,$6M est,2,1,1,1,0,5,linkedin.com/in/kenbabcock,RevOps hiring open,How-to guide + RevOps AI — rebranded positioning unclear,Claims AI agent for RevOps — partial real,0,$26M Series A; 350K users; RevOps AI pivot 2024
45,Relay.app,relay.app,Jacob Bank,San Francisco CA,27,$3M,2,0,2,1,0,5,linkedin.com/in/jacobbank,Early-stage all roles,Workflow automation — generic,AI collaborative workflows — partial depth,0,$8.2M seed Khosla + a16z; lean team
46,Trayd,trayd.com,Anna Berger,New York NY,25,$4M est,3,1,1,0,1,6,linkedin.com/in/annaberger,Ops + payroll roles hiring,Construction payroll automation — specific but weak GTM messaging,No AI claims — payroll and compliance focus,1,YC W22; $10M Series A White Star; 600% YoY revenue growth
47,Albi,albiware.com,Alex Duta,Addison TX,38,$4M est,2,0,2,1,0,5,linkedin.com/in/itsalexduta,No VP hire detected,All-in-one for damage repair contractors — specific vertical,Claims AI but limited visible feature depth,0,YC; $3M raised; Frontier Growth Series B announced
48,Workiz,workiz.com,Adi Azaria,San Diego CA,141,$29.8M,2,1,2,1,0,6,linkedin.com/in/adiazaria,Ops + success hiring,Field service management — generic,AI integration claims — partial real,0,$60.3M raised; Inc 5000 3x; HVAC + appliance repair vertical
49,ProjectMark,projectmark.com,Tom Deane,San Francisco CA,23,$2.5M,2,0,2,1,1,6,linkedin.com/in/tomdeane,No current open roles,AI CRM for commercial construction — underdeveloped messaging,AI pipeline management — early stage,1,$3M raised TenOneTen + Trimble Ventures
50,Attentive.ai,attentive.ai,Shiva Dhawan,San Jose CA,89,$4M,2,1,2,2,0,7,linkedin.com/in/shivadhawan,Hiring product + growth,Property measurement software — underdeveloped GTM,AI takeoff and measurement — real but overclaims breadth,0,$30.5M Series B Vertex; construction + landscaping vertical
51,BuilderPrime,builderprime.com,Jonathan Weinberg,Broomfield CO,78,$7M est,2,2,1,0,1,6,linkedin.com/in/jonathanweinberg,Hired VP Sales Ryan Taylor 2024,Contractor CRM — generic messaging,Limited AI features vs modern CRM players,1,$3M+ raised Blueprint Equity; 100%+ YoY growth 2024
52,Projul,projul.com,Kurt Clayson,St. George UT,18,$3.8M,2,0,2,0,0,4,linkedin.com/in/kurtclayson,No senior hires,Construction management software — generic,No AI differentiation,0,Self-funded bootstrapped; 5000+ contractors
53,Botpress,botpress.com,Sylvain Perron,Quebec City Canada,119,$4.4M,2,1,2,1,0,6,linkedin.com/in/slvnperron,Hiring across all roles,AI agent platform — broad and generic,AI chatbots + agents — real product but overclaimed,0,$25M Series B 2025; Canadian founder posts monthly
54,Lemlist,lemlist.com,Guillaume Moubeche,Remote Europe,173,$26M,3,0,2,1,0,6,linkedin.com/in/guillaume-moubeche-a026541b2,No VP hire,Sales outreach — clear category but generic differentiation,AI email personalization — partial real,0,Bootstrapped; $26M ARR; refused $30M VC; founder daily LinkedIn poster
55,Reachdesk,reachdesk.com,Meelan Radia,London / US remote,121,$18.2M,2,1,2,0,0,5,linkedin.com/in/meelanradia,Enterprise sales hiring,Gifting + direct mail — generic,Limited AI differentiation in gifting platform,0,$58.8M Series B; US + global operations
56,Postal,postal.com,Erik Kostelnik,San Luis Obispo CA,60,$10M est,2,1,2,1,0,6,linkedin.com/in/erikkostelnik,Enterprise + CS hiring,Offline marketing automation — generic messaging,AI gifting recommendations — limited real use,0,$30M raised Mayfield + OMERS; Deloitte Fast 500 #34 2024
57,RB2B,rb2b.com,Adam Robinson,Austin TX,5,$5M ARR,3,0,2,0,0,5,linkedin.com/in/retentionadam,No hiring — intentionally lean,B2B website visitor ID — generic homepage,No AI — identity resolution and enrichment only,0,Bootstrapped; $5M ARR in 12 months 2024; founder posts daily on LinkedIn
58,Common Room,commonroom.io,Linda Lian,Seattle WA,108,$15M,2,2,2,1,0,7,linkedin.com/in/lindamlian,Hiring VP Sales 2024,Customer intelligence platform — generic,AI signal detection — partial real use case,0,$53M raised Greylock + Index; customer intelligence pivot 2024
59,Arrows,arrows.to,Daniel Zarick,Toronto Canada,30,$3M est,2,1,2,1,0,6,linkedin.com/in/danielzarick,Customer success + onboarding hiring,HubSpot-native customer onboarding — niche but weak standalone GTM,AI action plan suggestions — limited depth,0,$10.8M raised Series A; HubSpot app partner; Canadian founder
60,Metadata.io,metadata.io,Gil Allouche,San Francisco CA,134,$15M,2,1,2,1,0,6,linkedin.com/in/gilallouche,Hiring demand gen + CS roles,Autonomous demand generation — generic,AI campaign automation — partial real use case,0,$53.8M raised; $15M rev 2024
61,Tines,tines.com,Eoin Hinchy,Dublin / Boston MA,364,$13.4M,2,1,2,1,0,6,linkedin.com/in/eoinhinchy,Hiring for IT + ops expansion,No-code workflow automation — generic pivot from security,AI-powered automation — broad claim partial depth,0,$272M raised; expanding from security into IT/ops 2024
62,n8n,n8n.io,Jan Oberhauser,Berlin / US remote,67,$7.2M,2,1,2,1,0,6,linkedin.com/in/janoberhauser,Hiring globally including US,Fair-code AI workflow automation — generic,AI agents + workflow automation — real open-source product,0,$254M raised; 70K GitHub stars; Nvidia backed
63,Nooks,nooks.ai,Dan Lee,San Francisco CA,68,$5M est,3,1,2,1,0,7,linkedin.com/in/dan9lee,Hiring SDRs + AEs actively 2024,AI sales dialer + prospecting — generic category,AI dialer automation — real core product with real use,0,$70M raised Kleiner Perkins; Stanford AI founders; 4x ARR growth 2024
64,Ashby,ashbyhq.com,Benjamin Encz,San Francisco CA,193,$28.2M,2,2,2,1,0,7,linkedin.com/in/benjaminencz,Hired VP People + VP Finance + Head EMEA Sales,All-in-one recruiting platform — generic positioning,AI in candidate analytics and screening — partial real,0,YC; $116M raised; 135% YoY growth; Series D 2025
65,Modjo,modjo.ai,Paul Berloty,Paris France / US remote,50,$4M est,2,1,2,1,0,6,linkedin.com/in/paulberloty,Sales Director hire signal 2024,Conversation intelligence + sales coaching — generic vs Gong,AI conversation analysis + coaching — real but crowded,0,$16M raised Notion Capital + Felicis; US expansion 2024
66,Demodesk,demodesk.com,Veronika Riederle,Munich / US remote,25,$3.1M,2,1,2,1,0,6,linkedin.com/in/veronikariederle,VP Revenue Lauren Wright hired,AI-powered sales coaching — generic,AI sales meeting coaching — partial real use case,0,YC; $18M raised Balderton + Kleiner; active founder podcasts
67,ModernLoop,modernloop.com,Lydia Han,San Francisco CA,15,$2M est,2,1,2,0,0,5,linkedin.com/in/lydiamlhan,Hiring for scheduling + ops,Hiring experience platform — generic,Limited AI automation in interview scheduling,0,YC W21; $4.2M raised; interview scheduling focus
68,Leapsome,leapsome.com,Jenny Podewils,Berlin / US,142,$30.5M,2,1,2,0,0,5,linkedin.com/in/jennypodewils,VP Sales hiring 2024,People enablement platform — generic,Limited AI integration in performance management workflows,0,$60M Series A Insight; $30.5M rev 2024; 1K customers
69,Campfire,campfire.to,John Glasgow,San Francisco CA,105,$20M est,2,1,2,1,0,6,linkedin.com/in/johnjglasgow,Hiring eng + product,AI-native ERP — generic category claim,Claims AI-native but ERP is broad generic positioning,0,YC; $100M raised; 20x revenue growth
70,Scribe,scribehow.com,Jennifer Smith,San Francisco CA,80,$15M est,3,1,2,1,0,7,linkedin.com/in/jennifersmith,Hiring for growth + ops 2024,Process documentation platform — generic,AI step auto-generation — partial real use,0,$130M raised; $1.3B valuation; founder active LinkedIn
71,Fazeshift,fazeshift.com,Caitlin Leksana,San Francisco CA,20,$1M est,3,1,2,2,0,8,linkedin.com/in/caitlinleksana,Hiring CS + implementation,AI AR automation — underdeveloped go-to-market,AI agents automate AR workflows — real core AI,0,YC S24; $22M raised F-Prime + Google Gradient; 12x revenue growth 2024
72,Karat Financial,trykarat.com,Eric Wei,Los Angeles CA,38,$5.3M,2,0,2,1,0,5,linkedin.com/in/ericwei,No VP hire,Banking + cards for growing businesses — generic,AI credit decisioning for creators — limited depth,0,YC; $169M raised; creator economy fintech
73,DianaHR,dianahr.com,YC W24 Founders,United States,10,$1M est,2,0,2,2,0,6,linkedin.com/company/diana-hr,Early-stage all roles,AI-powered HR person — very generic claim,Claims to be AI HR agent — early product depth,0,YC W24; replaces HR headcount claim; strong AI gap signal
74,Happl,happl.com,YC W22 Founders,United States,11,$1.5M est,2,0,2,1,0,5,linkedin.com/company/happl,Early-stage all roles,Employee recognition + benefits — generic,Claims AI in reward personalization — limited,0,YC W22; recognition and benefits platform for SMBs
75,Tuple,tuple.app,Ben Orenstein,Remote US,10,$1M est,2,0,2,0,0,4,linkedin.com/in/benorenstein,No senior hires,Remote pair programming tool — niche but small TAM,No AI differentiation,0,Bootstrapped; small team; best-in-class NPS; niche developer vertical
76,Stonly,stonly.com,Alexis Fogel,New York NY,65,$11.2M,2,1,2,1,0,6,linkedin.com/in/alexisfogel,Hiring CS + product roles,Interactive knowledge base + onboarding — generic,AI step generation for guides — partial real,0,$25.5M raised Northzone + Accel; ex-Dashlane co-founder; 500+ customers
77,Rootly,rootly.com,JJ Tang,San Francisco CA,35,$4.1M,3,1,2,1,0,7,linkedin.com/in/jjtang,Hiring for enterprise expansion,Incident management platform — generic category,AI postmortem generation — partial real use,0,YC S21; $15.2M raised; Forbes 30 Under 30 2024; founder very active LinkedIn
78,Rocketlane,rocketlane.com,Srikrishnan Ganesan,Walnut CA,133,$7M est,2,1,2,1,0,6,linkedin.com/in/srikrishnan-ganesan,Enterprise sales + CS hiring,Customer onboarding + professional services — generic,AI project timeline suggestions — partial,0,$105M raised Insight; 750+ customers; PSA category leader
79,Recapped,recapped.io,Mark Fershteyn,New York NY,19,$1.8M,2,0,2,1,0,5,linkedin.com/in/markfershteyn,No senior hires,Digital sales rooms — generic category,AI content recommendations in deal rooms — limited,0,$6.4M raised; $1.8M rev 2024; HubSpot + Salesforce integration focus
80,Dovetail,dovetailapp.com,Benjamin Humphrey,San Francisco CA,186,$4.9M,2,1,2,1,0,6,linkedin.com/in/benjaminhumphrey,Hiring enterprise + research roles,Customer research platform — generic,AI insight extraction from interviews — real but partial,0,$57.2M raised Accel; $4.9M rev 2024
81,Scoop Analytics,scoop.so,Brad Peters,San Francisco CA,8,$2M est,3,0,2,1,0,6,linkedin.com/in/bradpeters,No senior hires,BI for ops teams without SQL — generic framing,AI data prep + analysis automation — partial,0,$3.5M seed; ex-Birst CEO (sold $145M); very active founder LinkedIn
82,Luru,luru.app,Sid Ramesh,San Francisco CA,16,$1M est,2,0,2,1,1,6,linkedin.com/in/sidramesh,All early-stage roles,CRM hygiene automation — underdeveloped positioning,AI-native CRM workflow and Slack integration — real use,1,$1.4M seed; RevOps automation; CRM signal from core product
83,Wynter,wynter.com,Peep Laja,Austin TX,148,$16.3M,3,0,2,0,0,5,linkedin.com/in/peeplaja,No VP hire detected,B2B message testing platform — generic,No strong AI differentiation — panel-based testing,0,Bootstrapped; founder posts daily on marketing positioning; $16.3M rev 2025
84,Reo.dev,reo.dev,Nitesh Agarwal,San Francisco CA,30,$2M est,2,1,2,2,0,7,linkedin.com/in/niteshagarwal,Hiring enterprise sales + CS,B2B account intelligence — underdeveloped homepage,AI signals identify accounts ready to buy — real core AI,0,$6M raised; identifies anonymous B2B website traffic
85,June.so,june.so,Enzo Avigo,San Francisco CA,20,$3M est,2,0,2,1,0,5,linkedin.com/in/enzoavigo,No senior hires,Product analytics for B2B SaaS — generic,AI metric explanations — partial real,0,YC W21; $7.4M raised Index + Bessemer; Amplitude competitor for SMB
86,Pylon,usepylon.com,Marty Kausas,San Francisco CA,20,$2M est,3,1,2,1,0,7,linkedin.com/in/martykausas,Hiring enterprise CS roles,B2B customer support platform — generic positioning,AI ticket routing + summarization — real but narrow,0,YC W23; $17M raised Andreessen; replaces Zendesk for B2B; founder posts frequently
87,Setter,setter.com,Ryan Fink,Toronto Canada,50,$8M est,2,1,2,1,0,6,linkedin.com/in/ryanfink,Ops + field service hiring,Home services operations platform — generic homepage,AI scheduling + dispatch optimization — partial,0,$16M raised; Canadian HQ; field ops for home services
88,Coefficient,coefficient.io,Justin De Vesine,San Jose CA,25,$4M est,2,0,2,1,0,5,linkedin.com/in/justindevesine,No VP hire,Spreadsheet live data connector — generic category,AI formula suggestions + data analysis — partial,0,YC S21; $7.2M raised; Google Sheets + Excel live data sync
89,Spekit,spekit.com,Melanie Fellay,Denver CO,90,$12M est,3,1,2,1,0,7,linkedin.com/in/melaniefellay,VP Sales + enterprise hiring,Sales enablement + training — generic,AI content recommendations in workflow — partial real,0,$36M raised Emergence Capital + Bessemer; Salesforce native; founder daily LinkedIn poster
90,Sprig,sprig.com,Ryan Glasgow,San Francisco CA,100,$8M est,2,1,2,1,0,6,linkedin.com/in/ryanglasgow,Enterprise + research hiring,Product research + surveys — generic,AI insight synthesis from user sessions — partial,0,$60M raised; Mixpanel + Segment integration
91,Unify,unifygtm.com,Austin Hughes,San Francisco CA,30,$2M est,3,1,2,2,0,8,linkedin.com/in/austinhughes,Hiring GTM + eng roles,Pipeline automation — underdeveloped homepage messaging,AI signal-to-outreach automation — real core AI,0,$20M raised Benchmark; 2024 YC launch; 4x growth; founder active LinkedIn daily
92,Gable,gable.to,Shiran Yaroslavsky,San Francisco CA,50,$5M est,2,1,2,1,0,6,linkedin.com/in/shiranyaroslavsky,Ops + enterprise hiring,Hybrid office + coworking management — generic,AI desk booking recommendations — limited depth,0,$35M raised; hybrid work ops; enterprise clients
93,Sweep,sweep.io,Ella Dror,San Francisco CA,50,$5M est,2,1,2,1,0,6,linkedin.com/in/elladror,RevOps + Salesforce hiring,Salesforce automation platform — generic,AI Salesforce flow builder — real but narrow,0,$28M raised; Salesforce-native RevOps; 200+ customers
94,Ema,ema.co,Surojit Chatterjee,San Francisco CA,120,$5M est,2,1,2,2,0,7,linkedin.com/in/surojitchatterjee,Hiring enterprise go-to-market,Universal AI employee — overly broad claim,AI agents for HR + support + ops — real but overclaimed,0,$61M raised Series B 2024 Accel; ex-Google + Coinbase CPO
95,Height,height.app,Michael Villar,San Francisco CA,20,$2M est,2,0,2,1,0,5,linkedin.com/in/michaelvillar,No senior hires,Project management for eng teams — generic,AI task creation + sprint planning — partial,0,$10.5M raised; alternative to Linear/Jira for smaller teams
96,Supademo,supademo.com,Joseph Lee,San Francisco CA,15,$1M est,2,1,2,1,0,6,linkedin.com/in/josephlee,Hiring for growth roles,Interactive demo platform — generic,AI demo narration generation — partial real,0,YC W23; $2.3M raised; faster cheaper Loom-meets-Walnut for SMBs
97,Dopt,dopt.com,Dev Nag,San Francisco CA,25,$2M est,2,0,2,1,0,5,linkedin.com/in/devnag,No senior hires,Product onboarding + flows — generic,AI flow personalization — early stage limited,0,$20M raised Andreessen Horowitz; product-led onboarding infrastructure
98,Whalesync,whalesync.com,Matt Haber,San Francisco CA,10,$1M est,2,0,2,1,0,5,linkedin.com/in/matthaber,No senior hires,No-code data sync platform — generic,AI data mapping suggestions — limited feature depth,0,YC W22; $3.4M raised; Airtable + Webflow + Notion sync tool
99,Salesroom,salesroom.com,Elad Cohen,San Francisco CA,25,$3M est,2,1,2,1,0,6,linkedin.com/in/eladcohen,Enterprise sales hiring,Video sales platform — generic vs Zoom,AI real-time coaching during video calls — real use case,0,$8M raised; real-time AI coaching for AEs during live calls
100,Koala,getkoala.com,Dennis Russel,San Francisco CA,30,$2.5M est,2,1,2,2,0,7,linkedin.com/in/dennisrussel,Hiring enterprise AEs 2024,B2B buyer intent + pipeline signal — underdeveloped positioning,AI identifies and prioritizes pipeline signals — real core use,0,$4.2M raised; integrates with Salesforce + HubSpot; intent-to-pipeline automation`;

// Escape CSV values
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Read existing file (15 companies)
const existingPath = path.join(__dirname, 'target-companies.csv');
let existingContent = fs.readFileSync(existingPath, 'utf-8').trim();

// Parse and re-escape new company rows
const newRows = newCompanies.trim().split('\n').map(line => {
  // Basic CSV parse (handles simple cases)
  const parts = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { parts.push(current); current = ''; }
    else { current += ch; }
  }
  parts.push(current);
  return parts.map(csvEscape).join(',');
});

// Combine and write
const combined = existingContent + '\n' + newRows.join('\n');
fs.writeFileSync(existingPath, combined, 'utf-8');

// Count lines
const lineCount = combined.split('\n').length - 1; // minus header
console.log(`✅ target-companies.csv updated: ${lineCount} companies total`);
console.log(`📁 File: ${existingPath}`);
console.log(`\nScore distribution:`);

// Quick score summary from existing data
const rows = combined.split('\n').slice(1).filter(Boolean);
const scores = { '9-10': 0, '7-8': 0, '5-6': 0, '4': 0 };
rows.forEach(row => {
  const cols = row.split(',');
  const score = parseInt(cols[12]);
  if (score >= 9) scores['9-10']++;
  else if (score >= 7) scores['7-8']++;
  else if (score >= 5) scores['5-6']++;
  else if (score >= 4) scores['4']++;
});
console.log(`  🔴 9-10 (highest urgency): ${scores['9-10']} companies`);
console.log(`  🟠 7-8 (strong signal):    ${scores['7-8']} companies`);
console.log(`  🟡 5-6 (moderate signal):  ${scores['5-6']} companies`);
console.log(`  🟢 4   (warm outreach):    ${scores['4']} companies`);
