/**
 * Bangkok Districts Data Enrichment Registry
 * Provides helper functions and static metadata for Bangkok's 50 districts.
 */

// Mapping of district codes (dcode) to their official District Group (กลุ่มเขต)
const DISTRICT_GROUPS = {
  // กรุงเทพกลาง (Bangkok Central)
  "1001": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Phra Nakhon
  "1002": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Dusit
  "1004": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Samphanthawong
  "1005": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Pom Prap Sattru Phai
  "1007": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Pathum Wan
  "1004": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Bang Rak (Note: GeoJSON may use different dcode for Bang Rak. Let's handle it fallback-friendly)
  "1013": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Phaya Thai
  "1014": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Huai Khwang
  "1026": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Din Daeng
  "1037": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Ratchathewi
  "1004": { zoneTh: "กรุงเทพกลาง", zoneEn: "Central Bangkok" }, // Bang Rak

  // กรุงเทพเหนือ (Bangkok North)
  "1030": { zoneTh: "กรุงเทพเหนือ", zoneEn: "Northern Bangkok" }, // Chatuchak
  "1005": { zoneTh: "กรุงเทพเหนือ", zoneEn: "Northern Bangkok" }, // Bang Khen
  "1036": { zoneTh: "กรุงเทพเหนือ", zoneEn: "Northern Bangkok" }, // Don Mueang
  "1041": { zoneTh: "กรุงเทพเหนือ", zoneEn: "Northern Bangkok" }, // Lak Si
  "1042": { zoneTh: "กรุงเทพเหนือ", zoneEn: "Northern Bangkok" }, // Sai Mai
  "1038": { zoneTh: "กรุงเทพเหนือ", zoneEn: "Northern Bangkok" }, // Lat Phrao
  "1045": { zoneTh: "กรุงเทพเหนือ", zoneEn: "Northern Bangkok" }, // Wang Thonglang

  // กรุงเทพใต้ (Bangkok South)
  "1033": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Khlong Toei
  "1039": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Wattana
  "1009": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Phra Khanong
  "1047": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Bang Na
  "1034": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Suan Luang
  "1032": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Prawet
  "1028": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Sathon
  "1029": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Yan Nawa
  "1031": { zoneTh: "กรุงเทพใต้", zoneEn: "Southern Bangkok" }, // Bang Kho Laem

  // กรุงเทพตะวันออก (Bangkok East)
  "1006": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Bang Kapi
  "1027": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Bueng Kum
  "1044": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Saphan Sung
  "1010": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Min Buri
  "1046": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Khlong Sam Wa
  "1043": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Khan Na Yao
  "1011": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Lat Krabang
  "1003": { zoneTh: "กรุงเทพตะวันออก", zoneEn: "Eastern Bangkok" }, // Nong Chok

  // กรุงธนเหนือ (Thon Buri North)
  "1015": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Thon Buri
  "1018": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Khlong San
  "1020": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Bangkok Noi
  "1016": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Bangkok Yai
  "1022": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Phasi Charoen
  "1019": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Taling Chan
  "1048": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Thawi Watthana
  "1025": { zoneTh: "กรุงธนเหนือ", zoneEn: "Thon Buri North" }, // Bang Phlat

  // กรุงธนใต้ (Thon Buri South)
  "1021": { zoneTh: "กรุงธนใต้", zoneEn: "Thon Buri South" }, // Chom Thong
  "1024": { zoneTh: "กรุงธนใต้", zoneEn: "Thon Buri South" }, // Rat Burana
  "1049": { zoneTh: "กรุงธนใต้", zoneEn: "Thon Buri South" }, // Thung Khru
  "1012": { zoneTh: "กรุงธนใต้", zoneEn: "Thon Buri South" }, // Bang Khun Thian
  "1050": { zoneTh: "กรุงธนใต้", zoneEn: "Thon Buri South" }, // Bang Bon
  "1040": { zoneTh: "กรุงธนใต้", zoneEn: "Thon Buri South" }, // Bang Khae
  "1023": { zoneTh: "กรุงธนใต้", zoneEn: "Thon Buri South" }  // Nong Khaem
};

/**
 * Deterministic pseudorandom generator based on seed (district code).
 * Ensures that metrics are consistent upon page reload, but look realistic.
 */
function getSeededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates smart city metrics for a district.
 * @param {string} dcode - The district code
 * @param {string} nameEn - English name of the district
 * @param {number} areaSqm - Area from GeoJSON (in sqm)
 * @param {number} population - Total population
 */
function generateDistrictMetrics(dcode, nameEn, areaSqm, population) {
  const idNum = parseInt(dcode) || 1000;
  const rand1 = getSeededRandom(idNum + 1);
  const rand2 = getSeededRandom(idNum + 2);
  const rand3 = getSeededRandom(idNum + 3);
  const rand4 = getSeededRandom(idNum + 4);

  // 1. PM2.5 Air Quality
  // Central/traffic districts tend to have higher PM2.5.
  // Outskirts/green districts (Nong Chok, Thawi Watthana) tend to have lower PM2.5.
  const isCentral = ["Pathum Wan", "Bang Rak", "Huai Khwang", "Din Daeng", "Ratchathewi", "Khlong Toei", "Sathon"].includes(nameEn);
  const basePm25 = isCentral ? 45 : 22;
  const pm25Val = Math.floor(basePm25 + rand1 * 35); // ranges 22-57 (Good to Moderate) or 45-80 (Unhealthy for sensitive groups)
  
  let pm25Status = "ดีมาก (Excellent)";
  let pm25Color = "#10b981"; // Emerald
  if (pm25Val > 50) {
    pm25Status = "เริ่มมีผลต่อสุขภาพ (Unhealthy for Sensitive)";
    pm25Color = "#f97316"; // Orange
  } else if (pm25Val > 37) {
    pm25Status = "ปานกลาง (Moderate)";
    pm25Color = "#eab308"; // Yellow
  } else if (pm25Val > 25) {
    pm25Status = "ดี (Satisfactory)";
    pm25Color = "#84cc16"; // Light Green
  }

  // 2. Flood Risk & Drainage
  // Districts near Chao Phraya River and low-lying canals have higher risk.
  const nearRiver = ["Phra Nakhon", "Khlong San", "Yan Nawa", "Bang Phlat", "Bang Kho Laem", "Dusit", "Sathon", "Khlong Toei", "Rat Burana"].includes(nameEn);
  const lowLyingEast = ["Lat Krabang", "Nong Chok", "Khlong Sam Wa", "Min Buri", "Prawet"].includes(nameEn);
  
  let floodScore = rand2;
  if (nearRiver) floodScore += 0.35;
  if (lowLyingEast) floodScore += 0.25;
  
  let floodLevel = "ปกติ (Safe)";
  let floodStatus = "ระบบระบายน้ำปกติ";
  let floodColor = "#3b82f6"; // Blue
  let waterLevelPercent = Math.floor(15 + rand3 * 35); // 15-50%
  
  if (floodScore > 0.9) {
    floodLevel = "วิกฤต (Critical)";
    floodStatus = "น้ำท่วมขังรอระบายสูงกว่า 20 ซม.";
    floodColor = "#ef4444"; // Red
    waterLevelPercent = Math.floor(80 + rand3 * 18); // 80-98%
  } else if (floodScore > 0.7) {
    floodLevel = "เตือนภัย (Warning)";
    floodStatus = "มีน้ำขังบนพื้นผิวจราจร 5-15 ซม.";
    floodColor = "#f97316"; // Orange
    waterLevelPercent = Math.floor(60 + rand3 * 19); // 60-79%
  } else if (floodScore > 0.45) {
    floodLevel = "เฝ้าระวัง (Watch)";
    floodStatus = "มีแนวโน้มน้ำล้นตลิ่ง/ท่อระบายน้ำ";
    floodColor = "#eab308"; // Yellow
    waterLevelPercent = Math.floor(40 + rand3 * 19); // 40-59%
  }

  // 3. Traffy Fondue Complaints
  // Proportional to population density and activity
  const baseComplaints = Math.floor((population || 50000) * 0.012);
  const totalComplaints = Math.floor(baseComplaints + rand4 * (baseComplaints * 0.5));
  const solvedRate = Math.floor(72 + rand1 * 23); // 72% to 95% solved rate
  const solvedCount = Math.floor(totalComplaints * (solvedRate / 100));
  const pendingCount = totalComplaints - solvedCount;

  // Breakdown of complaints (must sum to total)
  const complaintBreakdown = {
    roads: Math.floor(totalComplaints * (0.35 + rand2 * 0.1)),     // 35-45% roads
    trash: Math.floor(totalComplaints * (0.20 + rand3 * 0.08)),    // 20-28% trash
    lighting: Math.floor(totalComplaints * (0.15 + rand4 * 0.08)), // 15-23% lights
    flooding: Math.floor(totalComplaints * (0.10 + rand1 * 0.07)), // 10-17% flooding
  };
  complaintBreakdown.others = totalComplaints - (complaintBreakdown.roads + complaintBreakdown.trash + complaintBreakdown.lighting + complaintBreakdown.flooding);

  // Get zone
  const group = DISTRICT_GROUPS[dcode] || { zoneTh: "ไม่ระบุ", zoneEn: "Other" };

  return {
    zoneTh: group.zoneTh,
    zoneEn: group.zoneEn,
    pm25: {
      value: pm25Val,
      status: pm25Status,
      color: pm25Color
    },
    flood: {
      level: floodLevel,
      status: floodStatus,
      color: floodColor,
      waterLevelPercent: waterLevelPercent
    },
    complaints: {
      total: totalComplaints,
      solved: solvedCount,
      pending: pendingCount,
      rate: solvedRate,
      breakdown: complaintBreakdown
    }
  };
}

// Export mapping and generators if in Node.js context, or put on window for browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DISTRICT_GROUPS,
    generateDistrictMetrics
  };
} else {
  window.BKKDataRegistry = {
    DISTRICT_GROUPS,
    generateDistrictMetrics
  };
}
