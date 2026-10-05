# DigiGuru Website Rebuild Prompt for Claude

You are working inside the existing DigiGuru GitHub repository. You have GitHub access and should inspect the repository before changing anything.

Your job is to rebuild the DigiGuru public website as a premium, fully responsive, conversion focused storytelling experience.

Do not treat this as a cosmetic redesign of the current page. Treat it as a product positioning and frontend experience problem.

## 1. Business context

DigiGuru is a conversational sales systems company.

We help businesses connect attention to action by joining their marketing, website, conversations and business systems into one customer journey.

The core journey is:

ATTENTION → CONVERSATION → UNDERSTANDING → ACTION → CONTINUITY

In practical terms:

Meta / TikTok / Search / Organic / Website
→ a customer enters the business conversation
→ primarily through WhatsApp or another appropriate channel
→ a custom conversational Concierge understands the specific business
→ it answers questions, qualifies intent and guides the customer
→ it can move the customer toward a booking, order, quote, enquiry or other business action
→ useful data can flow into CRM, calendar, booking systems, catalogues and follow up workflows

The Concierge is not the product by itself.

The product is the connected conversational sales system around the business.

DigiGuru is NOT positioned as a conventional digital marketing agency, generic AI agency or chatbot vendor.

Marketing, content and paid ads can be part of the system, but the central problem DigiGuru solves is the gap between generating attention and actually converting that attention into a business outcome.

## 2. The website's job

When a business owner or decision maker lands on the website, they should understand within seconds:

1. The problem they currently have.
2. Where leads are being lost.
3. What DigiGuru builds to close that gap.
4. How the system works from first touch to business action.
5. What the experience feels like for their customer.
6. What kind of business outcomes the system can support.
7. Why DigiGuru is different from a normal agency or a generic chatbot.
8. What the next step is.

The visitor should not leave thinking:

"This is an agency that does websites, social media and ads."

They should leave thinking:

"These people understand what happens to my leads after the click, and they build the system that turns those conversations into customers."

## 3. Primary message

Use this as the positioning anchor:

"Your marketing gets attention. DigiGuru turns it into action."

Supporting idea:

"We connect your marketing, website, WhatsApp and business tools into one customer journey, with a custom Concierge that understands your business and moves conversations forward in real time."

Core line:

"Attract. Converse. Convert. Continue."

Supporting commercial thought:

"You can spend more to generate leads. We help you make more of the leads you already attract."

Do not overuse the phrase "AI" in headlines. AI can explain the mechanism, but the customer's business outcome is the story.

Do not position DigiGuru as selling technology for its own sake.

## 4. Storytelling model

The page should feel like a guided story, not a stack of unrelated sections.

Use this narrative arc:

ACT I — THE ATTENTION

Show the familiar world:
ads, social posts, search, website visits, referrals.

The business has done the hard work of getting someone interested.

ACT II — THE LEAK

Show what happens next in a realistic and visually obvious way:

Click → browse → message → wait → repeat yourself → uncertainty → disappear

Make the visitor recognize their own business here.

Do not shame them. Make the problem feel obvious.

ACT III — THE SHIFT

Introduce DigiGuru as the layer that changes the journey:

Attention → conversation → understanding → action

Show that the customer no longer has to figure everything out alone.

ACT IV — THE CONCIERGE

Bring the custom conversational Concierge to life through an interactive or animated conversation example.

The visitor should see that the Concierge can:

• understand the business
• answer real questions
• ask useful qualifying questions
• use business context
• recommend the next step
• check or trigger an action where integrated
• hand off to a human when needed

Do not create a fake general purpose chatbot demo that says generic things.

Create a business conversation that feels commercially real.

ACT V — THE CONNECTED SYSTEM

Visually explain the system behind the conversation.

Show the relationship between:

Traffic sources
→ Website / landing page
→ WhatsApp / conversation
→ Concierge
→ business knowledge
→ CRM
→ calendar / booking
→ catalogue / products
→ follow up
→ human team

The exact integrations will differ by business. Make that flexibility explicit.

ACT VI — THE BUSINESS IMPACT

Help the visitor visualize what changes:

Before:

slow replies
unanswered questions
leads sitting in phones
manual qualification
repeated questions
missed bookings
lost enquiries
unclear follow up

After:

faster response
structured conversations
better lead qualification
clear next steps
appointments booked
orders initiated
quotes requested
CRM updated
human handoffs with context
follow up that does not depend on memory

Avoid unsupported numerical promises.

Use qualitative outcomes unless a case study has a verified metric.

ACT VII — PROOF

Use the real DigiGuru work as proof of the model.

Current examples:

Noka Foods
Food / commerce
Paid social and TikTok attention → WhatsApp ordering conversation → product questions → order

Eish Accessories
Services
Lead from Meta / Facebook / LinkedIn → WhatsApp → qualification → structured follow up

Lavington Green Dental
Healthcare
Website / social discovery → questions → WhatsApp → appointment intent → patient continuity

These are examples of different business journeys using the same underlying principle.

Do not invent results.
Do not fabricate testimonials.
Do not claim measured conversion improvements unless they are explicitly provided in the repository.

ACT VIII — THE INVITATION

End with a strong, low friction CTA.

Primary CTA:
"Start a conversation on WhatsApp"

The WhatsApp number must remain configurable and intentionally blank until the owner supplies it.

Do not invent a phone number.

Create a single configuration point such as:

src/config/contact.ts

with:

export const WHATSAPP_NUMBER = ""

Build the CTA system so the number can be populated later without hunting through components.

If the number is blank during development, keep the CTA visually present but prevent a broken outbound link. Show a subtle disabled state or safe fallback rather than a fake number.

## 5. Important design direction

The current prototype looks like a PDF pasted into a browser. Replace that visual language completely.

The result should feel like a modern, art directed product website designed by a strong senior web designer and implemented by a strong frontend engineer.

Do not make it look like:

• a generic SaaS landing page
• a generic digital agency
• a startup template
• a slide deck
• a PDF
• a grid of rounded cards with the same shadow
• a page made entirely from centered text blocks
• an AI generated purple gradient website
• an Inter + purple + glassmorphism template

Avoid generic "AI slop" patterns.

Choose a distinctive visual system and commit to it.

Use typography as a major part of the identity.

Prefer a distinctive pairing such as:

Display: Bricolage Grotesque, Instrument Serif or another strong editorial display face
Body/UI: Manrope, Geist or another clean highly readable sans serif

Do not use a default system font stack as the primary visual identity.

The visual identity should feel:

confident
commercial
intelligent
human
editorial
modern
slightly unconventional
high trust

It should communicate technology without looking like a technology brochure.

## 6. Visual storytelling requirements

Use composition, not just cards, to tell the story.

Consider:

• large editorial typography
• asymmetrical layouts
• oversized journey diagrams
• edge to edge sections
• horizontal transitions
• animated connectors
• flowing conversation bubbles
• layered interface mockups
• subtle grid or data textures
• carefully controlled negative space
• scroll based reveals
• sticky storytelling moments
• visual tension between "before" and "after"

Motion should explain the system rather than exist as decoration.

Examples:

• traffic sources converge into one conversation
• a lead card travels through the system
• a conversation gets enriched with business context
• a booking action appears after qualification
• CRM/calendar/catalogue nodes connect to the Concierge
• before/after journey changes as the user scrolls

Use motion sparingly and intentionally.

Prefer performant CSS and lightweight Motion animations.

Respect prefers-reduced-motion.

## 7. Recommended page structure

Build a single exceptional homepage first.

Suggested structure:

01. Sticky navigation

Logo / DigiGuru
Links:
The problem
The system
How it works
Examples
CTA

02. Hero

Large statement:
"Your marketing gets attention. DigiGuru turns it into action."

Supporting copy.

A visual journey should already be visible beside or beneath the headline.

The visual should clearly communicate:
Traffic → Conversation → Concierge → Action

03. The leak

Headline about the gap between lead generation and conversion.

Show an intentionally visual "leaky journey".

Example:
Ad → click → website → WhatsApp → wait → no reply → lead gone

Use animated transitions and interaction where appropriate.

04. The shift

Show:

"What changes when the conversation becomes part of the sales system?"

Compare disconnected and connected customer journeys.

05. The Concierge

This is the emotional centre of the site.

Show a realistic conversational interface.

Make it interactive.

The user should be able to click suggested replies and see the conversation progress.

Demonstrate a real use case such as:

Customer: "I need something for next Saturday. What do you recommend?"

Concierge: asks useful questions

Customer: provides context

Concierge: narrows options

Concierge: moves toward availability / booking / enquiry

Do not make every response generic.

06. What the Concierge knows

Visually show:

Business knowledge
products
services
pricing logic
FAQs
policies
availability
customer context

Then show the action layer:

calendar
CRM
catalogue
booking
follow up
human handoff

07. The system architecture

A large visual map of the DigiGuru system.

Do not use a boring technical architecture diagram.

Make it understandable to a business owner.

The visitor should be able to look at the diagram and instantly understand:

"This sits between my marketing and my business operations."

08. Business impact

Use a visual before/after system.

Before = friction
After = momentum

Include qualitative outcomes only unless verified data exists.

09. How DigiGuru works

Use a concise 5-step process:

Map the business
Map the conversation
Build the system
Test real scenarios
Launch and improve

This section should make DigiGuru feel thoughtful and operational, not like a black box.

10. Real examples

Use Noka Foods, Eish Accessories and Lavington Green Dental.

Each example should answer:

What kind of business is this?
Where was the friction?
What part of the journey did DigiGuru improve?
What does the new journey look like?

Use mini journey diagrams instead of just paragraph descriptions.

11. What DigiGuru is / is not

Optional but valuable.

DigiGuru IS:
A conversational sales system built around how your business actually sells.

DigiGuru IS NOT:
Just another chatbot.
Just another ad campaign.
Just another agency dashboard.

12. Final CTA

Large statement such as:

"You are already generating attention. Let's build what happens next."

Primary CTA:
"Start a conversation on WhatsApp"

Secondary CTA may be email or "See how it works".

13. Footer

Minimal.

## 8. UX principles

Think like a conversion focused web designer, not only a developer.

Every section must answer one question in the visitor's mind.

The sequence should feel inevitable.

Do not make the user work to understand what DigiGuru does.

Use clear hierarchy.

Use visual rhythm.

Keep copy concise enough to scan.

Make interactive elements obvious.

On mobile, the story must remain intact rather than becoming a long stack of desktop cards.

Design mobile as a first class experience.

The mobile version should preserve:

• hierarchy
• story
• motion
• diagrams
• CTA visibility
• readability

Do not simply shrink the desktop layout.

## 9. Accessibility

Implement:

• semantic HTML
• visible keyboard focus
• sufficient contrast
• accessible button labels
• meaningful alt text
• reduced motion support
• correct heading hierarchy
• touch friendly controls
• no interaction that depends only on hover

## 10. Performance

The site must feel fast.

Avoid unnecessary libraries.

Do not add heavy video backgrounds unless assets already exist and the benefit clearly justifies them.

Prefer:

CSS animation
SVG
lightweight image assets
compressed media
lazy loading where appropriate
modern image formats

Do not sacrifice performance for visual effects.

## 11. Technical direction

First inspect the repository and determine the current stack.

If the existing implementation is a simple static HTML/CSS/JS prototype and a clean rebuild will materially improve maintainability, migrate it to:

React
TypeScript
Vite
Tailwind CSS
Motion for React
Lucide React

Use reusable components.

Suggested structure:

src/
  components/
    Navigation.tsx
    Hero.tsx
    LeakSection.tsx
    Journey.tsx
    ConciergeDemo.tsx
    KnowledgeLayer.tsx
    SystemArchitecture.tsx
    Impact.tsx
    Process.tsx
    CaseStudies.tsx
    FinalCTA.tsx
    Footer.tsx
  data/
    caseStudies.ts
    conversationDemo.ts
  config/
    contact.ts
  styles/
    tokens.css
  App.tsx
  main.tsx
public/
  assets/
docs/
  DigiGuru_Company_Brief.md
  WEBSITE_STORY.md
README.md
AGENTS.md

Adapt this structure to the repository if a better existing architecture already exists.
Do not create unnecessary complexity.

## 12. Content model

Centralize important content rather than scattering hardcoded strings across components.

Create structured data for:

• case studies
• conversation demo messages
• journey steps
• system nodes
• CTA configuration

This makes future updates easy.

## 13. Brand/content rules

Use the business language carefully.

Preferred terms:

Conversational sales system
Conversational Concierge
Customer journey
Lead conversion
Business context
Connected systems
Human handoff

Avoid excessive jargon such as:

omnichannel orchestration
hyperautomation
agentic transformation
AI powered growth engine
revolutionary
next generation

The site should sound like a smart commercial operator explaining a business problem clearly.

Do not make unsupported performance claims.

Do not invent customer testimonials.

Do not invent logos.

Do not invent integrations that do not exist.

When an integration is illustrative, label it appropriately.

## 14. Interaction quality

At minimum implement:

• sticky navigation
• smooth section transitions
• scroll reveal animations
• interactive Concierge conversation
• interactive or animated system diagram
• functional navigation anchors
• WhatsApp CTA architecture with configurable number
• mobile navigation
• hover/focus states
• reduced-motion alternative

The interaction model should make the website feel alive.

## 15. Before/after visualization

This is important.

Create at least one section where the visitor can visually compare:

BEFORE

Lead arrives
→ business is busy
→ customer asks question
→ response delayed
→ context lost
→ lead disappears

AFTER

Lead arrives
→ conversation starts instantly
→ Concierge understands intent
→ useful question is asked
→ correct information is provided
→ booking / order / enquiry is initiated
→ CRM / calendar / team receives context

The visitor should understand this without reading a large paragraph.

## 16. Design exploration before coding

Before writing the final frontend, briefly reason through three possible art directions internally:

A. editorial / premium
B. product interface / operational
C. bold conversational / human

Choose the combination that best fits DigiGuru.

The chosen direction should feel distinctive rather than visually average.

Do not copy any reference site literally.

Use inspiration from strong conversational product sites such as:

Intercom
Podium
Respond.io
SleekFlow
Smith.ai
Manychat
Wati
HighLevel
Qualified
Drift / Salesloft

Borrow principles of clarity, proof, product visualization, real conversations and outcome driven storytelling — not branding, copy or layouts.

## 17. Important anti-slop rules

Never use:

• giant centered hero + 3 identical cards as the default page structure
• purple-blue gradients as a substitute for brand direction
• repeated rounded rectangles everywhere
• generic stock illustrations
• meaningless abstract blobs
• excessive glassmorphism
• random gradient text
• giant "AI" headings with no commercial meaning
• fake testimonials
• fake statistics
• fake logos
• copied slogans from competitors
• decorative animation that does not communicate anything

Every visual element should either:

1. explain the business problem,
2. explain the DigiGuru system,
3. show the customer experience,
4. show business impact,
5. establish trust, or
6. guide the user toward action.

## 18. SEO and metadata

Include:

Title:
DigiGuru — Conversational Sales Systems

Description:
DigiGuru builds conversational sales systems that connect marketing, websites, WhatsApp and business tools to turn attention into action.

Add Open Graph metadata.
Add semantic headings.
Add a clean canonical URL placeholder.

Do not overdo SEO copy.

## 19. QA requirement

Do not stop after generating code.

Run the app.

Inspect the page at desktop and mobile widths.

Check for:

• broken layout
• horizontal scrolling
• overflowing text
• missing assets
• console errors
• broken navigation
• nonfunctional interaction
• poor mobile hierarchy
• inaccessible buttons
• poor contrast
• awkward animation
• excessive loading time

Fix all obvious issues before considering the work complete.

## 20. GitHub workflow

You already have access to the repository.

First inspect:

• repository structure
• existing branch
• package.json
• current assets
• README
• any brand files
• current deployment assumptions

Then create a clean implementation.

Do not delete useful existing assets just because the current frontend is poor.

Create a branch if appropriate, make the implementation, test it, then commit the finished result.

Commit message:
"Rebuild DigiGuru website around conversational sales systems"

Also update README.md with:

• what DigiGuru is
• how to run the site locally
• where to configure WhatsApp number
• where content lives
• deployment notes

Create AGENTS.md with the core DigiGuru design and content rules so future AI coding sessions preserve the direction.

## 21. Final acceptance test

Do not tell me the task is complete simply because files were created.

The website is complete only if a new visitor can answer these questions after roughly 30 seconds:

1. What does DigiGuru do?
2. What problem does DigiGuru solve?
3. Where does DigiGuru fit in my customer journey?
4. What is the Concierge?
5. What can the system actually do?
6. How could this help my business?
7. What should I do next?

The final site must feel like one coherent story from the first scroll to the final CTA.

Start by inspecting the repository. Then plan the information architecture and visual direction. Then implement the site. Then test it at desktop and mobile widths. Then fix any issues you find. Then commit the final implementation.
