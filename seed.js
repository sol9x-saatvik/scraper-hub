/**
 * Seed script — inserts realistic dummy data into MongoDB.
 *
 * Setup (run once):
 *   npm install mongodb @faker-js/faker
 *
 * Run:
 *   node seed.js
 *
 * NOTE: use `@faker-js/faker` not the deprecated `faker` package.
 * NOTE: package.json has "type":"module" so this file uses ESM imports.
 */

import { MongoClient } from "mongodb";
import { faker } from "@faker-js/faker";

const MONGO_URI = "mongodb://localhost:27017";

const KEYWORDS = [
  "Iran nuclear",
  "Trump Venezuela",
  "Russia Ukraine",
  "China Taiwan",
  "ISIS Syria",
  "Taliban Afghanistan",
  "North Korea missile",
  "Hamas Israel",
  "Drug cartel Mexico",
  "Cyber attack",
];

const SUBREDDITS = ["worldnews", "politics", "news", "geopolitics", "conspiracy"];

// ── Content templates ──────────────────────────────────────────────────────

const TWEET_TEMPLATES = {
  "Iran nuclear": [
    "Breaking: Iran enriching uranium to 60% at Fordow. IAEA inspectors denied access. #IranNuclear",
    "Iran nuclear deal talks collapse again — Tehran refuses to limit centrifuge capacity.",
    "Satellite imagery shows new construction at Iranian nuclear sites. Intelligence officials alarmed. #Iran",
    "Iran announces it has surpassed nuclear threshold. UN demands emergency session. #IranNuclear",
    "Tehran warns it will restart advanced centrifuges if sanctions not lifted within 30 days.",
    "IAEA chief: Iran's stockpile now enough for multiple warheads. World on edge. #NuclearIran",
    "Iranian state media celebrates nuclear 'achievement' — West condemns. #IranNuclear",
  ],
  "Trump Venezuela": [
    "Trump imposes new oil sanctions on Venezuela, pressuring Maduro regime. #Venezuela",
    "Trump threatens military intervention in Venezuela if humanitarian crisis worsens.",
    "Venezuelan opposition meets with Trump officials in DC to discuss transition plan.",
    "Trump executive order freezes Venezuelan government assets in US banks. #TrumpVenezuela",
    "Trump: 'Maduro must go' — expanded sanctions target Venezuelan military leaders.",
    "Venezuela oil output collapses under US sanctions. Maduro blames 'economic war'.",
    "US recognises opposition leader as legitimate president of Venezuela. Maduro furious.",
  ],
  "Russia Ukraine": [
    "Russian forces launch massive drone strike on Kyiv. Most intercepted by air defense. #RussiaUkraine",
    "Ukraine claims successful strike on Russian ammo depot in Crimea. Moscow denies.",
    "NATO pledges additional air defense systems to Ukraine after eastern front escalation.",
    "Russia Ukraine ceasefire talks stall as both sides refuse to budge on territorial demands.",
    "Ukrainian forces advance in Kharkiv region, recapturing villages from Russian control.",
    "Russia fires hypersonic missiles at Ukrainian energy grid. Millions without power. #Ukraine",
    "G7 agrees new $50B aid package for Ukraine amid Russian offensive pressure.",
  ],
  "China Taiwan": [
    "China conducts largest military drills near Taiwan in years. US carrier group responds. #ChinaTaiwan",
    "Taiwan defence minister warns of heightened invasion risk as PLA patrols increase.",
    "US approves $2B arms sale to Taiwan despite Beijing's strong protests.",
    "China Taiwan tensions spike after US congressional delegation visits Taipei.",
    "PLA warplanes cross Taiwan median line for 12th consecutive day.",
    "China announces live-fire exercises encircling Taiwan. Taipei scrambles fighters.",
    "US Japan South Korea condemn China's military provocations against Taiwan.",
  ],
  "ISIS Syria": [
    "ISIS cell neutralised in eastern Syria in joint US-SDF operation. 3 HVTs eliminated.",
    "ISIS Syria resurgence feared as coalition forces reduce presence in Deir ez-Zor.",
    "Syrian refugees report ISIS recruitment in displacement camps near Jordan border.",
    "ISIS releases new propaganda targeting Syrian youth amid economic collapse.",
    "Coalition airstrikes destroy ISIS logistics network in central Syria. 12 killed.",
    "ISIS commander captured in Syria raid — intelligence goldmine say US officials.",
    "ISIS Syria attacks oil field, killing 4 SDF guards. Escalation feared.",
  ],
  "Taliban Afghanistan": [
    "Taliban bans women from NGO work. International aid organisations withdraw staff.",
    "Afghan economy collapses under Taliban — 90% of population below poverty line.",
    "Taliban holds secret talks with regional powers over mineral rights and investment.",
    "UN: Taliban systematically eliminating former Afghan government officials.",
    "Taliban arrests BBC journalist covering women's rights protests in Kabul.",
    "Afghan girls barred from secondary school for third consecutive year under Taliban.",
    "Taliban executes 12 former soldiers in public stadium. UN condemns atrocity.",
  ],
  "North Korea missile": [
    "North Korea fires ICBM into Sea of Japan — travels 6,000 km before splashing down.",
    "Kim Jong Un oversees North Korea missile test. Claims capability to strike US mainland.",
    "North Korea solid-fuel ICBM advances capability for rapid deployment. Alarm grows.",
    "South Korea US Japan condemn latest North Korea missile launch as 'unacceptable provocation'.",
    "Intel: North Korea transferring missile tech to Russia for use in Ukraine conflict.",
    "North Korea missile test flight longest ever — Japan issues emergency alert.",
    "Kim vows to launch spy satellite after successful North Korea missile programme progress.",
  ],
  "Hamas Israel": [
    "IDF strikes Hamas infrastructure in Gaza following rocket barrage on Tel Aviv.",
    "Hamas Israel ceasefire talks resume in Cairo with Qatar Egypt as mediators.",
    "Hamas releases hostage video — Israeli families demand immediate government action.",
    "Hamas Israel conflict enters new phase as IDF pushes into northern Gaza city centre.",
    "ICJ orders Israel to ensure humanitarian aid reaches Gaza amid Hamas conflict.",
    "Hamas launches largest rocket salvo in months — Iron Dome intercepts 95%.",
    "Israel announces expanded ground operation in Rafah. Egypt warns of crisis.",
  ],
  "Drug cartel Mexico": [
    "Sinaloa leadership battle spills into border cities. 12 killed in Tijuana overnight.",
    "Mexico cartel tunnels found under Arizona border — largest fentanyl seizure ever.",
    "Drug cartel Mexico threatens journalists covering Jalisco mass graves. 3rd killed.",
    "AMLO refuses DEA cooperation as cartel controls 40% of national territory.",
    "CJNG attacks Mexican military convoy. 8 soldiers dead. #DrugCartel",
    "US State Dept designates two Mexican cartels as foreign terrorist organisations.",
    "Fentanyl pill factory found in Mexico — enough to kill 200 million people.",
  ],
  "Cyber attack": [
    "Major cyber attack on US infrastructure — power grid in 3 states disrupted. FBI investigating.",
    "Russia-linked hackers behind cyber attack on European banking system. €2B damages.",
    "Cyber attack cripples UK hospital network. Patient data compromised. NHS on emergency.",
    "Chinese APT group responsible for cyber attack on defence contractors. Blueprints stolen.",
    "Cyber attack on Florida water treatment facility raises national security alarms.",
    "Iran-linked group launches cyber attack on Israeli power grid. Minimal damage reported.",
    "Ransomware cyber attack shuts down municipal services across 3 US cities.",
  ],
};

const CAPTION_TEMPLATES = {
  "Iran nuclear": [
    "The world watches as Iran continues its nuclear programme 🌐 #IranNuclear",
    "Iran's nuclear ambitions remain unchecked despite international pressure 😰 #Iran",
    "Breaking from Tehran — nuclear negotiations at critical point #IranDeal",
    "What does Iran's programme mean for Middle East stability? 🤔 #Geopolitics",
    "Nuclear Iran would change the entire regional balance of power forever #IranNuclear",
  ],
  "Trump Venezuela": [
    "Trump's Venezuela strategy: sanctions, isolation, military threats 🇻🇪 #Venezuela",
    "Venezuelan people suffering while political games continue #TrumpVenezuela",
    "New sanctions hit Venezuela hard — but ordinary people suffer most 😔",
    "Trump doubles down on Venezuela pressure. Change coming? #Venezuela",
    "The humanitarian crisis in Venezuela demands urgent global attention 🙏",
  ],
  "Russia Ukraine": [
    "Praying for peace in Ukraine 🕊️ #RussiaUkraine #StandWithUkraine",
    "Russia Ukraine conflict continues to devastate civilian lives 💔",
    "Another day of shelling in eastern Ukraine. When does it end? #Peace",
    "Ukrainian soldiers defending their homeland with incredible courage 🇺🇦",
    "The world must not forget what is happening in Ukraine right now #Ukraine",
  ],
  "China Taiwan": [
    "Taiwan stands strong against Chinese military intimidation 💪 #Taiwan",
    "The world must support Taiwan's democracy against authoritarian threats #FreeTaiwan",
    "China Taiwan tensions reaching dangerous new levels 🌏",
    "Taiwan's resilience in the face of constant threats is inspiring #TaiwanStrong",
    "History will judge those who stay silent on China Taiwan crisis #ChinaTaiwan",
  ],
  "ISIS Syria": [
    "ISIS continues to threaten stability across Syria and Iraq 😡 #ISIS",
    "Remembering the victims of ISIS terror in Syria 🕯️ #NeverForget",
    "Coalition forces working hard to eliminate ISIS presence in eastern Syria",
    "Syrian families displaced by ISIS need our ongoing support 🙏",
    "The ISIS threat never went away — it just went underground #ISISSyria",
  ],
  "Taliban Afghanistan": [
    "Afghan women deserve freedom and education 📚 #Taliban #WomensRights",
    "The Taliban regime destroys Afghan society from within 😢 #Afghanistan",
    "Years of progress erased by Taliban takeover 💔 #AfghanWomen",
    "Standing with the Afghan people fighting for their rights ✊ #TalibanOut",
    "Afghan girls are being robbed of their future by the Taliban #Education",
  ],
  "North Korea missile": [
    "North Korea missile tests threaten regional peace 😰 #NorthKorea",
    "When will the international community take real action on DPRK? 🤔",
    "North Korea's missile programme advancing while world watches #DPRK",
    "Praying for peace on the Korean peninsula 🙏 #NorthKorea",
    "Kim Jong Un using missile tests to extract concessions again #DPRK",
  ],
  "Hamas Israel": [
    "Praying for peace in the Middle East 🕊️ #CeaseFireNow",
    "Innocent civilians on both sides are suffering 💔 #IsraelPalestine",
    "The Hamas Israel conflict has no winners — only victims",
    "Supporting all innocent people caught in this crossfire 🙏",
    "Children in Gaza deserve safety, food, and a future #HamasIsrael",
  ],
  "Drug cartel Mexico": [
    "Mexico's cartel violence tears communities apart 😢 #Mexico",
    "The fentanyl crisis is destroying American families. Roots in Mexico 💊",
    "Brave Mexican journalists risking lives to expose cartel corruption 📰",
    "When will Mexico get real help fighting cartel violence? 🇲🇽",
    "Cartel control of Mexican territory is a national security emergency #Fentanyl",
  ],
  "Cyber attack": [
    "Cyber attacks on critical infrastructure are the new warfare 💻 #CyberSecurity",
    "Our digital systems are dangerously vulnerable. This cyber attack proves it 🔐",
    "Attacking hospitals with ransomware is absolutely criminal 😡 #CyberCrime",
    "Nation-state cyber attacks are escalating. Are we prepared? 🤔 #CyberWar",
    "Every government and company needs to treat cyber security as a top priority now",
  ],
};

const REDDIT_TITLE_TEMPLATES = {
  "Iran nuclear": [
    "Iran enriches uranium past threshold — IAEA confirms, inspectors denied access",
    "Megathread: Iran nuclear negotiations collapse — what happens next?",
    "Iran nuclear scientist assassinated near Tehran — Mossad suspected",
    "Analysis: Iran's nuclear breakout timeline has shortened to weeks, not months",
    "Iran denies IAEA access to key facility for third consecutive month",
    "What would a nuclear-armed Iran actually mean for the Middle East?",
  ],
  "Trump Venezuela": [
    "Trump extends TPS for Venezuelan refugees while tightening Maduro sanctions",
    "Venezuela: Inside the collapse of a petro-state under Maduro and US pressure",
    "Trump's Venezuela envoy meets opposition in secret Bogota talks",
    "Venezuelan military defections increase as Trump tightens economic vice",
    "Oil executives caught navigating Trump Venezuela sanctions maze",
    "Why hasn't Trump's Venezuela policy worked? An honest assessment",
  ],
  "Russia Ukraine": [
    "Ukraine situation report: latest battlefield updates from eastern front",
    "Russia Ukraine war crimes evidence being compiled for ICC prosecution",
    "Why Russia keeps targeting Ukrainian power infrastructure — a strategic explainer",
    "Ukraine's drone programme: how a smaller nation disrupts a military superpower",
    "NATO expansion and the Russia Ukraine war: historical context nobody explains",
    "Western aid fatigue and what it means for Ukraine's ability to hold the line",
  ],
  "China Taiwan": [
    "Taiwan election results could trigger major escalation with China — analysis",
    "China Taiwan military balance: what the actual numbers show",
    "US arms Taiwan as China's 'gray zone' tactics intensify in the strait",
    "Would the US actually defend Taiwan? A realistic strategic assessment",
    "Taiwanese semiconductor industry and why it matters for global stability",
    "China Taiwan: why 2027 is the date everyone in the Pentagon is watching",
  ],
  "ISIS Syria": [
    "ISIS Syria: the caliphate is gone but the ideology survives — new threat assessment",
    "Former ISIS Syria fighters returning to Europe — intel agencies on high alert",
    "Inside an ISIS Syria refugee camp: radicalisation is happening right now",
    "Why ISIS Syria keeps recruiting despite years of coalition airstrikes",
    "Kurdish forces warn ISIS is rebuilding in Iraqi desert camps",
    "How ISIS is financing itself in 2024 without territorial control",
  ],
  "Taliban Afghanistan": [
    "Taliban Afghanistan two years later: every promise broken, every right crushed",
    "Afghan women who defied the Taliban speak out — their stories must be heard",
    "Taliban economy: complete collapse or engineered aid dependency?",
    "The forgotten Afghans: translators and allies abandoned after US withdrawal",
    "Taliban reopens some schools — only for boys, under strict conditions",
    "Mineral wealth of Afghanistan: who profits under Taliban control?",
  ],
  "North Korea missile": [
    "North Korea missile: full technical analysis of the latest ICBM test",
    "How North Korea funds its missile programme despite maximum pressure",
    "North Korea missile debris recovered — what South Korea's navy found",
    "Kim Jong Un's new ICBM: propaganda or genuine military breakthrough?",
    "North Korea-Russia missile technology transfer — implications for Ukraine",
    "Can missile defence actually stop a North Korean ICBM? Honest answer: maybe",
  ],
  "Hamas Israel": [
    "Hamas Israel conflict: daily megathread — post updates here",
    "Hamas Israel negotiations: why every deal collapses at the last moment",
    "Inside Hamas's tunnel network: an engineering analysis",
    "Hamas Israel hostage situation: complete timeline and current status",
    "International humanitarian law and the Hamas Israel conflict explained",
    "Gaza casualty count methodology: how we know what we know",
  ],
  "Drug cartel Mexico": [
    "How drug cartel Mexico evolved from cocaine to fentanyl as primary product",
    "Drug cartel corruption penetrates every level of Mexican government — new report",
    "Tracking fentanyl from Mexico cartel labs to US streets: an investigation",
    "Inside Sinaloa: what life under cartel control actually looks like",
    "Mexico's military offensive against cartels: real progress or performance?",
    "The CJNG vs Sinaloa war: who's winning and what it means for the border",
  ],
  "Cyber attack": [
    "Cyber attack on US water systems: full threat assessment",
    "Russia's cyber attack playbook: how they take down critical infrastructure",
    "The cyber attack on the banking sector — what actually happened, explained",
    "Nation-state cyber attacks are acts of war. Why don't we treat them that way?",
    "How to protect your organisation after the latest wave of ransomware attacks",
    "China's long-running cyber attack campaign against defence contractors: timeline",
  ],
};

const REDDIT_CONTENT_POOL = [
  "This is deeply concerning. The international community needs to act immediately before it's too late.",
  "Can someone explain the full geopolitical implications here? I'm trying to understand the complete picture.",
  "This has been going on for years and nothing changes. A total failure of international diplomacy.",
  "The mainstream media is not covering this story adequately. The real issues are being ignored.",
  "Source? I've seen conflicting reports. Need independent verification before forming an opinion.",
  "I lived through something similar. The situation on the ground is far worse than what's being reported.",
  "Historical context is critical here. This didn't happen in a vacuum — decades of policy failures led here.",
  "The economic angle isn't being discussed enough. Follow the money and you'll understand the real drivers.",
  "Both sides are wrong here. The situation is more complex than partisan takes suggest.",
  "My family is directly affected by this. Please keep sharing and raising awareness globally.",
  "The refugee crisis this creates will destabilise neighbouring countries for a generation.",
  "Intelligence agencies have been warning about this for years. Nobody listened.",
  "This is the direct result of failed sanctions policy. We keep doing the same thing expecting different results.",
  "Anyone watching live streams from the region? The reality is completely different from official statements.",
  "What frustrates me most is that preventable civilian suffering is being used as a political bargaining chip.",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomDate() {
  const now = Date.now();
  const daysAgo = Math.floor(Math.random() * 90);
  const d = new Date(now - daysAgo * 86_400_000 - Math.random() * 86_400_000);
  // dd-MM-yyyy matches DateTimeFormatter pattern in DashboardController
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time, iso: d.toISOString() };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Generators ───────────────────────────────────────────────────────────────

function generateTwitterPosts(count) {
  return Array.from({ length: count }, () => {
    const keyword = pick(KEYWORDS);
    const { date, time } = randomDate();
    return {
      keyword,
      name: faker.person.fullName(),
      handle: "@" + faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15),
      tweet: pick(TWEET_TEMPLATES[keyword]),
      likes: String(faker.number.int({ min: 0, max: 500 })),
      reposts: String(faker.number.int({ min: 0, max: 200 })),
      replies: String(faker.number.int({ min: 0, max: 100 })),
      views: String(faker.number.int({ min: 0, max: 10000 })),
      date,
      time,
      url: `https://twitter.com/i/web/status/${faker.string.numeric(18)}`,
      screenshot_path: null,
      video_path: null,
      seeded: true,
    };
  });
}

function generateInstaPosts(count) {
  return Array.from({ length: count }, () => {
    const keyword = pick(KEYWORDS);
    const { date, time } = randomDate();
    return {
      keyword,
      username: faker.internet.username().toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20),
      caption: pick(CAPTION_TEMPLATES[keyword]),
      likes: String(faker.number.int({ min: 0, max: 2000 })),
      date,
      time,
      url: `https://www.instagram.com/p/${faker.string.alphanumeric(11)}/`,
      screenshot_path: null,
      video_path: null,
      seeded: true,
    };
  });
}

function generateRedditPosts(count) {
  return Array.from({ length: count }, () => {
    const keyword = pick(KEYWORDS);
    const sub = pick(SUBREDDITS);
    const { date, time } = randomDate();
    return {
      keyword,
      subreddit: `r/${sub}`,
      username: `u/${faker.internet.username().toLowerCase()}`,
      title: pick(REDDIT_TITLE_TEMPLATES[keyword]),
      content: pick(REDDIT_CONTENT_POOL) + " " + faker.lorem.sentences(2),
      upvotes: String(faker.number.int({ min: 0, max: 5000 })),
      comments: String(faker.number.int({ min: 0, max: 500 })),
      date,
      time,
      url: `https://www.reddit.com/r/${sub}/comments/${faker.string.alphanumeric(6)}/`,
      screenshot_path: null,
      seeded: true,
    };
  });
}

function generateWebSearchPosts(count) {
  const engines = ["Google", "Bing", "DuckDuckGo"];
  const domains = [
    "reuters.com", "bbc.com", "aljazeera.com", "apnews.com",
    "theguardian.com", "nytimes.com", "washingtonpost.com",
    "cnn.com", "politico.com", "foreignpolicy.com",
  ];
  return Array.from({ length: count }, () => {
    const keyword = pick(KEYWORDS);
    const { iso } = randomDate();
    const domain = pick(domains);
    const slug = keyword.toLowerCase().replace(/\s+/g, "-") + "-" + faker.string.alphanumeric(6);
    return {
      id: faker.string.uuid(),
      keyword,
      title: pick(REDDIT_TITLE_TEMPLATES[keyword]),
      url: `https://www.${domain}/world/${slug}`,
      snippet: faker.lorem.sentences(2),
      scrapedContent: faker.lorem.paragraphs(3),
      engine: pick(engines),
      status: "SUCCESS",
      scrapedAt: iso,
      seeded: true,
    };
  });
}

// 300 geo posts distributed across locations
const GEO_LOCATIONS = [
  { locationName: "Tehran",       country: "Iran",          latitude:  35.6892, longitude:  51.3890, count: 60 },
  { locationName: "Moscow",       country: "Russia",        latitude:  55.7558, longitude:  37.6173, count: 40 },
  { locationName: "Beijing",      country: "China",         latitude:  39.9042, longitude: 116.4074, count: 30 },
  { locationName: "Washington DC",country: "USA",           latitude:  38.9072, longitude: -77.0369, count: 35 },
  { locationName: "Kyiv",         country: "Ukraine",       latitude:  50.4501, longitude:  30.5234, count: 25 },
  { locationName: "Tel Aviv",     country: "Israel",        latitude:  32.0853, longitude:  34.7818, count: 25 },
  { locationName: "Kabul",        country: "Afghanistan",   latitude:  34.5553, longitude:  69.2075, count: 20 },
  { locationName: "Damascus",     country: "Syria",         latitude:  33.5138, longitude:  36.2765, count: 15 },
  { locationName: "Pyongyang",    country: "North Korea",   latitude:  39.0194, longitude: 125.7381, count: 15 },
  { locationName: "Mexico City",  country: "Mexico",        latitude:  19.4326, longitude: -99.1332, count: 15 },
  { locationName: "Caracas",      country: "Venezuela",     latitude:  10.4806, longitude: -66.9036, count: 10 },
  { locationName: "London",       country: "UK",            latitude:  51.5074, longitude:  -0.1278, count: 10 },
];

const SENTIMENTS = ["Positive", "Negative", "Neutral", "Angry"];
const PLATFORMS = ["Instagram", "Twitter", "Reddit", "Facebook"];

function generateGeoPosts() {
  const posts = [];
  for (const loc of GEO_LOCATIONS) {
    for (let i = 0; i < loc.count; i++) {
      const keyword = pick(KEYWORDS);
      const { date, time } = randomDate();
      posts.push({
        platform: pick(PLATFORMS),
        user: faker.internet.username(),
        content: faker.lorem.sentences(2),
        keyword,
        source: "SEARCH",
        locationName: loc.locationName,
        country: loc.country,
        latitude:  loc.latitude  + (Math.random() - 0.5) * 0.1,
        longitude: loc.longitude + (Math.random() - 0.5) * 0.1,
        sentiment: pick(SENTIMENTS),
        isHarmful: Math.random() < 0.2,
        harmfulSeverity: "None",
        likes: faker.number.int({ min: 0, max: 500 }),
        date,
        time,
        scrapedAt: new Date().toISOString(),
        seeded: true,
      });
    }
  }
  return posts;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log(`Connected to MongoDB at ${MONGO_URI}\n`);

    const twitterDb = client.db("twitter_data");
    const instaDb   = client.db("instagram_data");
    const redditDb  = client.db("reddit_data");
    const webDb     = client.db("search_engine_data");
    const geoDb     = client.db("geo_intelligence");

    // ── Real scraped doc counts (never touched) ──
    console.log("=== Real scraped docs (untouched) ===");
    const realTwitter = await twitterDb.collection("search_posts").countDocuments({ seeded: { $ne: true } });
    console.log(`Real scraped docs (untouched): twitter_data.search_posts           ${realTwitter}`);
    const realInsta = await instaDb.collection("search_posts").countDocuments({ seeded: { $ne: true } });
    console.log(`Real scraped docs (untouched): instagram_data.search_posts         ${realInsta}`);
    const realReddit = await redditDb.collection("search_posts").countDocuments({ seeded: { $ne: true } });
    console.log(`Real scraped docs (untouched): reddit_data.search_posts            ${realReddit}`);
    const realWeb = await webDb.collection("web_search_posts").countDocuments({ seeded: { $ne: true } });
    console.log(`Real scraped docs (untouched): search_engine_data.web_search_posts ${realWeb}`);
    const realGeo = await geoDb.collection("post_geo").countDocuments({ seeded: { $ne: true } });
    console.log(`Real scraped docs (untouched): geo_intelligence.post_geo           ${realGeo}`);

    // ── Remove only previously seeded documents ──
    console.log("\nClearing previous seeded documents...");
    await twitterDb.collection("search_posts").deleteMany({ seeded: true });
    await instaDb.collection("search_posts").deleteMany({ seeded: true });
    await redditDb.collection("search_posts").deleteMany({ seeded: true });
    await webDb.collection("web_search_posts").deleteMany({ seeded: true });
    await geoDb.collection("post_geo").deleteMany({ seeded: true });

    // ── Insert fresh seed data ──
    console.log("\nInserting seed data...");
    const twitterPosts = generateTwitterPosts(400);
    await twitterDb.collection("search_posts").insertMany(twitterPosts);
    console.log(`Inserted ${twitterPosts.length} → twitter_data.search_posts`);

    const instaPosts = generateInstaPosts(300);
    await instaDb.collection("search_posts").insertMany(instaPosts);
    console.log(`Inserted ${instaPosts.length} → instagram_data.search_posts`);

    const redditPosts = generateRedditPosts(200);
    await redditDb.collection("search_posts").insertMany(redditPosts);
    console.log(`Inserted ${redditPosts.length} → reddit_data.search_posts`);

    const webPosts = generateWebSearchPosts(100);
    await webDb.collection("web_search_posts").insertMany(webPosts);
    console.log(`Inserted ${webPosts.length} → search_engine_data.web_search_posts`);

    const geoPosts = generateGeoPosts();
    await geoDb.collection("post_geo").insertMany(geoPosts);
    console.log(`Inserted ${geoPosts.length} → geo_intelligence.post_geo`);

    console.log("\n=== Final counts (real + seeded) ===");
    console.log("twitter_data.search_posts:          ", await twitterDb.collection("search_posts").countDocuments());
    console.log("instagram_data.search_posts:        ", await instaDb.collection("search_posts").countDocuments());
    console.log("reddit_data.search_posts:           ", await redditDb.collection("search_posts").countDocuments());
    console.log("search_engine_data.web_search_posts:", await webDb.collection("web_search_posts").countDocuments());
    console.log("geo_intelligence.post_geo:          ", await geoDb.collection("post_geo").countDocuments());
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// ── Twitter mass data (10 000 posts + 800 geo) ────────────────────────────

const MASS_KEYWORDS = [
  "Iran nuclear", "Trump Venezuela", "Russia Ukraine", "China Taiwan",
  "ISIS Syria", "Taliban Afghanistan", "North Korea missile", "Hamas Israel",
  "Drug cartel Mexico", "Cyber attack", "India Pakistan", "South China Sea",
  "NATO expansion", "Oil prices OPEC", "Election fraud", "Climate protest",
  "AI regulation", "Cryptocurrency ban", "Border crisis", "Terrorism Europe",
];

const MASS_GEO_LOCATIONS = [
  { locationName: "Tehran",       country: "Iran",         lat:  35.6892, lng:  51.3890, count:  80 },
  { locationName: "Moscow",       country: "Russia",       lat:  55.7558, lng:  37.6173, count:  70 },
  { locationName: "Beijing",      country: "China",        lat:  39.9042, lng: 116.4074, count:  70 },
  { locationName: "Washington DC",country: "USA",          lat:  38.9072, lng: -77.0369, count:  60 },
  { locationName: "Kyiv",         country: "Ukraine",      lat:  50.4501, lng:  30.5234, count:  50 },
  { locationName: "Tel Aviv",     country: "Israel",       lat:  32.0853, lng:  34.7818, count:  50 },
  { locationName: "Kabul",        country: "Afghanistan",  lat:  34.5553, lng:  69.2075, count:  40 },
  { locationName: "Damascus",     country: "Syria",        lat:  33.5138, lng:  36.2765, count:  30 },
  { locationName: "Pyongyang",    country: "North Korea",  lat:  39.0194, lng: 125.7381, count:  30 },
  { locationName: "Mexico City",  country: "Mexico",       lat:  19.4326, lng: -99.1332, count:  30 },
  { locationName: "Caracas",      country: "Venezuela",    lat:  10.4806, lng: -66.9036, count:  25 },
  { locationName: "London",       country: "UK",           lat:  51.5074, lng:  -0.1278, count:  25 },
  { locationName: "New Delhi",    country: "India",        lat:  28.6139, lng:  77.2090, count:  25 },
  { locationName: "Islamabad",    country: "Pakistan",     lat:  33.6844, lng:  73.0479, count:  25 },
  { locationName: "Paris",        country: "France",       lat:  48.8566, lng:   2.3522, count:  20 },
  { locationName: "Berlin",       country: "Germany",      lat:  52.5200, lng:  13.4050, count:  20 },
  { locationName: "Beijing",      country: "China",        lat:  39.9042, lng: 116.4074, count:  20 },
  { locationName: "Tokyo",        country: "Japan",        lat:  35.6762, lng: 139.6503, count:  15 },
  { locationName: "Riyadh",       country: "Saudi Arabia", lat:  24.7136, lng:  46.6753, count:  15 },
  { locationName: "Cairo",        country: "Egypt",        lat:  30.0444, lng:  31.2357, count:  15 },
  { locationName: "Brasilia",     country: "Brazil",       lat: -15.7942, lng: -47.8825, count:  15 },
  { locationName: "Lagos",        country: "Nigeria",      lat:   6.5244, lng:   3.3792, count:  10 },
  { locationName: "Jakarta",      country: "Indonesia",    lat:  -6.2088, lng: 106.8456, count:  10 },
  { locationName: "Sydney",       country: "Australia",    lat: -33.8688, lng: 151.2093, count:  10 },
];

function randomDate180() {
  const now = Date.now();
  const daysAgo = Math.floor(Math.random() * 180);
  const d = new Date(now - daysAgo * 86_400_000 - Math.random() * 86_400_000);
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  return { date, time };
}

async function seedTwitterMassData() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log("\n=== seedTwitterMassData ===");

    const twitterDb = client.db("twitter_data");
    const geoDb     = client.db("geo_intelligence");

    // Remove only previously seeded mass Twitter data
    await twitterDb.collection("search_posts").deleteMany({ seeded: true, platform: "TWITTER" });
    await geoDb.collection("post_geo").deleteMany({ seeded: true, platform: "Twitter" });
    console.log("Cleared previous TWITTER seeded data.");

    // ── 10 000 Twitter search posts (batched) ──
    const TOTAL    = 10_000;
    const BATCH    = 1_000;
    let inserted   = 0;

    for (let b = 0; b < TOTAL / BATCH; b++) {
      const docs = [];
      for (let i = 0; i < BATCH; i++) {
        const globalIdx = b * BATCH + i;
        const keyword   = MASS_KEYWORDS[globalIdx % MASS_KEYWORDS.length];
        const { date, time } = randomDate180();
        docs.push({
          tweet_number: globalIdx,
          platform:  "TWITTER",
          source:    "SEARCH",
          keyword,
          name:      faker.internet.username(),
          handle:    "@" + faker.internet.username(),
          date,
          time,
          likes:     String(faker.number.int({ min: 0, max: 5000 })),
          reposts:   String(faker.number.int({ min: 0, max: 2000 })),
          replies:   String(faker.number.int({ min: 0, max: 1000 })),
          views:     String(faker.number.int({ min: 0, max: 100000 })),
          tweet:     faker.lorem.sentences(faker.number.int({ min: 1, max: 4 })),
          url:       `https://x.com/${faker.internet.username()}/status/${faker.number.int({ min: 1_000_000_000_000_000, max: 9_999_999_999_999_999 })}`,
          scraped_at:      new Date().toISOString(),
          screenshot_path: null,
          video_path:      null,
          seeded:          true,
        });
      }
      await twitterDb.collection("search_posts").insertMany(docs);
      inserted += docs.length;
      process.stdout.write(`\r  Twitter posts inserted: ${inserted}/${TOTAL}`);
    }
    process.stdout.write("\n");
    console.log("Inserted Twitter posts: 10000");

    // ── 800 geo posts ──
    const geoDocs = [];
    for (const loc of MASS_GEO_LOCATIONS) {
      for (let i = 0; i < loc.count; i++) {
        const keyword  = pick(MASS_KEYWORDS);
        const { date, time } = randomDate180();
        const isHarmful = Math.random() < 0.2;
        geoDocs.push({
          platform:     "Twitter",
          user:         "@" + faker.internet.username(),
          content:      faker.lorem.sentences(2),
          keyword,
          source:       "SEARCH",
          locationName: loc.locationName,
          country:      loc.country,
          latitude:     loc.lat + (Math.random() - 0.5) * 0.05,
          longitude:    loc.lng + (Math.random() - 0.5) * 0.05,
          sentiment:    pick(SENTIMENTS),
          isHarmful,
          harmfulSeverity: isHarmful ? pick(["Low", "Medium", "High"]) : "None",
          likes:        faker.number.int({ min: 0, max: 5000 }),
          date,
          time,
          scrapedAt:    new Date().toISOString(),
          seeded:       true,
        });
      }
    }
    await geoDb.collection("post_geo").insertMany(geoDocs);
    console.log("Inserted geo posts: 800");

    console.log("\n=== Mass seed final counts ===");
    console.log("twitter_data.search_posts:", await twitterDb.collection("search_posts").countDocuments());
    console.log("geo_intelligence.post_geo:", await geoDb.collection("post_geo").countDocuments());
  } catch (err) {
    console.error("seedTwitterMassData failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

await main();
await seedTwitterMassData();
