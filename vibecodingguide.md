# The Vibe Coding Playbook
## Build Anything. Ship Fast. Think Like a Founder.

*A senior engineer's field guide for turning any idea — web app, AI tool, SaaS product, startup MVP — into working, deployed software using AI. No prior coding experience required.*

---

> **Who wrote this, and why you should listen.**
>
> I've shipped products used by millions of people. I've been in rooms at Apple and Google where the engineers are brilliant and the standards are unforgiving. And I've watched the entire craft of software building transform in the last two years in a way I genuinely did not expect.
>
> The barrier to building software is no longer technical skill. It's *thinking skill* — the ability to break a complex idea into precise, logical pieces and communicate them clearly. AI handles the syntax. You handle the thinking.
>
> This guide teaches you to think like a builder. Not a coder. A builder.
>
> It's structured as a complete workflow from idea to deployed product, but the real gift it gives you is a *mental operating system* — a way of approaching any problem, in any domain, with the confidence that you can build your way to a solution.
>
> Read it in order. Don't skip sections. Every confusion you'll encounter later in a project has its answer somewhere earlier in this guide.

---

## What This Guide Is

This is not a web development tutorial. It is a **builder's playbook** — for web apps, AI tools, SaaS products, internal tools, startup MVPs, hackathon projects, or anything else that lives on a computer screen.

The workflow here is universal. The mental models apply whether you're building a journaling app, a logistics dashboard, a legal document generator, a music recommendation engine, or a marketplace. The tools are AI-powered and the process is the same.

**What you'll learn to do:**
- Turn any vague idea into a concrete technical specification
- Use the right AI tools (Claude, Gemini, ChatGPT, Antigravity) for the right tasks
- Build frontend interfaces that look and feel like real products
- Build backends that handle data, logic, and external services
- Protect secrets and credentials like a professional
- Push code to GitHub and deploy to the internet
- Think about quality, security, and user experience from day one

**Every section has:**
- The *why* before the *what* — because understanding beats memorizing
- Step-by-step instructions — nothing skipped, nothing assumed
- Exact prompts — copy-paste ready, fill-in-the-blank templates
- 📸 `[IMAGE: description]` markers — placeholders for screenshots you'll add

**Estimated time:** 10–14 hours for your first project. 3–5 hours after that.

---

## Before You Begin — The Tools

Install and sign up for all of these before starting anything else. Every one is free.

| Tool | What it does | Where |
|------|-------------|-------|
| **Antigravity** | AI-powered coding workspace — your primary build environment | [antigravity.ai](https://antigravity.ai) |
| **VS Code** | Code editor — view, edit, and manage your files | [code.visualstudio.com](https://code.visualstudio.com) |
| **Node.js (LTS)** | Runs JavaScript on your machine — required for most projects | [nodejs.org](https://nodejs.org) |
| **Git** | Version control — tracks every change, lets you undo anything | [git-scm.com](https://git-scm.com) |
| **GitHub** | Hosts your code online — connects to deployment platforms | [github.com](https://github.com) |
| **Claude** | Best AI for logic, planning, backend, debugging | [claude.ai](https://claude.ai) |
| **ChatGPT** | Great for brainstorming, writing, research | [chatgpt.com](https://chatgpt.com) |
| **Groq** | Free, fast AI API — add intelligence to your app | [console.groq.com](https://console.groq.com) |
| **MongoDB Atlas** | Free cloud database — stores your app's data | [mongodb.com/atlas](https://mongodb.com/atlas) |
| **Vercel** | Deploys your frontend to the internet — free | [vercel.com](https://vercel.com) |
| **Render** | Deploys your backend to the internet — free | [render.com](https://render.com) |

> 📸 **[IMAGE: Grid of all tool homepages side by side — Antigravity, VS Code, GitHub, Groq, MongoDB, Vercel, Render]**

---

---

# PHASE 0 — The Mental Model
*The foundation. Read this before touching any tool.*

---

## 0.1 — How Software Actually Works

Every piece of software — Instagram, Uber, Figma, a simple notes app — is built on the same three-part foundation:

**The Frontend** is everything the user sees and touches. It runs in the user's browser or on their device. It's responsible for layout, visuals, interactions, and animations. When you scroll through a feed or click a button, the frontend is handling that. Frontend code is written in HTML, CSS, and JavaScript — and you'll use React, which builds on top of those.

**The Backend** is the invisible logic engine running on a server somewhere in the world. It receives requests from the frontend, processes them, talks to databases and external services, and sends back responses. The user never sees the backend — they only see its effects. Authentication, payment processing, data storage, AI calls — these are all backend responsibilities.

**The Database** is permanent storage. Without a database, every time a user closes your app, all their data disappears. The database keeps it. When you log back into an app and your content is still there, that's a database doing its job.

These three layers communicate over the internet using **HTTP requests** — the same system your browser uses when you type a URL. The frontend sends a request ("give me this user's data"), the backend receives it, does the work, and sends back a response ("here's the data").

> 📸 **[IMAGE: Three-layer architecture diagram — Browser/Device (Frontend) ↔ HTTP Requests ↔ Server (Backend) ↔ Database. Clean, labeled arrows showing the flow both ways.]**

This structure is true for virtually every software product in existence. Internalize it. When something doesn't work in your project, you'll always be asking: "Is this a frontend problem, a backend problem, or a database problem?" That question alone will solve 80% of your bugs.

---

## 0.2 — What an API Is, Simply

**API** stands for Application Programming Interface. That's a useless name. Here's a useful one: **a contract that lets two separate systems talk to each other**.

The clearest analogy: a restaurant. You sit at the table. You don't go into the kitchen. You don't know how the food is made. But there's a menu — a defined list of things you can order — and a waiter who takes your request to the kitchen and brings back exactly what you ordered.

In software: your frontend (you at the table) sends a request to an API endpoint (the waiter) following a defined contract (the menu). The backend or external service (the kitchen) processes it and sends back the result.

When your app calls Groq to run an AI model, it's sending an HTTP request to Groq's API — following their contract, getting back a structured response. When your frontend asks your own backend to save data, it's calling *your* API — the endpoints you defined.

> 📸 **[IMAGE: Restaurant analogy diagram — customer = your app, menu = API docs, waiter = HTTP request, kitchen = backend/service, food = response data]**

There are also **third-party APIs** — services built by other companies that you plug into your app. Weather data, payment processing (Stripe), maps (Google Maps), AI (Groq, OpenAI), SMS (Twilio), email (SendGrid) — these are all APIs you can call from your backend with an API key. They're ready-made capabilities you can drop into any project.

---

## 0.3 — What Vibe Coding Is

Traditional software development requires you to learn programming languages — their exact syntax, their rules, their error messages. One misplaced character breaks everything. It takes years to get fluent.

**Vibe coding** is building software by describing what you want in plain language, and letting AI write the code.

The term was coined by **Andrej Karpathy** — a founding member of OpenAI, former Director of AI at Tesla, and one of the most consequential AI researchers of his generation. He described the experience of building by *describing intent* to an AI rather than writing every line yourself. You're immersed in the *problem and the idea* — the vibe of what you're building — not tangled in syntax.

> 📸 **[IMAGE: Andrej Karpathy's original post coining the term "vibe coding" — screenshot]**

Here is the difference in real terms.

**Traditional coding** — implementing a button that submits a form to an API:
```javascript
const form = document.querySelector('#submit-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Processing...';
  try {
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: form.querySelector('#input').value })
    });
    if (!res.ok) throw new Error('Request failed');
    const result = await res.json();
    // handle result...
  } catch (err) {
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit';
  }
});
```

**Vibe coding** — describing the same behavior to an AI:
> *"When the user submits the form, disable the submit button and change its text to 'Processing...'. Send a POST request to /api/process with the input field's value as 'data' in the request body. On success, display the result. On error, show a red error message below the form. Either way, re-enable and reset the button when done."*

The AI produces the code above — or better — from that description.

Your job is not to know the syntax. Your job is to *think clearly and describe precisely*. That is the real skill, and it is a learnable skill. This guide will build it in you.

---

## 0.4 — The Domains Where This Works

Vibe coding with the workflow in this guide applies across all software domains, not just web development. Here's how the same principles map:

| Domain | Frontend | Backend | AI API Use | Database |
|--------|---------|---------|-----------|----------|
| **Web App / SaaS** | React UI | Node.js + Express | Groq / OpenAI | MongoDB / Supabase |
| **AI Tool** | Chat interface | API wrapper | Groq / OpenAI | Conversation history |
| **Dashboard / Analytics** | Charts, tables | Data processing | Optional | SQL / MongoDB |
| **E-commerce** | Product catalog, cart | Orders, payments | Recommendations | PostgreSQL |
| **Marketplace** | Listings, profiles | Matching logic | AI matching | MongoDB |
| **Internal Tool** | Forms, workflows | Business logic | Optional | Any |
| **Education Platform** | Lessons, quizzes | Progress tracking | AI tutoring | Any |
| **Healthcare App** | Patient UI | HIPAA-compliant API | Diagnostics | Encrypted DB |
| **Fintech** | Dashboards, reports | Transaction logic | Fraud detection | PostgreSQL |
| **Game** | Canvas / WebGL | Game state API | AI opponent | Redis / MongoDB |

The stack changes. The *process* — plan, design system, build frontend, build backend, connect, secure, deploy — stays exactly the same.

---

## 0.5 — The Standard Tech Stack

This guide uses a specific set of technologies. You don't need to memorize their details — the AI knows them. You just need to know what each piece does so you can make informed decisions.

### Frontend Technologies

| Technology | In One Sentence | When to Use It |
|-----------|----------------|---------------|
| **React.js** | Component-based UI library | Any dynamic web interface |
| **Next.js** | React + backend in one framework | When you want frontend and API routes together |
| **Tailwind CSS** | Write styles as class names directly in HTML | Fast, consistent styling without writing CSS files |
| **Framer Motion** | Animation library for React | Any smooth UI animations |
| **Axios** | Makes HTTP requests from the frontend | Calling your backend API or any external API |
| **HTML/CSS/JS** | The raw foundations of the web | Simple pages, landing pages, no framework needed |

### Backend Technologies

| Technology | In One Sentence | When to Use It |
|-----------|----------------|---------------|
| **Node.js** | JavaScript runtime on a server | Any JavaScript backend |
| **Express.js** | Minimal framework for building APIs | Building your own backend API |
| **Next.js API Routes** | Backend endpoints inside a Next.js app | When frontend + backend are the same project |
| **Python + FastAPI** | Python-based API framework | AI/ML-heavy backends, data science projects |

### Databases

| Database | In One Sentence | When to Use It |
|---------|----------------|---------------|
| **MongoDB Atlas** | Stores data as flexible JSON documents | User-generated content, variable data structure |
| **Supabase** | PostgreSQL with built-in auth and real-time | Apps needing row-level security or structured data |
| **PostgreSQL** | Structured relational database | Financial data, complex relationships |
| **Redis** | Blazing-fast in-memory storage | Sessions, caching, leaderboards, real-time features |

### AI & External APIs

| Service | In One Sentence | Free Tier |
|---------|----------------|----------|
| **Groq** | Fast inference for open-source AI models | Generous free tier, no card required |
| **OpenAI** | GPT-4 and DALL-E | Limited free credits |
| **ElevenLabs** | AI text-to-speech | Free tier available |
| **Replicate** | Run AI models (image, video, audio) | Pay per use, very cheap |
| **Stripe** | Payment processing | Free until you collect money |
| **Twilio** | SMS, voice, WhatsApp | Free credits to start |
| **SendGrid** | Email sending | 100 emails/day free |
| **Cloudinary** | Image and video hosting | Free tier available |

You don't need all of these. You pick what your project needs. The guide will show you how to choose and integrate them.

---

---

# PHASE 1 — Think Before You Build
*The most underestimated phase. Where 80% of hackathon failures begin.*

---

## 1.1 — The Single Most Important Rule

**Never open a code editor or an AI chat without knowing exactly what you're building.**

Here's what happens when people skip planning: they start building, get deep into implementation, and then realize their data model doesn't support a core feature. Or their UI doesn't make sense for the user flow. Or they've built a complex backend for a feature they cut from scope two hours ago. The rebuild costs more time than the planning would have.

At hackathons, this is how teams with good ideas run out of time. At startups, this is how teams waste their first three months.

Planning is not bureaucracy. It's compression. You compress 10 hours of confusion into 1 hour of clarity.

The rule: **Before touching Antigravity, you must be able to answer these three questions from memory:**

1. What does the user do in this app, step by step?
2. What data gets stored, and in what shape?
3. What does the backend need to do that the frontend can't?

If you can't answer all three clearly, you're not ready to build yet.

---

## 1.2 — The Idea Pressure Test

Before committing to an idea, run it through this rapid pressure test. This takes 10 minutes and will save you from building the wrong thing.

**In one sentence, complete this:**
> "[YOUR APP] helps [SPECIFIC USER] do [SPECIFIC ACTION] so that [SPECIFIC BENEFIT]."

If you can't fill that in cleanly, the idea isn't clear enough yet. Some examples:

> "This app helps **college students** **track their job applications** so that **they never lose track of where they've applied and what stage each one is in**."

> "This app helps **indie musicians** **generate promotional content** so that **they can post consistently without spending hours writing captions and bios**."

> "This app helps **small restaurant owners** **manage their daily reservations and waitlist** so that **they don't need expensive software like OpenTable**."

Notice what's specific: the user, the action, the outcome. Vague ideas produce vague products. Specific ideas produce focused, usable products.

**Pressure test questions:**
- Who uses this? Name a specific type of person, not "everyone"
- What pain does it solve? Is the pain real and frequent?
- How does a user discover value within the first 60 seconds?
- What does "done" look like for version 1? (Resist scope creep.)
- What's the one feature without which the app is worthless?

---

## 1.3 — Domain-Specific Project Templates

If you're looking for an idea, here are starting points across domains. Each maps to the same build workflow in this guide.

**AI-Powered Productivity:**
> An AI writing assistant that generates first drafts of emails, reports, or proposals based on bullet points. User pastes bullet points, selects tone, gets a polished draft.

**Healthcare / Wellness:**
> A symptom tracker where users log daily how they feel, and AI identifies patterns over time and suggests which symptoms to discuss with a doctor.

**Education:**
> An AI tutor for a specific subject — user asks questions in plain language, AI explains concepts at their level, saves session history so they can review.

**Legal / Document:**
> Upload a contract or legal document, AI extracts key clauses, flags risky terms, explains in plain language. Lawyers hate this. Users love it.

**Finance:**
> A personal spending analyzer. User connects their bank statement CSV, AI categorizes spending, identifies patterns, suggests where to cut.

**Logistics / Operations:**
> A delivery route optimizer. Driver inputs pickup and dropoff locations, AI outputs the optimal order to minimize driving time.

**HR / Recruiting:**
> A resume screener. HR uploads a job description and a batch of resumes. AI ranks candidates and summarizes why each one does or doesn't fit.

**Creative:**
> A brand identity generator. User describes their business in 5 sentences, AI generates a brand name, tagline, color palette rationale, and social media bio.

**Real Estate:**
> A property comparison tool. User inputs 3–5 listings they're considering, AI summarizes pros/cons of each and recommends based on stated priorities.

**Food & Restaurant:**
> A digital menu with AI-powered dish recommendations. Customer tells the AI dietary restrictions and mood, AI suggests what to order.

Every single one of these: React frontend + Express backend + MongoDB + Groq AI + Vercel + Render. Same playbook.

---

## 1.4 — Build the Masterplan with Claude

The **Masterplan** is a structured document that captures every important decision about your project before you write a line of code. You build it in a conversation with Claude — not because you can't think for yourself, but because Claude's questions will surface things you haven't considered.

**Why Claude for this?** Claude is exceptional at structured reasoning, anticipating edge cases, and asking the questions you didn't know to ask. This is planning and architecture work — exactly where Claude excels.

**Step 1:** Go to [claude.ai](https://claude.ai). Start a new conversation.

**Step 2:** Use this prompt, filling in your own idea:

```
You are a senior software architect and product strategist with experience 
at high-growth companies.

I want to build: [DESCRIBE YOUR IDEA IN 2–3 SENTENCES]

Help me create a complete technical masterplan for this product. Be 
thorough and don't assume I know what I don't know. Challenge vague 
assumptions. If something in my idea is unclear, ask me before proceeding.

Cover all of these in your masterplan:

1. PROBLEM & POSITIONING
   - What specific problem does this solve?
   - Who is the primary user? Be specific (not "anyone" or "everyone")
   - What does this user currently do instead? (the "competition")
   - Why is this better, faster, or cheaper?

2. USER FLOW
   - Step-by-step: what does a user do from opening the app to getting value?
   - What's the "aha moment" — the first time they realize this is useful?
   - Write this as a numbered sequence of concrete actions

3. FEATURES — PRIORITIZED
   - Must-have (MVP cannot function without these)
   - Should-have (makes it significantly better)
   - Nice-to-have (version 2 or later)
   - NOT building (explicitly out of scope — this prevents scope creep)

4. PAGES / SCREENS
   - List every page or screen in the app
   - For each: name, purpose, what's visible on it, what actions a user takes

5. DATA MODEL
   - What data does the app store permanently?
   - For each entity (thing we store), list its fields, types, and whether required
   - Show relationships (e.g., "each Entry belongs to one User")

6. API DESIGN
   - List every backend endpoint the frontend will need to call
   - For each: HTTP method, URL path, what it receives, what it returns

7. EXTERNAL SERVICES
   - What APIs or third-party services does this need?
   - (AI, maps, payments, email, SMS, file storage, etc.)
   - For each: which service, what we use it for, free vs paid

8. TECH STACK RECOMMENDATION
   - Frontend: which framework and why
   - Backend: which language/framework and why
   - Database: which one and why
   - Any concerns or alternatives to consider?

9. RISKS & OPEN QUESTIONS
   - What are the 3 most likely things to go wrong while building this?
   - What decisions do I need to make that will significantly affect the build?
   - What am I probably underestimating?

Format this as a clean, structured markdown document titled "MASTERPLAN.md".
```

> 📸 **[IMAGE: Claude.ai interface with the masterplan prompt being typed and Claude starting to generate a detailed structured response]**

**Step 3:** Read Claude's output carefully. It will likely surface things you hadn't thought about. Have a follow-up conversation to refine anything unclear.

**Step 4:** Create a file called `MASTERPLAN.md` in your project folder and paste the output. This is your project's source of truth. Refer to it when you're confused mid-build.

> 📸 **[IMAGE: VS Code with MASTERPLAN.md open showing the full structured output — sections visible for User Flow, Features, Data Model, and API Design]**

---

## 1.5 — Generate the Technical Specification with SKILL.md

The `SKILL.md` file attached to this guide is a Master Vibe Coding Skill — 9 expert modules covering architecture, design systems, copywriting, component logic, animations, responsive design, data integration, Figma Make prompts, and QA.

Once you have your masterplan, use **Module 0 (the Master Orchestrator)** from SKILL.md to generate a complete technical specification — the detailed blueprint that you and the AI will build from.

**How to use it:**
1. Open `SKILL.md`
2. Copy Module 0 into a Claude conversation
3. Replace all `[BRACKETED]` placeholders with your project's details
4. Save the output as `TECHNICAL-SPEC.md`

The modules in SKILL.md are expert-level prompts built from trial and error. When you use them, you're not starting from scratch — you're standing on a foundation of optimized, battle-tested prompting patterns.

Reference specific modules as you build: Module 2 when designing your visual system, Module 4 when building complex components, Module 6 when adding animations, Module 9 before shipping.

---

---

# PHASE 2 — Set Up Your Environment
*Do this once. Takes 30–45 minutes. You never repeat it.*

---

## 2.1 — Install VS Code

VS Code (Visual Studio Code) is the world's most popular code editor. Even in a vibe coding workflow, you need it to view generated files, make small edits, and run terminal commands.

**Steps:**
1. Go to [code.visualstudio.com](https://code.visualstudio.com)
2. Click the download button for your OS (Windows, macOS, Linux)
3. Install (click through the defaults — they're all fine)
4. Open VS Code

> 📸 **[IMAGE: VS Code download page with the main download button visible]**

> 📸 **[IMAGE: VS Code open for the first time — welcome tab visible, Explorer panel on the left]**

**Open the integrated terminal:** Press `` Ctrl+` `` (the backtick key, top-left of keyboard, below Escape). A terminal panel opens at the bottom. This is where you type commands that your computer executes. You'll use it constantly.

**Install these VS Code extensions** (press `Ctrl+Shift+X` to open Extensions):
- **Thunder Client** — test your API endpoints without leaving VS Code
- **GitLens** — makes Git much more visible and useful
- **Prettier** — auto-formats your code so it stays readable

> 📸 **[IMAGE: VS Code Extensions panel showing Thunder Client and GitLens search results]**

---

## 2.2 — Install Node.js

Node.js is a runtime that lets your computer execute JavaScript outside of a browser. It's what powers your backend server when you run it locally.

**Steps:**
1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS version** (Long Term Support — the stable release)
3. Install (click through all defaults)

> 📸 **[IMAGE: nodejs.org showing the LTS download button prominently]**

**Verify the installation:**
```bash
node --version
# Should output something like: v20.11.0

npm --version  
# Should output something like: 10.2.4
```

`npm` (Node Package Manager) installs code libraries. It comes bundled with Node.js. When you install a project's dependencies, you're using npm.

> 📸 **[IMAGE: VS Code terminal showing both version commands running and outputting version numbers]**

---

## 2.3 — Install Git

Git is version control — a time machine for your code. Every time you commit, you take a snapshot. You can always go back.

**Steps:**
1. Go to [git-scm.com](https://git-scm.com)
2. Download for your OS and install (all defaults are fine)

**Verify:**
```bash
git --version
# Should output: git version 2.x.x
```

**Configure your identity (one-time, required):**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Use the same email you'll use for GitHub. This appears in your commit history.

---

## 2.4 — Create a GitHub Account

GitHub is where your code lives online. Vercel and Render deploy directly from it. Your GitHub profile is also your developer portfolio.

1. Go to [github.com](https://github.com) and click Sign up
2. Choose a username — make it professional, this is your identity
3. Verify your email

> 📸 **[IMAGE: GitHub signup page]**

---

## 2.5 — Set Up Groq (Free AI API)

Groq is an AI company with the fastest inference engine available. They give you free access to powerful open-source models: Meta's LLaMA 3, Mixtral, and Google's Gemma. No credit card. No waitlist. You get an API key in under 2 minutes.

**Why Groq over OpenAI for your projects?** OpenAI has usage caps and requires a credit card for anything beyond basic testing. Groq's free tier is genuinely generous. For hackathons and learning projects, Groq is the right choice.

**Step 1: Sign up**
- Go to [console.groq.com](https://console.groq.com)
- Sign in with Google or create an account

> 📸 **[IMAGE: Groq console homepage with Sign In button]**

**Step 2: Create an API Key**
- In the left sidebar, click **"API Keys"**
- Click **"Create API Key"**
- Name it after your project (e.g., `my-project-dev`)
- Click **"Submit"**

> 📸 **[IMAGE: Groq API Keys page with "Create API Key" button highlighted]**

> 📸 **[IMAGE: Groq key creation dialog with name field and Submit button]**

**Step 3: Copy your key immediately**
- Your key appears once, starting with `gsk_`
- Click the copy button
- **Open Notepad / TextEdit / any text editor right now and paste it**
- Close the dialog

> 📸 **[IMAGE: Groq key revealed — the gsk_ key visible with copy button. Arrow pointing to the key.]**

> ⚠️ **Critical:** This key is shown exactly once. If you click away without copying it, you'll need to delete it and create a new one. Groq does not store keys for retrieval.

**Step 4: Explore available models**
- In the left sidebar, click **"Models"**
- You'll see all available models with their context windows and speeds

> 📸 **[IMAGE: Groq models page showing available models — llama3, mixtral, gemma listed with specs]**

**Choose the right model for your project:**

| Model | Best for | Notes |
|-------|---------|-------|
| `llama3-70b-8192` | Complex reasoning, nuanced responses | Best quality, slightly slower |
| `llama3-8b-8192` | Fast responses, simpler tasks | Very fast, good for real-time |
| `mixtral-8x7b-32768` | Long documents, big context | 32k token window |
| `llama-3.1-8b-instant` | Real-time chat, streaming | Fastest available |
| `llava-v1.5-7b-4096-preview` | Vision tasks (analyze images) | When you need image input |

For most AI features in your app, start with `llama3-70b-8192`. It's the best balance of quality and speed.

---

## 2.6 — Set Up MongoDB Atlas

MongoDB is a database that stores data as **documents** — JSON-like objects. It's flexible: you can store different shapes of data in the same collection without a rigid schema. This makes it fast to prototype with.

**Atlas** is MongoDB's cloud hosting service. The free tier gives you 512MB and is enough for thousands to hundreds of thousands of records.

**Step 1: Create an account**
- Go to [mongodb.com/atlas](https://mongodb.com/atlas)
- Click **"Try Free"**
- Sign up with Google or email

> 📸 **[IMAGE: MongoDB Atlas "Try Free" homepage]**

**Step 2: Create your project**
- After logging in, you'll be prompted to create an Organization and a Project
- Name the project after your app (e.g., `my-project`)
- Click through the defaults

> 📸 **[IMAGE: MongoDB project creation screen with project name input field]**

**Step 3: Create a free cluster**
- Click **"Build a Database"** or **"Create a cluster"**
- Select **M0 Free** (the free tier — clearly marked, no credit card needed)
- **Provider:** AWS
- **Region:** Choose the one closest to you:
  - India → `ap-south-1` (Mumbai)
  - US East → `us-east-1` (Virginia)
  - Europe → `eu-west-1` (Ireland)
- **Cluster Name:** `Cluster0` (default is fine)
- Click **"Create Deployment"**

> 📸 **[IMAGE: MongoDB cluster creation — M0 Free selected, AWS provider, Mumbai region highlighted for India]**

**Step 4: Create a database user**

While the cluster is being provisioned (1–3 minutes), Atlas prompts you for credentials. This is the username/password your *application* uses to connect to the database — separate from your Atlas login.

- **Username:** something like `appuser` or `[yourproject]-user`
- **Password:** Click **"Autogenerate Secure Password"** and copy it
- Click **"Create Database User"**

> 📸 **[IMAGE: MongoDB "Create Database User" dialog with username field and Autogenerate password button]**

**Paste this username and password into your secrets text file NOW.**

**Step 5: Configure Network Access**

MongoDB only allows connections from approved IP addresses. For development and free-tier deployment, allow all IPs:

- In the left sidebar, click **"Network Access"**
- Click **"Add IP Address"**
- Click **"Allow Access From Anywhere"** — this adds `0.0.0.0/0`
- Click **"Confirm"**

> 📸 **[IMAGE: MongoDB Network Access page with "Add IP Address" and "Allow Access From Anywhere" button]**

> **Why "allow from anywhere"?** When you deploy on Render, your app runs on servers with dynamic IPs that change unpredictably. You can't whitelist them in advance. For production apps at companies, you'd lock this down to your server's static IP. For your projects, open access is standard practice.

**Step 6: Get your connection string**

This is the address your backend code uses to connect to your database.

- In the left sidebar, click **"Database"**
- Next to your cluster, click **"Connect"**

> 📸 **[IMAGE: MongoDB clusters list with "Connect" button next to Cluster0]**

- Select **"Drivers"**
- Driver: **Node.js** | Version: **5.5 or later**

> 📸 **[IMAGE: MongoDB Connect dialog showing Drivers option selected]**

- Copy the connection string. It looks like:
```
mongodb+srv://appuser:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

- Replace `<password>` with your actual password
- Add `/your-database-name` before the `?` — for example:
```
mongodb+srv://appuser:YOURPASSWORD@cluster0.abc123.mongodb.net/myproject?retryWrites=true&w=majority
```

The `/myproject` part tells MongoDB which database to use. It will be created automatically when you first save data.

**Paste this complete URI into your secrets text file.**

---

## 2.7 — Your Secrets File

You should now have a text file (on your computer only, not online) with:

```
=== PROJECT SECRETS — DO NOT SHARE OR COMMIT ===

Project: [Your Project Name]

GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxx

MONGODB_URI=mongodb+srv://appuser:YOURPASSWORD@cluster0.abc123.mongodb.net/myproject?retryWrites=true&w=majority

MongoDB Username: appuser
MongoDB Password: YOURPASSWORD
```

Keep this file. You'll need these values when deploying. Never paste them into a chat, email, or GitHub.

---

---

# PHASE 3 — Master Antigravity
*Your AI coding workspace. Where everything gets built.*

---

## 3.1 — Getting Started in Antigravity

Antigravity is an AI-powered development workspace. It combines:
- A chat interface where you describe what you want
- A file editor that shows generated code
- A live preview window
- Multiple AI models you can switch between

**Create your project:**
1. Go to [antigravity.ai](https://antigravity.ai) and sign up
2. Click **"New Project"**
3. Name it after your app

> 📸 **[IMAGE: Antigravity dashboard with "New Project" button and project creation dialog]**

> 📸 **[IMAGE: Antigravity workspace — three-panel layout: chat on left, code editor in center, preview on right. Each panel labeled.]**

---

## 3.2 — The Model Selection Strategy

Antigravity lets you switch between AI models. This is one of the most important decisions you'll make mid-build. Different models have measurably different strengths.

**Use Claude (Anthropic) when:**
- Planning and architecture ("how should I structure this?")
- Building backend logic (Express routes, database operations, auth)
- Debugging and error fixing ("why is this broken?")
- Writing code that needs to be logically correct and complete
- Anything where *reasoning quality* matters over *aesthetics*

**Use Gemini (Google) when:**
- Designing and building the frontend UI
- Creating animations with Framer Motion
- Generating visually polished layouts and components
- Styling decisions — colors, typography, spacing
- Anything where *visual quality* is the primary output

**The practical rule:**
> **Gemini builds what the user sees. Claude builds what makes it work.**

This is not dogma — test both on your project. But starting with this split will give you better outputs immediately.

> 📸 **[IMAGE: Antigravity model selector dropdown open, showing Claude and Gemini options with Gemini selected]**

---

## 3.3 — The Architecture of a Great Prompt

The quality of your output is directly determined by the quality of your input. This is true with every AI tool, and there are no shortcuts around it. Writing good prompts is a learnable skill — here's the framework.

**The five-part prompt:**

```
ROLE      → Who is the AI in this context?
CONTEXT   → What are we building? What already exists?
TASK      → What exactly do you want it to do right now?
RULES     → What constraints, formats, or preferences must it follow?
OUTPUT    → What format should the result be in?
```

**A weak prompt:**
```
make a dashboard
```
The AI has no idea what product this is, what data is displayed, who uses it, what it looks like, or what framework to use. It will guess — and it will guess generically.

**A strong prompt:**
```
You are a senior React developer building [YOUR APP NAME] — [one-sentence 
description of the app].

Design system: dark background (#0F0F0F), primary color (#YOUR_COLOR), 
font (YOUR_FONT), Tailwind CSS for all styling, Framer Motion for animations.

Build the [PAGE NAME] page. It should:
- [describe what this page displays]
- [describe the user interactions available]
- [describe states: loading, empty, error, success]
- [describe animations: what animates, when, how]
- [describe layout: desktop and mobile]

Rules:
- Use Tailwind CSS for all styling (no inline styles)
- Use Framer Motion for all animations
- Export the component as default
- Handle all edge cases (loading, empty, error)

Output the complete component file. Do not truncate.
```

**The golden rule:** Write prompts the way you'd write a brief for a senior contractor. Clear, complete, unambiguous. Leave no room for guessing on important decisions.

---

## 3.4 — Context Management Across Sessions

AI models do not have memory between separate conversations. Every new session starts fresh. This creates a critical habit you must build:

**Begin every Antigravity session with a context block.** Before your actual request, paste a brief summary of your project:

```
Project context:
- App: [APP NAME] — [one-sentence description]
- Frontend: React + Tailwind CSS + Framer Motion
- Backend: Node.js + Express.js + MongoDB
- AI: Groq API ([model name])
- Design: [primary color], [background color], [font name]
- Current state: [brief description of what's already built]

Today's task: [your actual request]
```

Thirty seconds of context setup prevents ten minutes of correcting misaligned output. Make it a habit.

---

## 3.5 — The Prompt Refinement Loop

First outputs from AI are rarely perfect — and that's fine. The workflow is:

```
Describe → Generate → Review → Refine → Repeat
```

When the output isn't right, don't rewrite the entire prompt. Describe what's wrong specifically:

**Weak refinement:**
```
that's wrong, redo it
```

**Strong refinement:**
```
The card component looks correct, but two things need to change:

1. The hover animation is too aggressive — the scale goes to 1.15 which 
   feels jarring. Change it to 1.03 with a softer ease-out.

2. On mobile (below 768px), the cards should stack vertically in a single 
   column. Currently they're staying in a 3-column grid which breaks 
   the layout on small screens.

Fix only these two things — don't change anything else.
```

Specific feedback → specific fixes. Vague feedback → random changes that may break other things.

---

---

# PHASE 4 — Build the Frontend
*The face of your product. Use Gemini here.*

---

## 4.1 — Set Up the Project Structure

Before building any UI, scaffold the project — create the folder structure, install dependencies, and set up routing. Switch to **Claude** for this step. It's architecture, not UI.

```
You are a senior React developer setting up a new project.

Project: [YOUR APP NAME] — [brief description]
Tech: React (using Vite), React Router, Tailwind CSS, Framer Motion, Axios

Create the complete initial project setup with:

1. Package.json with all required dependencies:
   - react, react-dom, react-router-dom
   - framer-motion
   - axios
   - tailwindcss, postcss, autoprefixer

2. Tailwind configuration (tailwind.config.js):
   - Include these custom colors in the theme:
     primary: '[YOUR PRIMARY COLOR]'
     background: '[YOUR BACKGROUND COLOR]'
     surface: '[YOUR CARD/SURFACE COLOR]'
   - Add a custom font family: '[YOUR FONT NAME]'

3. Global CSS (index.css):
   - Tailwind directives (@tailwind base/components/utilities)
   - Import [YOUR FONT] from Google Fonts
   - Set body background to background color, text color to [YOUR TEXT COLOR]
   - Custom scrollbar styles (subtle, matching the dark theme)

4. Folder structure:
   src/
   ├── components/         (reusable UI elements)
   │   └── Navbar.jsx     (navigation bar)
   ├── pages/              (full page components)
   │   ├── [PAGE1].jsx
   │   ├── [PAGE2].jsx
   │   └── [PAGE3].jsx
   ├── services/
   │   └── api.js         (all API call functions)
   ├── hooks/             (custom React hooks)
   ├── App.jsx            (root component with routing)
   └── main.jsx           (entry point)

5. App.jsx with React Router:
   - Routes for each of your pages
   - Wrap routes with a layout component that includes the Navbar

6. Navbar.jsx:
   - App name/logo on the left
   - Navigation links on the right to each page
   - Background: [your surface color], subtle bottom border
   - Active link highlighted in primary color
   - Smooth link transitions

Show every file's complete content. Don't truncate.
```

> 📸 **[IMAGE: Antigravity with Claude selected, project setup prompt typed, and the file tree generating in the editor panel]**

---

## 4.2 — Generate Each Page

Switch to **Gemini** for all page and UI work. Use this template for each page you build:

```
You are an expert UI designer and React developer building [APP NAME].

Design system reference:
- Background: [COLOR]
- Primary/accent color: [COLOR]  
- Surface/card color: [COLOR]
- Text: [COLOR]
- Font: [FONT NAME] — [weight for headings, weight for body]
- Style: [your aesthetic: minimal/bold/glassmorphism/clean/etc.]
- Libraries: Tailwind CSS for all styling, Framer Motion for all animations

Build the [PAGE NAME] page — its purpose is [describe what this page does].

Layout (describe in sections, top to bottom):

SECTION 1 — [SECTION NAME]:
[Describe exactly what's here: content, layout columns, visual style]

SECTION 2 — [SECTION NAME]:
[Describe exactly what's here]

[...continue for each section]

Interactive states:
- Loading: [describe what shows while data is loading]
- Empty: [describe what shows when there's no data yet]
- Error: [describe what shows if something goes wrong]

Animations (Framer Motion):
- Page load: [what animates in, how, with what timing]
- User interactions: [hover effects, click effects]
- Transitions: [how content appears/disappears]

Responsive behavior:
- Desktop (1280px+): [layout description]
- Tablet (768px–1280px): [layout description]
- Mobile (below 768px): [layout description]

For now, use realistic hardcoded placeholder data — we'll connect 
real data after the backend is built.

Show the complete [PageName].jsx file. Do not truncate.
```

**Build pages one at a time.** Don't try to generate all pages in one prompt — you'll get lower quality outputs. One page per prompt, then review and refine before moving to the next.

---

## 4.3 — Build Reusable Components

Components are the building blocks of your UI — buttons, cards, input fields, modals, badges. Build these separately and reuse them across pages.

```
Build a reusable [COMPONENT NAME] component for [APP NAME].

It should accept these props:
- [prop name]: [type] — [what it does]
- [prop name]: [type] — [what it does]
- [prop name]: [type] — [what it does, optional with default]

Visual design:
[describe how it looks — background, border, typography, size, shape]

States:
- Default: [describe]
- Hover: [describe interaction — use Framer Motion]
- Active/pressed: [describe]
- Disabled: [describe — if applicable]
- Loading: [describe — if applicable]

Example usage in the file (as a comment at the top):
// <ComponentName propName="value" />

Export as named export.
Show the complete file.
```

---

## 4.4 — Add Animations That Feel Premium

The difference between a product that feels like a student project and one that feels like a real product is often just the animations. These are the three levels of animation that matter most:

**Level 1 — Page transitions (every product should have these):**
```
Add page transition animations to [APP NAME] using Framer Motion.

Wrap each page component with AnimatePresence and motion.div.

Transition style: [fade / slide-up / slide-left / scale]
Duration: [300–500ms recommended]
Easing: easeOut or custom cubic-bezier

When navigating between pages:
- Outgoing page: [fades out / slides out] 
- Incoming page: [fades in / slides up from below]

Show updated App.jsx and one example page component with the animation wrapper.
```

**Level 2 — List stagger animations (makes any list feel alive):**
```
Add stagger animation to the [COMPONENT NAME] list in [PAGE NAME].

When the list renders:
- Container: opacity 0 → 1 immediately
- Each item: y: 20 → 0, opacity: 0 → 1
- Stagger: 0.08s between each item
- Duration per item: 0.4s
- Easing: easeOut

Use Framer Motion's staggerChildren and delayChildren on the container.
```

**Level 3 — Micro-interactions (buttons, cards, inputs):**
```
Add micro-interactions to [COMPONENT NAME]:

Button:
- Hover: scale 1.03, brightness increase, transition 200ms easeOut
- Click/tap: scale 0.97 for 100ms (press feedback)
- Loading state: spinner inside button, scale unchanged

Card:
- Hover: translateY -4px, shadow deepens, transition 250ms easeOut
- Focus (keyboard): visible focus ring in primary color

Input:
- Focus: border color transitions to primary, subtle glow
- Error state: border red, shake animation (x: 0 → 4 → -4 → 0)

Show updated component files.
```

---

## 4.5 — Review the Frontend

Before building any backend, take 20 minutes to review what you have:

**In Antigravity's preview:**
- Navigate through all pages — does routing work smoothly?
- Does the visual design feel cohesive?
- Does anything look misaligned or broken at different window sizes?
- Do the animations feel smooth and purposeful?

**The three questions to ask:**
1. Would I be proud to show this to someone right now?
2. Can a new user understand what this app does within 10 seconds of seeing it?
3. Does the loading/empty/error state for each page look intentional (not broken)?

If the answer to any is no, fix it now — before connecting real data. Bugs on top of placeholder data are much easier to fix than bugs on top of live API calls.

---

---

# PHASE 5 — Build the Backend
*Switch to Claude. This is logic, not visuals.*

---

## 5.1 — Understand Your Backend's Responsibilities

Your backend server does exactly five things:

1. **Listens** for HTTP requests from your frontend
2. **Validates** the incoming data (is it what we expect?)
3. **Processes** the request (run logic, call external APIs, do calculations)
4. **Reads/writes** to the database as needed
5. **Responds** with data or a status

It never renders UI. It never knows what the screen looks like. It just receives requests, does work, and sends back data.

> 📸 **[IMAGE: Backend request lifecycle diagram — Request arrives → Validate → Process (calls Groq if AI is needed, calls MongoDB for data) → Respond]**

**Why keep the backend separate from the frontend?**

- **Security:** Your API keys (Groq, database) live only on the server, never in the browser where users could find them
- **Control:** All data going into your database passes through your validation logic
- **Reusability:** Your backend API can serve a web app, a mobile app, and a third-party integration from the same code

---

## 5.2 — Generate the Backend

**Switch to Claude** in Antigravity. Use this prompt, filled in for your project:

```
You are a senior Node.js backend developer. Build the complete backend 
for [APP NAME] — [one-sentence description].

TECHNOLOGY STACK:
- Node.js + Express.js (web server)
- Mongoose (MongoDB ORM)
- Groq SDK (AI features — [describe what AI does in this app])
- dotenv (environment variables)
- cors (cross-origin requests from frontend)

PROJECT STRUCTURE:
backend/
├── server.js              (entry point)
├── models/
│   └── [ModelName].js     (MongoDB schemas — one per entity)
├── routes/
│   └── [resource].js      (API route handlers)
├── services/
│   └── groqService.js     (Groq AI logic)
├── middleware/
│   └── validate.js        (request validation)
└── package.json

ENVIRONMENT VARIABLES (always read from process.env, never hardcode):
- MONGODB_URI             MongoDB Atlas connection string
- GROQ_API_KEY            Groq API key
- PORT                    Server port (default 5000)
- FRONTEND_URL            Frontend URL for CORS

SERVER.JS requirements:
- dotenv.config() must be the very first line
- Connect to MongoDB, log success or failure clearly
- Enable CORS with origin: process.env.FRONTEND_URL
- Parse JSON request bodies (express.json())
- Mount all routers at /api/[resource]
- Global error handler at the bottom
- Start listening on PORT

MONGODB SCHEMAS — build one schema for each entity:
[For each entity from your masterplan, describe:]
Entity: [NAME]
Fields:
- [field]: [type], [required/optional], [any constraints]
- [field]: [type], [required/optional]
Timestamps: add createdAt and updatedAt automatically

GROQ SERVICE (services/groqService.js):
Function: [functionName](input)
- Model: [choose appropriate model from Groq]
- System prompt: [describe the AI's role and behavior]
- User message: [describe what gets sent and in what format]
- Response format: JSON with fields: [list the fields you need back]
- Must: validate the JSON response before returning
- On parse failure: throw a clear error with the raw response for debugging

API ROUTES — for each endpoint from your masterplan:
[ENDPOINT 1]
Method + Path: [e.g., POST /api/entries]
Auth required: no (for now, we'll add auth later if needed)
Request body: [describe shape]
Logic:
  1. [step by step what happens]
  2. ...
Returns on success: [describe response shape]
Error handling: [what errors can occur, what status codes to return]

[ENDPOINT 2]
[...repeat for each endpoint]

QUALITY REQUIREMENTS for all routes:
- Wrap everything in try/catch
- Log all errors with console.error (include timestamp and route)
- Return consistent error shapes: { error: "message", details: "..." }
- Validate all required fields before processing
- Use HTTP status codes correctly (200, 201, 400, 404, 500, 502)

PACKAGE.JSON scripts:
- "start": "node server.js"
- "dev": "nodemon server.js" 

Show every file's complete content. Do not skip any file. 
Do not truncate any file.
```

> 📸 **[IMAGE: Antigravity with Claude selected showing the backend prompt, and multiple files being generated in the file tree]**

---

## 5.3 — Install Dependencies and Test Locally

**Step 1:** Create a `.env` file in your `backend/` folder (detailed instructions in Phase 6):
```
MONGODB_URI=your-mongodb-uri-here
GROQ_API_KEY=your-groq-key-here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Step 2:** Open a terminal in your `backend/` folder:
```bash
npm install
```
> 📸 **[IMAGE: Terminal showing npm install running — packages being downloaded with progress shown]**

**Step 3:** Start the server:
```bash
node server.js
```

You should see both:
```
Server running on port 5000
MongoDB connected successfully
```

If you see an error instead, read it carefully. The error message almost always tells you exactly what's wrong. Paste the full error into Claude:

```
I'm getting this error starting my Node.js backend:
[paste the complete error message and stack trace]

Here's my server.js: [paste the file]

What's wrong and how do I fix it?
```

> 📸 **[IMAGE: Terminal showing "Server running on port 5000" and "MongoDB connected successfully" — the two green success messages]**

**Step 4:** Test your endpoints using Thunder Client in VS Code.

Click the Thunder Client icon in the left sidebar of VS Code (it looks like a lightning bolt). Create a new request:
- Method: `POST` (or whatever your endpoint uses)
- URL: `http://localhost:5000/api/[your-endpoint]`
- Body → JSON → paste your test data

Click Send. A successful response means your backend is working.

> 📸 **[IMAGE: Thunder Client in VS Code — request configured with method, URL, and JSON body. Response panel showing successful JSON response.]**

If you get a 500 error, look at your terminal — the error will be printed there. If you get no response at all, make sure your server is running.

---

## 5.4 — Connect Frontend to Backend

With both pieces working independently, wire them together. Switch to **Claude**:

```
Connect the [APP NAME] React frontend to the Express backend.

Backend is running at http://localhost:5000 in development.
Production backend URL will be set via REACT_APP_API_URL environment variable.

Step 1 — Create src/services/api.js:
- Create an axios instance with:
  - baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
  - default header: 'Content-Type': 'application/json'
- Export one function for each backend endpoint:
  [For each of your endpoints:]
  - [functionName]([params]): calls [METHOD] [/path], returns response.data

Each API function must:
- Use try/catch
- Log errors to console.error before re-throwing
- Return only response.data (not the whole axios response object)

Step 2 — Update [PAGE/COMPONENT NAME] to use real data:
[For each component that needs data:]

Component: [NAME]
Data it needs: [describe what data from which endpoint]
When to fetch: [on mount / on button click / on form submit]

Add these states:
- isLoading: boolean (false default)
- data: [describe type] (null or [] default)
- error: string | null (null default)

On data fetch:
1. Set isLoading true
2. Call the API function
3. On success: set data to result, set isLoading false
4. On error: set error to error.message, set isLoading false

Replace hardcoded placeholder data with real API data.

Show all updated files.
```

---

## 5.5 — Test the Full Integration

With frontend and backend both running locally, test the complete user flow from start to finish. Don't skip this.

**Run both simultaneously:**
- Terminal 1 (in `backend/`): `node server.js`
- Terminal 2 (in `frontend/`): `npm run dev`

Open your browser at `http://localhost:3000` (or whatever port Vite uses).

Go through every user action in your app:
- Does the main feature work end-to-end?
- Does data save to MongoDB and load back correctly?
- Do loading states appear during API calls?
- Do error states appear when something goes wrong? (Try disconnecting from the internet to test this)
- Do empty states appear before any data exists?

Open Chrome DevTools (F12):
- **Console tab:** Are there any red errors?
- **Network tab:** Do API calls return 200 status? If not, click the failing call to see the error details.

> 📸 **[IMAGE: Chrome DevTools Network tab showing API calls — one successful POST request with 200 status highlighted]**

Fix every bug here before moving to deployment. It's much harder to debug on a deployed server than on your local machine.

---

---

# PHASE 6 — Environment Variables and Security
*The professional habit that protects you from costly mistakes.*

---

## 6.1 — The Real Cost of a Leaked API Key

In 2022, a developer accidentally committed their AWS credentials to a public GitHub repository. Automated bots that constantly scan GitHub for credentials found it within minutes. The bots spun up hundreds of GPU instances to mine cryptocurrency. By the time the developer noticed, their AWS bill was $50,000.

This is not an edge case. GitHub's automated secret scanning catches thousands of exposed keys every day. Attackers have built entire automated pipelines to exploit them.

Your Groq API key gives access to free AI inference — if someone steals it, they deplete your quota. Your MongoDB URI gives access to your database — if someone steals it, they can read, delete, or corrupt all your users' data. These are real consequences for a simple oversight.

The solution is simple, takes 5 minutes to set up, and is non-negotiable as a professional habit.

---

## 6.2 — How Environment Variables Work

An **environment variable** is a value that your operating system or server provides to your application at runtime — separate from your code. Your code reads it by name. The actual value is never in the code.

```javascript
// BAD — the key is visible in your code, which goes to GitHub
const groq = new Groq({ apiKey: "gsk_abc123yourrealkeyhere" });

// GOOD — the code references a name, not the value
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
```

The value of `GROQ_API_KEY` lives in a `.env` file on your machine and in your deployment platform's settings. Your code just asks for it by name.

The `dotenv` package reads your `.env` file when Node.js starts and loads all the key-value pairs into `process.env`. In React, the build process bakes environment variables starting with `REACT_APP_` into the bundle at build time.

---

## 6.3 — Create Your .env Files

**Backend `.env`** — create this file inside your `backend/` folder:

```bash
# backend/.env
# NEVER commit this file to GitHub

# MongoDB Atlas connection string (replace the entire thing including <password>)
MONGODB_URI=mongodb+srv://appuser:YOURPASSWORD@cluster0.abc123.mongodb.net/myproject?retryWrites=true&w=majority

# Groq API key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Server port
PORT=5000

# Frontend URL — exact URL your React app runs at locally
# Update to your Vercel URL after deployment
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env`** — create this file in your React app's root folder:

```bash
# frontend/.env (or project root if frontend isn't in a subfolder)
# NEVER commit this file to GitHub

# Backend URL — used by axios in api.js
# Update to your Render URL after deployment
REACT_APP_API_URL=http://localhost:5000
```

> 📸 **[IMAGE: VS Code showing both .env files — one in backend/ folder, one in the React root. Both files are visible but the VALUES are blurred/obscured.]**

> ⚠️ **Never put quotes around values in .env files.** Write `GROQ_API_KEY=gsk_xxx` not `GROQ_API_KEY="gsk_xxx"`. The quotes become part of the value and will break your API call.

---

## 6.4 — Create .gitignore Files

A `.gitignore` file tells Git which files to never include in commits. These files stay on your machine and never go to GitHub.

**`backend/.gitignore`:**
```
# Secrets — never push these
.env
.env.*
.env.local

# Dependencies — installed via npm install
node_modules/

# Logs
*.log
npm-debug.log*
logs/

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
.idea/
```

**`frontend/.gitignore`** (Create React App generates one — add `.env` lines if missing):
```
# Secrets
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Dependencies
node_modules/

# Build output
/build
/dist

# OS
.DS_Store
```

**Verify it's working:**
```bash
git status
```

Your `.env` files should NOT appear in the output. If they do, your `.gitignore` isn't in the right location or has a typo.

> 📸 **[IMAGE: Terminal showing `git status` output — modified files listed, .env files conspicuously absent]**

---

## 6.5 — Security Best Practices

Beyond environment variables, here are the professional habits that separate production-quality code from student-project code:

**Never log sensitive data:**
```javascript
// BAD
console.log('Connecting with URI:', process.env.MONGODB_URI);

// GOOD
console.log('MongoDB connecting...', process.env.MONGODB_URI ? '(URI found)' : '(URI MISSING)');
```

**Validate all inputs on the backend:**
Never trust data coming from the frontend. Always validate that required fields exist, have the right type, and don't contain malicious content before processing them or saving them to the database.

**Use HTTPS in production:**
Vercel and Render give you HTTPS automatically. Never use `http://` URLs in production for API calls — credentials and data can be intercepted on plain HTTP.

**Rate limit AI API calls:**
If your app calls Groq on every user action, a single user could exhaust your free quota. For now, add a simple debounce (wait 300ms after the last keystroke before calling the API) to avoid accidental API flooding.

---

---

# PHASE 7 — Git and GitHub
*Your professional safety net. Build this habit before it saves you.*

---

## 7.1 — Why Git, Even Working Alone

Three scenarios where Git will save you:

1. **You break something.** You've been building for 3 hours, made 20 changes, and now nothing works and you don't know what you changed. With Git, you run `git diff` to see every change since your last commit, or `git checkout` to go back to the last working state.

2. **You want to try something risky.** Create a branch, try the experiment, if it works you merge it, if it doesn't you delete the branch and you're back to where you were.

3. **You deploy.** Both Vercel and Render deploy directly from GitHub. No Git means no deployment.

> 📸 **[IMAGE: Git timeline diagram — commits as dots labeled with descriptions, showing how you can go back to any point]**

---

## 7.2 — Create Your GitHub Repository

1. Log in to [github.com](https://github.com)
2. Click **"+"** in the top right → **"New repository"**

> 📸 **[IMAGE: GitHub top-right corner with + button and "New repository" option highlighted]**

3. Fill in:
   - **Repository name:** your project name, lowercase, hyphens (e.g., `my-project`)
   - **Description:** one sentence about what it does
   - **Visibility:** Public (better for portfolio) or Private
   - ⚠️ **Do NOT check:** "Add a README", "Add .gitignore", or "Choose a license" — you'll handle these from your local project

4. Click **"Create repository"**

> 📸 **[IMAGE: GitHub new repository form — name and description filled in, all checkboxes unchecked, Create button visible]**

5. Copy the repository URL from the quick setup screen — looks like:
   `https://github.com/yourusername/my-project.git`

> 📸 **[IMAGE: GitHub "quick setup" screen after repo creation — the HTTPS URL highlighted for copying]**

---

## 7.3 — Push Your Code

Open a terminal in your project's root folder (the one that contains both `frontend/` and `backend/` subfolders).

Run these commands **exactly in this order:**

```bash
# 1. Start tracking this folder with Git
git init
```
Expected output: `Initialized empty Git repository in .../my-project/.git/`

```bash
# 2. Check what Git sees — verify .env is NOT in this list
git status
```
Read this output. Your `.env` files should not appear. If they do, your `.gitignore` needs fixing before you proceed.

```bash
# 3. Stage everything (that isn't ignored by .gitignore)
git add .
```
No output is normal — it means it worked.

```bash
# 4. Create your first commit — the snapshot
git commit -m "Initial commit: [YOUR PROJECT NAME] full-stack app"
```
You'll see a summary of files included. This is your first saved state.

```bash
# 5. Set your main branch name to "main"
git branch -M main
```

```bash
# 6. Connect to your GitHub repository
# Replace with your actual GitHub URL
git remote add origin https://github.com/yourusername/my-project.git
```

```bash
# 7. Push — upload your code to GitHub
git push -u origin main
```

GitHub may ask for credentials. For password, use a Personal Access Token (not your GitHub account password):
- GitHub → Settings (top-right avatar) → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
- Check the `repo` scope
- Copy the token — this is your Git password

> 📸 **[IMAGE: GitHub Personal Access Token creation — repo scope checked, Generate token button visible]**

> 📸 **[IMAGE: Terminal showing all 7 commands run in sequence with their expected outputs]**

**Verify:** Go to your GitHub repository URL. Refresh. You should see all your project files. Click into `backend/` — your `.env` file should NOT be there.

> 📸 **[IMAGE: GitHub repository showing project files — frontend/ and backend/ folders visible, .env absent from file list]**

---

## 7.4 — The Daily Git Habit

After every meaningful change — new feature added, bug fixed, component completed — run:

```bash
git add .
git commit -m "Describe what changed in plain English"
git push
```

**Write commit messages like these:**
- ✅ `"Add AI analysis endpoint with Groq integration"`
- ✅ `"Fix CORS error blocking frontend API calls"`
- ✅ `"Build history page with stagger animations"`
- ✅ `"Connect history page to MongoDB data"`
- ❌ `"fix"` — fix what?
- ❌ `"changes"` — what changes?
- ❌ `"wip"` — fine during a session, but commit with a real message before sleeping

Good commit messages are a gift to your future self at 2am debugging something.

---

---

# PHASE 8 — Deploy to the Internet
*Your app goes from your laptop to the world.*

---

## 8.1 — The Deployment Architecture

You're deploying to two platforms because your project has two separate parts:

**Vercel** hosts your frontend (React app). It serves your app from a CDN — servers distributed globally — so it loads fast everywhere. It rebuilds and redeploys automatically when you push to GitHub. Free forever for personal projects.

**Render** hosts your backend (Node.js server). It keeps your server running, listening for API requests. It also auto-redeploys from GitHub. Free tier has a sleep behavior (covered below).

> 📸 **[IMAGE: Architecture diagram — GitHub at center, arrow to Vercel (serves React to users globally), arrow to Render (runs Node.js API). Both labeled with their roles.]**

---

## 8.2 — Deploy the Backend on Render

Deploy the backend first so you have its URL ready when configuring the frontend.

**Step 1:** Go to [render.com](https://render.com). Sign up using your GitHub account.

> 📸 **[IMAGE: Render homepage — "Get Started for Free" with GitHub logo]**

**Step 2:** Click **"New +"** → **"Web Service"**

> 📸 **[IMAGE: Render dashboard with "+ New" button expanded showing "Web Service" option]**

**Step 3:** Connect your repository.
- Click **"Connect GitHub account"** if prompted
- Find your project repo and click **"Connect"**

> 📸 **[IMAGE: Render GitHub repo connection screen — your repository listed with "Connect" button]**

**Step 4:** Configure the service. Fill in these settings exactly:

| Setting | What to enter |
|---------|--------------|
| **Name** | `your-project-backend` |
| **Region** | Closest to your users (Singapore for South Asia, Oregon for US) |
| **Branch** | `main` |
| **Root Directory** | `backend` ← Critical: your server code is in a subfolder |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

> 📸 **[IMAGE: Render service configuration form with all fields filled in as per the table]**

> ⚠️ **The Root Directory field is the most common mistake.** Leave it blank and Render looks for `package.json` in your repo root, not in `backend/`. It will fail. Set it to exactly: `backend`

**Step 5:** Add environment variables. Scroll to **"Environment Variables"** and add each one:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your full MongoDB Atlas connection string |
| `GROQ_API_KEY` | Your `gsk_...` Groq API key |
| `PORT` | `10000` |
| `FRONTEND_URL` | `https://your-project.vercel.app` (use a placeholder for now, update after Step 8.3) |

> 📸 **[IMAGE: Render Environment Variables section with all four variables added — values partially hidden]**

**Step 6:** Click **"Create Web Service"**.

Render builds your app. Watch the build log — it should end with your server start message and MongoDB connection message. First build takes 3–7 minutes.

> 📸 **[IMAGE: Render build log in progress — npm install output scrolling, then "Server running" and "MongoDB connected"]**

**Step 7:** Note your service URL at the top:
`https://your-project-backend.onrender.com`

**Test it:** Open a new browser tab and go to:
`https://your-project-backend.onrender.com/api/[your-first-endpoint]`

You should see a JSON response (even an empty array `[]` is success). If you see JSON, your backend is live.

> 📸 **[IMAGE: Render service page showing live URL with green "Live" indicator]**

> ⚠️ **Free tier sleep behavior:** Render's free tier shuts your server down after 15 minutes of inactivity to save resources. The first request after sleeping takes 30–50 seconds to wake up. All subsequent requests are instant. This is expected. For hackathon demos, open your backend URL once a minute before presenting.

---

## 8.3 — Deploy the Frontend on Vercel

**Step 1:** Go to [vercel.com](https://vercel.com). Sign up with your GitHub account.

> 📸 **[IMAGE: Vercel homepage — "Start Deploying" with GitHub login]**

**Step 2:** Click **"Add New Project"**

> 📸 **[IMAGE: Vercel dashboard with "Add New Project" button]**

**Step 3:** Import your repository.
- Your GitHub repos will be listed
- Click **"Import"** next to your project repo

> 📸 **[IMAGE: Vercel "Import Git Repository" — project listed with Import button]**

**Step 4:** Configure the project:

| Setting | What to enter |
|---------|--------------|
| **Project Name** | `your-project` |
| **Framework Preset** | Auto-detected (Vite or Create React App) |
| **Root Directory** | `frontend` ← Same as Render — your React app is in a subfolder |
| **Build Command** | Leave default (`npm run build`) |
| **Output Directory** | Leave default |

> 📸 **[IMAGE: Vercel project config — Root Directory field set to "frontend", framework auto-detected]**

**Step 5:** Add environment variables.

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://your-project-backend.onrender.com` |

> 📸 **[IMAGE: Vercel environment variables section with REACT_APP_API_URL set to the Render URL]**

**Step 6:** Click **"Deploy"**.

Vercel builds and deploys. Usually takes 1–3 minutes.

> 📸 **[IMAGE: Vercel build log — npm install, npm run build running, then "Deployment complete"]**

**Step 7:** Your live URL appears:
`https://your-project.vercel.app`

> 📸 **[IMAGE: Vercel successful deployment screen — confetti animation, live URL shown prominently]**

---

## 8.4 — Update the Backend CORS Setting

Now that you have your real Vercel URL, update the `FRONTEND_URL` on Render:

1. In Render, go to your backend service
2. Click **"Environment"** in the left sidebar
3. Edit `FRONTEND_URL` — change it from the placeholder to your actual Vercel URL: `https://your-project.vercel.app`
4. Click **"Save Changes"**

Render will automatically redeploy with the updated value. Watch the "Events" tab to see when it's done.

> 📸 **[IMAGE: Render Environment tab — FRONTEND_URL being edited to the real Vercel URL]**

---

## 8.5 — The Full End-to-End Test

Open your Vercel URL in a browser. Ideally, use your phone — not your development machine — to simulate a real user.

Work through every feature in your app. The request chain should be:
1. Your phone loads the React app from Vercel's CDN
2. You interact with the UI
3. React sends an API request to Render (your backend)
4. Render processes it, calls Groq or MongoDB as needed
5. Render sends the response back
6. React displays the result

If this chain completes successfully — end to end — your app is deployed.

> 📸 **[IMAGE: Deployed app open on a mobile phone — working feature visible, demonstrating real deployment]**

---

## 8.6 — Auto-Deploy for Future Updates

From now on, every time you run:
```bash
git add .
git commit -m "your change"
git push
```

Both Vercel and Render detect the GitHub push and automatically redeploy. You never manually deploy again — just push code.

**If you change environment variables:**
- On Vercel: Settings → Environment Variables → Edit → Deployments → Redeploy
- On Render: Environment → Edit → Render auto-redeploys

---

---

# PHASE 9 — AI Tool Optimization
*How to extract 10x more value from the same tools.*

---

## 9.1 — The Right AI for the Right Job

Knowing which AI to use for which task is a force multiplier. Here's the complete guide:

| Task | Best Tool | Why |
|------|----------|-----|
| **Planning & architecture** | Claude | Best structured reasoning, most thorough |
| **Masterplan creation** | Claude | Anticipates edge cases, surfaces blind spots |
| **Backend code generation** | Claude | Logically rigorous, handles complex data flows |
| **Debugging errors** | Claude | Root cause analysis, not just syntax fixes |
| **Database schema design** | Claude | Thinks through relationships and edge cases |
| **Frontend UI generation** | Gemini | Produces visually polished layouts |
| **Animation & motion** | Gemini | Natural feel for visual timing and aesthetics |
| **Color + typography systems** | Gemini | Strong visual design sensibility |
| **Research & brainstorming** | ChatGPT | Wide knowledge, good at exploring ideas broadly |
| **Market research** | ChatGPT with browsing | Access to recent information |
| **Copywriting** | Claude or ChatGPT | Both strong; Claude more precise, GPT more fluid |
| **Marketing content** | ChatGPT | Natural tone, good at persuasion |
| **Documentation writing** | Claude | Clear, structured, technically precise |
| **Code review** | Claude | Identifies security issues, edge cases |

**For Antigravity specifically:**
- First message of a session: Claude (to set up architecture and context)
- UI generation: switch to Gemini
- Bug fixing: switch back to Claude
- Polish and animations: back to Gemini

---

## 9.2 — Advanced Prompting Patterns

Beyond the basic five-part prompt, these patterns unlock significantly better outputs:

**Pattern 1 — Show, Don't Tell (provide an example)**

Instead of describing what you want abstractly, show the AI an example of the output format you expect:

```
Build the API response handler. The response shape is:
{
  "success": true,
  "data": {
    "id": "abc123",
    "result": "processed content here",
    "metadata": { "processingTime": 1.2, "model": "llama3-70b" }
  },
  "error": null
}

On error, the shape is:
{
  "success": false,
  "data": null,
  "error": { "code": "GROQ_TIMEOUT", "message": "AI service timed out" }
}

Build the Express middleware that normalizes all responses to this shape.
```

**Pattern 2 — Constrain the Scope Explicitly**

Tell the AI exactly what it should and should not touch:

```
Update only the JournalPage component. Specifically:
- Change the textarea minimum height from 200px to 280px
- Add a word counter below the textarea (in addition to the existing character counter)

Do NOT change:
- The Analyze button
- The AI response panel
- The page layout or spacing
- Any Framer Motion animations

Show only the changed lines with surrounding context (not the full file).
```

**Pattern 3 — Chain of Reasoning**

For complex backend logic, ask the AI to reason first before generating code:

```
I need to build a recommendation algorithm for [YOUR APP].

First, reason through: what are the 3-4 different approaches I could take? 
For each, what are the pros and cons given my constraints (free tier, 
MongoDB, Groq API)?

After reasoning, recommend the best approach and then implement it.
```

**Pattern 4 — Rubber Duck Debugging**

When something doesn't work and you don't know why:

```
I'm debugging a problem. Help me think through it systematically.

SYMPTOM: [exactly what the user sees / what the error says]
EXPECTED: [what should happen]
WHAT I'VE TRIED: [list what you've already checked]

Here are the relevant files:
[paste the files involved]

First, identify the 3 most likely root causes in order of probability.
Then, for each: tell me how to verify if that's the cause.
Only then, suggest fixes.
```

**Pattern 5 — The Second Opinion**

After generating complex code with one model, paste it to another for review:

```
Review this code for: correctness, security issues, performance problems, 
and missing edge cases.

[paste the code]

Be specific about any issues found — quote the exact line and explain 
why it's a problem and how to fix it.
```

---

## 9.3 — The 6 Universal Prompt Templates

**Template 1 — Build a UI Component:**
```
You are a senior React developer building [APP NAME].
Design system: [COLORS, FONT, AESTHETIC]. Stack: Tailwind CSS + Framer Motion.

Build [COMPONENT NAME]. It should:
- Display: [describe what the user sees]
- Accept props: [propName: type — description, ...]
- States: default / hover / active / loading / error / empty
- Animations: [describe each]

Rules: Tailwind only (no inline styles), Framer Motion for animations,
export as named export.

Show complete file. Do not truncate.
```

**Template 2 — Build a Backend Endpoint:**
```
Create [METHOD] [/path] endpoint in Express.js for [APP NAME].

Receives: [request body or params shape]
Logic:
  1. Validate: [what to check]
  2. Process: [step by step]
  3. [Call external service if needed]
  4. [Save to database if needed]
Returns: [success response shape]
Errors: [case → status code → message for each]

Must: try/catch everything, log errors, validate inputs first.
Show the complete route handler.
```

**Template 3 — Connect Data to UI:**
```
Update [COMPONENT] to fetch and display real data from the backend.

Endpoint: [METHOD] [URL] returns: [response shape]
Fetch when: [on mount / on event]

Add states: isLoading (bool), data ([type]), error (string|null)
Loading UI: [describe]
Empty UI: [describe]  
Error UI: [describe]
Success UI: replace hardcoded data with real data

Show the updated component. Don't change anything not related to data fetching.
```

**Template 4 — Debug a Specific Error:**
```
Debug this error:
[paste the exact error message and stack trace]

Context: [describe what the user did that triggered this]
Expected: [describe what should happen]

Relevant code:
[paste the file(s) involved]

Diagnose the root cause. Show the fix with an explanation of why 
the error was happening.
```

**Template 5 — Add a Feature:**
```
Add [FEATURE NAME] to [COMPONENT / FILE].

Current behavior: [describe what exists now]
New behavior: [describe the new behavior step by step]

Constraints:
- Don't break: [list what must keep working]
- Style must match: [describe existing design system]
- Performance: [any concerns — debounce, lazy load, etc.]

Show the updated code.
```

**Template 6 — Optimize / Refactor:**
```
Improve [FILE/COMPONENT] for [performance / readability / security].

Current issues:
- [specific issue you've noticed]
- [another issue]

Constraints: don't change the visual output or user behavior — 
only improve the implementation.

Show the refactored version with comments explaining the key changes.
```

---

## 9.4 — How to Use the Master SKILL.md

The `SKILL.md` attached to this guide contains 9 expert-level modules. Each is a production-quality, battle-tested prompting framework. Using them is straightforward:

1. Open `SKILL.md`
2. Find the relevant module
3. Copy it into Claude or the AI of your choice
4. Fill in every `[BRACKETED PLACEHOLDER]` with your project's specifics
5. Save the output

**When to use which module:**

The best use of SKILL.md is **before** you start building — run Module 0 (the Orchestrator) with your project details to generate a complete technical specification. This spec then informs every prompt you write in Antigravity.

During the build, pull individual modules as needed: Module 6 when you need an animation system, Module 7 when you need a responsive layout plan, Module 9 before you ship.

---

---

# PHASE 10 — Quality and Polish
*The gap between "it works" and "it's impressive."*

---

## 10.1 — What Quality Actually Means

At companies with high standards, "done" doesn't mean "it runs." It means:
- It works correctly in all scenarios, not just the happy path
- It fails gracefully when things go wrong
- It feels intentional — nothing looks accidental
- It's secure
- It's fast enough that it doesn't frustrate users

You don't need to reach company standards for a student project or hackathon. But you should aim to have no obviously broken things — no blank pages, no cryptic error messages, no buttons that do nothing, no layouts that fall apart on phone.

---

## 10.2 — The Four Layers of Quality

**Layer 1 — Functional completeness:**
Every user-facing feature actually works, end to end. Not "works on my machine" — works on a deployed URL opened on a different device.

**Layer 2 — Edge case handling:**
- Empty state: what does the user see before any data exists?
- Error state: what does the user see when an API call fails?
- Loading state: what does the user see while waiting?
- Input validation: what happens when they submit a blank form? An invalid value?

**Layer 3 — Visual consistency:**
- Does the spacing feel systematic (not random)?
- Do colors, fonts, and sizes feel cohesive?
- Do interactive elements give visual feedback when used?
- Does it look reasonable on a phone?

**Layer 4 — Performance basics:**
- Does the first page load in under 4 seconds on a normal connection?
- Are images reasonably sized (compress at [squoosh.app](https://squoosh.app))?
- Do API calls have timeouts so they don't hang forever?

---

## 10.3 — The Pre-Ship Checklist

Run through this before every hackathon demo, school submission, or sharing with anyone.

**Functional:**
- [ ] Main feature works end-to-end (not just locally — on the deployed URL)
- [ ] All navigation links work
- [ ] Forms validate inputs before submitting
- [ ] Loading states show during API calls
- [ ] Error states show when API calls fail
- [ ] Empty states show before data exists
- [ ] No browser console errors (open DevTools → Console)

**Visual:**
- [ ] Layout looks correct on desktop (1280px width)
- [ ] Layout looks correct on mobile (375px width — resize your browser)
- [ ] No placeholder text ("Lorem ipsum" or "[INSERT TEXT]") remaining
- [ ] Animations don't look broken or janky
- [ ] No oversized or broken images

**Security:**
- [ ] `.env` files are NOT on GitHub (check your repo manually)
- [ ] API keys are not visible in browser DevTools (open Console, search for `gsk_`)
- [ ] Backend validates all incoming request data

**Performance:**
- [ ] First page loads in under 4 seconds on mobile connection (test in incognito)
- [ ] Backend responds within 15 seconds (Groq is fast — if slower, check logs)

**Demo prep:**
- [ ] Have realistic, presentable data pre-loaded
- [ ] Backend is warmed up (hit it once before the demo)
- [ ] Vercel URL is bookmarked for instant access
- [ ] Have a screen recording as backup if live demo fails

---

## 10.4 — Run the SKILL.md QA Audit

For the most thorough pre-launch review, use Module 9 from your `SKILL.md` with Claude:

```
[Paste Module 9 from SKILL.md here]

Review this application:
- App name: [YOUR APP NAME]
- Live frontend URL: [your Vercel URL]
- Backend URL: [your Render URL]
- Tech stack: React + Tailwind + Framer Motion (frontend), 
  Node.js + Express + MongoDB + Groq (backend)
- Features: [list your main features]

Audit for: Performance, Accessibility, SEO, Security, Mobile, 
Browser compatibility. Prioritize by severity. Include specific 
fix instructions for each issue.
```

---

---

# PHASE 11 — The Startup and Hackathon Playbook
*How to turn this workflow into something competitive.*

---

## 11.1 — The 48-Hour Hackathon Schedule

This is how a senior engineer would allocate time if they had 48 hours and this workflow:

| Hours | Activity | Output |
|-------|---------|--------|
| 0–1 | Idea pressure test + Masterplan with Claude | `MASTERPLAN.md` |
| 1–2 | SKILL.md Module 0 → Full technical spec | `TECHNICAL-SPEC.md` |
| 2–3 | Project scaffold + design system defined | Folder structure, colors, fonts |
| 3–7 | All frontend pages built (Gemini) | 3–4 pages with real UI |
| 7–10 | All frontend animations added (Gemini) | Polished, animated UI |
| 10–13 | Full backend built + tested locally (Claude) | Working API |
| 13–15 | Frontend connected to backend | Real data flowing |
| 15–16 | `.env`, `.gitignore`, Git push | Code on GitHub |
| 16–18 | Deploy Render + Vercel | Live URL |
| 18–21 | End-to-end testing, bug fixes | Stable deployed app |
| 21–24 | Edge cases, empty states, error handling | Polished UX |
| 24–30 | Mobile responsiveness fixes | Works on all devices |
| 30–36 | Demo flow prep: data, narrative, practice pitch | Confident presentation |
| 36–44 | Buffer — unexpected issues, sleep, refine | Headspace |
| 44–48 | Final QA, backup recording, ready to present | Ship-ready |

---

## 11.2 — What Hackathon Judges Actually Evaluate

Having observed and participated in hackathon judging, here is what actually determines winners:

**Impact clarity (30%):** Can you explain in one sentence what problem this solves and for whom? If judges can't remember your use case after 10 other presentations, you won't win. Make it specific and memorable.

**Demo quality (25%):** Your 3-minute demo is not a feature tour. It's a story. Open with the problem. Show the solution in action with real data. Close with the outcome. Never type live — have realistic data pre-filled.

**Technical execution (25%):** Does it actually work? Is there real data, real AI, real persistence? Judges have seen enough "mock data with a button that does nothing" to recognize it immediately.

**Polish (20%):** Smooth animations, consistent design, no broken layouts, no console errors open — these signal that you care about the product, not just the code.

**The 30-second rule:** In a room of 20 projects, judges have their phone out within 30 seconds if they're not engaged. Open your demo at your most impressive screen, not the login page.

---

## 11.3 — From Hackathon to Startup: The Next Steps

If your hackathon project gets traction, here's what makes it production-ready for real users:

**Authentication:** Add real user accounts with Supabase Auth or Clerk. Replace the hardcoded `userId: "user123"` with real user IDs.

**Rate limiting:** Add express-rate-limit to your backend to prevent abuse. Without this, anyone can flood your Groq quota or MongoDB with unlimited requests.

**Error monitoring:** Add Sentry (free tier) to both frontend and backend. You'll be notified of every crash in production without monitoring it manually.

**Input sanitization:** Add server-side sanitization to prevent injection attacks. The `express-validator` package handles this cleanly.

**Database indexes:** For any query you run frequently (finding entries by userId, sorting by date), add a MongoDB index. Makes queries 100x faster as data grows.

**Environment tiers:** Create separate development and production environments with separate databases and API keys. Changes in development never affect production users.

**Domain name:** Connect a real domain to your Vercel deployment (Vercel Settings → Domains). This makes it feel real.

**Analytics:** Add Posthog (free tier) to understand how users actually use your product. You'll be surprised by the gap between how you think users behave and how they actually behave.

---

## 11.4 — Multi-Domain Application Patterns

Depending on your project's domain, some patterns come up repeatedly. Here's how the standard stack adapts:

**For an AI SaaS product:**
The core loop is: user inputs something → your backend processes it with Groq → result is displayed and optionally saved. The key challenge is prompt engineering — the quality of your AI output is determined almost entirely by the quality of your system prompts and user message formatting. Invest heavily in this.

**For a data-heavy dashboard:**
Use Recharts or Chart.js on the frontend for visualizations. On the backend, do heavy data processing and aggregation in MongoDB using the aggregation pipeline (`$group`, `$match`, `$sort`) before sending results to the frontend — don't send raw data and process it in the browser.

**For a marketplace or two-sided platform:**
The complexity is in the data model — you have two types of users (buyers and sellers, or providers and consumers) and the matching logic between them. Spend extra time in the Masterplan phase mapping every user flow for both sides before building anything.

**For a real-time application (chat, live updates):**
Add Socket.io to your Express backend and the corresponding client library to your React app. This enables real-time bidirectional communication instead of polling. Supabase's Realtime subscriptions are an alternative that requires less custom backend work.

**For a mobile-first app:**
Consider React Native with Expo instead of React for the frontend — it produces native iOS and Android apps from JavaScript code and the vibe coding workflow is nearly identical. The backend (Express + MongoDB + Groq) stays exactly the same.

**For a document/PDF workflow:**
The frontend lets users upload files. The backend uses the `multer` package to receive uploads, saves files to Cloudinary (cloud storage), then passes file content to Groq for analysis. Return the analysis and a link to the stored file.

---

---

# APPENDIX A — Common Errors and Their Fixes

*Organized by where the error occurs. Read the error message first — it usually tells you exactly what's wrong.*

---

## Backend Errors

**`Error: Cannot find module 'X'`**
You're importing a package that isn't installed. Run `npm install X` in the `backend/` folder. This happens after generating code that references packages — always run `npm install` after generating a new backend.

---

**`MongoServerSelectionError: Could not connect to any servers`**
Three causes, in order of likelihood:
1. Your `.env` has a typo in `MONGODB_URI` — copy it again from Atlas
2. You didn't replace `<password>` in the URI with the actual password
3. MongoDB Network Access doesn't have `0.0.0.0/0` — add it in Atlas Network Access settings

---

**`GROQ_API_KEY` is undefined or Groq returns 401:**
Your API key isn't being loaded. Check:
- Does `backend/.env` actually exist in the backend folder (not the root)?
- Is `require('dotenv').config()` or `import 'dotenv/config'` the very first line of `server.js`?
- Is the key in `.env` correct? (No quotes, no trailing spaces, no newline)

Add this debugging line temporarily at the top of server.js:
```javascript
console.log('Key loaded:', !!process.env.GROQ_API_KEY);
```

---

**`SyntaxError: Unexpected token` when parsing Groq response:**
Groq returned conversational text instead of JSON. The model didn't follow your JSON instruction.

Fix your system prompt — add explicitly:
```
Respond with ONLY the JSON object. No explanation before or after.
No markdown code fences. No "Here is the JSON:" preamble.
Start your response with { and end with }.
```

---

**Port already in use:**
Another process is running on port 5000. Either kill it or use a different port:
```bash
# Find what's using port 5000 (Mac/Linux)
lsof -i :5000

# Kill it
kill -9 [the PID number]

# Or just change PORT in .env to 5001
```

---

## Frontend Errors

**`Access to XMLHttpRequest blocked by CORS policy`:**
Your frontend is calling your backend but the backend isn't allowing the request.

Check your `server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

Also: the `FRONTEND_URL` in your `.env` must exactly match where your React app runs — including `http://` vs `https://` and the port number.

---

**`Module not found: Can't resolve './components/X'`:**
File path is wrong or the file doesn't exist. React imports are case-sensitive. `Components/Button` and `components/Button` are different. Check the exact filename and folder name.

---

**Framer Motion animations not running:**
1. Is `framer-motion` in your `package.json` and installed? (`npm install framer-motion`)
2. Is the element wrapped in `<motion.div>` (not just `<div>`)?
3. Does it have both `initial` and `animate` props? Both are required.
4. Is `AnimatePresence` wrapping conditional elements?

---

**React `useState` not updating immediately:**
State updates in React are asynchronous. You can't read a state value immediately after setting it:
```javascript
// WRONG — won't see the new value
setData(newValue);
console.log(data); // still old value

// RIGHT — use the value from the setState callback or wait for re-render
```
This is a fundamental React behavior, not a bug.

---

## Git Errors

**`error: failed to push some refs to origin`:**
GitHub has commits you don't have locally (usually from creating a README on GitHub). Fix:
```bash
git pull origin main --rebase
git push origin main
```

---

**`.env` file appeared in your GitHub repository:**
Do this immediately:
```bash
# Remove from Git tracking (keeps file on your computer)
git rm --cached backend/.env
git rm --cached frontend/.env

git commit -m "Remove .env files accidentally committed"
git push
```

Then: **regenerate all API keys immediately.** Consider any key that was in the committed `.env` compromised. Create new keys in Groq and MongoDB and update your `.env` and deployment environment variables.

---

## Deployment Errors

**Render build fails — `Cannot find package.json`:**
Your Root Directory is wrong. In Render service settings, it should be set to `backend` (not blank, not `./backend`).

---

**Vercel build fails — `react-scripts not found`:**
Your Root Directory on Vercel isn't set to `frontend`. Set it explicitly.

---

**Deployed app shows blank page:**
Open the browser console (F12 → Console). Usually a JavaScript error is shown. Most common cause: an environment variable is missing on Vercel. Go to Vercel Settings → Environment Variables, add the missing variable, then Redeploy.

---

**API calls fail on deployed app:**
The deployed frontend is calling `localhost:5000` instead of your Render URL. Check Vercel's environment variables — `REACT_APP_API_URL` must be set to your Render backend URL, and the app must have been redeployed after that variable was added.

---

---

# APPENDIX B — What You Now Know

By working through this guide and building a project, you've encountered concepts that are typically spread across a full CS curriculum's worth of courses:

**Systems thinking:** How frontend, backend, and database layers interact and why they're separated this way.

**Frontend engineering:** React component architecture, state management with hooks, routing, HTTP requests with Axios, animations with Framer Motion, responsive design with Tailwind.

**Backend engineering:** Server setup with Express, REST API design principles, middleware, input validation, error handling, environment-based configuration.

**Database fundamentals:** Document-based storage, schema design, relationships between data, cloud hosting, connection management.

**AI integration:** API-based AI inference, prompt engineering for structured outputs, handling AI responses, model selection trade-offs.

**Security fundamentals:** Environment variables, secret management, `.gitignore`, CORS, input validation, why client-side security alone is never sufficient.

**Version control:** Git workflow, commit discipline, branching concepts, remote repositories, the relationship between local and GitHub.

**Deployment and DevOps basics:** Build pipelines, environment management, CI/CD via GitHub integration, CDN vs origin server concepts, production vs development environments.

**Product thinking:** Idea pressure testing, user flow mapping, data modeling, feature prioritization, MVP scope discipline.

**Prompting and AI collaboration:** Model selection for tasks, context management, prompt architecture, iterative refinement, getting production-quality outputs from AI tools.

This is a real software engineer's working knowledge. You built your way to it in days instead of years.

---

## Attached Resources

| File | What it contains | When to use it |
|------|-----------------|---------------|
| `SKILL.md` | Master Vibe Coding Skill — 9 expert prompt modules | Planning, design system, animations, data, QA |
| `MASTERPLAN.md` | Your project masterplan (you create this in Phase 1) | Reference throughout the build |
| `TECHNICAL-SPEC.md` | Full technical spec from SKILL.md Module 0 | Reference when building features |

---

*The Vibe Coding Playbook — Version 3.0*
*A universal guide for building anything with AI*
*Compatible with: Antigravity · Claude Opus · Gemini 2.5 Pro · ChatGPT · OpenAI Codex*
*For web apps, AI tools, SaaS products, startup MVPs, internal tools, and beyond*