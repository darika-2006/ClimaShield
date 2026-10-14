/**
 * ClimaShield TN - Tamil Nadu Districts Metadata & Master Registry
 * Covers all 38 districts of Tamil Nadu with spatial coordinates,
 * terrain classification, and flood/cyclone vulnerability profiles.
 */

export const MAJOR_CITIES = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
  "Tirunelveli",
  "Thoothukudi",
  "Vellore"
];

export const TN_DISTRICTS = {
  "Ariyalur": {
    name: "Ariyalur",
    lat: 11.1401,
    lon: 79.0786,
    zone: "Cauvery Basin / Inland Plains",
    terrain: "Sedimentary plains & limestone formations",
    floodProne: false,
    headquarters: "Ariyalur"
  },
  "Chengalpattu": {
    name: "Chengalpattu",
    lat: 12.6819,
    lon: 79.9888,
    zone: "Coastal / Coromandel Belt",
    terrain: "Coastal plains, backwaters & estuaries",
    floodProne: true,
    headquarters: "Chengalpattu"
  },
  "Chennai": {
    name: "Chennai",
    lat: 13.0827,
    lon: 80.2707,
    zone: "Metropolitan Coastal / Cyclone Belt",
    terrain: "Low-lying coastal plain, Cooum & Adyar rivers",
    floodProne: true,
    headquarters: "Chennai"
  },
  "Coimbatore": {
    name: "Coimbatore",
    lat: 11.0168,
    lon: 76.9558,
    zone: "Western Ghats / Plateau",
    terrain: "Inland plateau surrounded by Western Ghats",
    floodProne: false,
    headquarters: "Coimbatore"
  },
  "Cuddalore": {
    name: "Cuddalore",
    lat: 11.7480,
    lon: 79.7714,
    zone: "Severe Coastal Cyclone Zone",
    terrain: "Coastal lowlands & Pennaiyar river delta",
    floodProne: true,
    headquarters: "Cuddalore"
  },
  "Dharmapuri": {
    name: "Dharmapuri",
    lat: 12.1211,
    lon: 78.1582,
    zone: "North-West Plateau",
    terrain: "Hilly plateau & deciduous forest corridors",
    floodProne: false,
    headquarters: "Dharmapuri"
  },
  "Dindigul": {
    name: "Dindigul",
    lat: 10.3673,
    lon: 77.9803,
    zone: "Central Hills & Valleys",
    terrain: "Palani hills foothills & agricultural plains",
    floodProne: false,
    headquarters: "Dindigul"
  },
  "Erode": {
    name: "Erode",
    lat: 11.3410,
    lon: 77.7172,
    zone: "Bhavani-Kaveri River Basin",
    terrain: "Riverine plains & Western Ghats fringe",
    floodProne: false,
    headquarters: "Erode"
  },
  "Kallakurichi": {
    name: "Kallakurichi",
    lat: 11.7384,
    lon: 78.9639,
    zone: "Inland Agricultural Belt",
    terrain: "Kalrayan hills foothills & undulating plains",
    floodProne: false,
    headquarters: "Kallakurichi"
  },
  "Kanchipuram": {
    name: "Kanchipuram",
    lat: 12.8342,
    lon: 79.7036,
    zone: "Palar River Basin",
    terrain: "Alluvial plains & seasonal river tanks",
    floodProne: true,
    headquarters: "Kanchipuram"
  },
  "Kanyakumari": {
    name: "Kanyakumari",
    lat: 8.0883,
    lon: 77.5385,
    zone: "Southern Coastal / High Rainfall",
    terrain: "Coastal strip backed by Western Ghats peaks",
    floodProne: true,
    headquarters: "Nagercoil"
  },
  "Karur": {
    name: "Karur",
    lat: 10.9601,
    lon: 78.0766,
    zone: "Cauvery River Plain",
    terrain: "Flat riverine alluvial plain",
    floodProne: false,
    headquarters: "Karur"
  },
  "Krishnagiri": {
    name: "Krishnagiri",
    lat: 12.5186,
    lon: 78.2137,
    zone: "Deccan Plateau Fringe",
    terrain: "Rocky plateau, granite hills & valleys",
    floodProne: false,
    headquarters: "Krishnagiri"
  },
  "Madurai": {
    name: "Madurai",
    lat: 9.9252,
    lon: 78.1198,
    zone: "Vaigai River Basin",
    terrain: "Historic river valley & semi-arid plains",
    floodProne: false,
    headquarters: "Madurai"
  },
  "Mayiladuthurai": {
    name: "Mayiladuthurai",
    lat: 11.1018,
    lon: 79.6522,
    zone: "Coastal Delta / Flood Risk Zone",
    terrain: "Low-lying Cauvery delta coastline",
    floodProne: true,
    headquarters: "Mayiladuthurai"
  },
  "Nagapattinam": {
    name: "Nagapattinam",
    lat: 10.7672,
    lon: 79.8449,
    zone: "High Risk Coastal & Tsunami Belt",
    terrain: "Flat delta coastline, salt pans & mangroves",
    floodProne: true,
    headquarters: "Nagapattinam"
  },
  "Namakkal": {
    name: "Namakkal",
    lat: 11.2189,
    lon: 78.1674,
    zone: "Central Inland District",
    terrain: "Kolli hills & dry agricultural plains",
    floodProne: false,
    headquarters: "Namakkal"
  },
  "Nilgiris": {
    name: "Nilgiris",
    lat: 11.4916,
    lon: 76.7337,
    zone: "High Altitude Western Ghats",
    terrain: "Mountainous highland, tea estates & landslide slopes",
    floodProne: false,
    headquarters: "Udhagamandalam (Ooty)"
  },
  "Perambalur": {
    name: "Perambalur",
    lat: 11.2342,
    lon: 78.8831,
    zone: "Inland Dry Basin",
    terrain: "Undulating dry plains & badland topography",
    floodProne: false,
    headquarters: "Perambalur"
  },
  "Pudukkottai": {
    name: "Pudukkottai",
    lat: 10.3833,
    lon: 78.8167,
    zone: "Palk Strait Coast & Inland",
    terrain: "Coastal scrub, tanks & red loam plains",
    floodProne: true,
    headquarters: "Pudukkottai"
  },
  "Ramanathapuram": {
    name: "Ramanathapuram",
    lat: 9.3639,
    lon: 78.8395,
    zone: "Gulf of Mannar Coastal Zone",
    terrain: "Arid coastal strip, coral island fringing",
    floodProne: true,
    headquarters: "Ramanathapuram"
  },
  "Ranipet": {
    name: "Ranipet",
    lat: 12.9272,
    lon: 79.3333,
    zone: "Palar River Industrial Corridor",
    terrain: "River basin plains & industrial terrain",
    floodProne: false,
    headquarters: "Ranipet"
  },
  "Salem": {
    name: "Salem",
    lat: 11.6643,
    lon: 78.1460,
    zone: "North-Central Mineral Belt",
    terrain: "Inter-montane valley surrounded by Shevaroy hills",
    floodProne: false,
    headquarters: "Salem"
  },
  "Sivaganga": {
    name: "Sivaganga",
    lat: 9.8433,
    lon: 78.4833,
    zone: "Southern Inland Plain",
    terrain: "Dry agricultural plains & cascading tanks",
    floodProne: false,
    headquarters: "Sivaganga"
  },
  "Tenkasi": {
    name: "Tenkasi",
    lat: 8.9593,
    lon: 77.3160,
    zone: "Western Ghats Foothills",
    terrain: "Mountainous pass, waterfalls & dense greenery",
    floodProne: false,
    headquarters: "Tenkasi"
  },
  "Thanjavur": {
    name: "Thanjavur",
    lat: 10.7870,
    lon: 79.1378,
    zone: "Granary Cauvery Delta",
    terrain: "Extensive delta alluvial plain",
    floodProne: true,
    headquarters: "Thanjavur"
  },
  "Theni": {
    name: "Theni",
    lat: 10.0104,
    lon: 77.4768,
    zone: "Cumbum Valley / Western Ghats",
    terrain: "Inter-mountain valley with Cardamom hills border",
    floodProne: false,
    headquarters: "Theni"
  },
  "Thoothukudi": {
    name: "Thoothukudi",
    lat: 8.7642,
    lon: 78.1348,
    zone: "Deep South Gulf Coast & Port Zone",
    terrain: "Coastal plain, salt pans & industrial seafront",
    floodProne: true,
    headquarters: "Thoothukudi"
  },
  "Tiruchirappalli": {
    name: "Tiruchirappalli",
    lat: 10.7905,
    lon: 78.7047,
    zone: "Central Cauvery River Hub",
    terrain: "Alluvial river basin with granite rock outcrops",
    floodProne: false,
    headquarters: "Tiruchirappalli"
  },
  "Tirunelveli": {
    name: "Tirunelveli",
    lat: 8.7139,
    lon: 77.7567,
    zone: "Thamirabarani River Basin",
    terrain: "River valley extending to coastal plains",
    floodProne: true,
    headquarters: "Tirunelveli"
  },
  "Tirupathur": {
    name: "Tirupathur",
    lat: 12.4926,
    lon: 78.5678,
    zone: "Yelagiri Hills & Valley",
    terrain: "Hilly plateau & agricultural valleys",
    floodProne: false,
    headquarters: "Tirupathur"
  },
  "Tiruppur": {
    name: "Tiruppur",
    lat: 11.1085,
    lon: 77.3411,
    zone: "Noyyal River Industrial Plain",
    terrain: "Open undulating semi-arid plain",
    floodProne: false,
    headquarters: "Tiruppur"
  },
  "Tiruvallur": {
    name: "Tiruvallur",
    lat: 13.1432,
    lon: 79.9079,
    zone: "North Coastal / Reservoir Zone",
    terrain: "Coastal plain with major metropolitan reservoirs",
    floodProne: true,
    headquarters: "Tiruvallur"
  },
  "Tiruvannamalai": {
    name: "Tiruvannamalai",
    lat: 12.2253,
    lon: 79.0747,
    zone: "North-Central Inland",
    terrain: "Annamalai hills backdrop & rain-fed agricultural land",
    floodProne: false,
    headquarters: "Tiruvannamalai"
  },
  "Tiruvarur": {
    name: "Tiruvarur",
    lat: 10.7709,
    lon: 79.6375,
    zone: "Core Cauvery Delta Basin",
    terrain: "Flat riverine delta with dense canal network",
    floodProne: true,
    headquarters: "Tiruvarur"
  },
  "Vellore": {
    name: "Vellore",
    lat: 12.9165,
    lon: 79.1325,
    zone: "Palar River Valley",
    terrain: "Hilly basin surrounded by Eastern Ghats spurs",
    floodProne: false,
    headquarters: "Vellore"
  },
  "Viluppuram": {
    name: "Viluppuram",
    lat: 11.9401,
    lon: 79.4861,
    zone: "Central Coastal Fringe",
    terrain: "Coastal lowlands & agricultural plains",
    floodProne: true,
    headquarters: "Viluppuram"
  },
  "Virudhunagar": {
    name: "Virudhunagar",
    lat: 9.5872,
    lon: 77.9514,
    zone: "Southern Rain-Shadow Region",
    terrain: "Semi-arid black cotton soil plains",
    floodProne: false,
    headquarters: "Virudhunagar"
  }
};

export function getDistrictMeta(rawName) {
  if (!rawName) return null;
  const clean = String(rawName).trim();
  if (TN_DISTRICTS[clean]) return TN_DISTRICTS[clean];

  const aliases = {
    "The Nilgiris": "Nilgiris",
    "Tuticorin": "Thoothukudi",
    "Thoothukkudi": "Thoothukudi",
    "Trichy": "Tiruchirappalli",
    "Trichirappalli": "Tiruchirappalli",
    "Thiruvarur": "Tiruvarur",
    "Kanchi": "Kanchipuram",
    "Kancheepuram": "Kanchipuram",
    "Thiruvallur": "Tiruvallur",
    "Villupuram": "Viluppuram",
    "Kanniyakumari": "Kanyakumari",
    "Tirupattur": "Tirupathur",
  };

  if (aliases[clean] && TN_DISTRICTS[aliases[clean]]) {
    return TN_DISTRICTS[aliases[clean]];
  }

  const foundKey = Object.keys(TN_DISTRICTS).find(
    k => k.toLowerCase() === clean.toLowerCase() || clean.toLowerCase().includes(k.toLowerCase())
  );

  return foundKey ? TN_DISTRICTS[foundKey] : null;
}
