/**
 * NyayaMitra Local AI Engine
 * A dynamic investigation engine that tailors questions based on the detected crime category.
 */

const isTelugu = (text) => /[\u0C00-\u0C7F]/.test(text) || text.toLowerCase().includes("kottaru") || text.toLowerCase().includes("donga") || text.toLowerCase().includes("avunu");

const isAffirmative = (text) => {
  const lower = text.toLowerCase();
  const yesWords = ["yes", "yeah", "correct", "proceed", "sare", "avunu", "right", "ok", "okay"];
  return yesWords.some(w => lower.includes(w));
};

const isEmergency = (text) => {
  const lower = text.toLowerCase();
  return lower.includes("help me") || lower.includes("dying") || lower.includes("kill") || lower.includes("blood") || lower.includes("pranalu") || lower.includes("champu") || lower.includes("emergency");
};

const CATEGORIES = {
  theft: ["steal", "stolen", "theft", "robbery", "donga", "bike", "phone", "chain", "snatching", "snatch"],
  women_safety: ["harass", "eve teasing", "follow", "women", "abuse", "wife", "husband", "dowry", "domestic", "harassment"],
  cyber_crime: ["fraud", "otp", "bank", "scam", "money", "online", "link", "hacked", "cyber", "upi"],
  assault: ["beat", "fight", "attack", "kottaru", "hit", "assault", "blood", "injury", "damage"],
  accident: ["accident", "crash", "hit and run", "vehicle", "car", "truck"],
  missing: ["missing", "lost", "kidnap", "child", "runaway", "kanipinchadam"],
  other: []
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return "other";
}

// Dynamic workflows per crime category
const WORKFLOWS = {
  theft: [
    { en: "Where and when did this theft occur? Please specify landmarks.", te: "ఈ దొంగతనం ఎక్కడ మరియు ఎప్పుడు జరిగింది? ఏమైనా గుర్తులు ఉంటే చెప్పండి." },
    { en: "Exactly what items were stolen? Do you know the approximate value?", te: "ఏ వస్తువులు దొంగిలించబడ్డాయి? వాటి విలువ ఎంతో తెలుసా?" },
    { en: "Do you have any suspects in mind or any photo/video evidence?", te: "మీకు ఎవరిపైనైనా అనుమానం ఉందా లేదా మీ వద్ద ఏవైనా సాక్ష్యాలు ఉన్నాయా?" }
  ],
  cyber_crime: [
    { en: "Which platform or bank was involved in this fraud?", te: "ఈ ఆన్‌లైన్ మోసం ఏ ప్లాట్‌ఫారమ్ లేదా బ్యాంక్ ద్వారా జరిగింది?" },
    { en: "How much money was lost, and when did this transaction happen?", te: "ఎంత డబ్బు పోయింది, మరియు ఈ లావాదేవీ ఎప్పుడు జరిగింది?" },
    { en: "Do you have transaction IDs, screenshots, or the fraudster's phone number?", te: "మీ వద్ద ట్రాన్సాక్షన్ ఐడి, స్క్రీన్‌షాట్‌లు లేదా మోసం చేసిన వారి ఫోన్ నంబర్ ఉన్నాయా?" }
  ],
  missing: [
    { en: "I understand how stressful this is. Please stay calm, we will help you. Who is missing? Please provide their name and age.", te: "ఇది ఎంత ఆందోళనకరంగా ఉందో నేను అర్థం చేసుకోగలను. దయచేసి ప్రశాంతంగా ఉండండి, మేము సహాయం చేస్తాము. ఎవరు తప్పిపోయారు? వారి పేరు మరియు వయసు చెప్పండి." },
    { en: "Where and when were they last seen? If you don't know the exact time, an approximate is fine.", te: "వారిని చివరగా ఎక్కడ మరియు ఎప్పుడు చూసారు? కచ్చితమైన సమయం తెలియకపోయినా పర్వాలేదు." },
    { en: "What were they wearing? Can you upload a recent photo of them?", te: "వారు ఏ బట్టలు వేసుకున్నారు? దయచేసి వారి తాజా ఫోటో అప్‌లోడ్ చేయగలరా?" }
  ],
  accident: [
    { en: "Is anyone injured? Do you need an ambulance right now? If yes, I can dispatch one immediately.", te: "ఎవరికైనా గాయాలు అయ్యాయా? మీకు ఇప్పుడు అంబులెన్స్ కావాలా? అవునంటే వెంటనే పంపిస్తాను." },
    { en: "Where exactly did the accident happen and at what time?", te: "ప్రమాదం కచ్చితంగా ఎక్కడ మరియు ఏ సమయంలో జరిగింది?" },
    { en: "Do you have the vehicle numbers involved or any photos of the scene? It is okay if you don't.", te: "ప్రమాదానికి గురైన వాహనాల నంబర్లు లేదా సంఘటన స్థలం ఫోటోలు మీ వద్ద ఉన్నాయా? లేకపోయినా పర్వాలేదు." }
  ],
  women_safety: [
    { en: "Your safety is our top priority. Are you currently in a safe location? Where did this incident happen?", te: "మీ భద్రత మాకు అత్యంత ముఖ్యం. మీరు ప్రస్తుతం సురక్షితమైన ప్రదేశంలో ఉన్నారా? ఈ సంఘటన ఎక్కడ జరిగింది?" },
    { en: "Who is the person harassing or abusing you? Do you know their details? Take your time.", te: "మిమ్మల్ని వేధిస్తున్న వ్యక్తి ఎవరు? వారి వివరాలు మీకు తెలుసా? నిదానంగా చెప్పండి." },
    { en: "Has this happened before? Do you have any evidence like messages or recordings?", te: "ఇది మునుపు కూడా జరిగిందా? మీ వద్ద ఏవైనా మెసేజ్‌లు లేదా రికార్డింగ్‌ల సాక్ష్యం ఉందా?" }
  ],
  assault: [
    { en: "Where and when did this assault or property damage occur?", te: "ఈ దాడి లేదా ఆస్తి నష్టం ఎక్కడ మరియు ఎప్పుడు జరిగింది?" },
    { en: "Who attacked you or caused the damage? Do you know their names?", te: "మీపై ఎవరు దాడి చేశారు? వారి పేర్లు మీకు తెలుసా?" },
    { en: "Do you have any medical reports, photos of the injuries, or witness details?", te: "మీ వద్ద మెడికల్ రిపోర్టులు, గాయాల ఫోటోలు లేదా సాక్షుల వివరాలు ఉన్నాయా?" }
  ],
  other: [
    { en: "Where exactly did this happen? Please provide the location.", te: "ఇది కచ్చితంగా ఎక్కడ జరిగింది? దయచేసి లొకేషన్ చెప్పండి." },
    { en: "When did it happen? Please specify the date and time.", te: "ఇది ఎప్పుడు జరిగింది? ఏ తేదీ మరియు సమయంలో జరిగిందో చెప్పండి." },
    { en: "Please explain exactly what happened in full detail.", te: "దయచేసి ఏం జరిగిందో పూర్తిగా వివరంగా చెప్పండి." },
    { en: "Do you have any suspects or any evidence you can upload?", te: "మీకు ఎవరిపైనైనా అనుమానం ఉందా లేదా అప్‌లోడ్ చేయడానికి ఏవైనా సాక్ష్యాలు ఉన్నాయా?" }
  ]
};

export function processLocalInterview(messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  const userCount = userMessages.length;
  
  if (userCount === 0) {
    return "Namaskaram. Welcome to NyayaMitra. I am your Digital AI Police Constable. I will help you register your complaint safely. You may speak in Telugu or English. Please do not worry. To start, what happened?";
  }

  const lastUserMsg = userMessages[userCount - 1].content;
  const telugu = isTelugu(lastUserMsg);
  
  const initialComplaint = userMessages[0].content;
  const detectedCategory = detectCategory(initialComplaint);
  const activeWorkflow = WORKFLOWS[detectedCategory] || WORKFLOWS['other'];

  // Calculate where we are in the flow
  const currentStep = userCount - 1; // 0 index for questions

  if (currentStep < activeWorkflow.length) {
    // We are still asking category-specific questions
    const nextQuestion = activeWorkflow[currentStep];
    let responseText = telugu ? nextQuestion.te : nextQuestion.en;
    
    // Emergency override injection
    if (isEmergency(lastUserMsg)) {
      const emergencyWarning = telugu 
        ? "⚠️ మీకు తక్షణ ప్రాణహాని ఉంటే, దయచేసి వెంటనే 112 కు కాల్ చేయండి. అయితే, పోలీసులను పంపించడానికి నేను ఈ వివరాలు నమోదు చేయడం కొనసాగిస్తాను. "
        : "⚠️ If you are in immediate physical danger, please dial 112 immediately. However, I am recording this information to dispatch officers. ";
      responseText = emergencyWarning + responseText;
    }
    
    return responseText;
  } 
  
  if (currentStep === activeWorkflow.length) {
    // Ask for Personal Details
    return telugu
      ? "వివరాలు సేకరించాను. దయచేసి మీ పూర్తి పేరు మరియు మొబైల్ నంబర్ చెప్పండి."
      : "I have recorded the details. Finally, please provide your Full Name and Mobile Number.";
  }
  
  if (currentStep === activeWorkflow.length + 1) {
    // Generate Summary & Confirmation
    return telugu
      ? `నేను మీ కంప్లైంట్ తయారు చేశాను. ఇది '${detectedCategory}' కేటగిరీకి చెందుతుంది. నేను నమోదు చేసిన వివరాలు సరైనవేనా? దయచేసి 'అవును' లేదా 'సరే' అని చెప్పి నిర్ధారించండి.`
      : `I have prepared your complaint. It is classified under '${detectedCategory}'. Before I register this officially, is this information correct? Please say Yes to confirm.`;
  }
  
  if (currentStep === activeWorkflow.length + 2) {
    // Generate FIR payload
    if (!isAffirmative(lastUserMsg)) {
       return telugu
         ? "సరే, నేను నమోదు చేయలేదు. దయచేసి మీరు ఏ వివరాలను మార్చాలనుకుంటున్నారో చెప్పండి."
         : "Understood. I have halted the FIR registration. Please provide the correct details.";
    }
    
    // Concatenate all answers into the description
    const fullDescription = userMessages.slice(0, activeWorkflow.length + 1).map((m, i) => `[A${i+1}]: ${m.content}`).join('\n');
    const personalInfo = userMessages[activeWorkflow.length + 1].content;
    
    const phoneMatch = personalInfo.match(/\d{10}/);
    const phone = phoneMatch ? phoneMatch[0] : "Provided in transcript";
    
    const firPayload = {
      category: detectedCategory,
      title: `Dynamic Voice FIR - ${detectedCategory.toUpperCase()}`,
      description: `Incident Transcript Details:\n${fullDescription}`,
      location: "Extracted from transcript", // In local mode, we fallback to general text
      district: "Visakhapatnam", 
      complainant_name: personalInfo,
      complainant_phone: phone,
      status: 'pending_verification'
    };
    
    const conversationalPart = telugu 
      ? "ధృవీకరించినందుకు ధన్యవాదాలు. నేను మీ FIR ని అధికారికంగా ఆంధ్రప్రదేశ్ పోలీస్ సర్వర్లలో నమోదు చేస్తున్నాను." 
      : "Confirmation received. I am now officially registering your FIR into the Andhra Pradesh Police secure database.";
      
    return `${conversationalPart}\n[FIR_READY]\n${JSON.stringify(firPayload)}`;
  }

  // Fallback
  return telugu 
    ? "మీ కేసు విజయవంతంగా నమోదు చేయబడింది. ధన్యవాదాలు." 
    : "Your case has been successfully registered. Thank you.";
}
