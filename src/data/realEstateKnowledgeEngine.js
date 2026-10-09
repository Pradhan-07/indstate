/**
 * INDSTATE REAL ESTATE KNOWLEDGE ENGINE
 * 
 * Comprehensive structured knowledge base covering Indian real estate laws,
 * RERA compliance, state-specific nuances, financial calculations,
 * due-diligence checklists, and buying journeys.
 */

export const REAL_ESTATE_KNOWLEDGE = {
  // ==========================================================================
  // 1. PROPERTY BUYING JOURNEY (10 STAGES)
  // ==========================================================================
  buyingJourney: {
    stages: [
      {
        id: 1,
        name: 'Exploring',
        nameHi: 'Shuruat / Exploration',
        description: 'Defining budget, preferred city, micro-market, and unit configuration (1/2/3/4 BHK).',
        tips: 'Always check carpet area pricing and keep 10-15% extra buffer for stamp duty, registration, and interior expenses.'
      },
      {
        id: 2,
        name: 'Shortlisting',
        nameHi: 'Shortlist Karna',
        description: 'Filtering properties based on RERA verification, commute time, floor plans, and amenities.',
        tips: 'Shortlist minimum 3-5 verified listings to compare price per sq.ft. of usable carpet area.'
      },
      {
        id: 3,
        name: 'Comparing',
        nameHi: 'Properties Compare Karna',
        description: 'Evaluating unit layouts, developer track record, amenities, and price per carpet sq.ft.',
        tips: 'Focus on carpet area, loading ratio (super built-up vs carpet), and maintenance costs.'
      },
      {
        id: 4,
        name: 'Site Visit',
        nameHi: 'Site Inspection / Physical Visit',
        description: 'Physical walkthrough of property, checking construction quality, daylight, ventilation, and approach road.',
        tips: 'Visit twice: once on a weekday during peak office hours for traffic check, and once on a weekend for neighbourhood noise.'
      },
      {
        id: 5,
        name: 'Due Diligence',
        nameHi: 'Legal & Paperwork Verification',
        description: 'Verifying Title Deed (30 years), Encumbrance Certificate (EC), Sanctioned Plan, and RERA registration.',
        tips: 'Never skip the 30-year title search and always verify the RERA number on the official state authority portal.'
      },
      {
        id: 6,
        name: 'Home Loan Approval',
        nameHi: 'Home Loan Sanction & Disbursement',
        description: 'Submitting KYC, ITR, bank statements for bank sanction and legal/technical property evaluation.',
        tips: 'Keep CIBIL score above 750 for the best interest rates (starting ~8.40% p.a.). LTV ranges from 75% to 90% depending on ticket size.'
      },
      {
        id: 7,
        name: 'Price Negotiation & Token',
        nameHi: 'Price Negotiation & Bayana (Token)',
        description: 'Finalizing total all-inclusive price and paying a nominal refundable token with written receipt.',
        tips: 'Keep token amount nominal (₹25,000 - ₹1,00,000) and explicitly mention refund clause if title search fails.'
      },
      {
        id: 8,
        name: 'Agreement to Sell',
        nameHi: 'Agreement to Sell (BBA)',
        description: 'Drafting the bi-lateral contract with payment milestones, penalty clauses, and delivery date.',
        tips: 'Ensure delivery date matches RERA completion date and payment is linked to construction milestones, not arbitrary calendar dates.'
      },
      {
        id: 9,
        name: 'Registration & Stamp Duty',
        nameHi: 'Stamp Duty & Sub-Registrar Registry',
        description: 'Paying state stamp duty (4-7%) and executing registered Sale Deed at local Sub-Registrar office.',
        tips: 'Deduct 1% TDS under Section 194-IA if property value is ₹50 Lakh or higher before releasing payment.'
      },
      {
        id: 10,
        name: 'Possession & Mutation',
        nameHi: 'Handover & Municipal Mutation / Khata',
        description: 'Receiving physical keys, Occupancy Certificate (OC), society handover, and transferring municipal property tax name.',
        tips: 'Never accept possession without an Occupancy Certificate (OC). Apply for municipal mutation (Khata/Patta) within 30 days.'
      }
    ]
  },

  // ==========================================================================
  // 2. RERA (REAL ESTATE REGULATION & DEVELOPMENT ACT, 2016)
  // ==========================================================================
  rera: {
    overview: 'RERA (Real Estate Regulatory Authority) was enacted in 2016 to protect home buyers, ensure transparent transactions, and enforce timely project delivery across India.',
    keyPillars: [
      {
        title: 'Mandatory Carpet Area Pricing',
        titleHi: 'Carpet Area par Pricing',
        detail: 'RERA strictly mandates selling property on Net Usable Carpet Area, prohibiting misleading Super Built-up quotes with 30-40% artificial loading.'
      },
      {
        title: '70% Project Escrow Account',
        titleHi: '70% Funds Escrow Account',
        detail: 'Builders must deposit 70% of money collected from buyers into a dedicated project escrow account, used solely for land and construction of that specific project.'
      },
      {
        title: 'Section 18 Delay Compensation',
        titleHi: 'Possession Delay Par Interest',
        detail: 'If a builder delays possession beyond the promised RERA deadline, the buyer is entitled to monthly interest at SBI highest lending rate (MCLR) + 2% until handover, or complete refund with interest.'
      },
      {
        title: '5-Year Structural Defect Guarantee',
        titleHi: '5 Saal ki Structural Guarantee',
        detail: 'Under Section 14(3), builders must rectify any structural or workmanship defects free of charge within 30 days of notice for 5 years after possession.'
      },
      {
        title: 'Compulsory Project Registration',
        titleHi: 'Mandatory RERA Registration',
        detail: 'All residential and commercial projects where land area exceeds 500 sq. meters or apartments exceed 8 units must register with state RERA before advertising or selling.'
      }
    ],
    statePortals: {
      'Maharashtra': { portal: 'MahaRERA', url: 'https://maharerait.mahaonline.gov.in', prefix: 'P' },
      'Delhi': { portal: 'Delhi RERA', url: 'https://rera.delhi.gov.in', prefix: 'DLRERA' },
      'Uttar Pradesh': { portal: 'UP RERA', url: 'https://www.up-rera.in', prefix: 'UPRERAPRJ' },
      'Karnataka': { portal: 'RERA Karnataka', url: 'https://rera.karnataka.gov.in', prefix: 'PRM/KA/RERA' },
      'Telangana': { portal: 'TG RERA', url: 'https://rera.telangana.gov.in', prefix: 'P0' },
      'Tamil Nadu': { portal: 'TNRERA', url: 'https://www.rera.tn.gov.in', prefix: 'TN/' },
      'Gujarat': { portal: 'GujRERA', url: 'https://gujrera.gujarat.gov.in', prefix: 'PR/GJ/' },
      'Rajasthan': { portal: 'RajRERA', url: 'https://rera.rajasthan.gov.in', prefix: 'RAJ/P/' },
      'Punjab': { portal: 'PBRERA', url: 'https://rera.punjab.gov.in', prefix: 'PBRERA' },
      'Haryana': { portal: 'HRERA (Gurugram / Panchkula)', url: 'https://haryanarera.gov.in', prefix: 'RC/REP/HARERA' }
    }
  },

  // ==========================================================================
  // 3. LEGAL DUE DILIGENCE (7-POINT VERIFICATION CHECKLIST)
  // ==========================================================================
  dueDiligenceChecklist: [
    {
      step: 1,
      title: 'Title Deed & Chain of Ownership (30 Years)',
      titleHi: 'Malkana Haq / Title Search (30 Saal)',
      description: 'Verify the original Sale Deed, Gift Deed, or Partition Deed and unbroken chain of title transfers for minimum 30 years to ensure clean, marketable title.'
    },
    {
      step: 2,
      title: 'Encumbrance Certificate (EC - Minimum 15-30 Years)',
      titleHi: 'Encumbrance Certificate (EC / Bhar-mukt praman)',
      description: 'Obtain Form 15 (issued by Sub-Registrar) showing all registered mortgages, liens, or court attachments. Form 16 confirms nil encumbrance.'
    },
    {
      step: 3,
      title: 'Sanctioned Building Plan & Commencement Certificate (CC)',
      titleHi: 'Sanctioned Building Plan & CC',
      description: 'Confirm local municipal authority approval (BBMP, BMC, MCD, GHMC) for the building structure. Ensure no illegal floors or unauthorized balconies.'
    },
    {
      step: 4,
      title: 'Occupancy Certificate (OC) / Completion Certificate',
      titleHi: 'Occupancy Certificate (OC)',
      description: 'The municipal body certifies that the building has civic amenities (water, electricity, sewage) and conforms to safety norms. Never occupy without OC!'
    },
    {
      step: 5,
      title: 'RERA Registration & Escrow Verification',
      titleHi: 'RERA Number Verification',
      description: 'Cross-reference the project RERA number on the official state portal to verify approved completion date, litigation history, and promoter credentials.'
    },
    {
      step: 6,
      title: 'Updated Municipal Property Tax Receipts & Society NOC',
      titleHi: 'Property Tax Receipts & Society NOC',
      description: 'Verify that previous property taxes are paid in full. For resale flats, obtain a clean No Objection Certificate (NOC) from the Resident Welfare Association (RWA).'
    },
    {
      step: 7,
      title: 'Physical Site Inspection & Boundary Tally',
      titleHi: 'Physical Site Walkthrough',
      description: 'Ensure boundary dimensions match the registered sale deed. Check water supply, electricity load sanction, parking allotment, and structural quality.'
    }
  ],

  // ==========================================================================
  // 4. HOME LOANS & FINANCE
  // ==========================================================================
  finance: {
    interestRateInfo: 'Indian home loan interest rates typically range from 8.40% to 8.75% per annum for floating repo-linked loans (EBLR). Rates vary based on CIBIL credit score (750+ offers lowest slabs).',
    ltvNorms: [
      { slab: 'Up to ₹30 Lakh', ltv: 'Up to 90%', downPayment: 'Min 10%' },
      { slab: '₹30 Lakh to ₹75 Lakh', ltv: 'Up to 80%', downPayment: 'Min 20%' },
      { slab: 'Above ₹75 Lakh', ltv: 'Up to 75%', downPayment: 'Min 25%' }
    ],
    taxBenefits: [
      { section: 'Section 80C', limit: 'Up to ₹1.5 Lakh per financial year on principal repayment.' },
      { section: 'Section 24(b)', limit: 'Up to ₹2.0 Lakh per financial year on interest paid for self-occupied home.' },
      { section: 'Section 80EEA', limit: 'Additional ₹1.5 Lakh on interest for first-time buyers of affordable homes (subject to statutory conditions).' }
    ],
    prepaymentRule: 'Under Reserve Bank of India (RBI) guidelines, banks and HFCs are strictly prohibited from charging any foreclosure or prepayment penalties on floating-rate home loans to individual borrowers.'
  },

  // ==========================================================================
  // 5. STATE-SPECIFIC REAL ESTATE NUANCES
  // ==========================================================================
  stateSpecifics: {
    'Maharashtra': {
      state: 'Maharashtra',
      primaryCities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
      stampDuty: '6% to 7% (5% base + 1% Local Body Tax / Metro Cess where applicable). Concession of 1% often granted to female buyers.',
      registrationFee: '1% capped at a maximum of ₹30,000 for properties above ₹30 Lakhs.',
      landDocument: '7/12 (Saat-Baara) Extract for rural/agricultural land, Property Card (PR Card) for urban municipal areas.',
      authority: 'MahaRERA (Headquarters in Mumbai, regional benches in Pune and Nagpur).'
    },
    'Delhi': {
      state: 'Delhi NCR',
      primaryCities: ['New Delhi', 'Delhi', 'Noida', 'Gurugram', 'Ghaziabad', 'Faridabad'],
      stampDuty: 'Delhi: 4% for female owners, 6% for male owners. Noida (UP): 7%. Gurugram (Haryana): 5% for females, 7% for males.',
      registrationFee: '1% of total transaction value in Delhi; statutory rates in UP/Haryana.',
      landDocument: 'Khasra/Khatauni in rural fringe, DDA Conveyance Deed / Lal Dora certification in urban villages.',
      authority: 'Delhi RERA for NCT; UP RERA for Noida/Greater Noida; HRERA Gurugram for Gurugram.'
    },
    'Karnataka': {
      state: 'Karnataka',
      primaryCities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
      stampDuty: '5% base duty + 2% cess + 1% surcharge in urban areas (effective ~5.6% - 5.65%). Subsidies for affordable segments.',
      registrationFee: '1% of guidance value or transaction value.',
      landDocument: 'Khata A (fully approved by BBMP/BDA) vs Khata B (revenue listing for unapproved layouts). EC via Kaveri 2.0 portal.',
      authority: 'RERA Karnataka.'
    },
    'Telangana': {
      state: 'Telangana',
      primaryCities: ['Hyderabad', 'Warangal', 'Secunderabad'],
      stampDuty: '4% Stamp Duty + 1.5% Transfer Duty + 0.5% Registration Fee + 1.5% Mutation Charges (Total around 7.5%).',
      registrationFee: 'Included in statutory transfer package (~0.5% - 1%).',
      landDocument: 'Dharani portal for agricultural land, IGRS Telangana TS-bPASS for municipal layout sanction.',
      authority: 'TG RERA.'
    },
    'Tamil Nadu': {
      state: 'Tamil Nadu',
      primaryCities: ['Chennai', 'Coimbatore', 'Madurai'],
      stampDuty: '7% Stamp Duty + 4% Registration Fee (Total 11% transfer duty).',
      registrationFee: '4% statutory fee.',
      landDocument: 'Patta, Chitta, and Adangal extract. TN e-Services for land records.',
      authority: 'TNRERA.'
    },
    'Gujarat': {
      state: 'Gujarat',
      primaryCities: ['Ahmedabad', 'Surat', 'Vadodara', 'Gandhinagar'],
      stampDuty: '4.9% for male owners; female owners eligible for 1% duty concession.',
      registrationFee: '1% of transaction or Jantri value.',
      landDocument: 'Jantri minimum government rate card. AnyRoR portal for 7/12 & 8A extracts.',
      authority: 'GujRERA.'
    }
  },

  // ==========================================================================
  // 6. PROPERTY TYPES
  // ==========================================================================
  propertyTypes: {
    'Apartment': {
      name: 'Apartment / High-rise Flat',
      suitableFor: 'Working professionals, modern families seeking 24x7 security, power backup, and shared clubhouse amenities.',
      pros: 'Lower initial cost, clubhouse/gym amenities, gated security, easier resale and rental liquidity.',
      cons: 'Monthly maintenance charges (₹3-₹10 per sq.ft.), limited privacy, no land ownership rights.'
    },
    'Villa': {
      name: 'Independent Villa / Gated Row House',
      suitableFor: 'Affluent families, privacy seekers, multi-generational households wanting private garden/terrace.',
      pros: 'Individual land ownership, private parking, terrace access, supreme privacy, higher long-term land appreciation.',
      cons: 'Higher capital cost, individual maintenance responsibility, located further from central city cores.'
    },
    'Builder Floor': {
      name: 'Builder Floor',
      suitableFor: 'Buyers in Delhi NCR wanting low-rise residential density with independent ownership per level.',
      pros: 'Only 3-4 families in the building, dedicated floor ownership, stilt parking, central residential localities.',
      cons: 'Fewer common amenities (no swimming pool/clubhouse), maintenance depends on mutual agreement between floor owners.'
    },
    'Plot': {
      name: 'Residential Plot / Land',
      suitableFor: 'Long-term investors, buyers planning customized architectural construction over 3-10 years.',
      pros: 'Highest historical appreciation, zero maintenance costs compared to flats, complete flexibility in construction.',
      cons: 'Boundary encroachment risk requiring physical vigil, lower home loan LTV (plots typically 70% max), no rental income.'
    },
    'Commercial': {
      name: 'Commercial Office / Retail Space',
      suitableFor: 'High-net-worth investors seeking steady rental cash flows.',
      pros: 'Higher gross rental yield (6% to 9% vs 2% to 3% for residential), longer lease lock-in periods (3 to 9 years).',
      cons: 'High vacancy risk if tenant vacates, larger minimum ticket size, sensitive to macro-economic cycles.'
    },
    'PG/Co-living': {
      name: 'PG & Techie Co-Living',
      suitableFor: 'Students, young IT professionals relocating for work.',
      pros: 'Zero furniture expenses, high-speed WiFi and food included, minimal lock-in period, flexible monthly rentals.',
      cons: 'Shared rooms/bathrooms, house rules, lesser long-term privacy.'
    }
  }
};
