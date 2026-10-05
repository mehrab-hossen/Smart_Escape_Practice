// Internationalization (i18n) for Smart Escape
// English and Bengali translations with Game & Simulation Features

const translations = {
  en: {
    appTitle: "Smart Escape",
    appSubtitle: "Tactical Evacuation Simulator",
    buildingBadge: "Facility",
    datasetInfo: "Nodes: {nodes} | Corridors: {edges} | Exits: {exits}",
    
    // Status and Alerts
    selectStartPrompt: "Select any room or junction as your starting location.",
    routeActive: "Optimal route locked to {exit} (Total Cost: {cost})",
    startBlocked: "Hazard Alert: Starting location is blocked!",
    noRoute: "Critical Alert: No evacuation route available!",
    dragDropHint: "Drop custom building.json or",
    browseFiles: "Browse file",
    reloadDefault: "Reset Default Map",
    
    // Simulation / Game Controls
    simTitle: "Evacuation Run",
    btnSimulate: "Run Evacuation",
    btnSimPause: "Pause",
    btnSimResume: "Resume",
    btnSimReset: "Stop & Rewind",
    simSpeed: "Speed",
    simStatusReady: "Ready to simulate evacuation",
    simStatusRunning: "Evacuee moving along optimal path...",
    simStatusPaused: "Simulation paused",
    simStatusSuccess: "Survivor safely evacuated through {exit}!",
    simStatusFailed: "Evacuation aborted: Path became blocked!",
    evacueeTimeElapsed: "Evacuation Time",
    evacueeCurrentLocation: "Current Node",
    soundToggle: "Sound FX",
    soundOn: "Sound On",
    soundOff: "Muted",

    // Emergency Scenarios (Game Missions)
    scenariosTitle: "Emergency Scenarios",
    scenariosSubtitle: "Simulate pre-configured crisis situations",
    scenarioNormal: "All Clear (Default)",
    scenarioFireJunctionA: "Fire at Junction A",
    scenarioNorthExitClosed: "North Exit Blocked",
    scenarioCorridorCollapse: "Central Corridors Collapsed",
    scenarioWorstCase: "Critical Multi-Hazard",
    applyScenario: "Trigger Event",

    // Modes & Canvas Controls
    modeTitle: "Cursor Tool",
    modeStart: "📍 Set Start",
    modeHazard: "⚠️ Toggle Hazard",
    resetSimulation: "Restore Initial State",
    clearAllHazards: "Clear All Hazards",
    resetView: "Center Map",
    zoomIn: "Zoom In (+)",
    zoomOut: "Zoom Out (−)",
    
    // Panels
    tabRoute: "Route & Run",
    tabHazards: "Hazard Matrix",
    tabScenarios: "Crisis Scenarios",
    routeSummaryTitle: "Optimal Route Analysis",
    routeNoneTitle: "No Route Available",
    startLocation: "Start Origin",
    destinationExit: "Safe Exit",
    totalEvacuationCost: "Total Cost Units",
    hopCount: "Corridors Traversed",
    pathSequence: "Node Sequence",
    stepByStepGuidance: "Turn-by-Turn Waypoints",
    initialStep: "Depart from {label} [{id}]",
    traversalStep: "Navigate to {label} [{id}] (Cost: {cost})",
    finalExitStep: "Safely exit via {label} [{id}] (Cost: {cost})",
    noRouteDetails: "All paths to open exits are obstructed by active hazards. Unblock corridors or reopen exits to restore connectivity.",
    startBlockedDetails: "The selected starting location is currently obstructed by a hazard. Clear the hazard or pick an alternative start node.",
    
    // Legend
    legendTitle: "Tactical Legend",
    legendRoom: "Room",
    legendJunction: "Junction",
    legendExit: "Open Exit",
    legendStart: "Start Location",
    legendRoute: "Active Route",
    legendBlockedNode: "Blocked Node",
    legendClosedExit: "Closed Exit",
    legendBlockedEdge: "Blocked Corridor",
    
    // Hazard Manager Panel
    hazardManagerTitle: "Hazard & Obstacle Matrix",
    hazardSubtitle: "Click elements directly on map or toggle switches below",
    tabAll: "All ({count})",
    tabNodes: "Rooms & Hubs ({count})",
    tabExits: "Exits ({count})",
    tabEdges: "Corridors ({count})",
    statusNormal: "Clear",
    statusBlocked: "Blocked",
    statusClosed: "Closed",
    statusOpen: "Open",
    blockAction: "Block",
    unblockAction: "Clear",
    closeAction: "Close",
    openAction: "Open",
    
    // Quick Instructions
    instructionsTitle: "Mission Protocol",
    inst1: "1. Select any room or junction to establish your survivor starting point.",
    inst2: "2. The engine instantly computes the lowest-cost escape route using Dijkstra's algorithm.",
    inst3: "3. Press 'Run Evacuation' to watch the live simulation run along the computed path.",
    inst4: "4. Trigger emergency hazards or scenarios to test dynamic real-time rerouting.",
    
    // Validation Errors
    errInvalidJSON: "Invalid JSON format: Please check file syntax.",
    errMissingBuilding: "Missing required 'building' name property.",
    errInvalidNodes: "Invalid 'nodes' property: Must be an array of 2 to 60 valid nodes.",
    errInvalidNodeItem: "Node #{index} is invalid: Requires unique 'id', 'label', valid 'type' (room|junction|exit), and numeric 'x', 'y'.",
    errDuplicateNodeId: "Duplicate node ID detected: '{id}'.",
    errNoExitNode: "Dataset must contain at least one node of type 'exit'.",
    errInvalidEdges: "Invalid 'edges' property: Must be an array of 1 to 150 valid edges.",
    errInvalidEdgeItem: "Edge #{index} is invalid: Requires unique 'id', valid 'from' and 'to' referencing existing nodes, and integer 'cost' > 0.",
    errDuplicateEdgeId: "Duplicate edge ID detected: '{id}'.",
    errSelfLoop: "Edge '{id}' connects node '{from}' to itself. Self-loops are not allowed.",
    errEdgeUnknownNode: "Edge '{id}' references non-existent node '{node}'.",
    errInvalidInitialState: "Invalid 'initial_state' object format.",
    errUnknownBlockedNode: "initial_state.blocked_nodes contains unknown node ID: '{id}'.",
    errUnknownBlockedEdge: "initial_state.blocked_edges contains unknown edge ID: '{id}'.",
    errUnknownClosedExit: "initial_state.closed_exits contains invalid or non-exit node ID: '{id}'.",
    
    // General
    close: "Dismiss",
    languageName: "English",
    costLabel: "Cost: {cost}"
  },
  
  bn: {
    appTitle: "স্মার্ট এস্কেপ",
    appSubtitle: "ট্যাকটিক্যাল জরুরি নির্গমন সিমুলেটর",
    buildingBadge: "স্থাপনা",
    datasetInfo: "নোড: {nodes} | করিডোর: {edges} | নির্গমন পথ: {exits}",
    
    // Status and Alerts
    selectStartPrompt: "শুরুর স্থান নির্ধারণ করতে যেকোনো কক্ষ বা সংযোগস্থল নির্বাচন করুন।",
    routeActive: "{exit}-এ পৌঁছানোর সর্বোত্তম পথ নির্ধারিত (মোট খরচ: {cost})",
    startBlocked: "বিপদ সংকেত: শুরুর অবস্থানটি অবরুদ্ধ বা ঝুঁকিপূর্ণ!",
    noRoute: "জরুরি সংকেত: কোনো নিরাপদ নির্গমন পথ পাওয়া যায়নি!",
    dragDropHint: "কাস্টম building.json ড্রপ করুন অথবা",
    browseFiles: "ফাইল নির্বাচন করুন",
    reloadDefault: "ডিফল্ট মানচিত্রে ফিরুন",
    
    // Simulation / Game Controls
    simTitle: "নির্গমন সিমুলেশন",
    btnSimulate: "নির্গমন শুরু করুন",
    btnSimPause: "বিরতি",
    btnSimResume: "পুনরায় চালু",
    btnSimReset: "থামুন ও রিওয়াইন্ড",
    simSpeed: "গতি",
    simStatusReady: "সিমুলেশন চালানোর জন্য প্রস্তুত",
    simStatusRunning: "উদ্ধারকারী সর্বোত্তম পথ ধরে অগ্রসর হচ্ছেন...",
    simStatusPaused: "সিমুলেশনে সাময়িক বিরতি",
    simStatusSuccess: "উদ্ধারকারী নিরাপদে {exit} দিয়ে বের হয়ে গেছেন!",
    simStatusFailed: "সিমুলেশন ব্যর্থ: পথটিতে নতুন বাধা সৃষ্টি হয়েছে!",
    evacueeTimeElapsed: "অতিবাহিত সময়",
    evacueeCurrentLocation: "বর্তমান অবস্থান",
    soundToggle: "শব্দ নিয়ন্ত্রণ",
    soundOn: "শব্দ চালু",
    soundOff: "শব্দ বন্ধ",

    // Emergency Scenarios (Game Missions)
    scenariosTitle: "জরুরি সংকট দৃশ্যপট",
    scenariosSubtitle: "পূর্বনির্ধারিত জরুরি পরিস্থিতি পরীক্ষা করুন",
    scenarioNormal: "সব স্বাভাবিক (ডিফল্ট)",
    scenarioFireJunctionA: "সংযোগস্থল A-তে অগ্নিকাণ্ড",
    scenarioNorthExitClosed: "উত্তর নির্গমন পথ বন্ধ",
    scenarioCorridorCollapse: "কেন্দ্রীয় করিডোর ধস",
    scenarioWorstCase: "চরম বহুমুখী দুর্যোগ",
    applyScenario: "ঘটনা প্রয়োগ করুন",

    // Modes & Canvas Controls
    modeTitle: "কার্সার টুল",
    modeStart: "📍 স্থান নির্বাচন",
    modeHazard: "⚠️ বাধা টগল",
    resetSimulation: "প্রাথমিক অবস্থায় রিসেট",
    clearAllHazards: "সকল বাধা অপসারণ",
    resetView: "মানচিত্র কেন্দ্রস্থ করুন",
    zoomIn: "জুম বড় (+)",
    zoomOut: "জুম ছোট (−)",
    
    // Panels
    tabRoute: "রুট ও সিমুলেশন",
    tabHazards: "বাধা নিয়ন্ত্রণ",
    tabScenarios: "সংকট দৃশ্যপট",
    routeSummaryTitle: "সর্বোত্তম রুট বিশ্লেষণ",
    routeNoneTitle: "কোনো পথ পাওয়া যায়নি",
    startLocation: "শুরুর অবস্থান",
    destinationExit: "নিরাপদ নির্গমন",
    totalEvacuationCost: "সর্বমোট খরচ ইউনিট",
    hopCount: "অতিক্রান্ত করিডোর",
    pathSequence: "নোড অনুক্রম",
    stepByStepGuidance: "ধাপভিত্তিক নির্দেশনা",
    initialStep: "{label} [{id}] থেকে যাত্রা শুরু করুন",
    traversalStep: "{label} [{id}]-এর দিকে অগ্রসর হন (খরচ: {cost})",
    finalExitStep: "{label} [{id}] দিয়ে নিরাপদে বেরিয়ে যান (খরচ: {cost})",
    noRouteDetails: "সকল উন্মুক্ত বহির্গমন পথ বাধার কারণে বিচ্ছিন্ন। করিডোর থেকে বাধা দূর করুন বা বন্ধ নির্গমন পথ পুনরায় উন্মুক্ত করুন।",
    startBlockedDetails: "নির্বাচিত শুরুর স্থানটি বাধার কারণে অনিরাপদ। বাধা অপসারণ করুন বা অন্য কোনো কক্ষ বেছে নিন।",
    
    // Legend
    legendTitle: "মানচিত্র নির্দেশিকা",
    legendRoom: "কক্ষ (Room)",
    legendJunction: "সংযোগস্থল (Junction)",
    legendExit: "উন্মুক্ত নির্গমন পথ",
    legendStart: "শুরুর অবস্থান",
    legendRoute: "সক্রিয় রুট",
    legendBlockedNode: "অবরুদ্ধ নোড",
    legendClosedExit: "বন্ধ নির্গমন পথ",
    legendBlockedEdge: "অবরুদ্ধ করিডোর",
    
    // Hazard Manager Panel
    hazardManagerTitle: "ঝুঁকি ও বাধা মেট্রিক্স",
    hazardSubtitle: "মানচিত্রে সরাসরি ক্লিক করুন অথবা নিচের সুইচ টগল করুন",
    tabAll: "সব ({count})",
    tabNodes: "কক্ষ ও সংযোগস্থল ({count})",
    tabExits: "নির্গমন পথ ({count})",
    tabEdges: "করিডোর ({count})",
    statusNormal: "স্বাভাবিক",
    statusBlocked: "অবরুদ্ধ",
    statusClosed: "বন্ধ",
    statusOpen: "খোলা",
    blockAction: "অবরোধ করুন",
    unblockAction: "উন্মুক্ত করুন",
    closeAction: "বন্ধ করুন",
    openAction: "খুলুন",
    
    // Quick Instructions
    instructionsTitle: "মিশন প্রোটোকল",
    inst1: "১. যেকোনো কক্ষ বা সংযোগস্থল নির্বাচন করে শুরুর অবস্থান চিহ্নিত করুন।",
    inst2: "২. ডিকস্ট্রা অ্যালগরিদমের মাধ্যমে তাৎক্ষণিকভাবে সর্বনিম্ন খরচের পথ বের হবে।",
    inst3: "৩. 'নির্গমন শুরু করুন' বাটনে ক্লিক করে জীবন্ত সিমুলেশন ও উদ্ধারকারী দেখুন।",
    inst4: "৪. যেকোনো সময় বিভিন্ন সংকট তৈরি করে স্বয়ংক্রিয় নতুন পথ পরীক্ষা করুন।",
    
    // Validation Errors
    errInvalidJSON: "ত্রুটিযুক্ত JSON ফরম্যাট: ফাইলের সিনট্যাক্স যাচাই করুন।",
    errMissingBuilding: "'building' প্রোপার্টি (ভবনের নাম) আবশ্যক।",
    errInvalidNodes: "ত্রুটিযুক্ত 'nodes': ২ থেকে ৬০টি বৈধ নোডের তালিকা প্রয়োজন।",
    errInvalidNodeItem: "নোড #{index} ত্রুটিযুক্ত: ইউনিক 'id', 'label', সঠিক 'type' (room|junction|exit), এবং সংখ্যাসূচক 'x', 'y' আবশ্যক।",
    errDuplicateNodeId: "একই নোড আইডি পুনরাবৃত্তি হয়েছে: '{id}'।",
    errNoExitNode: "ডেটাবেজে অন্তত একটি 'exit' ধরনের নোড থাকা আবশ্যক।",
    errInvalidEdges: "ত্রুটিযুক্ত 'edges': ১ থেকে ১৫০টি বৈধ সংযোগ থাকা প্রয়োজন।",
    errInvalidEdgeItem: "সংযোগ #{index} ত্রুটিযুক্ত: ইউনিক 'id', বিদ্যমান নোডের 'from' ও 'to', এবং ধনাত্মক পূর্ণসংখ্যা 'cost' (> 0) আবশ্যক।",
    errDuplicateEdgeId: "একই সংযোগ আইডি পুনরাবৃত্তি হয়েছে: '{id}'।",
    errSelfLoop: "সংযোগ '{id}'-এ নোড '{from}' নিজের সাথেই সংযুক্ত। এটি অনুমোদিত নয়।",
    errEdgeUnknownNode: "সংযোগ '{id}'-এ অজানা নোড '{node}' উল্লেখিত হয়েছে।",
    errInvalidInitialState: "'initial_state' অবজেক্টের ফরম্যাট সঠিক নয়।",
    errUnknownBlockedNode: "initial_state.blocked_nodes-এ অজানা নোড আইডি রয়েছে: '{id}'।",
    errUnknownBlockedEdge: "initial_state.blocked_edges-এ অজানা সংযোগ আইডি রয়েছে: '{id}'।",
    errUnknownClosedExit: "initial_state.closed_exits-এ অজানা বা নির্গমন নয় এমন আইডি রয়েছে: '{id}'।",
    
    // General
    close: "বন্ধ করুন",
    languageName: "বাংলা",
    costLabel: "খরচ: {cost}"
  }
};

let currentLang = 'en';

function getTranslation(key, params = {}) {
  const dict = translations[currentLang] || translations.en;
  let text = dict[key] || translations.en[key] || key;
  for (const [paramKey, paramVal] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramVal);
  }
  return text;
}

function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('smart_escape_lang', lang);
    return true;
  }
  return false;
}

function initLanguage() {
  const saved = localStorage.getItem('smart_escape_lang');
  if (saved && translations[saved]) {
    currentLang = saved;
  } else {
    currentLang = 'en';
  }
  return currentLang;
}
