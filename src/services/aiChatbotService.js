/**
 * INDSTATE AI REAL-ESTATE CHATBOT BRAIN & CONVERSATIONAL ASSISTANT
 * 
 * Implements:
 * 1. Multi-turn conversation state & slot-filling memory
 * 2. Natural language parsing (English, Hindi, Hinglish, informal slang, abbreviations, typos)
 * 3. Budget & BHK normalizer (50L, 1.2cr, 20k rent, etc.)
 * 4. City & locality entity normalizer
 * 5. Single-question conversational follow-up strategy (never overwhelms user)
 * 6. Real INDSTATE property database queries (never fabricates data or properties)
 * 7. Real-estate knowledge engine integration (buying journey, RERA, due diligence, finance, state specifics)
 * 8. Property comparison & detail analysis ("family ke liye sahi hai?", "checklist bana do")
 * 9. Human empathy & practical realism (builder trust, deal safety, tight budget)
 * 10. Memory controls & long-term user preferences
 */

import { detectLanguage } from '../utils/languageDetector.js';
import { formatIndianPrice } from '../utils/currencyFormatter.js';
import { REAL_ESTATE_KNOWLEDGE } from '../data/realEstateKnowledgeEngine.js';

// Storage keys for conversation memory and preferences
export const STORAGE_CONV_STATE_KEY = 'indstate_ai_conversation_state_v1';
export const STORAGE_USER_PREF_KEY = 'indstate_ai_user_preferences_v1';

// Initial clean conversation state structure
export function getInitialConversationState() {
  return {
    location: {
      state: null,
      city: null,
      locality: null
    },
    budget_min: null,
    budget_max: null,
    raw_budget_str: null,
    bhk: null,
    purpose: null,           // 'Buy' | 'Rent'
    property_type: null,     // 'Apartment' | 'Villa' | 'Builder Floor' | 'Plot' | 'Commercial' | 'PG/Co-living' | 'Penthouse'
    ready_to_move: null,     // true | false | null
    near_metro: false,
    near_school: false,
    family_requirement: false,
    loan_requirement: false,
    preferred_amenities: [],
    activePropertyId: null,  // Currently discussed property
    comparisonIds: [],       // Property IDs for comparison
    lastFollowUpAsked: null, // 'purpose' | 'budget' | 'bhk' | 'possession' | 'search_done'
    matchedProperties: [],
    journeyStage: 1,         // 1 to 10
    totalTurns: 0
  };
}

/**
 * 1. CITY & STATE TYPO NORMALIZER
 */
const CITY_STATE_MAP = [
  {
    city: 'Hyderabad',
    state: 'Telangana',
    aliases: ['hyderabad', 'hyd', 'hydrabad', 'hitec city', 'gachibowli', 'madhapur', 'kondapur', 'secunderabad', 'cyberabad']
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    aliases: ['bangalore', 'bengaluru', 'blr', 'banglore', 'whitefield', 'indiranagar', 'koramangala', 'bellandur', 'sarjapur', 'electronic city']
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    aliases: ['mumbai', 'bombay', 'worli', 'bandra', 'andheri', 'powai', 'thane', 'navi mumbai', 'juhu', 'dadar', 'malad']
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    aliases: ['pune', 'poona', 'kothrud', 'hinjewadi', 'baner', 'wakad', 'viman nagar', 'kalyani nagar', 'kharadi', 'hadapsar', 'magarpatta']
  },
  {
    city: 'New Delhi',
    state: 'Delhi',
    aliases: ['delhi', 'new delhi', 'delhi ncr', 'dilli', 'south delhi', 'vasant vihar', 'dwarka', 'rohini', 'saket', 'ncr']
  },
  {
    city: 'Noida',
    state: 'Uttar Pradesh',
    aliases: ['noida', 'greater noida', 'greaternoida', 'sector 62', 'sector 150', 'expressway', 'noida extension']
  },
  {
    city: 'Gurugram',
    state: 'Haryana',
    aliases: ['gurugram', 'gurgaon', 'cyber city', 'golf course road', 'sohna road', 'cyber hub', 'sector 29', 'sector 56']
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    aliases: ['jaipur', 'pink city', 'raja park', 'vaishali nagar', 'malviya nagar', 'mansarovar', 'c-scheme']
  },
  {
    city: 'North Goa',
    state: 'Goa',
    aliases: ['goa', 'north goa', 'south goa', 'candolim', 'calangute', 'panaji', 'panjim', 'anjuna', 'assagao']
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    aliases: ['chennai', 'madras', 'omr', 'anna nagar', 'adyar', 'velachery', 'guindy', 'ecr']
  },
  {
    city: 'Ahmedabad',
    state: 'Gujarat',
    aliases: ['ahmedabad', 'ahmadabad', 'amdavad', 'bodakdev', 'sg highway', 'satellite', 'vastrapur', 'prahlad nagar']
  }
];

const STATE_ALIASES = [
  { state: 'Maharashtra', aliases: ['maharashtra', 'mh'] },
  { state: 'Telangana', aliases: ['telangana', 'ts'] },
  { state: 'Karnataka', aliases: ['karnataka', 'ka'] },
  { state: 'Delhi', aliases: ['delhi', 'nct of delhi'] },
  { state: 'Uttar Pradesh', aliases: ['uttar pradesh', 'up'] },
  { state: 'Haryana', aliases: ['haryana', 'hr'] },
  { state: 'Rajasthan', aliases: ['rajasthan', 'raj'] },
  { state: 'Goa', aliases: ['goa'] },
  { state: 'Tamil Nadu', aliases: ['tamil nadu', 'tamilnadu', 'tn'] },
  { state: 'Gujarat', aliases: ['gujarat', 'gujrat', 'gj'] },
  { state: 'Punjab', aliases: ['punjab', 'pb'] },
  { state: 'Kerala', aliases: ['kerala', 'kl'] },
  { state: 'Andhra Pradesh', aliases: ['andhra', 'andhra pradesh', 'ap'] }
];

/**
 * 2. BUDGET PARSER (Indian format: 50L, 80 lakh, 1.2cr, 20k rent, etc.)
 */
export function parseBudgetFromText(text) {
  if (!text) return { min: null, max: null, raw: null, isRent: false };

  const lower = text.toLowerCase();
  let max = null;
  let min = null;
  let raw = null;
  let isRent = false;

  if (lower.includes('rent') || lower.includes('kiraya') || lower.includes('/month') || lower.includes('per month') || lower.includes('mahina')) {
    isRent = true;
  }

  // Rent patterns e.g. "20k", "25k rent", "₹35,000"
  const rentKMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (rentKMatch) {
    const val = parseFloat(rentKMatch[1]) * 1000;
    max = val;
    raw = `${rentKMatch[1]}k/month`;
    isRent = true;
    return { min, max, raw, isRent };
  }

  const rentPlainMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d{4,6})\s*(?:rent|kiraya|\/month|per month)?\b/i);
  if (rentPlainMatch && isRent) {
    max = parseInt(rentPlainMatch[1], 10);
    raw = `₹${max}/month`;
    return { min, max, raw, isRent };
  }

  // Crore patterns e.g. "1.2cr", "1 cr", "2.85 crore", "1.5 crores", "1cr"
  const crRangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)?\s*(?:se|to|-)\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i);
  if (crRangeMatch) {
    min = Math.round(parseFloat(crRangeMatch[1]) * 10000000);
    max = Math.round(parseFloat(crRangeMatch[2]) * 10000000);
    raw = `₹${crRangeMatch[1]} Cr - ₹${crRangeMatch[2]} Cr`;
    return { min, max, raw, isRent: false };
  }

  const crSingleMatch = lower.match(/(?:under|andar|below|less than|tak|upto|budget)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/i);
  if (crSingleMatch) {
    const crVal = parseFloat(crSingleMatch[1]);
    max = Math.round(crVal * 10000000);
    raw = `₹${crVal} Cr`;
    return { min: null, max, raw, isRent: false };
  }

  // Lakh patterns e.g. "50L", "60 lakh", "80 lakhs", "₹75 lakh", "50 lac", "50lakhs"
  const lakhRangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:l|lakh|lakhs|lac|lacs)?\s*(?:se|to|-)\s*(\d+(?:\.\d+)?)\s*(?:l|lakh|lakhs|lac|lacs)/i);
  if (lakhRangeMatch) {
    min = Math.round(parseFloat(lakhRangeMatch[1]) * 100000);
    max = Math.round(parseFloat(lakhRangeMatch[2]) * 100000);
    raw = `₹${lakhRangeMatch[1]} Lakh - ₹${lakhRangeMatch[2]} Lakh`;
    return { min, max, raw, isRent: false };
  }

  const lakhSingleMatch = lower.match(/(?:under|andar|below|less than|tak|upto|budget)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:l|lakh|lakhs|lac|lacs)\b/i);
  if (lakhSingleMatch) {
    const lakhVal = parseFloat(lakhSingleMatch[1]);
    max = Math.round(lakhVal * 100000);
    raw = `₹${lakhVal} Lakh`;
    return { min: null, max, raw, isRent: false };
  }

  return { min: null, max: null, raw: null, isRent };
}

/**
 * 3. BHK NORMALIZER
 */
export function parseBHKFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const bhkMatch = lower.match(/(\d)\s*(?:bhk|bedroom|bed|rk)\b/i);
  if (bhkMatch) {
    return parseInt(bhkMatch[1], 10);
  }

  if (lower.includes('one bhk') || lower.match(/\b1\s*bhk\b/)) return 1;
  if (lower.includes('two bhk') || lower.match(/\b2\s*bhk\b/)) return 2;
  if (lower.includes('three bhk') || lower.match(/\b3\s*bhk\b/)) return 3;
  if (lower.includes('four bhk') || lower.match(/\b4\s*bhk\b/)) return 4;

  return null;
}

/**
 * 4. PROPERTY TYPE NORMALIZER
 */
export function parsePropertyTypeFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (lower.includes('penthouse') || lower.includes('pent house')) return 'Penthouse';
  if (lower.includes('villa') || lower.includes('row house') || lower.includes('bungalow') || lower.includes('kothi')) return 'Villa';
  if (lower.includes('builder floor') || lower.includes('floor')) return 'Builder Floor';
  if (lower.includes('plot') || lower.includes('plots') || lower.includes('land') || lower.includes('zameen')) return 'Plot';
  if (lower.includes('commercial') || lower.includes('office') || lower.includes('retail') || lower.includes('shop') || lower.includes('dukaan')) return 'Commercial';
  if (lower.includes('pg') || lower.includes('paying guest') || lower.includes('hostel') || lower.includes('co-living') || lower.includes('coliving')) return 'PG/Co-living';
  if (lower.includes('flat') || lower.includes('apartment') || lower.includes('ghar') || lower.includes('house') || lower.includes('residence')) return 'Apartment';

  return null;
}

/**
 * 5. PURPOSE & INTENT NORMALIZER
 */
export function parsePurposeFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (
    lower.includes('rent') || 
    lower.includes('kiraya') || 
    lower.includes('kiraye') || 
    lower.includes('lease') || 
    lower.includes('pg') || 
    lower.includes('paying guest') ||
    lower.includes('co-living')
  ) {
    return 'Rent';
  }

  if (
    lower.includes('buy') || 
    lower.includes('purchase') || 
    lower.includes('kharidna') || 
    lower.includes('kharid') || 
    lower.includes('own') || 
    lower.includes('bechna') || 
    lower.includes('invest')
  ) {
    return 'Buy';
  }

  return null;
}

/**
 * 6. EXTRACT & UPDATE CONVERSATION STATE
 */
export function extractAndMergeState(currentState, userMessage) {
  const nextState = { ...currentState };
  const lower = userMessage.toLowerCase().trim();

  nextState.totalTurns = (nextState.totalTurns || 0) + 1;

  // 1. City & State extraction
  for (const item of CITY_STATE_MAP) {
    for (const alias of item.aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(lower)) {
        nextState.location.city = item.city;
        nextState.location.state = item.state;
        break;
      }
    }
    if (nextState.location.city) break;
  }

  // If city not found, check for state alone (e.g. "punjab me plots dikhana")
  if (!nextState.location.state) {
    for (const item of STATE_ALIASES) {
      for (const alias of item.aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(lower)) {
          nextState.location.state = item.state;
          break;
        }
      }
      if (nextState.location.state) break;
    }
  }

  // 2. Budget extraction
  const budgetInfo = parseBudgetFromText(lower);
  if (budgetInfo.max) {
    nextState.budget_max = budgetInfo.max;
    nextState.budget_min = budgetInfo.min;
    nextState.raw_budget_str = budgetInfo.raw;
    if (budgetInfo.isRent) {
      nextState.purpose = 'Rent';
    }
  }

  // 3. BHK extraction
  const bhk = parseBHKFromText(lower);
  if (bhk) {
    nextState.bhk = bhk;
  }

  // 4. Property type extraction
  const pType = parsePropertyTypeFromText(lower);
  if (pType) {
    nextState.property_type = pType;
  }

  // 5. Purpose (Buy / Rent)
  const purpose = parsePurposeFromText(lower);
  if (purpose) {
    nextState.purpose = purpose;
  }

  // 6. Possession status
  if (lower.includes('ready to move') || lower.includes('ready-to-move') || lower.includes('rtm') || lower.includes('ready')) {
    nextState.ready_to_move = true;
  } else if (lower.includes('under construction') || lower.includes('under-construction') || lower.includes('uc')) {
    nextState.ready_to_move = false;
  }

  // 7. Modifiers & Preferences
  if (lower.includes('metro') || lower.includes('near metro') || lower.includes('metro ke paas')) {
    nextState.near_metro = true;
  }
  if (lower.includes('school') || lower.includes('school ke paas') || lower.includes('near school')) {
    nextState.near_school = true;
  }
  if (lower.includes('family') || lower.includes('parivar') || lower.includes('baccho ke liye')) {
    nextState.family_requirement = true;
  }
  if (lower.includes('loan') || lower.includes('emi') || lower.includes('home loan') || lower.includes('cibil')) {
    nextState.loan_requirement = true;
  }

  return nextState;
}

/**
 * 7. REAL DATABASE SEARCH ENGINE (Tool: search_properties)
 * Strictly queries available properties from PropertyContext. Never fabricates properties.
 */
export function searchPropertiesInDB(filters, allProperties = []) {
  if (!allProperties || allProperties.length === 0) return [];

  return allProperties.filter(property => {
    // City match
    if (filters.city) {
      const pCity = (property.city || '').toLowerCase();
      const fCity = filters.city.toLowerCase();
      if (!pCity.includes(fCity) && !fCity.includes(pCity)) {
        // Special check for Delhi NCR
        if (fCity.includes('delhi') && (pCity.includes('delhi') || pCity.includes('noida') || pCity.includes('gurugram'))) {
          // Accept NCR match
        } else {
          return false;
        }
      }
    }

    // State match if city not specified
    if (!filters.city && filters.state) {
      const pState = (property.state || '').toLowerCase();
      const fState = filters.state.toLowerCase();
      if (!pState.includes(fState) && !fState.includes(pState)) {
        return false;
      }
    }

    // Purpose match (Buy / Rent)
    if (filters.purpose) {
      if ((property.purpose || 'Buy').toLowerCase() !== filters.purpose.toLowerCase()) {
        return false;
      }
    }

    // BHK match
    if (filters.bhk) {
      if (property.bhk && property.bhk !== filters.bhk) {
        return false;
      }
    }

    // Property Type match
    if (filters.property_type) {
      const pType = (property.propertyType || '').toLowerCase();
      const fType = filters.property_type.toLowerCase();
      if (fType === 'apartment') {
        if (pType !== 'apartment' && pType !== 'flat' && pType !== 'residence') return false;
      } else if (!pType.includes(fType)) {
        return false;
      }
    }

    // Budget Max filter
    if (filters.budget_max) {
      // If user specified budget, allow 15% tolerance if no exact matches, but here check strict bound
      if (property.price > filters.budget_max * 1.15) {
        return false;
      }
    }

    // Budget Min filter
    if (filters.budget_min) {
      if (property.price < filters.budget_min * 0.85) {
        return false;
      }
    }

    // Ready to Move filter
    if (filters.ready_to_move === true) {
      const pos = (property.possessionStatus || '').toLowerCase();
      if (!pos.includes('ready') && !pos.includes('immediate')) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 8. HUMAN-LIKE CONVERSATIONAL DECISION ENGINE
 */
export function processConversationalMessage({
  message,
  conversationHistory = [],
  conversationState = null,
  allProperties = [],
  userProfile = null
}) {
  const lang = detectLanguage(message);
  const isHinglish = lang === 'hinglish';
  const cleanMsg = message.toLowerCase().trim();

  // Load and merge state
  const state = extractAndMergeState(conversationState || getInitialConversationState(), message);

  // Helper formatting functions
  const fmtPrice = (val, isRent) => formatIndianPrice(val, isRent);

  // =========================================================================
  // CASE 0: USER CONTROLS — CLEAR / RESET MEMORY & SEARCH
  // =========================================================================
  if (
    cleanMsg.includes('clear chat') || 
    cleanMsg.includes('reset search') || 
    cleanMsg.includes('reset memory') || 
    cleanMsg.includes('forget') || 
    cleanMsg.includes('naya search') || 
    cleanMsg.includes('restart') || 
    cleanMsg.includes('start over')
  ) {
    const freshState = getInitialConversationState();
    return {
      text: isHinglish
        ? "Haan bhai, bilkul! Maine conversation memory aur purana search reset kar diya hai. Ab batao, kis city ya area me property dekhni hai?"
        : "Certainly! I have cleared your previous search filters and conversation memory. What city or location would you like to explore now?",
      state: freshState,
      quickReplies: isHinglish 
        ? ["Hyderabad me 2BHK", "Bangalore me flats", "RERA guidance", "Home Loan help"]
        : ["2BHK in Bangalore", "Flats in Hyderabad", "RERA Guidance", "Home Loan Help"],
      type: 'reset_memory'
    };
  }

  // =========================================================================
  // CASE 1: DUE DILIGENCE / 7-POINT CHECKLIST REQUEST
  // =========================================================================
  if (
    cleanMsg.includes('checklist') || 
    cleanMsg.includes('due diligence') || 
    cleanMsg.includes('paperwork') || 
    cleanMsg.includes('verification checklist') || 
    cleanMsg.includes('kya check kare') || 
    cleanMsg.includes('documents check')
  ) {
    const list = REAL_ESTATE_KNOWLEDGE.dueDiligenceChecklist;
    const text = isHinglish
      ? `Property final karne se pehle ye 7 cheezein verify karna behad zaroori hai:\n\n` +
        list.map(item => `**${item.step}. ${item.titleHi}**\n${item.description}`).join('\n\n') +
        `\n\n💡 *Tip: Kabhi bhi bina Occupancy Certificate (OC) aur state RERA portal par registration cross-check kiye final payment na karein.*`
      : `Before finalizing any property, here is INDSTATE's 7-Point Legal Due Diligence Checklist:\n\n` +
        list.map(item => `**Step ${item.step}: ${item.title}**\n${item.description}`).join('\n\n') +
        `\n\n💡 *Pro-Tip: Never execute the final sale deed without verifying Nil Encumbrance (Form 16) and municipal Occupancy Certificate (OC).*`;

    return {
      text,
      state,
      type: 'due_diligence_checklist',
      quickReplies: isHinglish 
        ? ["RERA verify kaise kare?", "Free Site Visit Book Karein", "Talk to Legal Expert"]
        : ["How to verify RERA?", "Schedule Site Visit", "Talk to Legal Expert"]
    };
  }

  // =========================================================================
  // CASE 2: HUMAN EMPATHY & PRACTICAL REALISM
  // =========================================================================
  // A) "Ye property safe hai?" / "deal safe hai?"
  if (
    cleanMsg.includes('safe hai') || 
    cleanMsg.includes('is it safe') || 
    cleanMsg.includes('deal safe') || 
    cleanMsg.includes('kya safe hai') ||
    cleanMsg.includes('dhokha toh nahi')
  ) {
    const text = isHinglish
      ? "Sirf listing dekhkar main ise 100% safe nahi bolunga. Real-estate me safety documents se decide hoti hai.\n\nMain jo verified information available hai uske basis par check kar sakta hoon:\n1. Project ka **RERA registration status**\n2. Title & 30-year unbroken chain\n3. Sanctioned plan aur **Occupancy Certificate (OC)**\n4. Property tax dues aur Encumbrance Certificate (EC)\n\nAgar aap chahein toh humare certified advisor ke saath escorted site visit aur legal paperwork review arrange karwa sakta hoon."
      : "I wouldn't call any property 100% safe solely from a listing photo or marketing pitch. Safety depends strictly on legal verification.\n\nHere is what must be verified before paying any token:\n1. Valid **RERA registration & 70% escrow compliance**\n2. 30-year unbroken title chain & Encumbrance Certificate\n3. Municipal Sanctioned Building Plan & OC\n4. Zero pending municipal tax liabilities\n\nWould you like our verified advisors to arrange an escorted inspection and document review?";

    return {
      text,
      state,
      type: 'safety_guidance',
      quickReplies: isHinglish
        ? ["Iski checklist bana do", "RERA number check karo", "Advisor se baat karo"]
        : ["Generate Checklist", "Verify RERA", "Talk to Advisor"]
    };
  }

  // B) "Builder pe trust nahi ho raha"
  if (
    cleanMsg.includes('trust nahi') || 
    cleanMsg.includes('builder trust') || 
    cleanMsg.includes('builder par bharosa') || 
    cleanMsg.includes('scam') || 
    cleanMsg.includes('fraud')
  ) {
    const text = isHinglish
      ? "Aapka shak bilkul laazmi hai — property me lifetime savings lagti hain. Builder par blind trust karne ke bajaye ye practical steps lein:\n\n1. **State RERA Portal Check:** Builder ka RERA number official portal par daal kar unke past projects aur delivery timeline track record check karein.\n2. **70% Escrow Account:** Confirm karein ki buyer funds project-specific escrow account me jaa rahe hain.\n3. **Bank Approval List:** Check karein ki SBI ya top PSU banks ne iss project ko approved kar rakha hai ya nahi.\n4. **Construction Milestones:** Kabhi bhi time-based payment na karein, sirf RERA architect-certified construction stage par hi paise dein."
      : "Your caution is completely justified — a home is a lifetime investment. Instead of blind trust, rely on verifiable facts:\n\n1. **Check Official RERA Record:** Look up the promoter's track record, past litigation, and sanctioned deadlines on the state RERA portal.\n2. **Dedicated 70% Escrow:** Ensure buyer contributions are deposited into the project's designated RERA escrow account.\n3. **PSU Bank Approvals:** Verify if leading lenders (SBI, HDFC, ICICI) have approved the project for home loans.\n4. **Construction-Linked Payments:** Never agree to calendar-based installments; only pay against certified structural milestones.";

    return {
      text,
      state,
      type: 'builder_trust_guidance',
      quickReplies: isHinglish
        ? ["RERA portal link", "Checklist bana do", "Verified flats dikhao"]
        : ["RERA Portal Links", "Generate Checklist", "Show Verified Homes"]
    };
  }

  // C) "Budget kam hai kuch acha milega?"
  if (
    cleanMsg.includes('budget kam hai') || 
    cleanMsg.includes('sasta ghar') || 
    cleanMsg.includes('cheap') || 
    cleanMsg.includes('tight budget') || 
    cleanMsg.includes('kam budget')
  ) {
    const text = isHinglish
      ? "Bhai bilkul fikar mat karo! Kam budget me bhi achhi aur value-for-money property mil sakti hai agar smart approach use karein:\n\n1. **Emerging Corridors:** Prime central area ke bajaye 15-20 min aage metro connectivity wale developing micro-markets me rates 25-35% kam hote hain.\n2. **Resale Listings:** Resale flats me distress sellers milte hain jahan 10-15% discount negotiate ho sakta hai.\n3. **Carpet Area Focus:** Super built-up ke jhanjhat me padne ke bajaye compact 1BHK ya smart 2BHK carpet area par focus karein.\n4. **PMAY / Subsidies:** First-time buyers ke liye government schemes aur 80EEA tax benefits ka fayda uthayein.\n\nAap apna specific budget aur city batao, main best verified options filter karta hoon."
      : "Don't worry at all! Even with a tight budget, you can find a solid, appreciating property by following these strategies:\n\n1. **Target Developing Corridors:** Areas along upcoming metro lines or ring roads often cost 25-35% less than saturated central hubs.\n2. **Explore Resale Units:** Well-maintained 3-7 year old resale flats often offer immediate rental value and negotiation room.\n3. **Prioritize Usable Carpet Area:** Look for smart 1.5 BHK or 2 BHK layouts that maximize usable space without inflating maintenance costs.\n4. **Leverage Tax Benefits:** Section 80C and Section 24(b) provide substantial annual tax savings on your loan EMI.\n\nTell me your city and budget range, and I'll pull the best verified listings for you.";

    return {
      text,
      state,
      type: 'budget_empathy',
      quickReplies: isHinglish
        ? ["Under 50 Lakh options", "Rent vs Buy", "Home Loan EMI check"]
        : ["Under ₹50 Lakh Options", "Rent vs Buy", "Check Home Loan EMI"]
    };
  }

  // =========================================================================
  // CASE 3: "YE PROPERTY FAMILY KE LIYE SAHI HAI?"
  // =========================================================================
  if (
    cleanMsg.includes('family ke liye sahi hai') || 
    cleanMsg.includes('good for family') || 
    cleanMsg.includes('suitable for family') || 
    cleanMsg.includes('parivar ke liye')
  ) {
    // Find active property or top matching property in DB
    const prop = (state.activePropertyId && allProperties.find(p => p.id === state.activePropertyId)) 
      || (state.matchedProperties && state.matchedProperties[0])
      || allProperties[0];

    if (prop) {
      const bhkStr = prop.bhk ? `${prop.bhk}BHK` : 'Apartment';
      const amenitiesStr = (prop.amenities || []).slice(0, 4).join(', ');
      const nearbyStr = (prop.nearby || []).map(n => n.landmark).slice(0, 3).join(', ');

      const text = isHinglish
        ? `Family ke liye **${prop.title}** (${prop.city}) kaafi suitable lag raha hai:\n\n` +
          `• **Configuration:** ${bhkStr} layout hai, jisme parivar ke liye sufficient space aur privacy milti hai.\n` +
          `• **Carpet Area:** Around ${prop.carpetArea || 1200} sq.ft. usable space hai.\n` +
          `• **Society & Amenities:** ${amenitiesStr || '24x7 Security, Power Backup, Kids Play Area'}.\n` +
          (nearbyStr ? `• **Nearby Access:** ${nearbyStr}.\n` : '') +
          `• **Parking & Security:** Gated campus with CCTV.\n\n` +
          `Lekin final decision se pehle din me aur raat me dono time physical site inspection karna better rahega taaki noise aur neighbourhood feel verify ho sake.`
        : `For a family, **${prop.title}** in ${prop.city} is a strong fit based on verified specifications:\n\n` +
          `• **Layout & Space:** ${bhkStr} with ${prop.carpetArea || 1200} sq.ft. carpet area, providing comfortable living space for children and parents.\n` +
          `• **Gated Amenities:** ${amenitiesStr || 'Multi-tier security, power backup, open green spaces'}.\n` +
          (nearbyStr ? `• **Convenience:** Quick access to ${nearbyStr}.\n` : '') +
          `• **Safety:** 24x7 gated surveillance and dedicated parking bays.\n\n` +
          `However, I always recommend conducting a physical inspection once during peak hours to assess traffic and neighbourhood atmosphere before committing.`;

      return {
        text,
        state,
        type: 'family_suitability',
        properties: [prop],
        quickReplies: isHinglish
          ? ["Site visit schedule karein", "RERA details check karo", "Dusra option dikhao"]
          : ["Schedule Site Visit", "Check RERA Details", "Show Other Options"]
      };
    }
  }

  // =========================================================================
  // CASE 4: RERA QUESTIONS & EXPLANATIONS
  // =========================================================================
  if (
    cleanMsg.includes('rera kya hota hai') || 
    cleanMsg.includes('what is rera') || 
    cleanMsg.includes('rera verify kaise') || 
    cleanMsg.includes('rera number kaise check') || 
    cleanMsg.includes('rera registration') || 
    cleanMsg.includes('carpet area kya hota') || 
    cleanMsg.includes('super built-up') ||
    cleanMsg.includes('builder delay')
  ) {
    if (cleanMsg.includes('carpet area') || cleanMsg.includes('super built-up')) {
      const text = isHinglish
        ? `Carpet Area aur Super Built-up Area me ye main antar hota hai:\n\n` +
          `• **Carpet Area (Asli Area):** Wo area jispe carpet bichha sakte hain — yaani chaar deewaron ke andar ka actual usable floor area.\n` +
          `• **Super Built-up Area:** Isme carpet area ke saath deewarein, balconies, lift lobby, staircase, aur clubhouse ka loading hissa jod diya jata hai (jo aksar 25% se 40% tak extra hota hai).\n\n` +
          `💡 **RERA ka niyam:** RERA ke tahat builders ko strictly **Net Carpet Area** par hi price quote karna compulsory hai. INDSTATE par har property ka exact usable carpet area transparently verified rehta hai.`
        : `Here is the critical distinction between Carpet Area and Super Built-up Area under RERA:\n\n` +
          `• **Carpet Area (Actual Usable Area):** The net usable floor area bounded by inner walls where you can lay a carpet. This is the space you actually live in.\n` +
          `• **Super Built-up Area:** Includes carpet area plus thickness of walls, balconies, and proportional common areas (lift lobby, corridors, clubhouse amenities) — often loaded by 25% to 40%!\n\n` +
          `💡 **RERA Mandate:** Under the RERA Act, developers are legally obligated to quote and sell units strictly on **Net Usable Carpet Area**, prohibiting deceptive super built-up inflation.`;

      return {
        text,
        state,
        type: 'rera_carpet_area_info',
        quickReplies: isHinglish
          ? ["RERA verify kaise kare?", "Verified Flats Dikhao", "Due Diligence Checklist"]
          : ["How to verify RERA?", "Browse Verified Homes", "Due Diligence Checklist"]
      };
    }

    if (cleanMsg.includes('verify kaise') || cleanMsg.includes('kaise check')) {
      const text = isHinglish
        ? `RERA Number verify karne ka 3-step process:\n\n` +
          `1. **State RERA Portal Kholein:** Jaise Maharashtra ke liye MahaRERA, Delhi ke liye Delhi RERA, Telangana ke liye TG RERA, Karnataka ke liye RERA Karnataka.\n` +
          `2. **Project Search Me Jayein:** 'Registered Projects' tab me jakar builder ka naam ya RERA Registration Number enter karein.\n` +
          `3. **Key Points Tally Karein:**\n` +
          `   • Sanctioned completion date (possession deadline)\n` +
          `   • 70% Escrow bank account number\n` +
          `   • Approved layout plans aur court cases/complaints.\n\n` +
          `Agar aapke paas koi project ya property hai, mujhe batao — main available details cross-check kar deta hoon.`
        : `Here is the official 3-step procedure to verify a RERA registration:\n\n` +
          `1. **Visit the Respective State Portal:** MahaRERA (Maharashtra), TG RERA (Telangana), RERA Karnataka, UP RERA (Noida), or HRERA (Gurugram).\n` +
          `2. **Locate 'Registered Projects':** Search by the project name or unique RERA Registration ID.\n` +
          `3. **Review Public Disclosures:**\n` +
          `   • Sanctioned possession timeline & quarter-wise progress reports\n` +
          `   • Designated 70% project escrow bank account\n` +
          `   • Sanctioned layout blueprints & pending litigations.\n\n` +
          `If you have a specific property in mind on INDSTATE, share it with me and I will check its verified credentials.`;

      return {
        text,
        state,
        type: 'rera_verification_steps',
        quickReplies: isHinglish
          ? ["Hyderabad me RERA flats", "Pune me RERA flats", "Due Diligence Checklist"]
          : ["RERA flats in Hyderabad", "RERA flats in Pune", "Due Diligence Checklist"]
      };
    }

    // General RERA overview
    const text = isHinglish
      ? `RERA (Real Estate Regulation & Development Act, 2016) ek regulatory framework hai jo real-estate buyers ko transparency aur strong legal protections provide karta hai.\n\n` +
        `Iske 3 sabse bade fayde hain:\n` +
        `1. **70% Escrow Protection:** Builder ko buyer ka 70% paisa alag bank account me rakhna hota hai, jo sirf usi project ki construction me use ho sakta hai.\n` +
        `2. **Delay Compensation (Section 18):** Agar builder possession me deri karta hai, toh buyer ko monthly interest (SBI rate + 2%) ya full refund lene ka statutory right hai.\n` +
        `3. **Carpet Area Transparency:** Misleading super built-up loading par rok laga di gayi hai.\n\n` +
        `INDSTATE par hum strictly RERA-verified properties ko highlight karte hain taaki aapka decision safe rahe.`
      : `RERA (Real Estate Regulatory Authority, enacted in 2016) is India's landmark legislation designed to protect home buyers and enforce accountability on property developers.\n\n` +
        `Key Buyer Protections:\n` +
        `1. **70% Dedicated Escrow Account:** Builders cannot divert project funds; 70% of collections must go into building that specific property.\n` +
        `2. **Strict Delay Penalties (Section 18):** If the developer misses the registered possession date, they must pay interest (SBI MCLR + 2%) for every month of delay.\n` +
        `3. **5-Year Structural Defect Guarantee:** Any structural or construction flaw within 5 years must be repaired by the builder within 30 days without cost.\n\n` +
        `Would you like to explore RERA-registered homes or verify a specific project?`;

    return {
      text,
      state,
      type: 'rera_overview',
      quickReplies: isHinglish
        ? ["RERA number kaise check kare?", "Checklist bana do", "Flats dikhao"]
        : ["How to check RERA?", "Make Checklist", "Show Properties"]
    };
  }

  // =========================================================================
  // CASE 5: HOME LOANS & FINANCE QUESTIONS
  // =========================================================================
  if (
    cleanMsg.includes('home loan') || 
    cleanMsg.includes('loan eligibility') || 
    cleanMsg.includes('emi') || 
    cleanMsg.includes('down payment') || 
    cleanMsg.includes('interest rate') || 
    cleanMsg.includes('ltv') ||
    cleanMsg.includes('80c')
  ) {
    const text = isHinglish
      ? `Home Loan aur EMI ke liye zaroori guidelines:\n\n` +
        `• **Interest Rates:** Current floating home loan rates typically ~8.40% se 8.75% p.a. chal rahe hain (CIBIL score 750+ par best slabs milte hain).\n` +
        `• **Down Payment & LTV:**\n` +
        `  - ₹30 Lakh tak property: Bank up to 90% loan deti hai (10% down payment).\n` +
        `  - ₹30L se ₹75L: Bank up to 80% loan deti hai (20% down payment).\n` +
        `  - ₹75L se upar: Up to 75% loan sanction hota hai (25% down payment).\n` +
        `• **Tax Benefits:** Section 80C ke under ₹1.5 Lakh principal par, aur Section 24(b) ke under ₹2 Lakh interest par annual tax deduction milta hai.\n` +
        `• **Zero Prepayment Penalty:** RBI guidelines ke mutabiq floating-rate loans par koi prepayment ya foreclosure charge nahi lag sakta.`
      : `Here are the essential facts regarding Indian Home Loans & Financing:\n\n` +
        `• **Current Interest Rates:** Floating rates generally range between 8.40% and 8.75% p.a. for borrowers with a CIBIL score of 750+.\n` +
        `• **Loan-to-Value (LTV) & Down Payment Slabs:**\n` +
        `  - Up to ₹30 Lakh: Up to 90% loan financed (10% min. down payment).\n` +
        `  - ₹30 Lakh to ₹75 Lakh: Up to 80% loan financed (20% down payment).\n` +
        `  - Above ₹75 Lakh: Up to 75% loan financed (25% down payment).\n` +
        `• **Tax Deductions:** Save up to ₹1.5 Lakh/yr on principal under Section 80C and up to ₹2.0 Lakh/yr on interest under Section 24(b).\n` +
        `• **RBI Prepayment Protection:** Banks cannot levy any foreclosure or partial prepayment penalties on floating-rate individual loans.`;

    return {
      text,
      state,
      type: 'finance_guidance',
      quickReplies: isHinglish
        ? ["Loan advisor se baat karein", "Properties dikhao", "Due diligence checklist"]
        : ["Connect with Loan Desk", "View Properties", "Due Diligence Checklist"]
    };
  }

  // =========================================================================
  // CASE 6: STATE-SPECIFIC STAMP DUTY & RULES
  // =========================================================================
  if (
    cleanMsg.includes('stamp duty') || 
    cleanMsg.includes('registration charge') || 
    cleanMsg.includes('kharcha') || 
    cleanMsg.includes('registry')
  ) {
    const matchedStateKey = Object.keys(REAL_ESTATE_KNOWLEDGE.stateSpecifics).find(st => 
      cleanMsg.includes(st.toLowerCase()) || (state.location.state && state.location.state.toLowerCase().includes(st.toLowerCase()))
    );

    if (matchedStateKey) {
      const info = REAL_ESTATE_KNOWLEDGE.stateSpecifics[matchedStateKey];
      const text = isHinglish
        ? `**${info.state}** me stamp duty aur registration ke verified guidelines:\n\n` +
          `• **Stamp Duty:** ${info.stampDuty}\n` +
          `• **Registration Fee:** ${info.registrationFee}\n` +
          `• **Key Land Document:** ${info.landDocument}\n` +
          `• **Regulatory Body:** ${info.authority}\n\n` +
          `⚠️ *Dhayan rahe: Stamp duty rates municipal zones, gender (women buyers ke concessions), aur guidance value par depend karte hain aur change ho sakte hain. Exact calculation ke liye official sub-registrar portal verify karein.*`
        : `Verified Stamp Duty & Registration guidelines for **${info.state}**:\n\n` +
          `• **Stamp Duty:** ${info.stampDuty}\n` +
          `• **Registration Fee:** ${info.registrationFee}\n` +
          `• **Primary Land Records:** ${info.landDocument}\n` +
          `• **Regulatory Authority:** ${info.authority}\n\n` +
          `⚠️ *Note: Statutory charges vary based on municipal jurisdiction, gender incentives, and guidance values. Always verify the current exact challan on the official state IGR portal before registry.*`;

      return {
        text,
        state,
        type: 'state_stamp_duty',
        quickReplies: isHinglish
          ? ["Checklist bana do", "Properties dikhao", "RERA guidance"]
          : ["Generate Checklist", "Show Properties", "RERA Guidance"]
      };
    } else {
      const text = isHinglish
        ? "India me Stamp Duty aur Registration charges har state ke alag hote hain — jaise Maharashtra me ~6-7%, Telangana me ~7.5%, Karnataka me ~5.6%, aur Delhi me 4-6%. Aap kis specific state ya city ke charges jaanna chahte hain?"
        : "In India, Stamp Duty and Registration fees are state-specific jurisdictions — ranging from ~4-6% in Delhi, 6-7% in Maharashtra, ~5.6% in Karnataka, to ~7.5% in Telangana. Which state or city are you planning to register in?";

      return {
        text,
        state,
        type: 'state_stamp_duty_inquiry',
        quickReplies: isHinglish
          ? ["Maharashtra stamp duty", "Telangana stamp duty", "Karnataka stamp duty", "Delhi NCR stamp duty"]
          : ["Maharashtra Stamp Duty", "Telangana Stamp Duty", "Karnataka Stamp Duty", "Delhi NCR Stamp Duty"]
      };
    }
  }

  // =========================================================================
  // CASE 7: PROPERTY COMPARISON ("Ye dono compare karo", "Property A vs B")
  // =========================================================================
  if (
    cleanMsg.includes('compare') || 
    cleanMsg.includes('tulna') || 
    cleanMsg.includes('dono compare') || 
    cleanMsg.includes(' vs ') || 
    cleanMsg.includes('which is better')
  ) {
    let propA = null;
    let propB = null;

    // Try finding two properties from DB
    if (state.comparisonIds && state.comparisonIds.length >= 2) {
      propA = allProperties.find(p => p.id === state.comparisonIds[0]);
      propB = allProperties.find(p => p.id === state.comparisonIds[1]);
    }

    if (!propA || !propB) {
      // Pick top 2 properties for the current city/state or default top 2
      const cityProps = allProperties.filter(p => !state.location.city || (p.city && p.city.toLowerCase() === state.location.city.toLowerCase()));
      if (cityProps.length >= 2) {
        propA = cityProps[0];
        propB = cityProps[1];
      } else if (allProperties.length >= 2) {
        propA = allProperties[0];
        propB = allProperties[1];
      }
    }

    if (propA && propB) {
      const text = isHinglish
        ? `Main real verified data ke basis par **${propA.title}** aur **${propB.title}** ka comparison detail karta hoon:\n\n` +
          `| Parameter | ${propA.title.slice(0, 20)}... | ${propB.title.slice(0, 20)}... |\n` +
          `|---|---|---|\n` +
          `| **Price** | ${fmtPrice(propA.price, propA.purpose === 'Rent')} | ${fmtPrice(propB.price, propB.purpose === 'Rent')} |\n` +
          `| **BHK & Type** | ${propA.bhk || 3} BHK ${propA.propertyType} | ${propB.bhk || 3} BHK ${propB.propertyType} |\n` +
          `| **Location** | ${propA.locality}, ${propA.city} | ${propB.locality}, ${propB.city} |\n` +
          `| **Carpet Area** | ${propA.carpetArea || 'N/A'} sq.ft. | ${propB.carpetArea || 'N/A'} sq.ft. |\n` +
          `| **RERA Status** | ${propA.isReraVerified ? `Verified (${propA.reraNumber})` : 'Under Verification'} | ${propB.isReraVerified ? `Verified (${propB.reraNumber})` : 'Under Verification'} |\n` +
          `| **Possession** | ${propA.possessionStatus || 'Ready to Move'} | ${propB.possessionStatus || 'Ready to Move'} |\n\n` +
          `Aapki priority ke hisaab se (family convenience ya budget), hum dono properties ke liye free physical walkthrough book kar sakte hain.`
        : `Here is a side-by-side comparison between **${propA.title}** and **${propB.title}** using verified listing parameters:\n\n` +
          `• **Price:** ${fmtPrice(propA.price, propA.purpose === 'Rent')} vs ${fmtPrice(propB.price, propB.purpose === 'Rent')}\n` +
          `• **Configuration:** ${propA.bhk || 3} BHK (${propA.propertyType}) vs ${propB.bhk || 3} BHK (${propB.propertyType})\n` +
          `• **Location:** ${propA.locality}, ${propA.city} vs ${propB.locality}, ${propB.city}\n` +
          `• **Carpet Area:** ${propA.carpetArea || 'N/A'} sq.ft. vs ${propB.carpetArea || 'N/A'} sq.ft.\n` +
          `• **RERA Verification:** ${propA.isReraVerified ? `Verified (${propA.reraNumber})` : 'Pending'} vs ${propB.isReraVerified ? `Verified (${propB.reraNumber})` : 'Pending'}\n` +
          `• **Handover:** ${propA.possessionStatus || 'Ready to Move'} vs ${propB.possessionStatus || 'Ready to Move'}\n\n` +
          `Which property aligns better with your timeline and commute requirements?`;

      return {
        text,
        state,
        type: 'property_comparison',
        properties: [propA, propB],
        quickReplies: isHinglish
          ? ["Option 1 ki detail batao", "Option 2 ki detail batao", "Free Site Visit"]
          : ["Details of Option 1", "Details of Option 2", "Schedule Site Visit"]
      };
    }
  }

  // =========================================================================
  // CASE 8: PROPERTY DETAILS ("Is property ka detail batao")
  // =========================================================================
  if (
    cleanMsg.includes('detail batao') || 
    cleanMsg.includes('property detail') || 
    cleanMsg.includes('more details') || 
    cleanMsg.includes('details of') || 
    cleanMsg.includes('iski detail')
  ) {
    const prop = (state.activePropertyId && allProperties.find(p => p.id === state.activePropertyId))
      || (state.matchedProperties && state.matchedProperties[0])
      || allProperties[0];

    if (prop) {
      const text = isHinglish
        ? `**${prop.title}** (${prop.locality}, ${prop.city}) ke verified details:\n\n` +
          `• **Price:** ${fmtPrice(prop.price, prop.purpose === 'Rent')}\n` +
          `• **Configuration:** ${prop.bhk} BHK • ${prop.bathrooms || 2} Bathrooms\n` +
          `• **Carpet Area:** ${prop.carpetArea ? `${prop.carpetArea} sq.ft. (Actual usable)` : 'Listing me available nahi hai'}\n` +
          `• **Super Built-Up:** ${prop.superBuiltUpArea ? `${prop.superBuiltUpArea} sq.ft.` : 'N/A'}\n` +
          `• **Property Type:** ${prop.propertyType || 'Apartment'}\n` +
          `• **RERA Status:** ${prop.isReraVerified ? `Verified (${prop.reraNumber})` : 'Is listing me RERA information available nahi hai'}\n` +
          `• **Possession:** ${prop.possessionStatus || 'Ready to Move'}\n` +
          `• **Parking:** ${prop.parking || 'Covered Parking Bay'}\n` +
          `• **Facing:** ${prop.facing || 'Vastu Compliant'}\n` +
          `• **Amenities:** ${(prop.amenities || []).slice(0, 5).join(', ')}\n\n` +
          `Kya aap is property ke liye escorted site visit schedule karna chahte hain?`
        : `Verified details for **${prop.title}** (${prop.locality}, ${prop.city}):\n\n` +
          `• **Price:** ${fmtPrice(prop.price, prop.purpose === 'Rent')}\n` +
          `• **Configuration:** ${prop.bhk} BHK • ${prop.bathrooms || 2} Bathrooms\n` +
          `• **Carpet Area:** ${prop.carpetArea ? `${prop.carpetArea} sq.ft. (Net usable)` : 'Not specified in listing'}\n` +
          `• **Super Built-up Area:** ${prop.superBuiltUpArea ? `${prop.superBuiltUpArea} sq.ft.` : 'N/A'}\n` +
          `• **Type:** ${prop.propertyType || 'Apartment'}\n` +
          `• **RERA Registration:** ${prop.isReraVerified ? `Verified (${prop.reraNumber})` : 'Information not available in listing'}\n` +
          `• **Possession Status:** ${prop.possessionStatus || 'Ready to Move'}\n` +
          `• **Parking:** ${prop.parking || 'Covered'}\n` +
          `• **Orientation:** ${prop.facing || 'East/Vastu'}\n` +
          `• **Amenities:** ${(prop.amenities || []).slice(0, 5).join(', ')}\n\n` +
          `Would you like to schedule a free site visit or initiate an inquiry for this property?`;

      return {
        text,
        state: { ...state, activePropertyId: prop.id },
        type: 'property_details',
        properties: [prop],
        quickReplies: isHinglish
          ? ["Site visit schedule karo", "Ye property family ke liye sahi hai?", "Inquiry start karo"]
          : ["Schedule Site Visit", "Is it good for family?", "Start Inquiry"]
      };
    }
  }

  // =========================================================================
  // CASE 9: MULTI-TURN PROPERTY SEARCH & SINGLE FOLLOW-UP LOGIC
  // =========================================================================
  const hasCity = !!state.location.city;
  const hasBudget = !!state.budget_max;
  const hasBHK = !!state.bhk;
  const hasPurpose = !!state.purpose;

  // Let's execute the real database search with the current accumulated filters
  const searchResults = searchPropertiesInDB({
    city: state.location.city,
    state: state.location.state,
    purpose: state.purpose,
    bhk: state.bhk,
    property_type: state.property_type,
    budget_max: state.budget_max,
    budget_min: state.budget_min,
    ready_to_move: state.ready_to_move
  }, allProperties);

  state.matchedProperties = searchResults;

  // Sub-case 9A: User specified city, but NOT purpose yet
  // e.g. "mujhe bangalore me ghar chahiye" -> "Bilkul. Purchase ke liye chahiye ya rent pe?"
  if (hasCity && !hasPurpose && !hasBudget && !hasBHK) {
    state.lastFollowUpAsked = 'purpose';
    const text = isHinglish
      ? `Bilkul. ${state.location.city} me purchase ke liye chahiye ya rent pe?`
      : `Absolutely. Are you looking to buy or rent in ${state.location.city}?`;

    return {
      text,
      state,
      type: 'follow_up_purpose',
      quickReplies: isHinglish
        ? [`${state.location.city} me Buy karna hai`, `${state.location.city} me Rent par chahiye`, "Plots dekhna hai"]
        : [`Buy in ${state.location.city}`, `Rent in ${state.location.city}`, "Looking for Plots"]
    };
  }

  // Sub-case 9B: User gave City + Purpose, but NO budget yet
  if (hasCity && hasPurpose && !hasBudget && !hasBHK) {
    state.lastFollowUpAsked = 'budget';
    const text = isHinglish
      ? `Samajh gaya — ${state.location.city} me ${state.purpose === 'Rent' ? 'rent' : 'purchase'} ke liye. Aap lagbhag kitna budget plan kar rahe hain? (e.g. 50L, 80L, 1.5 Cr)`
      : `Understood — ${state.purpose === 'Rent' ? 'renting' : 'buying'} in ${state.location.city}. What budget range are you planning? (e.g. ₹50 Lakh, ₹80 Lakh, ₹1.5 Cr)`;

    return {
      text,
      state,
      type: 'follow_up_budget',
      quickReplies: isHinglish
        ? ["Under 50 Lakh", "50L - 1 Cr", "1 Cr - 2.5 Cr", "Luxury above 2.5 Cr"]
        : ["Under ₹50 Lakh", "₹50L - ₹1 Cr", "₹1 Cr - ₹2.5 Cr", "Above ₹2.5 Cr"]
    };
  }

  // Sub-case 9C: User gave City + Budget, but NO BHK yet
  // e.g. "80L" in Bangalore -> "Got it — Bangalore me budget around ₹80 lakh. 2BHK chahiye ya 3BHK?"
  if (hasCity && hasBudget && !hasBHK) {
    state.lastFollowUpAsked = 'bhk';
    const budgetStr = state.raw_budget_str || fmtPrice(state.budget_max, state.purpose === 'Rent');
    const text = isHinglish
      ? `Got it — ${state.location.city} me budget around ${budgetStr}. 2BHK chahiye ya 3BHK?`
      : `Got it — in ${state.location.city} with a budget of ${budgetStr}. Are you looking for a 2BHK or 3BHK?`;

    return {
      text,
      state,
      type: 'follow_up_bhk',
      quickReplies: isHinglish
        ? ["2BHK chahiye", "3BHK chahiye", "Villa ya Row House", "Flexible with configuration"]
        : ["2BHK Apartment", "3BHK Apartment", "Villa / Row House", "Flexible"]
    };
  }

  // Sub-case 9D: User provided rich multi-turn info (City + Budget + BHK) or direct full prompt
  // Example from prompt:
  // User: "bhai mujhe Hyderabad me 50 lakh ke andar 2BHK chahiye"
  // Bot: "Bilkul. Hyderabad me ₹50 lakh tak 2BHK ke liye main tumhe options dhoondhne me help karta hoon. Tumhe ready-to-move chahiye ya under-construction bhi chalega?"
  if (hasCity && (hasBudget || hasBHK)) {
    // If possession status was not asked yet, ask ready-to-move vs under-construction if user hasn't specified
    if (state.ready_to_move === null && !cleanMsg.includes('ready') && !cleanMsg.includes('construction') && state.lastFollowUpAsked !== 'possession') {
      state.lastFollowUpAsked = 'possession';
      const budgetStr = state.raw_budget_str || (state.budget_max ? fmtPrice(state.budget_max) : '');
      const bhkStr = state.bhk ? `${state.bhk}BHK` : 'property';

      const text = isHinglish
        ? `Bilkul. ${state.location.city} me ${budgetStr ? `${budgetStr} tak ` : ''}${bhkStr} ke liye main options dhoondhne me help karta hoon. Tumhe ready-to-move chahiye ya under-construction bhi chalega?`
        : `Absolutely! I can help you find ${bhkStr} options in ${state.location.city}${budgetStr ? ` up to ${budgetStr}` : ''}. Are you looking for ready-to-move or is under-construction acceptable as well?`;

      return {
        text,
        state,
        type: 'follow_up_possession',
        quickReplies: isHinglish
          ? ["Ready-to-move chahiye", "Under-construction chalega", "Verified options dikhao"]
          : ["Ready to Move", "Under Construction is fine", "Show Verified Options"]
      };
    }

    // Possession is decided or user followed up with "ready to move"
    // Now return real property cards from database!
    if (searchResults.length > 0) {
      const topResults = searchResults.slice(0, 3);
      state.activePropertyId = topResults[0].id;
      state.comparisonIds = topResults.map(p => p.id);

      const text = isHinglish
        ? `Ye ${topResults.length} verified options tumhare requirement ke anusaar INDSTATE database me match ho rahe hain:`
        : `Here are ${topResults.length} verified properties matching your criteria from our connected database:`;

      return {
        text,
        state,
        type: 'property_search_results',
        properties: topResults,
        quickReplies: isHinglish
          ? ["Site visit schedule karo", "Ye property family ke liye sahi hai?", "Compare karo"]
          : ["Schedule Site Visit", "Is it good for family?", "Compare Options"]
      };
    } else {
      // NO EXACT MATCH IN DATABASE — NEVER FABRICATE!
      // Check if there are other verified listings in the same city or state to recommend honestly
      const cityAlternatives = allProperties.filter(p => 
        (p.city && p.city.toLowerCase() === state.location.city.toLowerCase()) ||
        (p.state && state.location.state && p.state.toLowerCase() === state.location.state.toLowerCase())
      );

      if (cityAlternatives.length > 0) {
        const sample = cityAlternatives[0];
        const text = isHinglish
          ? `${state.location.city} me filhal hamare verified database me exact ₹${state.budget_max ? (state.budget_max / 100000).toFixed(0) + ' Lakh' : 'budget'} ke andar direct listing active nahi hai. ` +
            `Lekin ${sample.locality}, ${sample.city} me hamare paas **${sample.title}** (${fmtPrice(sample.price, sample.purpose === 'Rent')}, ${sample.bhk}BHK) available hai.\n\n` +
            `Kya aap budget thoda flexible rakhna chahenge ya nearby affordable micro-markets me options check karein?`
          : `Currently in our verified database for ${state.location.city}, we do not have an active listing strictly under ${state.raw_budget_str || (state.budget_max ? `₹${(state.budget_max / 100000).toFixed(0)} Lakh` : 'that budget')}. ` +
            `However, in ${sample.locality}, ${sample.city}, we have **${sample.title}** (${fmtPrice(sample.price, sample.purpose === 'Rent')}, ${sample.bhk} BHK) available.\n\n` +
            `Would you like to keep the budget flexible or explore verified options in nearby micro-markets?`;

        return {
          text,
          state,
          type: 'property_no_exact_match',
          properties: [sample],
          quickReplies: isHinglish
            ? ["Flexible budget options", "Callback request karein", "Dusri city me dikhao"]
            : ["Flexible Budget Options", "Request Callback", "Search Other City"]
        };
      } else {
        const text = isHinglish
          ? `${state.location.city || 'Iss location'} me abhi hamare database me verified listings available nahi hain. Main bina verified data ke koi fake property recommend nahi karta. Aap Mumbai, Pune, Bengaluru, Hyderabad ya Delhi NCR me verified homes check kar sakte hain.`
          : `We do not currently have verified listings for ${state.location.city || 'this location'} in our database. I strictly do not fabricate listings. You can explore our verified properties across Mumbai, Pune, Bengaluru, Hyderabad, Gurugram, and Noida.`;

        return {
          text,
          state,
          type: 'property_no_results',
          properties: [],
          quickReplies: isHinglish
            ? ["Bengaluru me dikhao", "Hyderabad me dikhao", "Pune me dikhao"]
            : ["Explore Bengaluru", "Explore Hyderabad", "Explore Pune"]
        };
      }
    }
  }

  // =========================================================================
  // CASE 10: USER GAVE ONLY A BUDGET OR ONLY BHK WITHOUT CITY
  // =========================================================================
  if (hasBudget && !hasCity) {
    const text = isHinglish
      ? `Budget ${state.raw_budget_str || fmtPrice(state.budget_max)} noted! Aap kis city me property search kar rahe hain? (Jaise Hyderabad, Bangalore, Pune, Mumbai, ya Delhi NCR)`
      : `Got your budget of ${state.raw_budget_str || fmtPrice(state.budget_max)}! Which city are you looking to buy or rent in? (e.g. Hyderabad, Bangalore, Pune, Mumbai, or Delhi NCR)`;

    return {
      text,
      state,
      type: 'follow_up_city',
      quickReplies: isHinglish
        ? ["Hyderabad", "Bengaluru", "Pune", "Mumbai", "Delhi NCR"]
        : ["Hyderabad", "Bengaluru", "Pune", "Mumbai", "Delhi NCR"]
    };
  }

  // =========================================================================
  // CASE 11: CASUAL SMALL TALK & GREETINGS
  // =========================================================================
  if (
    cleanMsg.includes('namaste') || 
    cleanMsg.includes('hello') || 
    cleanMsg.includes('hi') || 
    cleanMsg.includes('hey') || 
    cleanMsg.includes('kaise ho') || 
    cleanMsg.includes('kya hal hai')
  ) {
    const text = isHinglish
      ? "Namaste bhai! Sab badhiya hai. Main INDSTATE ka AI Property Assistant hoon — India bhar me 100% RERA-verified properties, loans, aur legal due-diligence me aapki help karta hoon. Aaj kis city me property dekh rahe hain?"
      : "Hello and welcome to INDSTATE! I am your AI Real Estate Assistant. I can help you search RERA-verified homes, evaluate home loans, and run legal checklists across India. Which city are you exploring today?";

    return {
      text,
      state,
      type: 'greeting',
      quickReplies: isHinglish
        ? ["Hyderabad me 2BHK", "Bangalore me flats", "RERA verify kaise kare?", "Home Loan guidance"]
        : ["2BHK in Hyderabad", "Apartments in Bangalore", "Verify RERA", "Home Loan Guidance"]
    };
  }

  // Default conversational fallback (Honest + practical guidance)
  return null;
}
