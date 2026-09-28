import { detectLanguage } from './languageDetector.js';
import { formatIndianPrice } from './currencyFormatter.js';

/**
 * Enhanced Conversational & Problem-Solving RAG Engine
 * Acts as an experienced senior real estate customer-care advisor and knowledgeable friend:
 * - Proactively clarifies ambiguous problems with diagnostic questions and structured chips
 * - Retains conversational context & memory (city, BHK, previous topics, failed attempts)
 * - Empathizes with user distress and delivers structured step-by-step resolution paths
 * - Detects frustration or "didn't work" signals to smoothly escalate to human advisors
 * - Resolves multi-part queries in a single comprehensive answer
 * - Speaks in warm, natural English and Hinglish (no stiff corporate jargon)
 */

// Common English & Hinglish Stopwords to filter out noise
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'of', 'to', 'for',
  'with', 'and', 'or', 'it', 'this', 'that', 'i', 'you', 'me', 'my', 'we', 'our',
  'kya', 'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein', 'par', 'pe',
  'aur', 'bhi', 'kuch', 'batao', 'dekhna', 'chahiye', 'kripya', 'pls', 'please'
]);

// Real Estate Domain Synonyms & Bilingual Expansion
const SYNONYMS = {
  'delay': ['possession', 'late', 'deri', 'delayed', 'compensation', 'section 18'],
  'deri': ['delay', 'late', 'possession', 'compensation'],
  'late': ['delay', 'possession', 'deri'],
  'deposit': ['security', 'refund', 'advance', 'bayana', 'token'],
  'token': ['advance', 'bayana', 'booking', 'deposit', 'refund'],
  'bayana': ['token', 'advance', 'booking', 'deposit'],
  'refund': ['cancel', 'cancellation', 'wapas', 'money back', 'deposit'],
  'wapas': ['refund', 'cancel', 'return'],
  'loan': ['emi', 'finance', 'interest', 'karz', 'cibil', 'eligibility', 'bank', 'rejection'],
  'emi': ['loan', 'calculator', 'interest', 'monthly'],
  'carpet': ['usable', 'actual', 'builtup', 'super', 'loading', 'area', 'sqft'],
  'loading': ['super', 'carpet', 'difference', 'builtup'],
  'rent': ['kiraya', 'tenant', 'landlord', 'kirayedar', 'agreement', 'lease'],
  'kiraya': ['rent', 'rental', 'tenant', 'agreement'],
  'rera': ['verified', 'legal', 'registration', 'complaint', 'authority', 'maharera', 'up rera'],
  'tax': ['gst', 'stamp', 'duty', 'registration', 'charges', 'kharcha'],
  'stamp': ['duty', 'registration', 'registry', 'tax', 'legal'],
  'registry': ['stamp duty', 'registration', 'possession', 'deed'],
  'brokerage': ['commission', 'dalali', 'fee', 'charge', 'zero brokerage'],
  'dalali': ['brokerage', 'commission', 'fees', 'zero brokerage'],
  'pg': ['coliving', 'co-living', 'hostel', 'sharing', 'paying guest'],
  'inspection': ['site visit', 'visit', 'check', 'escort', 'tour'],
  'builder': ['developer', 'builder delay', 'possession', 'project', 'construction'],
  'agreement': ['contract', 'sale deed', 'registered', 'mou', 'lease agreement'],
  'apartment': ['property', 'flat', 'listing', 'ghar', 'home'],
  'flat': ['property', 'apartment', 'listing', 'ghar', 'home'],
  'police': ['verification', 'tenant verification', 'police verification', 'safety', 'tenant'],
  'list': ['post property', 'list property', 'sell property', 'upload', 'listing'],
  'listing': ['list property', 'post property', 'sell property', 'add property'],
  'bechna': ['sell', 'list', 'post property', 'ghar bechna']
};

/**
 * Expands clean tokens with domain synonyms to maximize semantic recall
 */
function expandSynonyms(tokens) {
  const expanded = [...tokens];
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      expanded.push(...syns);
    }
  }
  return expanded;
}

/**
 * Tokenizes text into unigrams, bigrams, and synonym-expanded terms
 */
export function tokenizeAndVectorize(text) {
  if (!text || typeof text !== 'string') return {};

  const clean = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));

  const expandedTokens = expandSynonyms(clean);
  const vector = {};

  // Unigram weights
  for (const word of expandedTokens) {
    vector[word] = (vector[word] || 0) + 1;
  }

  // Bigram weights
  for (let i = 0; i < clean.length - 1; i++) {
    const bigram = `${clean[i]} ${clean[i + 1]}`;
    vector[bigram] = (vector[bigram] || 0) + 2.5;
  }

  return vector;
}

/**
 * Calculates Cosine Similarity between two term vectors
 */
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    normA += vecA[key] * vecA[key];
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }

  for (const key in vecB) {
    normB += vecB[key] * vecB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Pre-vectorizes a knowledge base entry across questions, tags, and keywords
 */
export function buildEntryVector(entry) {
  const combinedText = `
    ${entry.questionEn || ''} 
    ${entry.questionHi || ''} 
    ${entry.category || ''} 
    ${(entry.tags || []).join(' ')} 
    ${(entry.keywords || []).join(' ')}
  `;
  return tokenizeAndVectorize(combinedText);
}

/**
 * Semantic Vector Search over Knowledge Base
 */
export function searchKnowledgeBase(query, knowledgeBase, threshold = 0.20) {
  const queryVec = tokenizeAndVectorize(query);
  const scored = [];

  for (const entry of knowledgeBase) {
    const entryVec = entry._vector || buildEntryVector(entry);
    const score = cosineSimilarity(queryVec, entryVec);

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= threshold) {
    return {
      bestMatch: scored[0].entry,
      score: scored[0].score,
      candidates: scored.slice(0, 3)
    };
  }

  return { bestMatch: null, score: scored[0]?.score || 0, candidates: [] };
}

/**
 * Known Indian Metros and Tier-1 Cities
 */
const KNOWN_CITIES = [
  'mumbai', 'pune', 'bangalore', 'bengaluru', 'hyderabad', 'delhi', 
  'noida', 'gurugram', 'gurgaon', 'goa', 'chennai', 'kolkata', 
  'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'patna'
];

/**
 * Extracts entities (city, BHK, price, issue history, milestones, user profile) from conversation history
 */
export function extractEntitiesFromHistory(conversationHistory = [], currentQuery = '') {
  const allUserTexts = conversationHistory
    .filter(m => m.sender === 'user')
    .map(m => m.text || '');
  const allBotTexts = conversationHistory
    .filter(m => m.sender === 'bot')
    .map(m => m.text || '');

  const combinedText = [
    ...conversationHistory.map(m => m.text || ''),
    currentQuery
  ].join(' ').toLowerCase();

  const entities = {
    city: null,
    bhk: null,
    problemContext: null,
    hasPriorBotSuggestion: false,
    lastBotCategory: null,
    milestones: {
      birthday: false,
      birthdayAcknowledgedRecently: false,
      anniversary: false,
      anniversaryAcknowledgedRecently: false,
      newJob: false,
      newJobAcknowledgedRecently: false,
      relocation: false,
      userName: null
    }
  };

  // 1. Detect City
  for (const city of KNOWN_CITIES) {
    if (combinedText.includes(city)) {
      // Normalize Bangalore / Gurgaon
      if (city === 'bangalore') entities.city = 'Bengaluru';
      else if (city === 'gurgaon') entities.city = 'Gurugram';
      else entities.city = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // 2. Detect BHK
  const bhkMatch = combinedText.match(/\b([1-5])\s*bhk\b/i);
  if (bhkMatch) {
    entities.bhk = `${bhkMatch[1]} BHK`;
  } else if (combinedText.includes('villa')) {
    entities.bhk = 'Villa';
  } else if (combinedText.includes('plot')) {
    entities.bhk = 'Plot';
  }

  // 3. Detect Prior Bot Assistance
  const recentBotMessages = conversationHistory.filter(m => m.sender === 'bot');
  if (recentBotMessages.length > 0) {
    entities.hasPriorBotSuggestion = true;
    entities.lastBotCategory = recentBotMessages[recentBotMessages.length - 1].category;
  }

  // 4. Milestone tracking across user message history
  const pastUserText = allUserTexts.join(' ').toLowerCase();
  const pastBotText = allBotTexts.join(' ').toLowerCase();
  const fullUserText = (pastUserText + ' ' + currentQuery).toLowerCase();

  // Birthday
  if (/\b(birthday|b'day|bday|janamdin)\b/i.test(fullUserText)) {
    entities.milestones.birthday = true;
    if (/\b(once again|phir se|again)\b/i.test(pastBotText) && /\b(birthday|bday|janamdin|shubhkaamnayein)\b/i.test(pastBotText)) {
      entities.milestones.birthdayFollowedUp = true;
    }
  }

  // Anniversary
  if (/\b(anniversary|saalgirah)\b/i.test(fullUserText)) {
    entities.milestones.anniversary = true;
    if (/\b(once again|phir se|again)\b/i.test(pastBotText) && /\b(anniversary|saalgirah|badhaiyan)\b/i.test(pastBotText)) {
      entities.milestones.anniversaryFollowedUp = true;
    }
  }

  // New Job / Promotion
  if (/\b(new job|nayi job|placement|naukri|promotion)\b/i.test(fullUserText)) {
    entities.milestones.newJob = true;
    if (/\b(once again|phir se|again)\b/i.test(pastBotText) && /\b(new job|nayi job|promotion|role)\b/i.test(pastBotText)) {
      entities.milestones.newJobFollowedUp = true;
    }
  }

  // Relocation
  if (/\b(shifting|relocating|moving to|shift ho raha|shift hona)\b/i.test(fullUserText)) {
    entities.milestones.relocation = true;
  }

  // User Name
  const nameMatch = fullUserText.match(/\b(?:my name is|mera naam|i am|call me)\s+([a-z]+)/i);
  if (nameMatch && nameMatch[1]) {
    const rawName = nameMatch[1].toLowerCase();
    const commonWords = ['looking', 'searching', 'here', 'interested', 'fine', 'good', 'happy', 'tired', 'just', 'not', 'wanting'];
    if (!commonWords.includes(rawName)) {
      entities.milestones.userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    }
  }

  return entities;
}

/**
 * Detects if the user is expressing frustration or reporting that a previous fix failed
 */
function detectFrustrationOrFailure(cleanMsg, conversationHistory = []) {
  const failurePatterns = [
    /\b(didn'?t work|did not work|not working|failed|useless|nahi hua|kuch nahi hua|kaam nahi kiya|nahi chala|try kiya tha)\b/i,
    /\b(refused again|they refused|mana kar diya|reject ho gaya|fir se reject|bank ne mana|builder ne mana)\b/i,
    /\b(fraud|scam|dhokha|cheated|worst service|bakwaas|pareshan|troubled|stuck|help nahi mil rahi)\b/i,
    /\b(still waiting|still not resolved|no response|no callback|kisi ne call nahi kiya)\b/i
  ];

  for (const pattern of failurePatterns) {
    if (pattern.test(cleanMsg)) {
      return true;
    }
  }

  return false;
}

/**
 * Detects whether the user is stating an ambiguous problem that needs diagnostic questions
 */
function detectAmbiguousProblem(cleanMsg, isHinglish, entities) {
  // Case 1: Loan Rejection or Ambiguous Loan Issue
  if (
    (/\b(loan|home loan|cibil|emi)\b/i.test(cleanMsg)) &&
    (/\b(problem|issue|reject|rejection|pareshani|dikkat|nahi mil raha|atack|atki)\b/i.test(cleanMsg)) &&
    !cleanMsg.includes('cibil score 750') &&
    !cleanMsg.includes('self-employed')
  ) {
    const text = isHinglish
      ? `Arey, ye sunke chinta hui — home loan me dikkat aana kaafi stressful hota hai. Par ghabraiye mat, aksar 70% cases me paperwork, co-applicant add karke ya CIBIL dispute rectify karke loan approve ho jata hai.\n\nAapko exact step-by-step solution batane ke liye, kya aap thoda clarify karenge:\n1. **Kaunse bank se apply kiya tha** (SBI, HDFC, ICICI ya koi NBFC)?\n2. **Bank ne rejection ya delay ka kya reason bataya?** (Low CIBIL score, income/ITR proof, ya property valuation clear nahi tha)?\n\nAap niche diye gaye common options me se bhi chun sakte hain:`
      : `I'm really sorry to hear that — running into a roadblock with home loan approval can be genuinely stressful. But don't worry, in over 70% of cases, issues can be resolved by adding a co-applicant, fixing a bureau reporting glitch, or selecting a lender that fits your income profile.\n\nTo give you the exact resolution path, could you clarify:\n1. **Which bank or lender did you apply with** (e.g. SBI, HDFC, ICICI, or an NBFC)?\n2. **What primary reason was cited by the loan officer?** (Low CIBIL score, ITR/income proofs, or property technical valuation)?\n\nYou can also tap the closest option below:`;

    return {
      text,
      type: 'diagnostic_clarification',
      category: 'Home Loans & Finance',
      language: isHinglish ? 'hinglish' : 'en',
      quickReplies: isHinglish
        ? ["CIBIL score kam hai", "Income / ITR issue", "Property approval pending", "Loan Advisor se baat karein"]
        : ["Low CIBIL Score", "Income / ITR Issue", "Property Valuation", "Connect with Loan Advisor"]
    };
  }

  // Case 2: Builder Delay / Delayed Possession Problem
  if (
    (/\b(builder|possession|handover|flat delay)\b/i.test(cleanMsg)) &&
    (/\b(delay|late|nahi de raha|deri|time par nahi|stuck|delaying)\b/i.test(cleanMsg)) &&
    !cleanMsg.includes('section 18')
  ) {
    const cityMention = entities.city ? ` in ${entities.city}` : '';
    const text = isHinglish
      ? `Ye sunke bilkul accha nahi laga — builder ka possession delay karna home buyers ke sath sabse badi pareshani hoti hai. Par kanoon poori tarah aapke sath hai: RERA Section 18 ke tehat builder ko delay ke har mahine ke liye State Bank of India ke highest lending rate + 2% ka interest compensation dena mandatory hai.\n\nAapko sahi legal recourse batane ke liye, kya aap batayenge:\n1. **Promised date se kitne mahine delay ho chuka hai?**\n2. **Kya builder ne koi written notice ya force majeure letter diya hai?**\n\nYahan aapke liye 3 immediate options hain:`
      : `I'm really sorry to hear that — unexpected possession delays${cityMention} are deeply frustrating. However, Indian law is firmly on your side: Under Section 18 of RERA, builders are legally mandated to pay you monthly interest compensation (typically SBI MCLR + 2%) for every single month of delay until handover.\n\nTo guide your exact recourse, could you share:\n1. **How many months past the promised agreement date has it been?**\n2. **Did the builder send a formal letter citing force majeure, or are they simply non-responsive?**\n\nHere are your 3 immediate resolution steps:`;

    return {
      text,
      type: 'diagnostic_clarification',
      category: 'Legal & RERA',
      language: isHinglish ? 'hinglish' : 'en',
      quickReplies: isHinglish
        ? ["1 se 6 mahine delay", "1 saal se zyada delay", "Interest claim karna hai", "RERA complaint file karein"]
        : ["Delayed by 1-6 months", "Delayed by 1+ years", "Claim Interest Penalty", "File RERA Complaint"]
    };
  }

  // Case 3: Token Money / Deposit Withheld Dispute
  if (
    (/\b(token|bayana|deposit|security deposit)\b/i.test(cleanMsg)) &&
    (/\b(nahi de raha|wapas nahi|deducted|refused|fas gaya|kaat liya|dispute)\b/i.test(cleanMsg))
  ) {
    const text = isHinglish
      ? `Ye bilkul galat baat hai — bina legal proof ke landlord ya seller aapka security deposit ya token amount nahi rok sakta. Chaliye isse step-by-step sort karte hain.\n\nChaliye dekhein aapke paas kya evidence hai:\n• **Signed Rent Agreement / Booking Receipt**?\n• **Flat handover ke waqt ki photos/videos ya inspection sign-off**?\n\nAgar haan, toh yahan 3 solid recourse options hain:\n1. **Formal Legal Notice**: Advocate ke zariye 15-day formal notice bhejna jisse 85% cases me refund aa jata hai.\n2. **Rent Authority Dispute**: State Tenancy Authority me summary complaint file karein.\n3. **Police Breach of Trust (Section 406 IPC)**: Illegal withholding par complaint.`
      : `That is completely unacceptable — landlords or sellers cannot arbitrarily withhold your security deposit or refundable token bayana without verified contractual proof. Let's get this sorted step-by-step.\n\nLet's check if you have these 2 records ready:\n• **Signed agreement or digital token receipt**?\n• **Clear handover photos/videos or inspection sign-off**?\n\nHere is your immediate 3-step action plan:\n1. **Formal Advocate Notice**: A formal 15-day notice with reference to Section 406 IPC (Criminal Breach of Trust) resolves 85% of deposit withholding without court litigation.\n2. **Rent Court Dispute**: File a summary complaint under your state's Tenancy Act.\n3. **Advisor Intervention**: We can have an INDSTATE legal associate review your agreement today.`;

    return {
      text,
      type: 'diagnostic_clarification',
      category: 'Renting a Property',
      language: isHinglish ? 'hinglish' : 'en',
      quickReplies: isHinglish
        ? ["Agreement mere paas hai", "Legal notice bhejna hai", "Rent Court dispute", "Advisor se baat karein"]
        : ["I have signed agreement", "Send Legal Notice", "Rent Authority dispute", "Talk to Legal Advisor"]
    };
  }

  return null;
}

/**
 * Handles multi-part queries (e.g. loan interest AND stamp duty in Pune)
 */
function handleMultiPartQuery(userMessage, knowledgeBase, isHinglish, entities) {
  const clean = userMessage.toLowerCase();
  const hasAnd = clean.includes(' aur ') || clean.includes(' and ') || clean.includes(' plus ') || clean.includes(' also ');
  
  if (!hasAnd) return null;

  // Check if query spans multiple distinct domains
  const wantsLoan = clean.includes('loan') || clean.includes('emi') || clean.includes('interest') || clean.includes('cibil');
  const wantsStamp = clean.includes('stamp') || clean.includes('duty') || clean.includes('tax') || clean.includes('registry');
  const wantsRera = clean.includes('rera') || clean.includes('verified') || clean.includes('delay');

  if (wantsLoan && wantsStamp) {
    const cityText = entities.city ? `**${entities.city}**` : (isHinglish ? 'aapke state' : 'your state');
    const text = isHinglish
      ? `Achha sawaal — aapne dono ahem financial aspects poocha hai. Chaliye dono ko clear kar deta hoon:\n\n` +
        `• **1. Home Loan Interest & Rates:**\n` +
        `Currently, major Indian banks (SBI, HDFC, ICICI) offer home loan interest rates between **8.40% to 8.75% p.a.** (floating, linked to RBI's Repo Rate). Agar aapka CIBIL score 750+ hai toh aapko lowest 8.40% rate milta hai.\n\n` +
        `• **2. Stamp Duty & Registration (${cityText}):**\n` +
        (entities.city && entities.city.toLowerCase() === 'pune' 
          ? `Pune (Maharashtra) me residential property ke liye standard stamp duty **6% se 7%** hoti hai (5% base + 1% local body tax + metro cess) aur registration charges 1% (max ₹30,000) hote hain.\n\n`
          : `Stamp duty aamtaur par **5% se 7%** hoti hai (state ke anusaar) aur ₹30,000 ya 1% registration fee lagti hai. Women buyers ke liye kai states me 1% concession milta hai.\n\n`) +
        `Kya aap specific budget ke liye exact monthly EMI aur stamp duty calculation dekhna chahte hain?`
      : `Great question — you've asked about both primary financial costs upfront. Let me break both down clearly for you:\n\n` +
        `• **1. Home Loan Interest Rates:**\n` +
        `Top national lenders (SBI, HDFC, ICICI) are currently offering home loans starting at **8.40% to 8.75% p.a.** (floating, repo-rate linked). A CIBIL score of 750+ qualifies you for the bottom-tier 8.40% slab.\n\n` +
        `• **2. Stamp Duty & Registration (${cityText}):**\n` +
        (entities.city && entities.city.toLowerCase() === 'pune'
          ? `For Pune (Maharashtra), stamp duty is standard **6% to 7%** (5% base + 1% local body tax + 1% metro cess), plus a flat ₹30,000 registration fee for properties above ₹30 Lakhs.\n\n`
          : `Stamp duty typically ranges from **5% to 7%** of agreement value depending on the state, with registration capped at ₹30,000 or 1%. Female owners frequently receive a 1% state duty concession.\n\n`) +
        `Would you like me to calculate the exact monthly EMI and total closing costs for a specific property price?`;

    return {
      text,
      type: 'multipart_answer',
      category: 'Home Loans & Finance',
      language: isHinglish ? 'hinglish' : 'en',
      quickReplies: isHinglish
        ? ["EMI calculate karein", "Loan eligibility check", "RERA verified properties", "Talk to Advisor"]
        : ["Calculate EMI", "Check Loan Eligibility", "Browse Verified Homes", "Connect with Advisor"]
    };
  }

  return null;
}

/**
 * Transforms a raw knowledge base answer into a warm, friend-like senior advisor voice
 * Integrates remembered user name, city context, and personal milestones
 */
function formatWarmFriendAnswer(rawAnswer, match, query, entities, isHinglish) {
  // Conversational openings (friendly, warm, acknowledging)
  const hinglishOpenings = [
    "Achha sawaal — chaliye main aapko iska exact aur verified hisaab batata hoon:\n\n",
    "Bilkul samajh sakta hoon — ghar lene me ye point sabse ahem hota hai. Main clear karta hoon:\n\n",
    "Aapne bilkul sahi waqt par ye poocha! Iska clear rule ye hai:\n\n",
    "Haanji bilkul, main step-by-step samjha deta hoon taaki aapka ek rupaye ka bhi loss na ho:\n\n"
  ];

  const englishOpenings = [
    "Great question — let me break this down clearly so you know exactly where you stand:\n\n",
    "Totally understand — buying or renting a home is a big step, so getting this right is crucial:\n\n",
    "Good thing you're checking this upfront! Here is the verified reality:\n\n",
    "Certainly! Let me walk you through the exact protocol step-by-step:\n\n"
  ];

  const opening = isHinglish 
    ? hinglishOpenings[Math.floor(Math.random() * hinglishOpenings.length)]
    : englishOpenings[Math.floor(Math.random() * englishOpenings.length)];

  // Inject remembered user name if known
  const nameSalutation = entities?.milestones?.userName 
    ? (isHinglish ? `${entities.milestones.userName} ji, ` : `${entities.milestones.userName}, `)
    : "";

  // Inject remembered city if relevant and not already mentioned in raw answer
  let contextSnippet = "";
  if (entities.city && !rawAnswer.toLowerCase().includes(entities.city.toLowerCase())) {
    if (match.category === 'Buying a Property' || match.category === 'Legal & RERA' || match.category === 'Renting a Property') {
      contextSnippet = isHinglish 
        ? `*(Aapke **${entities.city}** ke context me bhi ye same state-verified guidelines apply hoti hain)*\n\n`
        : `*(This applies directly to verified properties in **${entities.city}** as well)*\n\n`;
    }
  }

  // Inject casual milestone memory if present & not acknowledged recently
  let milestoneSnippet = "";
  if (entities?.milestones?.birthday && !entities?.milestones?.birthdayFollowedUp) {
    milestoneSnippet = isHinglish 
      ? `*(Aur haan, aapko Janamdin ki bohot saari shubhkaamnayein once again! 🎂)*\n\n`
      : `*(And wishing you a wonderful birthday once again! 🎉)*\n\n`;
  } else if (entities?.milestones?.newJob && !entities?.milestones?.newJobFollowedUp) {
    milestoneSnippet = isHinglish
      ? `*(Aur aapko nayi job/role ke liye badhaiyan once again! 💼)*\n\n`
      : `*(And congratulations on the new role once again! 💼)*\n\n`;
  }

  // Friendly conversational closing
  const closing = isHinglish
    ? `\n\nAgar kisi specific project ya situation me aur detail chahiye, toh batayein — main yahin hoon!`
    : `\n\nIf you need me to check a specific project or need further clarification, just ask — I'm right here to help!`;

  // Professional advice disclaimer based on flags (L), (T), (F), (P)
  const flags = match?.flags || [];
  const disclaimers = [];

  if (flags.includes('L')) {
    disclaimers.push(isHinglish
      ? "⚖️ *Note: Yeh kanooni jankari samanya suvidha ke liye hai. Kisi bhi legal action ya final agreement se pehle qualified property lawyer se confirm zaroor karein.*"
      : "⚖️ *Note: This legal information is for general guidance. Please verify all legal documents and agreements with a qualified property lawyer before signing.*");
  }
  if (flags.includes('T')) {
    disclaimers.push(isHinglish
      ? "📊 *Note: Tax niyam aur slabs samay ke sath badalte rehte hain. Apne exact tax calculation aur filing ke liye Chartered Accountant (CA) se confirm karein.*"
      : "📊 *Note: Tax rules and exemption limits are subject to periodic amendments. Please confirm with a Chartered Accountant (CA).*");
  }
  if (flags.includes('F')) {
    disclaimers.push(isHinglish
      ? "💰 *Note: Loan eligibility, interest rates aur charges har bank aur individual profile ke hisaab se alag ho sakte hain. Bank ya financial advisor se confirm karein.*"
      : "💰 *Note: Loan eligibility, interest rates, and approval terms depend on bank policies and individual credit evaluation. Please confirm with your lender or financial advisor.*");
  }
  if (flags.includes('P')) {
    disclaimers.push(isHinglish
      ? "🏢 *Note: INDSTATE platform ki features aur policies launch ke dauran update ho sakti hain. Kisi bhi service se pehle official support team se verify karein.*"
      : "🏢 *Note: Platform features, verification processes, and service policies are verified and updated by the INDSTATE team.*");
  }

  let disclaimerBlock = "";
  if (disclaimers.length > 0) {
    disclaimerBlock = `\n\n${disclaimers.join('\n')}`;
  }

  return `${nameSalutation}${opening}${milestoneSnippet}${contextSnippet}${rawAnswer}${disclaimerBlock}${closing}`;
}

/**
 * Detects if the current user message is announcing a personal milestone
 * e.g. Birthday, Anniversary, New Job, Relocation
 */
function handlePersonalMilestones(cleanMsg, isHinglish, lang, entities) {
  // 1. Birthday Announcement
  if (/\b(birthday|b'day|bday|janamdin)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "Arey waah, Janamdin ki dher saari shubhkaamnayein! 🎂🎉 May this year bring you great health, happiness, and maybe even your dream home! Aaj celebrations chal rahi hain ya property browse karne ka mood hai?"
      : "Wishing you a very Happy Birthday! 🎂🎉 May this year bring you immense happiness and hopefully the keys to your dream home! Are you celebrating today or exploring properties?";
    return {
      text,
      type: 'small_talk',
      category: 'General Conversation',
      language: lang,
      quickReplies: isHinglish
        ? ["Thank you! Ghar dekhna hai", "Celebration chal rahi hai", "Mumbai me flats", "Home Loan EMI"]
        : ["Thanks! Looking for homes", "Just celebrating today", "Explore Properties", "Calculate EMI"]
    };
  }

  // 2. Anniversary Announcement
  if (/\b(anniversary|saalgirah|wedding anniversary)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "Aapko anniversary ki bohot bohot badhaiyan! 💐✨ Khushiyan hamesha bani rahein. Aaj ke khaas din par real estate ya kisi property ke regarding koi help chahiye?"
      : "Wishing you a very Happy Anniversary! 💐✨ May you celebrate many more joyful years together. Let me know if there's any property search or question I can help with today!";
    return {
      text,
      type: 'small_talk',
      category: 'General Conversation',
      language: lang,
      quickReplies: isHinglish
        ? ["Thank you!", "Family ke liye 3BHK flat", "Villa options", "Loan eligibility"]
        : ["Thank you!", "3 BHK Family Flats", "Explore Villas", "Loan Eligibility"]
    };
  }

  // 3. New Job / Promotion
  if (/\b(new job|nayi job|placement|naukri lag|got a job|promotion)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "Badhai ho nayi job / promotion ke liye! 💼🎉 Nayi shuruat ke liye dher saari shubhkaamnayein. Agar nayi office ke paas rental flat ya apna ghar dhundh rahe hain, toh zaroor bataiye!"
      : "Congratulations on the new job / promotion! 💼🎉 That's fantastic news. If you're looking for a rental flat or apartment close to your new workplace, I'm here to help!";
    return {
      text,
      type: 'small_talk',
      category: 'General Conversation',
      language: lang,
      quickReplies: isHinglish
        ? ["Office ke paas rent", "Commute check karein", "Properties dikhao"]
        : ["Rent near office", "Check commute", "Explore Listings"]
    };
  }

  // 4. Shifting / Relocation
  if (
    /\b(shifting|relocating|moving to|shift ho raha|shift hona hai|transfer)\b/i.test(cleanMsg) &&
    !cleanMsg.includes('bhk') && !cleanMsg.includes('price') && !cleanMsg.includes('flat')
  ) {
    const text = isHinglish
      ? "Naye shehar shift hona ek exciting journey hoti hai! 🚚 Agar safe localities, commute time, rental agreements ya verified flats dhoondhne mein help chahiye, toh bas poochiye."
      : "Relocating to a new city is such an exciting milestone! 🚚 If you need help finding verified rental homes, checking commute times, or understanding local rental agreements, I'm right here.";
    return {
      text,
      type: 'small_talk',
      category: 'General Conversation',
      language: lang,
      quickReplies: isHinglish
        ? ["Localities recommend karo", "Rental flats dikhao", "Rent agreement rules"]
        : ["Best localities", "Rental Apartments", "Rental Agreement Norms"]
    };
  }

  return null;
}

/**
 * Detects casual small talk, greetings, how-are-you, gratitude, goodbyes, banter, and light casual remarks
 */
function handleCasualSmallTalk(cleanMsg, isHinglish, lang, entities) {
  // 1. "How are you" / "Kaise ho" / Well-being check
  if (
    /\b(kaise ho|how are you|how r u|kya haal|kya haal hai|aap kaise hain|kaisa hai|kaisi ho|sab kaisa chal|sab theek|sab badiya|sab badhiya|wassup|what'?s up|sup|how are things|how is it going)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Main bilkul theek hoon, shukriya poochne ke liye! Aap bataiye, ghar dhund rahe hain ya kuch aur madad chahiye?"
      : "I'm doing well, thank you for asking! How about you — are you looking for a home or need help with something else today?";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Ghar dhundh raha hoon", "RERA verified flats", "Loan EMI kitni hogi?", "Bas aise hi check kar raha tha"]
        : ["Looking for a home", "Explore RERA flats", "Calculate Loan EMI", "Just browsing around"]
    };
  }

  // 2. Greetings ("hi", "hello", "namaste", "hey", etc.)
  if (
    /^(hi|hello|hey|heya|namaste|namaskar|salaam|kem cho|good morning|good afternoon|good evening|pranam|suno|yo)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Namaste! 🙏 Main aapka INDSTATE AI Property Assistant hoon. Bharat ke kisi bhi shehar mein verified properties, home loans, ya RERA rules ke baare mein poochna ho toh bataiye — main aapki kya madad karoon?"
      : "Namaste & Hello! 🙏 I am your INDSTATE AI Property Assistant. Whether you're searching for verified homes across India, calculating loan EMIs, or checking RERA rules, I'm here to help. What can I assist you with today?";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Buy Property", "Rent Property", "Home loan EMI", "RERA verified flats"]
        : ["Buy Property", "Rent Property", "Calculate EMI", "Check RERA"]
    };
  }

  // 3. Thank-you / Appreciation messages
  // CRITICAL REQUIREMENT: Respond briefly and warmly ("Khushi hui help karke!"), don't force another sales pitch into every single reply
  if (
    /^(thank you|thanks|thx|dhanyawad|shukriya|bahut shukriya|thank you so much|thanks a lot|great help|awesome|you are great|good job|superb|helpful|bahut accha|bohot badhiya|bahut badhiya)\b/i.test(cleanMsg) ||
    cleanMsg === 'thanks' || cleanMsg === 'thank you' || cleanMsg === 'dhanyawad' || cleanMsg === 'shukriya'
  ) {
    const text = isHinglish
      ? "Khushi hui help karke! 😊 Kabhi bhi koi sawaal ho toh main yahin hoon."
      : "Happy to help! 😊 Feel free to reach out anytime if anything else comes up.";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Theek hai!", "Ek aur sawaal tha", "Properties explore karein"]
        : ["Got it!", "One more question", "Explore Properties"]
    };
  }

  // 4. Goodbyes
  // CRITICAL REQUIREMENT: Acknowledge naturally ("Theek hai, koi bhi sawaal ho to main yahin hoon!") rather than ending abruptly or ignoring it
  if (
    /^(bye|goodbye|alvida|see you|tata|phir milte hain|take care|good night|chalta hoon|bye for now|later|cya)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Theek hai, koi bhi sawaal ho to main yahin hoon! Apna khayal rakhiye aur phir milte hain. 🙏"
      : "Take care! If you ever have any questions or need a hand, I'm right here. Have a great day ahead! 🙏";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Phir milenge", "Properties save kar li hain"]
        : ["Take care", "Saved properties"]
    };
  }

  // 5. Light casual remarks: user jokes, laughing, banter
  if (
    /\b(haha|hehe|lol|lmao|rofl|mazak|kidding|just kidding|mazak kar raha tha)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Haha, sahi hai! 😄 Waise property ya ghar ke baare mein kuch plan chal raha hai, ya bas aise hi casually explore kar rahe the?"
      : "Haha, love the good spirits! 😄 Are you looking to explore homes anytime soon, or just checking things out casually today?";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Ghar dekhna hai", "Bas aise hi browse", "Loan EMI check"]
        : ["Looking for a home", "Just browsing", "Check Loan EMI"]
    };
  }

  // 6. Telling a joke request
  if (
    /\b(joke sunao|tell me a joke|koi joke|say a joke)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Haha, ek real estate joke suniye — 'Ghar lene mein sabse mushkil kaam kya hota hai? Budget aur balcony ka view dono ko match karwana!' 😄 Waise agar koi verified property dekh rahe hain toh bataiye, budget match karwane mein help kar sakta hoon!"
      : "Haha, here's a quick one: Why do real estate agents love windows? Because they provide a great outlook! 😄 On a serious note, if you're looking for real rooms or apartments, I'm right here!";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Accha joke tha 😄", "Properties dikhao", "Loan EMI Calculator"]
        : ["Good one 😄", "Show Properties", "Loan EMI Calculator"]
    };
  }

  // 7. Light casual remarks on weather / day (passing remarks)
  if (
    /\b(bohot garmi|so hot|barish ho rahi|raining heavily|it'?s raining|rainy day|thand hai|so cold|weather is nice|mausam accha)\b/i.test(cleanMsg) &&
    !cleanMsg.includes('delhi') && !cleanMsg.includes('mumbai') && !cleanMsg.includes('forecast')
  ) {
    const text = isHinglish
      ? "Sach mein, mausam ka haal toh aisa hi chal raha hai! Ek cup chai ke sath ghar se baithkar dream properties browse karne ka perfect time hai waise. Kuch dekhna chahenge?"
      : "Tell me about it! Sounds like the perfect weather to stay cozy indoors with a warm drink and browse some lovely homes online. Let me know if you want to look at any places!";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Chaliye flats dekhte hain", "Mumbai me 2BHK", "Pune me villas"]
        : ["Let's browse flats", "2 BHK in Mumbai", "Villas in Pune"]
    };
  }

  // 8. Casual user feelings / tiredness
  if (
    /\b(thak gaya|exhausted|tired today|had a long day|chilling|just chilling|bore ho raha)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Arre re, thoda aaram kijiye aur break lijiye! Main saara paperwork aur property search ka heavy lifting sambhal loonga jab bhi aap ready hon."
      : "Take it easy and get some well-deserved rest! Whenever you're ready, I can handle all the heavy lifting on home searches and paperwork for you.";
    return {
      text,
      type: 'small_talk',
      category: 'Small Talk',
      language: lang,
      quickReplies: isHinglish
        ? ["Shukriya!", "Kal check karenge", "Properties save kar do"]
        : ["Thanks!", "Will check tomorrow", "Save my search"]
    };
  }

  return null;
}

/**
 * Handles easily answerable factual questions, live date/time, and currency/unit conversions
 */
function handleGeneralKnowledgeAndConversions(cleanMsg, isHinglish, lang) {
  // 1. Live Today's Date / Day / Year
  if (
    /\b(today'?s date|todays date|what is the date|what date is it|aaj konsi date|aaj ki date|aaj kya tarikh|aaj kitni tareekh|current time|what day is it|aaj ka din|what is today)\b/i.test(cleanMsg)
  ) {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const text = isHinglish
      ? `Aaj **${dateFormatted}** hai! Bataiye, aaj property ke regarding kya plan hai — kuch naya explore karein?`
      : `Today is **${dateFormatted}**. How can I help you with your property plans or questions today?`;

    return {
      text,
      type: 'general_knowledge',
      category: 'General Knowledge',
      language: lang,
      quickReplies: isHinglish
        ? ["Flats in Mumbai", "Loan EMI Calculator", "RERA verified homes"]
        : ["Find Apartments", "Loan EMI Calculator", "Check RERA Projects"]
    };
  }

  // 2. Currency Conversions (Crore, Million, Lakh, USD to INR)
  if (
    /\b(crore in million|crore to million|million in crore|million to crore|1 crore in million|1 million in lakh|million in lakh|lakh in million|usd to inr|dollar in inr|rupees in dollar|1 million kitna|1 crore kitna)\b/i.test(cleanMsg)
  ) {
    let answerText = "";
    if (cleanMsg.includes('crore in million') || cleanMsg.includes('crore to million') || cleanMsg.includes('1 crore in million') || cleanMsg.includes('1 crore kitna')) {
      answerText = isHinglish
        ? "1 Crore = **10 Million** (yaani 100 Lakhs). International real estate reports mein ₹1 Crore ko 10 Million likha jata hai."
        : "1 Crore = **10 Million** (equal to 100 Lakhs). In international financial notation, 1 Crore is written as 10 Million.";
    } else if (cleanMsg.includes('million in lakh') || cleanMsg.includes('million to lakh') || cleanMsg.includes('1 million kitna') || cleanMsg.includes('million in crore') || cleanMsg.includes('million to crore')) {
      answerText = isHinglish
        ? "1 Million = **10 Lakhs** (yaani 0.1 Crore). Is hisaab se 10 Million milkar 1 Crore banta hai."
        : "1 Million = **10 Lakhs** (equal to 0.1 Crore). Thus, 10 Million equals 1 Crore in Indian numbering.";
    } else if (cleanMsg.includes('usd') || cleanMsg.includes('dollar')) {
      answerText = isHinglish
        ? "USD to INR exchange rate aamtaur par **₹83 se ₹85 per US Dollar** ke beech rehta hai (exact value daily forex market par depend karti hai). NRI buyers FEMA guidelines ke tehat NRE/NRO account se property kharid sakte hain."
        : "The USD to INR exchange rate typically trades around **₹83 to ₹85 per US Dollar** (subject to live forex fluctuations). NRI buyers can freely invest in residential properties in India using NRE/NRO bank accounts under FEMA guidelines.";
    }

    if (answerText) {
      return {
        text: answerText,
        type: 'general_knowledge',
        category: 'Conversions & Finance',
        language: lang,
        quickReplies: isHinglish
          ? ["Home loan EMI kitni hogi?", "Carpet area calculation", "Properties dikhao"]
          : ["Calculate Loan EMI", "Carpet Area Calculator", "Browse Properties"]
      };
    }
  }

  // 3. Indian Real Estate & Land Unit Conversions
  // Gaj / Square Yard to Sq Ft
  if (/\b(gaj to sq ft|sq yard to sq ft|gaj me kitna|1 gaj kitna|square yard to square feet)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Gaj (Square Yard) = **9 Square Feet** (3 ft × 3 ft). Jaise 100 Gaj ka plot = **900 sq.ft** hota hai, aur 200 Gaj ka plot = **1,800 sq.ft** hota hai."
      : "1 Gaj (Square Yard) = **9 Square Feet** (3 ft × 3 ft). For example, a 100 Gaj plot equals **900 sq.ft**, and a 200 Gaj plot equals **1,800 sq.ft**.";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Acre to sq ft kitna hai?", "Carpet area kya hai?", "Plots dikhao"] : ["Acre to Sq Ft", "What is Carpet Area?", "Browse Plots"]
    };
  }

  // Acre to Sq Ft / Gaj
  if (/\b(acre to sq ft|acre to gaj|1 acre kitna|acre in sq ft)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Acre = **43,560 Square Feet** (yaani **4,840 Gaj / Square Yards**, lagbhag 0.405 Hectares ya 40 Gunthas)."
      : "1 Acre = **43,560 Square Feet** (which equals **4,840 Square Yards / Gaj**, approximately 0.405 Hectares or 40 Gunthas).";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Hectare to acre", "Guntha to sq ft", "Agricultural land rules"] : ["Hectare to Acre", "Guntha to Sq Ft", "Explore Land Listings"]
    };
  }

  // Hectare to Acre / Sq Ft
  if (/\b(hectare to acre|hectare to sq ft|1 hectare kitna)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Hectare = **2.471 Acres** (lagbhag **107,639 Square Feet** ya 10,000 Square Meters)."
      : "1 Hectare = **2.471 Acres** (approximately **107,639 Square Feet** or 10,000 Square Meters).";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Acre to sq ft", "Bigha in sq ft", "Land verify kaise karein"] : ["Acre to Sq Ft", "Bigha in Sq Ft", "Verify Land Records"]
    };
  }

  // Bigha to Sq Ft
  if (/\b(bigha to sq ft|bigha in sq ft|1 bigha kitna)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Bigha ki value har state mein alag hoti hai: Uttar Pradesh/Bihar mein 1 Pucca Bigha ≈ **27,000 sq.ft**, Rajasthan mein ≈ **17,424 sq.ft**, aur West Bengal mein ≈ **14,400 sq.ft** hota hai."
      : "1 Bigha varies by state: In Uttar Pradesh/Bihar 1 Pucca Bigha ≈ **27,000 sq.ft**, in Rajasthan ≈ **17,424 sq.ft**, and in West Bengal ≈ **14,400 sq.ft**.";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Gaj to sq ft", "Acre in sq ft", "Land registry process"] : ["Gaj to Sq Ft", "Acre in Sq Ft", "Registration Process"]
    };
  }

  // Guntha to Sq Ft
  if (/\b(guntha to sq ft|guntha in sq ft|1 guntha kitna)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Guntha (Maharashtra aur Karnataka mein standard measurement) = **1,089 Square Feet** (33 ft × 33 ft). 1 Acre mein poore **40 Guntha** hote hain."
      : "1 Guntha (standard land measurement in Maharashtra & Karnataka) = **1,089 Square Feet** (33 ft × 33 ft). Exactly **40 Gunthas** make up 1 Acre.";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Pune me plots", "Bengaluru me plots", "7/12 extract kya hai"] : ["Plots in Pune", "Plots in Bengaluru", "What is 7/12 Extract"]
    };
  }

  // Cent to Sq Ft
  if (/\b(cent to sq ft|cent in sq ft|1 cent kitna)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Cent (Kerala aur Tamil Nadu mein widely used) = **435.6 Square Feet** (yaani 1 Acre ka 1/100th hissa)."
      : "1 Cent (widely used in Kerala & Tamil Nadu) = **435.6 Square Feet** (equal to 1/100th of an Acre).";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Plots in Chennai", "Plots in Kochi", "Acre to sq ft"] : ["Plots in Chennai", "Plots in Kochi", "Acre to Sq Ft"]
    };
  }

  // Kanal & Marla to Sq Ft
  if (/\b(kanal to sq ft|kanal in sq ft|1 kanal kitna|marla to sq ft)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Kanal (Punjab, Haryana aur North India) = **5,445 Square Feet** (605 Sq Yards). 1 Kanal mein 20 Marlas hote hain, aur 1 Marla = **272.25 Square Feet** hota hai."
      : "1 Kanal (used in Punjab, Haryana & North India) = **5,445 Square Feet** (605 Sq Yards). 1 Kanal contains 20 Marlas, with 1 Marla equal to **272.25 Square Feet**.";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Plots in Chandigarh", "Plots in Gurugram", "Gaj to sq ft"] : ["Plots in Chandigarh", "Plots in Gurugram", "Gaj to Sq Ft"]
    };
  }

  // Square Meter to Square Feet
  if (/\b(sq meter to sq ft|sqm to sqft|square meter to square feet)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "1 Square Meter (sq.m) = **10.764 Square Feet** (sq.ft). Jaise 100 sq.m ka apartment lagbhag **1,076 sq.ft** carpet area hota hai."
      : "1 Square Meter (sq.m) = **10.764 Square Feet** (sq.ft). For example, a 100 sq.m apartment equals approximately **1,076 sq.ft** of floor area.";
    return {
      text,
      type: 'general_knowledge',
      category: 'Unit Conversions',
      language: lang,
      quickReplies: isHinglish ? ["Carpet area definition", "2 BHK flats", "Properties dikhao"] : ["Carpet Area Norms", "2 BHK Flats", "Browse Listings"]
    };
  }

  // 4. Simple Factual Knowledge
  // Capital of India
  if (/\b(capital of india|bharat ki rajdhani|india ki capital)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "Bharat (India) ki capital **New Delhi** hai! INDSTATE par Delhi NCR (Delhi, Noida, Gurugram) ke top RERA-verified projects listed hain."
      : "The capital of India is **New Delhi**. INDSTATE features hundreds of verified listings across Delhi NCR, including Noida and Gurugram.";
    return {
      text,
      type: 'general_knowledge',
      category: 'General Knowledge',
      language: lang,
      quickReplies: isHinglish ? ["Delhi me flats", "Gurugram me apartments", "Noida properties"] : ["Flats in Delhi", "Flats in Gurugram", "Flats in Noida"]
    };
  }

  // Prime Minister of India
  if (/\b(prime minister of india|pm of india|bharat ke pradhan mantri)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "Bharat ke current Prime Minister **Shri Narendra Modi** hain. Waise housing sector ke liye unka flagship initiative 'Pradhan Mantri Awas Yojana (PMAY)' affordable homes par subsidy deta hai. Kya aap PMAY eligibility dekhna chahte hain?"
      : "The current Prime Minister of India is **Shri Narendra Modi**. In the real estate sector, the flagship 'Pradhan Mantri Awas Yojana (PMAY)' initiative provides credit-linked interest subsidies for eligible homebuyers. Would you like to check PMAY subsidy details?";
    return {
      text,
      type: 'general_knowledge',
      category: 'General Knowledge',
      language: lang,
      quickReplies: isHinglish ? ["PMAY details batao", "Home loan interest", "Affordable housing"] : ["PMAY Scheme Details", "Home Loan Rates", "Affordable Housing"]
    };
  }

  // States in India
  if (/\b(how many states in india|kitne states hain india|states in india)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "Bharat mein total **28 States aur 8 Union Territories** hain — aur INDSTATE in sabhi 28 states mein 100% verified properties aur RERA transparency provide karta hai!"
      : "India has **28 States and 8 Union Territories** — and INDSTATE covers RERA-verified real estate across all 28 Indian states!";
    return {
      text,
      type: 'general_knowledge',
      category: 'General Knowledge',
      language: lang,
      quickReplies: isHinglish ? ["Maharashtra properties", "Karnataka properties", "All states"] : ["Maharashtra Listings", "Karnataka Listings", "Browse All States"]
    };
  }

  // Current RBI Repo Rate
  if (/\b(repo rate kya hai|current repo rate|rbi repo rate|rbi interest rate)\b/i.test(cleanMsg)) {
    const text = isHinglish
      ? "Reserve Bank of India (RBI) ka current benchmark Repo Rate **6.50%** par hai. Banks ke floating home loans isi repo rate se linked (EBLR) hote hain, isliye national banks mein home loan rates 8.40% se 8.75% ke range mein chal rahe hain."
      : "The Reserve Bank of India (RBI) benchmark Repo Rate currently stands at **6.50%**. Because floating home loans are pegged to the repo rate (EBLR), leading Indian banks offer home loans starting from 8.40% to 8.75% p.a.";
    return {
      text,
      type: 'general_knowledge',
      category: 'Home Loans & Finance',
      language: lang,
      quickReplies: isHinglish ? ["EMI Calculator kholo", "SBI vs HDFC loan", "Pre-approval check"] : ["Open EMI Calculator", "SBI vs HDFC Rates", "Check Pre-approval"]
    };
  }

  return null;
}

/**
 * Handles questions requiring live / current dynamic information (Weather, Scores, Stocks, News)
 * Adheres strictly to honesty guidelines: acknowledges limitation warmly, suggests alternatives,
 * and smoothly guides back to property topics without being pushy.
 */
function handleRealtimeLimitations(cleanMsg, isHinglish, lang) {
  // 1. Live Weather / Temperature / Forecast
  if (
    /\b(weather|temperature|forecast|mausam kaisa|barish hogi|aaj ka mausam)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Ye mujhe abhi real-time pata nahi chal payega, kyunki mere paas live meteorological weather satellite feeds ka direct access nahi hai! Aap apne phone ka Weather app check kar sakte hain live forecast ke liye. Waise property ya ghar ke baare mein kuch help chahiye?"
      : "I don't have access to live real-time weather feeds, so I wouldn't want to guess or give you an outdated forecast! You can quickly check your phone's Weather app for live local temperatures. In the meantime, let me know if there's any property or home loan question I can assist you with!";
    return {
      text,
      type: 'realtime_limitation',
      category: 'Real-Time Limitation',
      language: lang,
      quickReplies: isHinglish
        ? ["Properties explore karein", "Home Loan EMI check", "RERA verified flats"]
        : ["Explore Properties", "Calculate Loan EMI", "Check RERA Listings"]
    };
  }

  // 2. Live Sports / Cricket Scores / Matches
  if (
    /\b(cricket score|ipl score|match score|live score|score kya hua|kaun jeeta|who won the match)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Ye live match score mujhe abhi real-time pata nahi chal payega, kyunki mere paas live sports feeds ka integration nahi hai. Aap Google ya Cricbuzz par live scorecard dekh sakte hain! Waise real estate ya properties ke baare mein koi sawaal ho toh zaroor poochiye."
      : "I don't have live real-time integration for sports or match scores! You can easily catch the live scorecard on Google or Cricbuzz. Let me know if there's anything real-estate or property-related I can assist with though!";
    return {
      text,
      type: 'realtime_limitation',
      category: 'Real-Time Limitation',
      language: lang,
      quickReplies: isHinglish
        ? ["Flats in Mumbai", "Loan eligibility", "RERA status check"]
        : ["Flats in Mumbai", "Loan Eligibility", "Check RERA Status"]
    };
  }

  // 3. Live Stock Prices / Share Market / Crypto
  if (
    /\b(stock price|share price|sensex today|nifty today|reliance share|tata share|bitcoin price|crypto price|share market live)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Stock aur crypto markets second-by-second fluctuate karte hain aur mere paas live ticker terminal feed nahi hai, isliye main galat rate quote nahi karna chahta. Aap Moneycontrol ya Google Finance par live rates check kar sakte hain! Agar aap real estate investment ya rental yield ke baare mein kuch jaanna chahte hain, toh main zaroor help kar sakta hoon."
      : "Stock and equity prices fluctuate second-by-second and I don't have a live market terminal feed, so I wouldn't want to quote an inaccurate figure! You can check Google Finance or Moneycontrol for live market rates. If you're comparing property investment yields or home loan rates, however, I'm right here to help!";
    return {
      text,
      type: 'realtime_limitation',
      category: 'Real-Time Limitation',
      language: lang,
      quickReplies: isHinglish
        ? ["Rental yield kitna hota hai?", "Commercial vs Residential", "Properties dikhao"]
        : ["Rental Yield Guide", "Commercial vs Residential", "Browse Properties"]
    };
  }

  // 4. Breaking News Headlines
  if (
    /\b(breaking news|news today|aaj ki taaza khabar|latest headlines|news headlines)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Live breaking news ke liye mere paas real-time media telecast feed nahi hai — aap kisi news app ya Google News par latest headlines dekh sakte hain! Real estate policy, RERA reforms aur property trends ke baare mein jaankari chahiye ho toh main poori madad karunga."
      : "I don't have a live breaking news feed, so you can check Google News or your favorite news app for today's headlines! If you'd like updates on real estate policies, RERA guidelines, or property market trends, I'd be happy to share.";
    return {
      text,
      type: 'realtime_limitation',
      category: 'Real-Time Limitation',
      language: lang,
      quickReplies: isHinglish
        ? ["RERA reforms kya hain?", "Stamp duty rates", "Top projects"]
        : ["RERA Reforms", "Stamp Duty Rates", "Top Verified Projects"]
    };
  }

  return null;
}

/**
 * Handles completely off-topic questions (Coding, Cooking/Recipes, Essays, Medical Advice)
 * Warm, slightly playful about being specialized in real estate.
 */
function handleOfftopicSpecialization(cleanMsg, isHinglish, lang) {
  // 1. Coding & Programming
  if (
    /\b(code|coding|python|javascript|programmer|programming|developer|debug|react|html|css|c\+\+|java|sql|build an app|script)\b/i.test(cleanMsg) &&
    !cleanMsg.includes('pincode') && !cleanMsg.includes('pin code')
  ) {
    const text = isHinglish
      ? "Haha, coding aur programming mera area nahi hai! 😄 Main ghar-dhundhne, RERA, loans, aisi cheezon mein expert hoon — koi property-related sawaal ho to zaroor poochiye!"
      : "Haha, coding is outside my wheelhouse! 😄 I'm an expert at home hunting, RERA checks, home loans, and property paperwork — happy to help with any of those though!";
    return {
      text,
      type: 'offtopic_specialization',
      category: 'Off-Topic',
      language: lang,
      quickReplies: isHinglish
        ? ["Ghar dhoondhna hai", "Loan EMI calculation", "RERA rules"]
        : ["Find a Home", "Calculate EMI", "Check RERA Rules"]
    };
  }

  // 2. Cooking / Recipes / Food Preparation
  if (
    (/\b(recipe|biryani|cook|khana kaise banaye|how to cook|dish recipe|pasta recipe|maggi|curry recipe|paneer recipe|how to bake)\b/i.test(cleanMsg)) &&
    !cleanMsg.includes('kitchen modular') && !cleanMsg.includes('modular kitchen')
  ) {
    const text = isHinglish
      ? "Haha, biryani aur cooking mera area nahi hai! 😄 Main ghar-dhundhne, RERA, loans, aisi cheezon mein expert hoon — koi property-related sawaal ho to zaroor poochiye!"
      : "Haha, cooking and recipes are outside my area of expertise! 😄 I'm an expert at home hunting, RERA checks, home loans, and property paperwork — happy to help with any of those though!";
    return {
      text,
      type: 'offtopic_specialization',
      category: 'Off-Topic',
      language: lang,
      quickReplies: isHinglish
        ? ["Modular kitchen wale flats", "Properties dikhao", "Loan eligibility"]
        : ["Flats with Modular Kitchen", "Browse Properties", "Check Loan EMI"]
    };
  }

  // 3. School Essays / Poems / Songs
  if (
    /\b(write an essay|write a poem|sing a song|do my homework|write a speech|write a story)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Haha, essays aur poems likhna mera department nahi hai! 😄 Main property market insights, home loan numbers aur legal paperwork mein expert hoon — real estate ke baare mein koi plan ho toh batayein!"
      : "Haha, writing essays or poems is a bit outside my zone! 😄 I specialize in real estate intelligence, home loan numbers, and property legalities. If you ever have a question about homes or loans, I'm right here!";
    return {
      text,
      type: 'offtopic_specialization',
      category: 'Off-Topic',
      language: lang,
      quickReplies: isHinglish
        ? ["Property search karein", "Home Loan calculator", "RERA verified homes"]
        : ["Search Properties", "Loan Calculator", "Explore Verified Homes"]
    };
  }

  // 4. Medical / Health Diagnoses
  if (
    /\b(medicine for|doctor advice|fever medicine|headache dawa|dawai|tablet for)\b/i.test(cleanMsg)
  ) {
    const text = isHinglish
      ? "Health aur medical advice ke liye please kisi qualified doctor ya healthcare professional se consult karein — main sirf real estate aur property decisions mein expert hoon! Apna khayal rakhiye! 🙏"
      : "For health and medical advice, please consult a certified doctor or healthcare professional — real estate is my only domain! Please take care of yourself! 🙏";
    return {
      text,
      type: 'offtopic_specialization',
      category: 'Off-Topic',
      language: lang,
      quickReplies: isHinglish
        ? ["Theek hai", "Hospital ke paas flats", "Properties dikhao"]
        : ["Understood", "Flats near hospitals", "Browse Properties"]
    };
  }

  return null;
}

/**
 * Context Augmentation for Follow-Up Queries
 */
function augmentQueryWithContext(userMessage, conversationHistory = []) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return userMessage;
  }

  const clean = userMessage.toLowerCase().trim();
  const isFollowUpPattern = (
    clean.startsWith('what if') ||
    clean.startsWith('and what') ||
    clean.startsWith('what about') ||
    clean.startsWith('aur agar') ||
    clean.startsWith('aur ') ||
    clean.startsWith('how much') ||
    clean.startsWith('can i') ||
    clean.startsWith('kya isme') ||
    clean.includes('delay') ||
    clean.includes('deri') ||
    clean.includes('refund') ||
    clean.includes('this') ||
    clean.includes('ye') ||
    clean.includes('iska') ||
    clean.split(' ').length <= 4
  );

  if (!isFollowUpPattern) {
    return userMessage;
  }

  // Scan backwards through the last 3 conversation turns
  const recentTurns = conversationHistory.slice(-3);
  let contextClues = [];

  for (let i = recentTurns.length - 1; i >= 0; i--) {
    const msg = recentTurns[i];
    if (msg.category) {
      contextClues.push(msg.category);
    }
    if (msg.queryRef) {
      contextClues.push(msg.queryRef);
    }
    if (msg.sender === 'user' && msg.text) {
      contextClues.push(msg.text);
    }
  }

  if (contextClues.length > 0) {
    return `${userMessage} ${contextClues.slice(0, 2).join(' ')}`;
  }

  return userMessage;
}

/**
 * City aliases for flexible Indian metro searches
 */
const CITY_ALIASES = {
  'bangalore': 'bengaluru',
  'bengaluru': 'bengaluru',
  'mumbai': 'mumbai',
  'bombay': 'mumbai',
  'gurgaon': 'gurugram',
  'gurugram': 'gurugram',
  'delhi': 'delhi',
  'noida': 'noida',
  'pune': 'pune',
  'hyderabad': 'hyderabad',
  'kolkata': 'kolkata',
  'calcutta': 'kolkata',
  'chennai': 'chennai',
  'madras': 'chennai',
  'ahmedabad': 'ahmedabad'
};

/**
 * Finds matching properties if user query relates to specific real estate listings
 */
export function findMatchingProperties(query, properties = []) {
  if (!query || properties.length === 0) return [];
  const q = query.toLowerCase();

  const scored = properties.map(p => {
    const pCity = (p.city || '').toLowerCase();
    const cityAlias = CITY_ALIASES[pCity] || pCity;

    let score = 0;
    if (p.title && (p.title.toLowerCase().includes(q) || q.includes(p.title.toLowerCase()))) score += 10;
    if (q.includes(pCity) || q.includes(cityAlias)) score += 5;
    if (p.locality && q.includes(p.locality.toLowerCase())) score += 4;
    if (p.bhk && (q.includes(`${p.bhk}bhk`) || q.includes(`${p.bhk} bhk`))) score += 4;
    if (p.purpose && q.includes(p.purpose.toLowerCase())) score += 2;
    if (p.propertyType && q.includes(p.propertyType.toLowerCase())) score += 2;

    return { property: p, score };
  }).filter(item => item.score >= 4);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(item => item.property);
}

/**
 * Core Senior RAG Response Synthesizer
 * Generates natural, context-aware answers mirroring detected language (English vs Hinglish)
 */
export function synthesizeRAGResponse({
  userMessage,
  knowledgeBase = [],
  properties = [],
  conversationHistory = []
}) {
  const lang = detectLanguage(userMessage);
  const isHinglish = lang === 'hinglish';
  const cleanMsg = userMessage.toLowerCase().trim();

  // Extract memory entities across session
  const entities = extractEntitiesFromHistory(conversationHistory, userMessage);

  // 1. Check for Personal Milestone Announcement (Birthday, Anniversary, New Job, Relocation)
  const milestoneResponse = handlePersonalMilestones(cleanMsg, isHinglish, lang, entities);
  if (milestoneResponse) {
    return milestoneResponse;
  }

  // 2. Check for Casual Small Talk (Greetings, How-are-you, Gratitude, Goodbyes, Banter/Jokes, Weather, Feelings)
  const smallTalkResponse = handleCasualSmallTalk(cleanMsg, isHinglish, lang, entities);
  if (smallTalkResponse) {
    return smallTalkResponse;
  }

  // 3. Check for General Knowledge & Conversions (Live Date/Time, Crore-Million, Land units, Simple Facts)
  const gkResponse = handleGeneralKnowledgeAndConversions(cleanMsg, isHinglish, lang);
  if (gkResponse) {
    return gkResponse;
  }

  // 4. Check for Live/Real-Time Limitation Queries (Live Weather, Live Cricket/Sports, Live Stocks, Breaking News)
  const realtimeResponse = handleRealtimeLimitations(cleanMsg, isHinglish, lang);
  if (realtimeResponse) {
    return realtimeResponse;
  }

  // 5. Check for Off-Topic Specialization Queries (Coding, Recipes/Cooking, Poems/Essays, Medical)
  const offtopicResponse = handleOfftopicSpecialization(cleanMsg, isHinglish, lang);
  if (offtopicResponse) {
    return offtopicResponse;
  }

  // 2. Frustration / "Didn't Work" / 2-Strike Failure Escalation
  const isFrustratedOrFailed = detectFrustrationOrFailure(cleanMsg, conversationHistory);
  if (isFrustratedOrFailed && (entities.hasPriorBotSuggestion || conversationHistory.length >= 2)) {
    return {
      text: isHinglish
        ? "Ye sunke bura laga ki standard steps se aapki pareshani hal nahi hui. Main bilkul samajh sakta hoon — jab property ya hard-earned money ka sawal ho toh har din ka delay chinta deta hai. Ab aur wait karne ke bajaye, main aapka issue direct humare Senior RERA & Financial Dispute Desk ko escalate kar raha hoon. Niche diye gaye direct connect buttons se aap turant senior advisor se baat kar sakte hain."
        : "I'm genuinely sorry to hear that the initial recourse didn't resolve this for you. I completely understand how stressful it is when your hard-earned savings or property handover is delayed. Rather than giving you more generic suggestions, I am escalating your case directly to our Senior RERA & Financial Escalation Desk for direct intervention.",
      type: 'human_handoff',
      language: lang,
      action: 'show_handoff_card',
      quickReplies: isHinglish 
        ? ["Senior Advisor se WhatsApp", "Direct Callback Request", "Top RERA Lawyers"]
        : ["Chat with Senior Advisor", "Request Immediate Callback", "View Verified Options"]
    };
  }

  // 3. Detect Explicit Human Agent / Advisor Request Intent
  if (
    cleanMsg.includes('agent') ||
    cleanMsg.includes('expert') ||
    cleanMsg.includes('advisor') ||
    cleanMsg.includes('call me') ||
    cleanMsg.includes('call karo') ||
    cleanMsg.includes('talk to') ||
    cleanMsg.includes('baat karni') ||
    cleanMsg.includes('phone number') ||
    cleanMsg.includes('customer care')
  ) {
    return {
      text: isHinglish
        ? "Haanji bilkul! Aap humare INDSTATE verified real estate advisors se seedhe baat kar sakte hain. Aap niche diye gaye WhatsApp button se turant chat shuru kar sakte hain ya Callback schedule kar sakte hain."
        : "Certainly! You can connect directly with an INDSTATE certified RERA advisor. You can chat instantly via WhatsApp below or request an immediate callback.",
      type: 'human_handoff',
      language: lang,
      action: 'show_handoff_card',
      quickReplies: isHinglish 
        ? ["Callback request karein", "WhatsApp par baat karein", "Properties dikhao"]
        : ["Request Callback", "Chat on WhatsApp", "View Properties"]
    };
  }

  // 4. Ambiguous Problem Clarification Engine
  const ambiguousDiagnostic = detectAmbiguousProblem(cleanMsg, isHinglish, entities);
  if (ambiguousDiagnostic) {
    return ambiguousDiagnostic;
  }

  // 5. Multi-Part Query Resolution
  const multiPartResponse = handleMultiPartQuery(userMessage, knowledgeBase, isHinglish, entities);
  if (multiPartResponse) {
    return multiPartResponse;
  }

  // 6. Check for Specific Property Mentions in Database (RAG Property Context)
  const matchedProps = findMatchingProperties(userMessage, properties);
  if (matchedProps.length > 0) {
    const topProp = matchedProps[0];
    const priceFormatted = formatIndianPrice(topProp.price, topProp.purpose === 'Rent');
    const carpetArea = topProp.carpetArea || topProp.carpetAreaSqFt || '1,200+';
    const baths = topProp.bathrooms || topProp.baths || 2;

    let milestoneNote = "";
    if (entities?.milestones?.birthday && !entities?.milestones?.birthdayAcknowledgedRecently) {
      milestoneNote = isHinglish
        ? `\n\n*(Aur haan, aapko Janamdin ki bohot saari shubhkaamnayein once again! 🎂)*`
        : `\n\n*(And wishing you a wonderful birthday once again! 🎉)*`;
    } else if (entities?.milestones?.newJob && !entities?.milestones?.newJobAcknowledgedRecently) {
      milestoneNote = isHinglish
        ? `\n\n*(Aur aapko nayi job/role ke liye badhaiyan once again! 💼)*`
        : `\n\n*(And congratulations on the new role once again! 💼)*`;
    }

    const text = isHinglish
      ? `Haanji! Mujhe aapke search ke anusaar **${topProp.title}** (${topProp.locality}, ${topProp.city}) mil gaya hai. 
         \n• **Price:** ${priceFormatted}
         \n• **RERA Status:** ${topProp.isReraVerified ? `Verified (${topProp.reraNumber})` : 'Under Verification'}
         \n• **Carpet Area:** ${carpetArea} sq.ft. (Actual Usable Area)
         \n• **Configuration:** ${topProp.bhk} BHK • ${baths} Baths
         \nKya aap iss property ke liye free escorted site inspection schedule karna chahenge?${milestoneNote}`
      : `Yes! I found **${topProp.title}** located in ${topProp.locality}, ${topProp.city}.
         \n• **Price:** ${priceFormatted}
         \n• **RERA Status:** ${topProp.isReraVerified ? `Verified (${topProp.reraNumber})` : 'Under Verification'}
         \n• **Carpet Area:** ${carpetArea} sq.ft. (100% Usable Carpet Area)
         \n• **Layout:** ${topProp.bhk} BHK • ${baths} Baths
         \nWould you like to schedule a free escorted site inspection for this property?${milestoneNote}`;

    return {
      text,
      type: 'property_rag',
      properties: matchedProps,
      language: lang,
      quickReplies: isHinglish
        ? ["Site visit book karo", "More details", "Different city"]
        : ["Book Site Visit", "More Details", "Search Other City"]
    };
  }

  // 7. Perform Semantic Vector Search against Knowledge Base (with Context Augmentation)
  const augmentedQuery = augmentQueryWithContext(userMessage, conversationHistory);
  const searchResult = searchKnowledgeBase(augmentedQuery, knowledgeBase, 0.19);

  if (searchResult.bestMatch) {
    const match = searchResult.bestMatch;
    const baseAnswer = isHinglish ? match.answerHi : match.answerEn;
    const warmAnswer = formatWarmFriendAnswer(baseAnswer, match, userMessage, entities, isHinglish);

    return {
      text: warmAnswer,
      type: 'kb_answer',
      category: match.category,
      matchId: match.id,
      score: searchResult.score,
      language: lang,
      quickReplies: isHinglish
        ? ["Property dikhao", "RERA verified flats", "Site visit schedule karo"]
        : ["View Properties", "Check RERA Listings", "Schedule Site Visit"]
    };
  }

  // 8. Honest Warm Fallback & Human Escalation (Below Confidence Threshold)
  return {
    text: isHinglish
      ? "Dekhiye, main aapko galat ya adhoori jaankari bilkul nahi dena chahta kyunki property decisions me ek ek rupaye ki keemat hoti hai. Mere verified records me iss specific query ka exact rule abhi nahi hai — par humare certified RERA property advisors se main aapki turant baat karwa deta hoon jo direct help karenge."
      : "I want to be completely upfront with you — because real estate decisions involve serious finances, I'd rather not guess or provide incomplete information. I don't have the exact verified documentation for this specific query, but I can connect you directly with an INDSTATE certified RERA advisor right now.",
    type: 'fallback_handoff',
    fallback: true,
    unansweredQuery: userMessage,
    language: lang,
    action: 'show_handoff_card',
    quickReplies: isHinglish
      ? ["WhatsApp Advisor", "Callback request karein", "Top Properties"]
      : ["Chat on WhatsApp", "Request Callback", "Browse Listings"]
  };
}
