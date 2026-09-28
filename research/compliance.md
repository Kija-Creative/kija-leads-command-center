# Outreach guardrails, chain exclusions and review integrity

Synthesized 2026-09-28 from the compliance research topic and its fact check. All 89 claims were confirmed or corrected; corrected values are used below.

> **Not legal advice.** This is research to design guardrails for an internal tool. It is not a legal opinion. Where a rule turns on how a statute applies to Kija's own facts (above all Texas chapter 302 and anything involving text messages), ask a licensed attorney before relying on it.

Rules are written as MUST (the app enforces or blocks), SHOULD (the app warns) and PEOPLE (a human follows it). Each rule cites its source.

## 1. Email (CAN-SPAM)

CAN-SPAM covers cold B2B email: "The law makes no exception for business-to-business email." ([FTC compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)). It is an opt out law: a first email needs no consent, but every commercial email must meet these rules.

| # | Rule | Level | Source wording |
|---|---|---|---|
| E1 | From, To, Reply-To and routing are accurate and identify Kija Creative | MUST | "must be accurate and identify the person or business who initiated the message" |
| E2 | Subject describes the content, for example "A homepage concept for {business}". Never "Re:", "Fwd:", fake follow ups, urgency, or anything implying Google or an existing relationship | MUST | "The subject line must accurately reflect the content of the message" |
| E3 | Identify the email as an ad, for example "This is a one-time marketing email from Kija Creative." | MUST | "you must disclose clearly and conspicuously that your message is an advertisement" |
| E4 | Include a valid postal address. Add `settings.contact.postalAddress` (street, USPS PO box or registered private mailbox) and block drafts while it is empty | MUST | "Your message must include your valid physical postal address" |
| E5 | Include an opt out line, for example "Reply 'no thanks' and we will not contact you again." No fee, no extra data, no step beyond a reply or one web page | MUST | "Your message must include a clear and conspicuous explanation of how the recipient can opt out"; "You can't charge a fee, require the recipient to give you any personally identifying information beyond an email address" |
| E6 | Opt outs are applied the same day via a suppression list (`data/suppression.json`: dedupe key, phone digits, email, channel, date, source) that ingest and the drafts view honor | MUST | "You must honor a recipient's opt-out request within 10 business days" |
| E7 | Any opt out mechanism keeps working at least 30 days after sending | MUST | "Any opt-out mechanism you offer must be able to process opt-out requests for at least 30 days after you send your message." |
| E8 | Never sell or transfer an opted out address | PEOPLE | FTC guide |
| E9 | Using an email tool does not move liability off Kija | PEOPLE | "you can't contract away your legal responsibility" |

Penalty (corrected): up to $53,088 per violating email. This is the January 2025 inflation adjustment ([FR 2025-01361](https://www.federalregister.gov/documents/2025/01/17/2025-01361/adjustments-to-civil-penalty-amounts)); the FTC said on September 15, 2026 that 2025 levels stay in effect for 2026. The guide's "Edited January 2024" note is stale.

## 2. Phone calls (federal)

**FTC Telemarketing Sales Rule.** "Most phone calls between a telemarketer and a business are exempt from the TSR." ([FTC](https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule)). Exempt B2B calls fall outside the TSR's Do Not Call scrub duty under 16 CFR 310.6(b)(7) (corrected: the FTC page's "purge numbers" sentence is about nondurable office supply sellers). Two limits:

- Calls to a business line that sell to an employee for personal use are not B2B.
- Since March 7, 2024, "The final rule announced today expands prohibitions against misrepresentations to business-to-business telemarketing" ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/03/ftc-implements-new-protections-businesses-against-telemarketing-fraud-affirms-protections-against-ai)). Current [16 CFR 310.6(b)(7)](https://www.law.cornell.edu/cfr/text/16/310.6) keeps B2B calls subject to 310.3(a)(2) and (a)(4). Cite the CFR for current law.

**FCC rules under the TCPA** ([47 CFR 64.1200](https://www.law.cornell.edu/cfr/text/47/64.1200)):

- Autodialer or artificial or prerecorded voice calls to a cell number need prior express consent, and prior express **written** consent when the call is telemarketing (64.1200(a)(1) and (a)(2)). There is no business line exception for mobiles.
- National Do Not Call protects "A residential telephone subscriber who has registered" (c)(2); residential calling hours are 8 a.m. to 9 p.m. local time (c)(1); these rules reach "telemarketing calls or text messages to wireless telephone numbers" (e).
- **The sole proprietor problem.** The FCC "will presume wireless subscribers who ask to be put on the national do-not-call list to be 'residential subscribers.'" ([FCC 03-153](https://docs.fcc.gov/public/attachments/FCC-03-153A1.pdf), para 36), even though "The national do-not-call rules will also not prohibit calls to businesses" (para 37). Many no-website businesses list the owner's personal cell on Google, so the business exemption protects little in practice.
- Autodialer definition: "a necessary feature of an autodialer ... is the capacity to use a random or sequential number generator" ([Facebook v. Duguid](https://www.supremecourt.gov/opinions/20pdf/19-511_p86b.pdf), April 1, 2021). A person dialing one number at a time is generally outside it. This does not help with prerecorded voice or with state laws.
- Revocation: consent may be revoked "in any reasonable manner"; replying "stop," "quit," "end," "revoke," "opt out," "cancel," or "unsubscribe" is per se reasonable; requests are processed "certainly within 10 business days" ([FCC 24-24](https://docs.fcc.gov/public/attachments/FCC-24-24A1.pdf)). The revoke-all piece was delayed; secondary sources report January 31, 2027 (the delay order itself was not opened).
- Damages: "$500 in damages for each such violation", up to three times for willful or knowing violations ([47 U.S.C. 227](https://www.law.cornell.edu/uscode/text/47/227)). The Do Not Call private action needs more than one call within 12 months.
- Courts can depart from FCC readings: "The Hobbs Act does not bind district courts in civil enforcement proceedings to an agency's interpretation of a statute." ([McLaughlin Chiropractic v. McKesson](https://www.supremecourt.gov/opinions/24pdf/23-1226_1a72.pdf), June 20, 2025). Conservative defaults are the better choice.

## 3. State telemarketing laws (summary)

| State | Restriction | Hours and frequency | Notes |
|---|---|---|---|
| Florida | Sales calls, texts or voicemails that involve "an automated system for the selection and dialing of telephone numbers or the playing of a recorded message" need prior express written consent (Fla. Stat. 501.059(8)(a)) | Florida Telemarketing Act 501.616(6): no calls before 8 a.m. or after 8 p.m.; no more than 3 in 24 hours on the same subject | "Telephonic sales call" includes "text message, or voicemail". "Consumer" ties to consumer goods or services, so pure B2B may fall outside (unsettled). After a STOP reply the sender has 15 days to stop (2023 amendment). The 501.604(10) B2B exemption (3 years plus 50% repeat sales, or resale or manufacturing) probably does not fit Kija. Florida licensing (501.605) was not researched |
| Oklahoma | Same structure: "selection or dialing" or a recorded message without prior express written consent (HB 3168, effective November 1, 2022) | 8 a.m. to 8 p.m.; no more than 3 in 24 hours | B2B exemption narrow: "at least fifty percent (50%) of its dollar volume consisting of repeat sales to existing businesses" after 3 years, or resale or manufacturing. $500 per violation, up to triple |
| Maryland | "an automated system for the selection or dialing of telephone numbers" or a recorded message without written consent (SB 90, effective January 1, 2024) | No calls 8 p.m. to 8 a.m.; no more than 3 in 24 hours | Excludes "certain business-to-business sales"; scope not checked |
| Washington | No commercial text to a Washington resident's cell "unless the subscriber has clearly and affirmatively consented in advance" (RCW 19.190.060 and .070). No equipment test, so manual texts count. No B2B exception. Automatic dialing and announcing devices banned for commercial solicitation (RCW 80.36.400) | Not reviewed | RCW 80.36.400 damages: greater of actual or $1,000 per violation |

## 4. Texas Business and Commerce Code chapter 302 (registration)

Source: [BC.302](https://tcss.legis.texas.gov/resources/BC/htm/BC.302.htm) (the document file behind statutes.capitol.texas.gov).

**It probably applies to Kija calling from Dallas, nationwide.** Reasons:

1. "'Telephone solicitation' means a call or other transmission, including a transmission of a text or graphic message or of an image" (302.001(7), amended by SB 140, effective September 1, 2025). No consumer-only limit; "Purchaser" is any person "solicited to become or becomes obligated for the purchase or rental of an item" (302.001(3)).
2. "A seller may not make a telephone solicitation from a location in this state or to a purchaser located in this state unless the seller holds a registration certificate for the business location from which the telephone solicitation is made." (302.101). A Dallas location triggers it whatever state the prospect is in.
3. The only commercial exemption covers a purchaser that intends to "resell the item purchased" or use it in manufacturing (302.056). A website does not fit.
4. "a person who claims an exemption from the application of this chapter has the burden of proving the exemption" (302.051(a)). The Secretary of State "does not decide if an individual or entity must register" ([SOS FAQ](https://www.sos.state.tx.us/statdoc/faqs3400.shtml)).

**The plausible exemption, 302.059(1):** the seller does not intend to complete a sale on the call, "does not make a major sales presentation during the telephone solicitation but arranges for a major sales presentation to be made face-to-face at a later meeting between the salesperson and the purchaser", and does not send someone to collect payment. Kija's model (call, book a walkthrough, never close on the call) fits the spirit. **Open question for an attorney: does a video or screen share walkthrough count as face-to-face?** An in-person meeting clearly does.

Other exemptions do not help: existing customers after 2 years under the same name (302.058) covers only past clients; isolated transactions (302.061) exclude "a pattern of repeated transactions", and a weekly program is a pattern. The SOS consent-texting relief covers only texts "with prior consent of the consumer" and is a litigation position, not statute.

If Kija registers: $200 filing fee (302.106), $10,000 security (302.107), one year term, renewable, one certificate per calling location. A registered seller may not claim to purchasers that it complies with the chapter (302.203). Exposure: civil penalty up to $5,000 per violation (302.302); knowing registration violations are a Class A misdemeanor (302.251); violations are DTPA deceptive acts (302.303).

Texas chapters 301 (consumer call hours 9 a.m. to 9 p.m., Sunday from noon) and 304 (Texas no-call list, "personal, family, or household purposes") cover consumer goods and are probably not triggered by pure B2B sales. Chapter 301's hours make a sensible conservative default.

## 5. Outreach rules for the app and the people

### Calls

| # | Rule | Level | Basis |
|---|---|---|---|
| C1 | Dialed by a person only. No autodialer, no prerecorded or AI voice, no ringless voicemail drops. The `voicemail` draft is a script to read live | MUST (PEOPLE) | 64.1200(a); state autodialer laws; RCW 80.36.400 |
| C2 | Call window 9 a.m. to 8 p.m. in the business's local time, Monday to Saturday, never Sunday. Prefer the business's sourced open hours | MUST (app shows the local time and blocks outside the window) | Strictest of FCC (8 to 9), FL, OK, MD (8 to 8), TX 301 (9 to 9) |
| C3 | At most 1 attempt a day and 3 in total without a reply | MUST | FL, OK, MD 3 in 24 hours; TCPA more-than-one-call rule |
| C4 | Open with the caller's name, Kija Creative and the purpose. Accurate caller ID. Never claim to be with Google or imply an existing relationship. No misstatements about results | PEOPLE | TSR 310.3(a)(2), (a)(4) via 310.6(b)(7) |
| C5 | Add `phoneLineType` (`business`, `mobile`, `unknown`). For `mobile` and `unknown`, show "may be treated as residential; email first" | SHOULD | FCC 03-153 para 36 |
| C6 | Add `settings.compliance.texasRegistration`: `unknown`, `registered` (certificate number, expiry) or `exempt-confirmed` (attorney name, date). While `unknown`, show a banner on the call script and never close a sale on a call | MUST | Tex. Bus. and Com. Code 302.101, 302.059(1) |
| C7 | Any request to stop, in any words, suppresses every channel | MUST | FCC 24-24; CAN-SPAM |

### Texts

| # | Rule | Level | Basis |
|---|---|---|---|
| T1 | No cold texts. `followUpText` stays hidden unless `outreach.textConsent` is recorded (date, channel, what the owner said, for example "text me at this number") | MUST | RCW 19.190.060; FL, OK, MD; TX 302.001(7) |
| T2 | Never text a Washington area code or Washington address without recorded consent | MUST | RCW 19.190.070(1)(b) |
| T3 | With consent: send manually, one to one, name Kija Creative, include "Reply STOP to opt out" | PEOPLE | FCC 24-24; FL 501.059(10)(c) |
| T4 | Treat stop, quit, end, revoke, opt out, cancel, unsubscribe, or any clear request, as revocation for every channel | MUST | FCC 24-24 para 12 |

### Pitch copy

| # | Rule | Level | Basis |
|---|---|---|---|
| P1 | Keep the SPEC "if" and "about" ROI language; never promise results or state a revenue loss as fact | MUST | TSR misrepresentation ban; FTC Act |
| P2 | Never present fake or placeholder reviews that look real in a demo or pitch | MUST | 16 CFR Part 465 |
| P3 | Maps Platform AUP bars using the Services to "facilitate unsolicited mass email, promotions, advertisements, or other solicitations". Drafts only, one to one, human sent | MUST | [Maps AUP](https://cloud.google.com/maps-platform/terms/aup); SPEC rule 2 |

## 6. Demo concepts that use a business's name

Risk: Lanham Act 43(a) covers use of a name "likely to cause confusion, or to cause mistake, or to deceive as to the affiliation, connection, or association" or as to "sponsorship, or approval" ([15 U.S.C. 1125](https://www.law.cornell.edu/uscode/text/15/1125)). A private concept shown only to the owner has little confusion risk; the risk rises if it becomes public, looks official, or collects inquiries meant for the business. *Toyota v. Tabari* (9th Cir. 2010) asks whether the use "falsely suggested he was sponsored or endorsed by the trademark holder"; a disclaimer, "While not required, ... is relevant"; and "a location modifier following a trademark indicates that consumers can expect to find the brand's local subsidiary, franchise or affiliate" ([opinion](https://cdn.ca9.uscourts.gov/datastore/opinions/2010/07/08/07-55344.pdf)). Registering a domain on someone's mark with "a bad faith intent to profit from that mark" is cyberpiracy (1125(d)). Photos are protected "the moment it is created and fixed in a tangible form" ([Copyright Office](https://www.copyright.gov/help/faq/faq-general.html)). Also: Maps Platform Terms 3.2.3(c), "Customer will not create content based on Google Maps Content" (see `places-api.md`).

| # | Rule | Level |
|---|---|---|
| D1 | Keep the SPEC protections: local files, `noindex, nofollow`, visible concept ribbon, forms that send nothing, no invented facts, sharing only after `demo.shareApproved` | MUST |
| D2 | Never publish a demo to a public URL before a signed agreement. Shared links are password protected or expiring. Google: "To keep a web page out of Google, block indexing with noindex or password-protect the page." noindex only works if robots.txt does not block the page | MUST |
| D3 | Never register, park or reserve a domain containing the prospect's name or a close variant before a signed agreement | PEOPLE |
| D4 | Put the disclaimer in the exported share file, not only the ribbon: "Concept created by Kija Creative to show {business} an idea. Not the official website, not affiliated with or endorsed by {business}." | MUST |
| D5 | Never copy logos, photos, menus, price lists or review text. Use neutral typography, generated or abstract visuals, and paraphrased `reviewThemes` only. Never build demo content from Places API data | MUST |
| D6 | Never use the owner's personal name or likeness | MUST |
| D7 | Delete on request, record it in history, expire share files after 30 days | MUST |
| D8 | Never show a demo to third parties (competitors, portfolio, social) without written consent | PEOPLE |

## 7. Chains and franchises

`research/chains-extra.json` holds 355 deduplicated names for `config/chains.json`. Parent portfolios were checked on company pages: [Neighborly](https://www.neighborlybrands.com/our-brands/), [Authority Brands](https://www.authoritybrands.com/our-brands/) (the brand is "Mosquito Squad Plus"), [Driven Brands](https://www.drivenbrands.com/about/), [Monro FY2024](https://www.sec.gov/Archives/edgar/data/876427/000119312524174676/d552031dars.pdf) (store count stale; use the latest 10-K), [Rollins](https://www.rollins.com/brands), [Regis](https://www.regiscorp.com/salon-brands), [Empower Brands](https://empowerfranchising.com/our-brands/superior-fence-rail/) and Bridgestone Retail Operations (corrected: "nearly 2,200" centers, Nashville headquarters, [page](https://www.bridgestoneamericas.com/content/bscorpcomm-sites/americas/en/corporation/subsidiaries-and-business-units/bridgestone-retail-operations.html)). The brands the fact checker found missing (for example Molly Maid, Junk King, The Cleaning Authority, Crane Pest Control, Magicuts, Merlins, Jan-Pro) were added. UK-only Neighborly brands and the Rollins UK brand "Safeguard" were left out because generic words like "Countrywide" and "Safeguard" would reject US independents. The remaining names come from the researcher's general knowledge and were not individually verified: spot check any match before rejecting a lead.

Matching notes for `isChain`:

- Match whole normalized names or normalized prefixes, not substrings. Watch generic names: Classic Collision, Premier Pools & Spas, Oil Changers, Garage Experts, Club Car Wash, Brake Check, City Looks, Style America, Groundworks, California Pools.
- Franchise locations add a city or owner suffix ("Mr. Rooter Plumbing of North Dallas"); a prefix match catches them.
- Private equity roll ups often keep local names and cannot be caught by a list. They almost always have websites, so the website check drops them.
- Lawn Doctor, Mosquito Hunters, Superior Fence & Rail and Pool Scouts are not HomeFront Brands; Superior Fence & Rail is Empower Brands.

**Do not auto exclude these network badges and host brands.** Independent owners trade under them. Warn instead that a network page may exist and check whether it is credible and owned:

- Auto networks: NAPA AutoCare Center, AAA Approved Auto Repair, Tire Pros, Point S, Bosch Car Service, ACDelco Professional Service Center, Goodyear independent dealers.
- Salon suite hosts: Sola Salon Studios, Phenix Salon Suites, MY SALON Suite, Salon Lofts, Image Studios, Salons by JC. A stylist inside a suite is independent; a profile for the suite location itself is a chain.
- HVAC and plumbing dealer programs: Carrier Factory Authorized Dealer, Lennox Premier Dealer, Trane Comfort Specialist, Ruud Pro Partner, Nexstar Network members.
- Roofing credentials: GAF Master Elite, Owens Corning Platinum Preferred, CertainTeed SELECT ShingleMaster. Never repeat a credential in a demo unless the lead record sources it.

## 8. Fake and manipulated review signals

**Context.** The FTC Consumer Reviews and Testimonials Rule (16 CFR Part 465) was announced August 14, 2024 and "went into effect on October 21, 2024" (corrected wording: "The Commission's Rule on the Use of Consumer Reviews and Testimonials, which went into effect on October 21, 2024"). It "prohibits reviews and testimonials that misrepresent whether a reviewer's experience was positive or negative, or whether the reviewer used the product or service at all", with "civil penalties of up to $53,088 per violation" (FTC warning letters, December 22, 2025). Incentives are allowed only "as long as there isn't an express or implied requirement that the reviews have to express a particular sentiment". Google is stricter: it bans "Reviews or ratings that have been paid for, directly or in kind", content "posted from multiple accounts by or at the request of one person", "unusual volumes or patterns of review contributions", conflict of interest reviews, and merchants who "Discourage or prohibit negative reviews, or selectively solicit positive reviews" ([policy](https://support.google.com/contributionpolicy/answer/7400114?hl=en)). Google "blocked or removed more than 240 million policy-violating reviews from 2024" and more than 12 million fake profiles ([Google blog](https://blog.google/products-and-platforms/products/maps/google-business-profiles-ai-fake-reviews/)).

**Why it matters.** A 4.9 built on fake reviews is not trust Kija can convert, and the pitch would republish it. The FTC's own caution: "Don't assume that, just by looking, you can spot the difference between a real review and a fake one." These are risk signals that lower `confidence` or move a lead to the queue. **Never mention them to the business as an accusation.** Record each check in `verification.checks`. Numeric thresholds are Kija heuristics, not sourced.

**Hard stops (reject or queue):**

1. Warning banner or review freeze: "Business Profile will display a warning to let consumers know that fake reviews were removed" ([GBP Help](https://support.google.com/business/answer/14114287?hl=en)).
2. Fake listing signs: keyword stuffed name ("Including unnecessary information in your business name isn't permitted", [guidelines](https://support.google.com/business/answer/3038177?hl=en)); virtual office or residential address for a claimed storefront; near identical profiles sharing a phone; a sudden unrelated category change ("a business that suddenly changes its category from 'cafe' to 'plumber'").
3. Reviews mentioning an incentive ("got 10% off for leaving this").

**Signals (two or more lower confidence one step; three or more send to the queue):**

4. Burst: "watch for a burst of reviews over a short period of time" ([FTC consumer advice](https://consumer.ftc.gov/articles/how-evaluate-online-reviews)). Heuristic: over a third of all reviews in one 30 day window with no visible cause.
5. Thin accounts: "If it seems that the reviewer has created an account just to write one review for one product, that review may be fake." Heuristic: over half of the 10 newest 5 star reviewers have 1 or 2 reviews, no photos, no Local Guide level.
6. Distribution: almost no 2 to 4 star reviews, or only 5s and 1s. Note "Some fake positive reviews give less than the highest possible rating in order to seem more believable."
7. Text: generic praise, repeated phrasing, similar lengths, services the business does not list, many reviews naming one staff member (possible quotas, which Google bans).
8. Reviewer geography far from the metro served.
9. Identical canned owner replies, or replies offering rewards.
10. Sharp mismatch with Yelp, Facebook or BBB, or a Yelp consumer alert.
11. Hundreds of reviews on a profile that looks months old.

**Positive signals:** reviewer photos of the real shop or work, steady flow over years, specific varied detail, a few critical reviews with calm replies, ratings that roughly agree across platforms.

**For Kija's own offer:** any review request feature must not gate (ask only happy customers), must not offer incentives (Google bans them), and must not suppress negatives.

## Open items

- Texas: attorney decision between the 302.059(1) exemption and registering.
- Florida commercial telephone seller licensing (501.605) not researched.
- Maryland B2B exemption scope and the Oklahoma cross-referenced definition not opened.
- FCC delay order for revoke-all not opened.
- Quoting Google review text on demos is a copyright and Google terms question that was not researched; the rule above (paraphrase only) avoids it.
