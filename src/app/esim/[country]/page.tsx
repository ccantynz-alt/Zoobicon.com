import { Metadata } from "next";

// Countries we target for SEO — each gets a unique page
const COUNTRIES: Record<string, {
  name: string; code: string; region: string; emoji: string;
  networks: string; speed: string; planFrom: string;
  description: string; tips: string[];
}> = {
  "new-zealand": {
    name: "New Zealand", code: "NZ", region: "Oceania", emoji: "🇳🇿",
    networks: "Spark, One NZ (Vodafone), 2degrees", speed: "4G/5G",
    planFrom: "$4.99", description: "Full 4G/5G coverage across both islands. Excellent in Auckland, Wellington, Christchurch, and Queenstown. Rural coverage strong on main highways.",
    tips: ["Activate before landing at Auckland Airport", "5G available in major cities", "Great coverage on tourist routes like Milford Sound road"],
  },
  "australia": {
    name: "Australia", code: "AU", region: "Oceania", emoji: "🇦🇺",
    networks: "Telstra, Optus, Vodafone AU", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent urban coverage. Telstra has the best rural reach. 5G in Sydney, Melbourne, Brisbane, Perth, Adelaide.",
    tips: ["Telstra network recommended for outback travel", "5G widespread in capital cities", "Consider 10GB+ plan for longer stays"],
  },
  "fiji": {
    name: "Fiji", code: "FJ", region: "Pacific Islands", emoji: "🇫🇯",
    networks: "Vodafone Fiji, Digicel Fiji", speed: "4G",
    planFrom: "$8.99", description: "Good coverage on Viti Levu (main island) and popular resort areas. Limited on outer islands. 4G in Suva and Nadi.",
    tips: ["Activate before leaving NZ/AU", "Coverage best around resorts and towns", "Download offline maps for island hopping"],
  },
  "samoa": {
    name: "Samoa", code: "WS", region: "Pacific Islands", emoji: "🇼🇸",
    networks: "Digicel Samoa, Bluesky", speed: "3G/4G",
    planFrom: "$8.99", description: "4G coverage in Apia and surrounding areas. 3G in rural Upolu and Savai'i. Growing network investment.",
    tips: ["Best coverage in Apia area", "Download content offline for rural areas", "Bluesky network expanding 4G rapidly"],
  },
  "tonga": {
    name: "Tonga", code: "TO", region: "Pacific Islands", emoji: "🇹🇴",
    networks: "Digicel Tonga", speed: "3G/4G",
    planFrom: "$8.99", description: "4G in Nuku'alofa. 3G coverage on main islands. Limited connectivity on outer island groups.",
    tips: ["Activate in NZ/AU before departure", "Main island has best coverage", "Consider offline maps for island groups"],
  },
  "thailand": {
    name: "Thailand", code: "TH", region: "Southeast Asia", emoji: "🇹🇭",
    networks: "AIS, DTAC, TrueMove", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent nationwide 4G. 5G in Bangkok, Chiang Mai, Phuket, Pattaya. Very affordable data.",
    tips: ["Thailand has some of the cheapest data in the world", "5G widespread in Bangkok", "Coverage good even on islands like Koh Samui"],
  },
  "indonesia": {
    name: "Indonesia", code: "ID", region: "Southeast Asia", emoji: "🇮🇩",
    networks: "Telkomsel, XL Axiata, Indosat", speed: "4G/5G",
    planFrom: "$4.99", description: "Strong 4G in Java, Bali, Sumatra. 5G rolling out in Jakarta. Coverage varies on smaller islands.",
    tips: ["Telkomsel has the widest coverage", "Bali has excellent 4G everywhere", "Consider higher data plan for video calls"],
  },
  "vietnam": {
    name: "Vietnam", code: "VN", region: "Southeast Asia", emoji: "🇻🇳",
    networks: "Viettel, Mobifone, Vinaphone", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent 4G nationwide. 5G in Hanoi and Ho Chi Minh City. Incredibly affordable data rates.",
    tips: ["Vietnam has amazing 4G coverage even in rural areas", "5G available in major cities", "Data is very cheap — get a larger plan"],
  },
  "philippines": {
    name: "Philippines", code: "PH", region: "Southeast Asia", emoji: "🇵🇭",
    networks: "Globe, Smart, DITO", speed: "4G/5G",
    planFrom: "$4.99", description: "Good 4G in Metro Manila, Cebu, Davao. Coverage varies across 7,000+ islands. 5G expanding in urban areas.",
    tips: ["Coverage best in urban areas", "Island connectivity varies — check coverage maps", "Globe and Smart have widest reach"],
  },
  "japan": {
    name: "Japan", code: "JP", region: "East Asia", emoji: "🇯🇵",
    networks: "NTT Docomo, au (KDDI), SoftBank", speed: "5G",
    planFrom: "$4.99", description: "World-class 5G and 4G everywhere. Shinkansen, subway, rural — Japan has near-perfect coverage nationwide.",
    tips: ["Japan has arguably the best mobile network in the world", "5G in all major cities", "Works underground in subway stations"],
  },
  "united-states": {
    name: "United States", code: "US", region: "North America", emoji: "🇺🇸",
    networks: "T-Mobile, AT&T, Verizon", speed: "5G",
    planFrom: "$4.99", description: "Extensive 5G/4G coverage in urban and suburban areas. Rural coverage improving. Works across all 50 states.",
    tips: ["T-Mobile has the widest 5G coverage", "Consider 10GB+ for longer trips", "Coverage excellent in cities, variable in national parks"],
  },
  "united-kingdom": {
    name: "United Kingdom", code: "GB", region: "Europe", emoji: "🇬🇧",
    networks: "EE, Three, Vodafone UK, O2", speed: "5G",
    planFrom: "$4.99", description: "Strong 5G in London, Manchester, Birmingham, Edinburgh. 4G covers virtually the entire country.",
    tips: ["5G widespread in major cities", "EU roaming may not apply post-Brexit — eSIM avoids this", "EE has best UK coverage"],
  },
  // ── Pacific Islands ──────────────────────────────────
  "vanuatu": {
    name: "Vanuatu", code: "VU", region: "Pacific Islands", emoji: "🇻🇺",
    networks: "Digicel Vanuatu, TVL", speed: "3G/4G",
    planFrom: "$8.99", description: "4G in Port Vila and Luganville. 3G on other islands. Growing network coverage across the archipelago.",
    tips: ["Best coverage in Port Vila", "Download offline maps for outer islands", "Activate before leaving NZ/AU"],
  },
  "cook-islands": {
    name: "Cook Islands", code: "CK", region: "Pacific Islands", emoji: "🇨🇰",
    networks: "Vodafone Cook Islands", speed: "3G/4G",
    planFrom: "$9.99", description: "4G on Rarotonga. 3G on Aitutaki. Limited coverage on outer islands.",
    tips: ["Rarotonga has good 4G coverage", "Aitutaki has basic 3G", "Pre-download everything for outer islands"],
  },
  "papua-new-guinea": {
    name: "Papua New Guinea", code: "PG", region: "Pacific Islands", emoji: "🇵🇬",
    networks: "Digicel PNG, bmobile", speed: "3G/4G",
    planFrom: "$8.99", description: "4G in Port Moresby and Lae. 3G in other urban areas. Limited rural coverage across the highlands.",
    tips: ["Coverage concentrated in urban centres", "Digicel has the widest reach", "Essential for safety — always have connectivity in PNG"],
  },
  "new-caledonia": {
    name: "New Caledonia", code: "NC", region: "Pacific Islands", emoji: "🇳🇨",
    networks: "OPT New Caledonia", speed: "4G",
    planFrom: "$8.99", description: "Good 4G coverage in Nouméa and surrounding areas. Coverage extends along main roads on Grande Terre.",
    tips: ["Nouméa has excellent coverage", "French territory — EU-style infrastructure", "Great diving spots have surprisingly good coverage"],
  },
  "french-polynesia": {
    name: "French Polynesia", code: "PF", region: "Pacific Islands", emoji: "🇵🇫",
    networks: "Vini (OPT)", speed: "4G",
    planFrom: "$9.99", description: "4G in Tahiti, Moorea, Bora Bora. Coverage on major tourist islands. Limited on remote atolls.",
    tips: ["Tahiti and Bora Bora have good 4G", "Resort areas well covered", "French territory with decent infrastructure"],
  },
  // ── Southeast Asia ───────────────────────────────────
  "malaysia": {
    name: "Malaysia", code: "MY", region: "Southeast Asia", emoji: "🇲🇾",
    networks: "Maxis, Celcom, Digi, U Mobile", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent 4G/5G in Kuala Lumpur, Penang, Johor Bahru. Strong coverage in Sabah and Sarawak.",
    tips: ["5G rolling out in KL", "Excellent coverage even in Borneo", "Very affordable data rates"],
  },
  "singapore": {
    name: "Singapore", code: "SG", region: "Southeast Asia", emoji: "🇸🇬",
    networks: "Singtel, StarHub, M1", speed: "5G",
    planFrom: "$4.99", description: "Nationwide 5G coverage. One of the most connected countries on earth. Blazing fast speeds everywhere.",
    tips: ["5G everywhere on the island", "Fastest mobile speeds in SE Asia", "Small country — one plan covers everything"],
  },
  "cambodia": {
    name: "Cambodia", code: "KH", region: "Southeast Asia", emoji: "🇰🇭",
    networks: "Smart, Cellcard, Metfone", speed: "4G",
    planFrom: "$4.99", description: "Good 4G in Phnom Penh, Siem Reap, Sihanoukville. Growing coverage along main highways.",
    tips: ["Coverage good in tourist areas", "Siem Reap (Angkor Wat) well covered", "Very cheap data"],
  },
  "myanmar": {
    name: "Myanmar", code: "MM", region: "Southeast Asia", emoji: "🇲🇲",
    networks: "MPT, Ooredoo, Telenor", speed: "4G",
    planFrom: "$4.99", description: "4G in Yangon, Mandalay, Bagan. Coverage improving but variable in rural areas.",
    tips: ["Major cities have decent 4G", "Coverage can drop in rural areas", "Essential backup connectivity for travelers"],
  },
  "laos": {
    name: "Laos", code: "LA", region: "Southeast Asia", emoji: "🇱🇦",
    networks: "Lao Telecom, Unitel, ETL", speed: "4G",
    planFrom: "$4.99", description: "4G in Vientiane, Luang Prabang. 3G along main routes. Limited in remote highlands.",
    tips: ["Tourist centres have good coverage", "Luang Prabang well connected", "Download offline maps for rural travel"],
  },
  // ── East Asia ────────────────────────────────────────
  "south-korea": {
    name: "South Korea", code: "KR", region: "East Asia", emoji: "🇰🇷",
    networks: "SK Telecom, KT, LG U+", speed: "5G",
    planFrom: "$4.99", description: "World-leading 5G network. Near-perfect coverage nationwide including subway, countryside, and islands.",
    tips: ["Fastest 5G in the world", "Coverage even in subway tunnels", "K-pop fans — stream anywhere"],
  },
  "taiwan": {
    name: "Taiwan", code: "TW", region: "East Asia", emoji: "🇹🇼",
    networks: "Chunghwa Telecom, Taiwan Mobile, FarEasTone", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent 4G/5G across the island. Taipei, Kaohsiung, Taichung all well covered. Good mountain coverage.",
    tips: ["5G in major cities", "Excellent coverage island-wide", "Night markets have great connectivity"],
  },
  "hong-kong": {
    name: "Hong Kong", code: "HK", region: "East Asia", emoji: "🇭🇰",
    networks: "CSL, SmarTone, 3HK, CMHK", speed: "5G",
    planFrom: "$4.99", description: "Dense 5G coverage across Hong Kong Island, Kowloon, and New Territories. Works in MTR subway.",
    tips: ["5G everywhere", "Works underground in MTR", "Small area — even 1GB goes a long way"],
  },
  "china": {
    name: "China", code: "CN", region: "East Asia", emoji: "🇨🇳",
    networks: "China Mobile, China Unicom, China Telecom", speed: "5G",
    planFrom: "$6.99", description: "Massive 5G network in cities. 4G coverage nationwide. Note: some apps/sites blocked — pair with VPN.",
    tips: ["Pair with Zoobicon VPN for unrestricted access", "5G in all major cities", "WeChat and Alipay work on eSIM data"],
  },
  // ── South Asia ───────────────────────────────────────
  "india": {
    name: "India", code: "IN", region: "South Asia", emoji: "🇮🇳",
    networks: "Jio, Airtel, Vi (Vodafone Idea)", speed: "4G/5G",
    planFrom: "$4.99", description: "Jio 5G expanding rapidly. 4G coverage across most of India. Incredibly affordable data.",
    tips: ["India has some of the cheapest data globally", "Jio 5G in 700+ cities", "Get a larger plan — data is very cheap here"],
  },
  "sri-lanka": {
    name: "Sri Lanka", code: "LK", region: "South Asia", emoji: "🇱🇰",
    networks: "Dialog, Mobitel, Hutch", speed: "4G",
    planFrom: "$4.99", description: "Good 4G in Colombo, Kandy, Galle, and tourist areas. Coverage along main roads and coastal routes.",
    tips: ["Dialog has best coverage", "Tourist routes well covered", "Beach areas have good 4G"],
  },
  "nepal": {
    name: "Nepal", code: "NP", region: "South Asia", emoji: "🇳🇵",
    networks: "Nepal Telecom, Ncell", speed: "4G",
    planFrom: "$4.99", description: "4G in Kathmandu Valley and Pokhara. 3G on trekking routes. Limited above 4,000m altitude.",
    tips: ["Coverage good in Kathmandu", "Annapurna Circuit has patchy coverage", "Essential backup for trekkers"],
  },
  // ── Middle East ──────────────────────────────────────
  "uae": {
    name: "United Arab Emirates", code: "AE", region: "Middle East", emoji: "🇦🇪",
    networks: "Etisalat, du", speed: "5G",
    planFrom: "$4.99", description: "Blazing fast 5G in Dubai, Abu Dhabi, Sharjah. Premium network quality throughout the country.",
    tips: ["UAE has some of the fastest 5G in the world", "VoIP apps may be restricted — pair with VPN", "Desert safari areas have coverage"],
  },
  "turkey": {
    name: "Turkey", code: "TR", region: "Middle East", emoji: "🇹🇷",
    networks: "Turkcell, Vodafone TR, Türk Telekom", speed: "4G/5G",
    planFrom: "$4.99", description: "Strong 4G nationwide. 5G launching. Excellent coverage in Istanbul, Ankara, Cappadocia, Antalya.",
    tips: ["Turkcell has best coverage", "Cappadocia and coastal areas well covered", "Very affordable data"],
  },
  "qatar": {
    name: "Qatar", code: "QA", region: "Middle East", emoji: "🇶🇦",
    networks: "Ooredoo, Vodafone Qatar", speed: "5G",
    planFrom: "$4.99", description: "Excellent 5G coverage in Doha and surroundings. Compact country with comprehensive network.",
    tips: ["5G across Doha", "World Cup infrastructure still active", "Small country — 1GB plan sufficient for short visits"],
  },
  "saudi-arabia": {
    name: "Saudi Arabia", code: "SA", region: "Middle East", emoji: "🇸🇦",
    networks: "STC, Mobily, Zain", speed: "5G",
    planFrom: "$4.99", description: "Massive 5G investment. Excellent coverage in Riyadh, Jeddah, Mecca, Medina. Growing coverage in NEOM region.",
    tips: ["5G in major cities", "Hajj/Umrah pilgrims — eSIM avoids long SIM queues", "Pair with VPN for unrestricted access"],
  },
  "israel": {
    name: "Israel", code: "IL", region: "Middle East", emoji: "🇮🇱",
    networks: "Partner, Cellcom, Pelephone", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent 4G/5G nationwide. Small country with dense, reliable coverage everywhere.",
    tips: ["Coverage excellent everywhere including Dead Sea area", "5G in Tel Aviv, Jerusalem", "Very connected country"],
  },
  // ── Europe ───────────────────────────────────────────
  "france": {
    name: "France", code: "FR", region: "Europe", emoji: "🇫🇷",
    networks: "Orange, SFR, Bouygues, Free Mobile", speed: "5G",
    planFrom: "$4.99", description: "5G in Paris, Lyon, Marseille, Nice. 4G covers 99% of the population. Excellent rural coverage.",
    tips: ["Orange has best rural coverage", "Paris Metro has coverage", "EU roaming included in regional plans"],
  },
  "germany": {
    name: "Germany", code: "DE", region: "Europe", emoji: "🇩🇪",
    networks: "Telekom, Vodafone DE, O2", speed: "5G",
    planFrom: "$4.99", description: "5G in major cities. 4G coverage across most of the country. German efficiency applies to networks.",
    tips: ["Telekom (T-Mobile) has best coverage", "Autobahn has good coverage", "EU roaming included"],
  },
  "spain": {
    name: "Spain", code: "ES", region: "Europe", emoji: "🇪🇸",
    networks: "Movistar, Vodafone ES, Orange ES", speed: "5G",
    planFrom: "$4.99", description: "Excellent 5G in Madrid, Barcelona, Valencia. 4G covers tourist areas, beaches, and islands including Canaries and Balearics.",
    tips: ["Great coverage in Canary Islands and Mallorca", "Barcelona and Madrid have fast 5G", "EU roaming included"],
  },
  "italy": {
    name: "Italy", code: "IT", region: "Europe", emoji: "🇮🇹",
    networks: "TIM, Vodafone IT, WindTre, Iliad", speed: "5G",
    planFrom: "$4.99", description: "5G in Rome, Milan, Naples, Florence. 4G covers most of the country including Sicily and Sardinia.",
    tips: ["Coverage good in Tuscan countryside", "Rome and Florence well covered for tourists", "EU roaming included"],
  },
  "portugal": {
    name: "Portugal", code: "PT", region: "Europe", emoji: "🇵🇹",
    networks: "MEO, NOS, Vodafone PT", speed: "5G",
    planFrom: "$4.99", description: "5G in Lisbon and Porto. Excellent 4G nationwide including Algarve, Azores, and Madeira.",
    tips: ["Algarve beaches have great coverage", "Azores and Madeira covered", "Digital nomad favourite — great connectivity"],
  },
  "netherlands": {
    name: "Netherlands", code: "NL", region: "Europe", emoji: "🇳🇱",
    networks: "KPN, T-Mobile NL, Vodafone NL", speed: "5G",
    planFrom: "$4.99", description: "Dense 5G coverage. One of the most connected countries in Europe. Perfect nationwide coverage.",
    tips: ["5G everywhere", "Small country — even 1GB goes far", "Amsterdam has blazing fast speeds"],
  },
  "greece": {
    name: "Greece", code: "GR", region: "Europe", emoji: "🇬🇷",
    networks: "Cosmote, Vodafone GR, Wind", speed: "4G/5G",
    planFrom: "$4.99", description: "Good 4G/5G on mainland and major islands. Mykonos, Santorini, Crete well covered. Some remote islands limited.",
    tips: ["Major islands have good coverage", "Ferries often have coverage too", "EU roaming included in regional plans"],
  },
  "croatia": {
    name: "Croatia", code: "HR", region: "Europe", emoji: "🇭🇷",
    networks: "Hrvatski Telekom, A1 Croatia, Tele2", speed: "4G/5G",
    planFrom: "$4.99", description: "Good 4G along the Dalmatian coast. 5G in Zagreb. Dubrovnik, Split, Hvar well covered.",
    tips: ["Coastline has great coverage", "Dubrovnik and Split well connected", "EU roaming included"],
  },
  "iceland": {
    name: "Iceland", code: "IS", region: "Europe", emoji: "🇮🇸",
    networks: "Síminn, Vodafone IS, Nova", speed: "4G",
    planFrom: "$4.99", description: "4G along Ring Road and populated areas. Limited in highlands and interior. Good for most tourist routes.",
    tips: ["Ring Road has decent coverage", "Highlands have very limited connectivity", "Download offline maps for F-roads"],
  },
  "switzerland": {
    name: "Switzerland", code: "CH", region: "Europe", emoji: "🇨🇭",
    networks: "Swisscom, Sunrise, Salt", speed: "5G",
    planFrom: "$5.99", description: "Excellent 5G in cities. Strong 4G including mountain resorts. Swiss precision applies to mobile networks.",
    tips: ["5G in Zurich, Geneva, Bern", "Ski resorts have good coverage", "Not EU — separate plan may be needed"],
  },
  // ── Americas ─────────────────────────────────────────
  "canada": {
    name: "Canada", code: "CA", region: "North America", emoji: "🇨🇦",
    networks: "Rogers, Bell, Telus", speed: "5G",
    planFrom: "$4.99", description: "5G in major cities. 4G covers populated corridors. Limited in northern territories and remote areas.",
    tips: ["Coverage follows population — Trans-Canada Highway well covered", "5G in Toronto, Vancouver, Montreal", "National parks may have limited coverage"],
  },
  "mexico": {
    name: "Mexico", code: "MX", region: "North America", emoji: "🇲🇽",
    networks: "Telcel, AT&T Mexico, Movistar", speed: "4G/5G",
    planFrom: "$4.99", description: "Good 4G in cities and tourist areas. Telcel dominates with widest coverage. 5G launching in Mexico City.",
    tips: ["Telcel has best nationwide coverage", "Cancún, CDMX, Guadalajara well covered", "Very affordable data"],
  },
  "brazil": {
    name: "Brazil", code: "BR", region: "South America", emoji: "🇧🇷",
    networks: "Claro, Vivo, TIM, Oi", speed: "4G/5G",
    planFrom: "$4.99", description: "5G in São Paulo, Rio, Brasília. 4G in most urban areas. Amazon region has limited coverage.",
    tips: ["5G expanding fast in major cities", "Rio beaches have good coverage", "Consider larger plan for Brazil's size"],
  },
  "colombia": {
    name: "Colombia", code: "CO", region: "South America", emoji: "🇨🇴",
    networks: "Claro, Movistar, Tigo", speed: "4G",
    planFrom: "$4.99", description: "Good 4G in Bogotá, Medellín, Cartagena, Cali. Growing coverage across the country.",
    tips: ["Medellín digital nomad scene — great coverage", "Cartagena well covered for tourists", "Claro has widest reach"],
  },
  "argentina": {
    name: "Argentina", code: "AR", region: "South America", emoji: "🇦🇷",
    networks: "Claro, Personal, Movistar", speed: "4G",
    planFrom: "$4.99", description: "4G in Buenos Aires, Mendoza, Córdoba, Patagonia towns. Limited in remote Patagonia and Tierra del Fuego.",
    tips: ["Buenos Aires has good coverage", "Patagonia towns covered but gaps between them", "Download offline maps for road trips"],
  },
  "peru": {
    name: "Peru", code: "PE", region: "South America", emoji: "🇵🇪",
    networks: "Claro, Movistar, Entel", speed: "4G",
    planFrom: "$4.99", description: "4G in Lima, Cusco, Arequipa. Coverage along tourist routes. Limited in deep Amazon and high Andes.",
    tips: ["Cusco and Machu Picchu area covered", "Lima has good 4G", "Amazon lodges may have limited connectivity"],
  },
  "chile": {
    name: "Chile", code: "CL", region: "South America", emoji: "🇨🇱",
    networks: "Entel, Movistar, Claro, WOM", speed: "4G/5G",
    planFrom: "$4.99", description: "5G in Santiago. Good 4G along the length of the country. Atacama and Patagonia have coverage in towns.",
    tips: ["Santiago has 5G", "Coverage follows Pan-American Highway", "Easter Island has basic coverage"],
  },
  "costa-rica": {
    name: "Costa Rica", code: "CR", region: "Central America", emoji: "🇨🇷",
    networks: "Kolbi (ICE), Claro, Movistar", speed: "4G",
    planFrom: "$4.99", description: "Good 4G in San José, tourist beaches, and national park areas. Growing coverage nationwide.",
    tips: ["Manuel Antonio and Arenal have coverage", "Eco-lodges may have limited signal", "Very tourism-friendly connectivity"],
  },
  // ── Africa ───────────────────────────────────────────
  "south-africa": {
    name: "South Africa", code: "ZA", region: "Africa", emoji: "🇿🇦",
    networks: "Vodacom, MTN, Cell C, Telkom", speed: "4G/5G",
    planFrom: "$4.99", description: "5G in Johannesburg, Cape Town, Durban. Good 4G coverage in urban areas and along major routes.",
    tips: ["Vodacom has best coverage", "Safari lodges often have WiFi but cellular varies", "Cape Town has excellent coverage"],
  },
  "kenya": {
    name: "Kenya", code: "KE", region: "Africa", emoji: "🇰🇪",
    networks: "Safaricom, Airtel Kenya", speed: "4G",
    planFrom: "$4.99", description: "Safaricom dominates with good 4G in Nairobi, Mombasa, and tourist areas. M-Pesa mobile payments everywhere.",
    tips: ["Safaricom has by far the best coverage", "Masai Mara has basic coverage", "Nairobi tech hub has great connectivity"],
  },
  "morocco": {
    name: "Morocco", code: "MA", region: "Africa", emoji: "🇲🇦",
    networks: "Maroc Telecom, Orange Morocco, inwi", speed: "4G",
    planFrom: "$4.99", description: "Good 4G in Marrakech, Casablanca, Fez, Rabat. Coverage along tourist routes. Limited in Sahara.",
    tips: ["Maroc Telecom has widest reach", "Marrakech and tourist areas well covered", "Sahara desert has limited connectivity"],
  },
  "egypt": {
    name: "Egypt", code: "EG", region: "Africa", emoji: "🇪🇬",
    networks: "Vodafone Egypt, Orange Egypt, Etisalat", speed: "4G",
    planFrom: "$4.99", description: "Good 4G in Cairo, Alexandria, Luxor, Sharm El Sheikh. Coverage along Nile Valley tourist routes.",
    tips: ["Cairo has good coverage", "Pyramids area well covered", "Red Sea resorts have good signal"],
  },
  "tanzania": {
    name: "Tanzania", code: "TZ", region: "Africa", emoji: "🇹🇿",
    networks: "Vodacom Tanzania, Airtel Tanzania", speed: "4G",
    planFrom: "$4.99", description: "4G in Dar es Salaam, Arusha, Zanzibar. Coverage near Kilimanjaro and Serengeti entry points.",
    tips: ["Zanzibar has decent coverage", "Serengeti camps have limited signal", "Activate before safari trips"],
  },
};

const COUNTRY_SLUGS = Object.keys(COUNTRIES);

export function generateStaticParams() {
  return COUNTRY_SLUGS.map(country => ({ country }));
}

export function generateMetadata({ params }: { params: { country: string } }): Metadata {
  const data = COUNTRIES[params.country];
  if (!data) return { title: "eSIM Plans | Zoobicon" };
  return {
    title: `eSIM ${data.name} — Instant Data Plans from ${data.planFrom} | Zoobicon`,
    description: `Get instant eSIM data for ${data.name}. ${data.speed} on ${data.networks}. Activate in under 60 seconds. Plans from ${data.planFrom}. No physical SIM needed.`,
    openGraph: {
      title: `eSIM for ${data.name} ${data.emoji} | Zoobicon`,
      description: `Instant ${data.speed} data in ${data.name}. Plans from ${data.planFrom}/trip. Activate via QR code in seconds.`,
      url: `https://zoobicon.com/esim/${params.country}`,
    },
    alternates: { canonical: `https://zoobicon.com/esim/${params.country}` },
  };
}

export default function EsimCountryPage({ params }: { params: { country: string } }) {
  const data = COUNTRIES[params.country];

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Country not found</h1>
          <p className="text-white/40">Check our <a href="/products/esim" className="text-stone-400 underline">full eSIM coverage list</a>.</p>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Zoobicon eSIM — ${data.name}`,
    description: `Instant eSIM data plans for ${data.name}. ${data.speed} coverage on ${data.networks}. From ${data.planFrom}.`,
    url: `https://zoobicon.com/esim/${params.country}`,
    brand: { "@type": "Brand", name: "Zoobicon" },
    offers: { "@type": "Offer", price: data.planFrom.replace("$", ""), priceCurrency: "USD", availability: "https://schema.org/InStock" },
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <a href="/" className="text-sm font-bold">Zoobicon</a>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="/products/esim" className="hover:text-white/60">All eSIM Plans</a>
            <a href="/auth/signup" className="text-stone-400 hover:text-stone-300">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{data.emoji}</span>
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">{data.region}</p>
              <h1 className="text-3xl sm:text-4xl font-bold">eSIM for {data.name}</h1>
            </div>
          </div>
          <p className="text-white/50 max-w-2xl mb-8">{data.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-stone-400">{data.planFrom}</div>
              <div className="text-[10px] text-white/30 mt-1">Plans from</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-stone-400">{data.speed}</div>
              <div className="text-[10px] text-white/30 mt-1">Network speed</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-stone-400">&lt;60s</div>
              <div className="text-[10px] text-white/30 mt-1">Activation time</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-stone-400">QR</div>
              <div className="text-[10px] text-white/30 mt-1">Scan & connect</div>
            </div>
          </div>

          <a href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-stone-500 to-stone-600 font-semibold text-sm hover:from-stone-400 hover:to-stone-500 transition-all">
            Get eSIM for {data.name} →
          </a>
        </div>
      </section>

      {/* Networks */}
      <section className="py-12 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">Networks in {data.name}</h2>
          <p className="text-sm text-white/50 mb-6">Your Zoobicon eSIM connects to premium local carriers: <span className="text-white/70">{data.networks}</span></p>

          <h3 className="text-lg font-semibold mb-3">Travel Tips</h3>
          <ul className="space-y-2">
            {data.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                <span className="text-stone-400 mt-0.5">•</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-6">How to get eSIM for {data.name}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Choose a plan", desc: `Select a data plan for ${data.name}. Plans start from ${data.planFrom}.` },
              { step: "2", title: "Scan QR code", desc: "We send you a QR code instantly. Scan it with your phone camera to install the eSIM." },
              { step: "3", title: "Connect", desc: `Your eSIM activates immediately on ${data.speed} networks. Start using data in ${data.name}.` },
            ].map(s => (
              <div key={s.step} className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 text-center">
                <div className="w-8 h-8 rounded-full bg-stone-500/10 border border-stone-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-bold text-stone-400">{s.step}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-white/40">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other countries */}
      <section className="py-12 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">eSIM for other destinations</h2>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_SLUGS.filter(s => s !== params.country).map(slug => {
              const c = COUNTRIES[slug];
              return (
                <a key={slug} href={`/esim/${slug}`} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white hover:border-stone-500/30 transition-all">
                  {c.emoji} {c.name}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready for {data.name}?</h2>
          <p className="text-white/40 mb-6 text-sm">Get instant {data.speed} data. No SIM card. No store visits. Active in under 60 seconds.</p>
          <a href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-stone-500 to-stone-600 font-semibold text-sm hover:from-stone-400 hover:to-stone-500 transition-all">
            Get eSIM for {data.name} →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] text-white/20">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</div>
          <div className="text-[10px] text-white/20">&copy; 2026 Zoobicon. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
