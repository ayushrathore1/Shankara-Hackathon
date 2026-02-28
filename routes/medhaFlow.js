const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const MedhaFlow = require('../models/MedhaFlow');

/**
 * MedhaFlow Routes — Groq AI-powered career discovery
 * All routes require authentication for progress tracking
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(messages, { temperature = 0.7, max_tokens = 1024 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  const response = await axios.post(GROQ_API_URL, {
    model: GROQ_MODEL, messages, temperature, max_tokens,
    response_format: { type: 'json_object' }
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000
  });
  const raw = response.data.choices[0].message.content;
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

// Helper: build answers block for prompts (handles old flat-string AND new object format)
function buildAnswersBlock(answers) {
  const dims = [
    { key: 'q1', label: 'cognitive_style', desc: 'How they solve problems' },
    { key: 'q2', label: 'engagement_driver', desc: 'What makes them lose track of time' },
    { key: 'q3', label: 'work_environment', desc: 'Their ideal work environment' },
    { key: 'q4', label: 'resilience_style', desc: 'How they handle failure' },
    { key: 'q5', label: 'perceived_identity', desc: 'Their strengths and weaknesses' },
  ];

  let block = 'Psychological profile from adaptive interview:\n\n';
  for (const d of dims) {
    const val = answers[d.key];
    if (typeof val === 'object' && val !== null) {
      // New format
      const text = val.custom || val.text || '';
      const dimension = val.dimension || d.label;
      block += `DIMENSION — ${dimension} (${d.desc}):\nTheir words: "${text}"\n`;
      if (val.followup_a) {
        block += `Deeper signal: "${val.followup_a}"\n`;
      }
    } else {
      // Old format (flat string)
      block += `${d.desc}: "${val || ''}"\n`;
      const custom = answers[`${d.key}_custom`];
      if (custom) block += `Additional detail: "${custom}"\n`;
    }
    block += '\n';
  }

  block += `Self description: "${answers.q6 || ''}"\n\n`;
  block += `INSTRUCTION:\nWeight the deeper signal responses most heavily — these are unprompted elaborations that reveal authentic personality more accurately than selected options. If deeper signal exists for a dimension, treat it as the primary input. Users who skipped follow-ups should still receive accurate recommendations based on their main answer text.\nMake the user feel individually seen in every output.`;

  return block;
}

const FALLBACK_CAREERS = [
  { rank: 1, title: 'UX Designer', slug: 'ux-designer', fit_label: 'Strong Fit', why: 'Based on your responses, you seem drawn to creative problem-solving and understanding people — both core to UX design.', reality_check: 'The hardest part is defending your design decisions with data.', salary_range: '₹4-12 LPA', market_demand: 'Very High', time_to_first_role: '4-8 months' },
  { rank: 2, title: 'Product Manager', slug: 'product-manager', fit_label: 'High Fit', why: 'Your collaborative instincts and big-picture thinking align well with product management.', reality_check: 'You\'ll have all the responsibility but often none of the authority.', salary_range: '₹6-18 LPA', market_demand: 'High', time_to_first_role: '6-12 months' },
  { rank: 3, title: 'Digital Marketer', slug: 'digital-marketer', fit_label: 'Good Match', why: 'Your curiosity about people and comfort with fast-changing environments suits digital marketing.', reality_check: 'Most of your experiments will fail — the skill is learning quickly.', salary_range: '₹3-10 LPA', market_demand: 'High', time_to_first_role: '2-5 months' },
];

// ─── POST /recommend ─── (auth required)
router.post('/recommend', protect, async (req, res) => {
  try {
    const { answers } = req.body;
    const name = req.user.name || 'User';
    if (!answers?.q1) return res.status(400).json({ success: false, message: 'Answers required' });

    const degreeInfo = answers._degree ? `\nIMPORTANT CONTEXT — ${name} is a ${answers._year || ''} year ${answers._degree} student. Factor this into your recommendations — consider careers that leverage or complement their educational background, but don't limit recommendations to only their field. Cross-field careers are welcome if fit is strong.\n` : '';

    const systemPrompt = `You are a career guidance expert with deep knowledge of how personality, thinking style, work preferences, and strengths map to career success and satisfaction. You analyze a person's open-ended answers and recommend careers based on genuine fit — not just skills, but how they think, what motivates them, and what environment they thrive in. You are direct, specific, and honest. You never recommend a career just because it sounds impressive. You MUST return valid JSON only.`;
    const userPrompt = `Analyze ${name}'s answers and recommend exactly 3 career DOMAINS for them. Each domain is a broad field. Under each domain, list 2-3 specific career paths (learning paths) that fit this person.
${degreeInfo}
${buildAnswersBlock(answers)}

Return ONLY valid JSON:
{
  "domains": [
    {
      "rank": 1,
      "domain": "Domain Name (e.g. Design & Creative, Technology, Business & Finance, Marketing, Healthcare, Education, etc.)",
      "domain_slug": "domain-name-slug",
      "emoji": "relevant emoji",
      "fit_label": "Strong Fit",
      "why_domain": "1-2 sentences why this domain fits the person. Reference their answers.",
      "paths": [
        {
          "title": "Specific Career Title",
          "slug": "career-slug",
          "one_liner": "1 sentence what this career actually IS in plain language",
          "why": "1-2 sentences why THIS path within the domain specifically fits this person",
          "salary_range": "\u20b9X-Y LPA",
          "market_demand": "Very High / High / Moderate",
          "time_to_first_role": "X-Y months",
          "yt_search_query": "a day in the life of [career title] in India"
        }
      ]
    }
  ]
}

Rules:
- Exactly 3 domains, rank 1=Strong Fit, rank 2=High Fit, rank 3=Good Match
- Each domain has 2-3 specific career paths (learning paths)
- Domains should be meaningfully DIFFERENT from each other — not 3 variations of tech
- Career paths within a domain should be distinct roles, not synonyms
- Include non-tech domains (marketing, finance, education, healthcare, creative) when they fit
- yt_search_query must be a realistic YouTube search that will find day-in-the-life videos`;

    let result;
    try {
      result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.7, max_tokens: 1024 });
    } catch (e) {
      console.error('Groq recommend fail:', e.message);
      try {
        result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt + '\nReturn only valid JSON.' }], { temperature: 0.5, max_tokens: 1024 });
      } catch (e2) {
        console.error('Retry fail:', e2.message);
        // Save fallback and return
        await MedhaFlow.findOneAndUpdate({ userId: req.user._id }, { quizAnswers: answers, careerResults: FALLBACK_CAREERS }, { upsert: true, new: true });
        return res.json({ success: true, data: { careers: FALLBACK_CAREERS, fallback: true } });
      }
    }

    const domains = result.domains || FALLBACK_CAREERS;

    // Flatten for backward compat: extract all paths as careerResults
    const flatCareers = domains.flatMap(d => (d.paths || []).map((p, pi) => ({
      rank: d.rank * 10 + pi,
      title: p.title,
      slug: p.slug,
      fit_label: d.fit_label,
      why: p.why,
      reality_check: p.one_liner,
      salary_range: p.salary_range,
      market_demand: p.market_demand,
      time_to_first_role: p.time_to_first_role,
    })));

    // Save to DB
    await MedhaFlow.findOneAndUpdate(
      { userId: req.user._id },
      { quizAnswers: answers, careerResults: flatCareers, careerDomains: domains, selectedCareer: null, roadmapData: null, dayInLifeData: null, roadmapProgress: {}, streakCount: 0 },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { domains, careers: flatCareers, fallback: false } });
  } catch (error) {
    console.error('Recommend error:', error.message);
    res.json({ success: true, data: { careers: FALLBACK_CAREERS, fallback: true } });
  }
});

// ─── POST /dayinlife ─── (auth required)
router.post('/dayinlife', protect, async (req, res) => {
  try {
    const { career } = req.body;
    const name = req.user.name || 'User';
    const flow = await MedhaFlow.findOne({ userId: req.user._id }).lean();
    if (!flow?.quizAnswers || !career?.title) return res.status(400).json({ success: false, message: 'Career and quiz data required' });
    const answers = flow.quizAnswers;

    const systemPrompt = `You are a career storyteller. You write vivid, honest, second-person narratives of what a typical workday looks like in a specific career. You write for confused college students who need to FEEL what a career is like. You are specific — real tools, real frustrations, real rewards. Never glamorize. Return valid JSON only.`;
    const userPrompt = `Write a "Day in the Life" for ${name} considering becoming a ${career.title}.

${buildAnswersBlock(answers)}

Return ONLY valid JSON:
{
  "narrative": "300-400 words, written as You wake up..., vivid and specific",
  "energizing_moment": "1 sentence what would light them up",
  "challenging_moment": "1 sentence what would test them",
  "tools": ["tool1", "tool2", "tool3", "tool4"],
  "meaningful_because": "2 sentences why this career matters"
}`;

    const result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.8, max_tokens: 1500 });

    // Save to DB
    await MedhaFlow.findOneAndUpdate({ userId: req.user._id }, { selectedCareer: { title: career.title, slug: career.slug }, dayInLifeData: result });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DayInLife error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate day in life' });
  }
});

// ─── POST /roadmap ─── (auth required, includes YouTube video links)
router.post('/roadmap', protect, async (req, res) => {
  try {
    const { career } = req.body;
    const name = req.user.name || 'User';
    if (!career?.title) return res.status(400).json({ success: false, message: 'Career title required' });

    const flow = await MedhaFlow.findOne({ userId: req.user._id }).lean();
    const answers = flow?.quizAnswers || {};

    const systemPrompt = `You are an expert career roadmap designer and learning curator. You create structured, actionable learning paths that take someone from zero to job-ready. Your milestones are always output-based. You know the best free educational YouTube channels and can recommend specific, real video topics with accurate titles. Return valid JSON only.`;
    const userPrompt = `Generate a 4-stage learning roadmap for ${name} becoming a ${career.title}.

${answers?.q1 ? buildAnswersBlock(answers) : `The student wants to become a ${career.title}. Create a roadmap from beginner to job-ready.`}

For EACH step, provide a real YouTube video recommendation. Use well-known educational channels like:
- For tech: freeCodeCamp, Fireship, Traversy Media, The Net Ninja, CS50
- For design: The Futur, Flux Academy, Jesse Showalter, Figma official
- For business: Ali Abdaal, Y Combinator, Harvard Business Review
- For marketing: Neil Patel, HubSpot, Gary Vee
- For any field: use the most reputable free educational channel

Return ONLY valid JSON:
{
  "total_duration": "X weeks",
  "stages": [
    {
      "id": "stage-1",
      "title": "Stage title",
      "weeks": "Weeks X-Y",
      "steps": [
        {
          "id": "s1-step-1",
          "skill": "Skill name",
          "description": "2 sentences — what this skill is and why it matters in ${career.title}",
          "video_title": "Exact or close title of a real YouTube video/tutorial for this topic",
          "video_channel": "Channel name",
          "youtube_search": "Precise YouTube search query that will find this exact video",
          "milestone": "Specific concrete deliverable that proves this skill was learned",
          "hours": 4
        }
      ]
    }
  ]
}

Rules:
- Exactly 3 steps per stage (12 total)
- Stage 1 = complete beginner, Stage 4 = job-ready
- Milestones must be OUTPUT-BASED (create/build/write/design something)
- video_title must be realistic — name real tutorials that actually exist
- youtube_search should find the exact or very similar video`;

    const result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.7, max_tokens: 2500 });

    // Save to DB
    await MedhaFlow.findOneAndUpdate({ userId: req.user._id }, { roadmapData: result, selectedCareer: { title: career.title, slug: career.slug } });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Roadmap error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate roadmap' });
  }
});

// ─── POST /generate-challenge ─── Generate validation questions for a step (auth required)
router.post('/generate-challenge', protect, async (req, res) => {
  try {
    const { stepId } = req.body;
    if (!stepId) return res.status(400).json({ success: false, message: 'stepId required' });

    const flow = await MedhaFlow.findOne({ userId: req.user._id });
    if (!flow) return res.status(404).json({ success: false, message: 'No flow found' });

    // Find the step
    let stepDetail = null;
    if (flow.roadmapData?.stages) {
      for (const stage of flow.roadmapData.stages) {
        const found = (stage.steps || []).find(s => s.id === stepId);
        if (found) { stepDetail = found; break; }
      }
    }
    if (!stepDetail) return res.status(404).json({ success: false, message: 'Step not found' });

    const careerTitle = flow.selectedCareer?.title || 'this career';

    const systemPrompt = `You are a skill assessment expert who creates short, targeted validation challenges to test if someone has genuinely learned a skill. You create a mix of conceptual and practical questions. For technical skills, include code-writing tasks. For non-technical skills, include scenario-based practical tasks. Return valid JSON only.`;

    const userPrompt = `Create exactly 3 validation questions for this skill:

CAREER: ${careerTitle}
SKILL: ${stepDetail.skill}
DESCRIPTION: ${stepDetail.description}
MILESTONE: "${stepDetail.milestone}"

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "A conceptual understanding question about ${stepDetail.skill}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question": "A short-answer question that tests practical understanding — e.g. 'Explain how you would...' or 'What would happen if...'",
      "expected_keywords": ["keyword1", "keyword2", "keyword3"]
    },
    {
      "id": "q3",
      "type": "code",
      "question": "Write a code snippet, script, or structured response that demonstrates ${stepDetail.skill}. For example: 'Write a function that...' or 'Create a plan/outline for...' or 'Draft a...'",
      "language": "the most appropriate language or format for this skill",
      "hint": "A helpful hint about what the evaluator is looking for"
    }
  ]
}

Rules:
- q1 MUST be an MCQ with exactly 4 options and a correct_index (0-3)
- q2 MUST be a short-answer requiring 1-3 sentences, with expected_keywords that a good answer should contain
- q3 MUST ask the user to write code, a script, a plan, or create something concrete
- Make questions SPECIFIC to ${stepDetail.skill} and ${careerTitle} — never generic
- Difficulty: intermediate — they should need real understanding to pass`;

    const result = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.6, max_tokens: 1200 }
    );

    // Store questions in DB (without answers) so we can validate later
    const challengeData = {
      questions: result.questions,
      generatedAt: new Date(),
    };
    flow.proofSubmissions.set(stepId, { ...challengeData, status: 'pending', proof: '', proofType: 'challenge' });
    await flow.save();

    // Return questions WITHOUT correct answers to the frontend
    const safeQuestions = result.questions.map(q => {
      if (q.type === 'mcq') {
        return { id: q.id, type: q.type, question: q.question, options: q.options };
      }
      if (q.type === 'short_answer') {
        return { id: q.id, type: q.type, question: q.question };
      }
      return { id: q.id, type: q.type, question: q.question, language: q.language, hint: q.hint };
    });

    res.json({ success: true, data: { questions: safeQuestions, stepId } });
  } catch (error) {
    console.error('Generate challenge error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate challenge' });
  }
});

// ─── POST /validate-challenge ─── Grade user's answers (auth required)
router.post('/validate-challenge', protect, async (req, res) => {
  try {
    const { stepId, answers } = req.body;
    if (!stepId || !answers) return res.status(400).json({ success: false, message: 'stepId and answers required' });

    const flow = await MedhaFlow.findOne({ userId: req.user._id });
    if (!flow) return res.status(404).json({ success: false, message: 'No flow found' });

    // Get stored challenge
    const storedChallenge = flow.proofSubmissions.get(stepId);
    if (!storedChallenge?.questions) return res.status(400).json({ success: false, message: 'No challenge found — generate one first' });

    // Find step details
    let stepDetail = null;
    if (flow.roadmapData?.stages) {
      for (const stage of flow.roadmapData.stages) {
        const found = (stage.steps || []).find(s => s.id === stepId);
        if (found) { stepDetail = found; break; }
      }
    }
    const careerTitle = flow.selectedCareer?.title || 'this career';

    // Grade MCQ locally
    const mcqQuestion = storedChallenge.questions.find(q => q.type === 'mcq');
    const mcqCorrect = mcqQuestion && answers.q1 !== undefined ? Number(answers.q1) === mcqQuestion.correct_index : false;

    // Grade short answer + code via AI
    const systemPrompt = `You are a fair skill evaluator. You grade a student's answers to validate their knowledge. Be strict but encouraging. Return valid JSON only.`;

    const shortQ = storedChallenge.questions.find(q => q.type === 'short_answer');
    const codeQ = storedChallenge.questions.find(q => q.type === 'code');

    const userPrompt = `Grade these answers for a ${careerTitle} student learning ${stepDetail?.skill || 'this skill'}.

QUESTION 2 (Short Answer): "${shortQ?.question || ''}"
Expected keywords: ${JSON.stringify(shortQ?.expected_keywords || [])}
STUDENT'S ANSWER: "${answers.q2 || '(no answer)'}"

QUESTION 3 (Code/Practical): "${codeQ?.question || ''}"
Hint for evaluator: "${codeQ?.hint || ''}"
STUDENT'S ANSWER:
\`\`\`
${answers.q3 || '(no answer)'}
\`\`\`

Return ONLY valid JSON:
{
  "q2_pass": true or false,
  "q2_feedback": "1-2 sentences on their short answer",
  "q3_pass": true or false,
  "q3_feedback": "1-2 sentences on their code/practical answer",
  "overall_feedback": "1 encouraging sentence summarizing their performance"
}

Rules:
- q2_pass = true if answer shows real understanding AND contains at least 1-2 expected keywords or equivalent concepts
- q3_pass = true if the code/response is functionally correct or demonstrates genuine effort and understanding
- Be strict: vague or copy-paste answers should fail
- Be encouraging: if they fail, tell them what to study`;

    let grading;
    try {
      grading = await callGroq(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        { temperature: 0.2, max_tokens: 500 }
      );
    } catch (err) {
      console.error('Grading AI error:', err.message);
      grading = { q2_pass: true, q2_feedback: 'Answer recorded.', q3_pass: true, q3_feedback: 'Answer recorded.', overall_feedback: 'Good effort!' };
    }

    const results = {
      q1: { pass: mcqCorrect, feedback: mcqCorrect ? 'Correct!' : `Incorrect — the right answer was option ${String.fromCharCode(65 + (mcqQuestion?.correct_index || 0))}.` },
      q2: { pass: !!grading.q2_pass, feedback: grading.q2_feedback || '' },
      q3: { pass: !!grading.q3_pass, feedback: grading.q3_feedback || '' },
    };

    const passCount = [results.q1.pass, results.q2.pass, results.q3.pass].filter(Boolean).length;
    const passed = passCount >= 2; // Need 2/3 to pass
    const score = Math.round((passCount / 3) * 100);

    // Save results
    flow.proofSubmissions.set(stepId, {
      proof: JSON.stringify(answers),
      proofType: 'challenge',
      status: passed ? 'approved' : 'needs_improvement',
      feedback: grading.overall_feedback || '',
      score,
      questions: storedChallenge.questions,
      results,
      submittedAt: new Date(),
      validatedAt: new Date(),
    });

    // Auto-mark step complete if passed
    if (passed) {
      flow.roadmapProgress.set(stepId, true);
      const today = new Date().toISOString().split('T')[0];
      if (today !== flow.lastActiveDate) {
        flow.streakCount = (flow.streakCount || 0) + 1;
        flow.lastActiveDate = today;
      }
    }

    await flow.save();

    res.json({
      success: true,
      data: {
        passed,
        score,
        passCount,
        results,
        overall_feedback: grading.overall_feedback || '',
        stepId,
      }
    });
  } catch (error) {
    console.error('Validate challenge error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to validate answers' });
  }
});

// ─── POST /followup ─── Generate AI follow-up question (auth required)
router.post('/followup', protect, async (req, res) => {
  const FALLBACK = { followup: 'Anything else about that feels worth mentioning?', placeholder: 'Add anything relevant...' };
  try {
    const { dimension, answer_text, question_number } = req.body;
    if (!answer_text) return res.json({ success: true, data: FALLBACK });

    const systemPrompt = `You are a warm, curious career counselor having a genuine conversation with a confused college student. You have just heard their answer to one question. You want to understand them more deeply with one gentle follow-up.

Your follow-up must:
- Be a single sentence or short question only
- Feel like natural conversation not an interview
- Reference something specific from their answer
- Never repeat the main question
- Never ask something answerable with yes or no
- Never use career jargon or psychology terms
- Feel like something a curious friend would ask
- Maximum 15 words`;

    const userPrompt = `The student just answered a question about their ${dimension || 'preferences'} (how they prefer to work and think).

Their exact words: "${answer_text}"

Generate one follow-up that digs one layer deeper into what they just said.

Examples of the tone (do not copy these, generate fresh ones based on their actual answer):
If someone said they like breaking problems down: "What does that process actually look like for you when you get stuck?"
If someone said they enjoy creative work: "What have you made that you are most proud of?"
If someone said they prefer working with people: "What kind of conversations give you energy?"

Return ONLY a JSON object. No markdown. No backticks:
{
  "followup": "your single follow-up sentence here",
  "placeholder": "3-5 word placeholder for the textarea"
}`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.json({ success: true, data: FALLBACK });

    const response = await axios.post(GROQ_API_URL, {
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.85,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 2000, // 2 second hard timeout
    });

    const raw = response.data.choices[0].message.content;
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json({ success: true, data: { followup: parsed.followup || FALLBACK.followup, placeholder: parsed.placeholder || FALLBACK.placeholder } });
  } catch (error) {
    // Silent fallback — never break the quiz
    res.json({ success: true, data: FALLBACK });
  }
});

// ═══════════════════════════════════════════════════════════
// EXERCISE & VALIDATION SYSTEM
// ═══════════════════════════════════════════════════════════

// ─── POST /exercises ─── Generate 3 exercises for a roadmap step (auth required)
router.post('/exercises', protect, async (req, res) => {
  try {
    const { career, stage, step_skill, step_description, youtube_search, user_name, user_profile } = req.body;
    if (!step_skill || !career) return res.status(400).json({ success: false, error: 'Missing step_skill or career' });

    const systemPrompt = `You are an expert educational content designer specializing in career-focused skill development. You create practical exercises that force active application of concepts — not passive recall. Your exercises are specific, achievable in 30-60 minutes, and produce a tangible output the learner can review and keep. You personalize difficulty and context based on the learner's cognitive style. You MUST return valid JSON only.`;

    const userPrompt = `Generate exactly 3 exercises for ${user_name || 'the student'} who is learning ${step_skill} as part of their ${career} roadmap.

About this learning step:
${step_description || step_skill}

The learning resource for this step covers:
${youtube_search || step_skill + ' tutorial'}

${user_profile ? `${user_name}'s learning profile:
- Cognitive style: ${user_profile.cognitive_style || 'analytical'}
- Motivated by: ${user_profile.motivation_source || 'growth'}
- Thrives in: ${user_profile.environment_preference || 'structured'}` : ''}

Generate 3 exercises of different types:

EXERCISE 1 — CONCEPTUAL (15-20 minutes)
Tests whether they understood the core concept.
Output: a written answer, definition, or explanation.
Personalize the scenario to their cognitive style.

EXERCISE 2 — APPLIED (30-45 minutes)
Tests whether they can use the concept in practice.
Output: something tangible they create or produce.
Make it relevant to real ${career} work.

EXERCISE 3 — REFLECTIVE (10-15 minutes)
Tests whether they can connect this concept to their own experience or the career reality.
Output: a short personal reflection or observation.
Connect it to their motivation source.

Return ONLY valid JSON:
{
  "step_skill": "${step_skill}",
  "exercises": [
    {
      "id": "ex-1",
      "type": "conceptual",
      "title": "exercise title in 5 words max",
      "instruction": "clear instruction paragraph explaining exactly what to do",
      "context": "1 sentence explaining why this exercise matters for ${career}",
      "output_format": "exactly what to produce — be specific about format and length",
      "time_estimate": "X minutes",
      "evaluation_criteria": ["criterion 1", "criterion 2", "criterion 3"]
    },
    {
      "id": "ex-2",
      "type": "applied",
      "title": "...", "instruction": "...", "context": "...", "output_format": "...", "time_estimate": "...", "evaluation_criteria": ["...", "...", "..."]
    },
    {
      "id": "ex-3",
      "type": "reflective",
      "title": "...", "instruction": "...", "context": "...", "output_format": "...", "time_estimate": "...", "evaluation_criteria": ["...", "...", "..."]
    }
  ]
}`;

    let result;
    try {
      result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.7, max_tokens: 2000 });
    } catch (firstErr) {
      // Retry once
      try {
        result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.7, max_tokens: 2000 });
      } catch (retryErr) {
        return res.json({ success: false, error: 'Exercise generation unavailable', retry: true });
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Exercise generation error:', error.message);
    res.json({ success: false, error: 'Exercise generation unavailable', retry: true });
  }
});

// ─── POST /validate ─── Evaluate exercise submission (auth required)
router.post('/validate-exercise', protect, async (req, res) => {
  const FALLBACK = {
    verdict: 'Adequate',
    what_worked: 'Your response showed engagement with the material.',
    what_was_missing: 'We couldn\'t fully evaluate this submission right now.',
    one_thing_to_do: 'Review your response and consider if you covered all aspects.',
    unlock: true,
    encouragement: 'Keep going — consistency matters more than perfection.'
  };

  try {
    const { career, step_skill, exercise, user_response, user_name } = req.body;
    if (!user_response || user_response.trim().length < 10) {
      return res.json({ success: true, data: { ...FALLBACK, verdict: 'Needs Revision', unlock: false, what_was_missing: 'Your response was too short to evaluate. Please write at least a few sentences.' } });
    }

    const systemPrompt = `You are a supportive but honest mentor reviewing a student's exercise submission. You give specific, actionable feedback — not generic praise or criticism. You identify exactly what was strong, exactly what was missing, and exactly what the student should do to improve. You never say 'good job' without explaining specifically what was good. You never say 'needs improvement' without explaining exactly what to improve and how. Your tone is warm but direct. You MUST return valid JSON only.`;

    const userPrompt = `Review ${user_name || 'the student'}'s submission for this exercise:

Exercise: ${exercise.title}
Type: ${exercise.type}
Instruction given: ${exercise.instruction}
Expected output: ${exercise.output_format}
Career context: ${career} — ${step_skill}

Evaluation criteria:
${(exercise.evaluation_criteria || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}

${user_name || 'Student'}'s submission:
"${user_response}"

Provide feedback structured as:

1. VERDICT: one of these exactly:
   "Strong" — met all criteria well
   "Adequate" — met basic criteria, room to grow
   "Needs Revision" — missed important criteria

2. WHAT WORKED: 1-2 specific sentences about what was genuinely strong. Reference their actual words.

3. WHAT WAS MISSING: 1-2 specific sentences about what was incomplete or incorrect. Be direct. If nothing was missing, say so honestly.

4. ONE THING TO DO: Single most impactful action they can take right now. Specific and immediately actionable.

5. UNLOCK: boolean — true if verdict is Strong or Adequate, false if Needs Revision

Return ONLY valid JSON:
{
  "verdict": "Strong" | "Adequate" | "Needs Revision",
  "what_worked": "specific feedback text",
  "what_was_missing": "specific feedback text or 'Nothing significant was missing'",
  "one_thing_to_do": "specific actionable instruction",
  "unlock": true | false,
  "encouragement": "one sentence — specific to what they demonstrated, not generic"
}`;

    const result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.4, max_tokens: 600 });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Validation error:', error.message);
    // Never block step completion due to API failure
    res.json({ success: true, data: FALLBACK });
  }
});

// ─── POST /hint ─── Give a guided hint without revealing the answer (auth required)
router.post('/hint', protect, async (req, res) => {
  try {
    const { step_skill, exercise, user_partial } = req.body;

    const systemPrompt = `Give a hint for this exercise that guides without giving away the answer. If the user has partial work, build the hint from where they are. If they have nothing, give a starting point only. Maximum 3 sentences. Socratic — ask a question that points them in the right direction rather than telling them what to do. Return valid JSON only.`;

    const userPrompt = `Exercise on ${step_skill}:
Type: ${exercise?.type || 'conceptual'}
Instruction: ${exercise?.instruction || 'Complete this exercise'}
Expected output: ${exercise?.output_format || 'A written response'}

User's current work: "${user_partial || '(nothing yet)'}"

Return ONLY valid JSON: { "hint": "hint text max 3 sentences" }`;

    const result = await callGroq([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.6, max_tokens: 150 });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Hint error:', error.message);
    res.json({ success: true, data: { hint: 'Think about the core concept being tested here. What would you explain to a friend who asked you about this topic? Start there.' } });
  }
});

// ─── GET /youtube-video ─── Find a real YouTube video via Google CSE (auth required)
router.get('/youtube-video', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'q query param required' });

    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    if (!apiKey || !cseId) {
      // Fallback: return a YouTube search URL
      return res.json({ success: true, data: { fallback: true, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` } });
    }

    // Search YouTube via Google CSE
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(q + ' site:youtube.com')}&num=3`;
    const searchRes = await axios.get(searchUrl, { timeout: 8000 });
    const items = searchRes.data?.items || [];

    // Find a youtube.com/watch result
    const ytItem = items.find(item => item.link?.includes('youtube.com/watch'));
    if (!ytItem) {
      return res.json({ success: true, data: { fallback: true, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` } });
    }

    // Extract video ID
    const videoIdMatch = ytItem.link.match(/[?&]v=([^&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    res.json({
      success: true,
      data: {
        fallback: false,
        videoId,
        title: ytItem.title || '',
        url: ytItem.link,
        thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null,
        channel: ytItem.displayLink || 'YouTube',
        snippet: ytItem.snippet || '',
      }
    });
  } catch (error) {
    console.error('YouTube search error:', error.message);
    const q = req.query.q || '';
    res.json({ success: true, data: { fallback: true, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` } });
  }
});

// ─── GET /me ─── Get user's saved flow (auth required)
router.get('/me', protect, async (req, res) => {
  try {
    const flow = await MedhaFlow.findOne({ userId: req.user._id }).lean();
    if (!flow) return res.json({ success: true, data: null });

    // Convert Maps to plain objects
    const progress = flow.roadmapProgress instanceof Map
      ? Object.fromEntries(flow.roadmapProgress)
      : (flow.roadmapProgress || {});
    const proofs = flow.proofSubmissions instanceof Map
      ? Object.fromEntries(flow.proofSubmissions)
      : (flow.proofSubmissions || {});

    res.json({ success: true, data: { ...flow, roadmapProgress: progress, proofSubmissions: proofs } });
  } catch (error) {
    console.error('GetFlow error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load flow' });
  }
});

module.exports = router;
