# ROI benchmarks: tickets, margins, rented leads and website prices

Synthesized 2026-09-28 from three research topics (tickets for auto and personal care, tickets for home services and contractors, rented lead costs and website prices) and their fact checks. The machine copy is `research/benchmarks.json`, in the SPEC `data/benchmarks.json` shape. Only confirmed or corrected claims are used.

## How the numbers were chosen

- **ROI model (SPEC):** jobs to break even = site price / (typical ticket x gross margin). An overstated ticket or margin flatters the pitch, so every choice below leans low.
- **Editor rule for typical tickets:** use a sourced average for the job a new customer most commonly buys. Where the researcher built a blended ticket from an assumed repair and replacement mix, the editor replaced it with the sourced single-job average, because the mix weights were Kija assumptions, not data. The larger job goes in `high` and in the notes as an override.
- **Editor rule for margins:** at or below the best measured figure. Published targets (ServiceTitan 50% to 55% HVAC, 55% to 65% garage door; PCA 50% painting) are never used as the typical and never described as an industry average.
- **Unverified values:** where no source exists, the value is a conservative estimate, its `sources` array is empty, and `notes` begins "Estimate, not verified:". The app must label these.
- **Margins assume a shop that pays staff.** Solo owner-operators keep far more of each extra job; use `roiOverrides.margin`.
- **Consumer cost guides:** HomeAdvisor pages say updated June 2026 but their titles say "[2025 Data]", so they are labelled 2025. HomeGuide pages are labelled by their own modified date. Both are consumer cost estimates, not contractor invoices: the UI should say "consumer cost estimate".
- **Rented leads:** Google LSA figures are vendor client averages of charged leads. Search Ads figures (LocaliQ) are a different product and run roughly 2x LSA in the same trade; they are labelled "Google Search Ads" and must not be pitched as LSA prices. Dollars are rounded to whole numbers in the JSON; exact values are in the source notes. `rentedLead` is null when no usable figure exists.

## Summary table

Gross per job = typical x margin, rounded.

| categoryKey | low | typical | high | unit | margin | gross per job | rented lead (per lead) | verified? |
|---|---|---|---|---|---|---|---|---|
| auto-repair | $250 | $500 | $750 | per repair order | 0.50 | $250 | $31 to $42 (search ads) | yes |
| auto-body-collision | $1,698 | $3,682 | $5,721 | per repairable collision claim | 0.40 | $1,473 | $56 (search ads) | yes |
| tire-shop | $118 | $305 | $1,002 | per customer visit | 0.27 | $82 | $21 to $29 (search ads) | yes |
| muffler-exhaust | $120 | $340 | $1,511 | per exhaust repair | 0.40 | $136 | null | yes (typical is low end) |
| diesel-truck-repair | $300 | $965 | $2,000 | per heavy-duty invoice | 0.35 | $338 | null | ticket yes, margin estimate |
| mobile-mechanic | $120 | $200 | $600 | per completed mobile job | 0.45 | $90 | null | ticket yes, margin estimate |
| auto-detailing | $95 | $144 | $390 | per detail | 0.35 | $50 | null | ticket yes, margin estimate |
| towing | $50 | $88 | $272 | per light-duty tow | 0.30 | $26 | null | ticket yes, margin estimate |
| barber | $35 | $40 | $45 | per haircut | 0.30 | $12 | $39 (search ads, industry) | yes |
| hair-salon | $35 | $89 | $200 | per service ticket | 0.35 | $31 | $39 (search ads, industry) | yes |
| nail-salon | $15 | $40 | $75 | per service visit | 0.35 | $14 | $39 (search ads, industry) | yes |
| tattoo | $80 | $150 | $1,200 | per session | 0.40 | $60 | null | yes, low confidence |
| pet-grooming | $79 | $79 | $136 | per full groom | 0.40 | $32 | $32 (search ads, industry) | yes |
| general | $40 | $150 | $500 | per job, derived | 0.40 | $60 | $53 to $54 (LSA) | ticket and margin estimate |
| hvac | $150 | $320 | $12,500 | per first job, repair typical | 0.34 | $109 | $51 to $80 (LSA) | yes |
| plumbing | $125 | $310 | $5,500 | per first job, service call typical | 0.34 | $105 | $57 to $75 (LSA) | yes |
| electrical | $141 | $280 | $4,000 | per first job, small job typical | 0.32 | $90 | $39 to $55 (LSA) | yes |
| septic | $292 | $428 | $8,500 | per first job, pumping typical | 0.35 | $150 | $59 (LSA stand-in) | ticket yes, margin estimate |
| garage-door | $155 | $265 | $3,500 | per first job, repair typical | 0.35 | $93 | $49 (LSA) | yes (margin is a broad proxy) |
| restoration | $1,383 | $3,500 | $18,000 | per job, water mitigation typical | 0.35 | $1,225 | $132 to $215 (LSA) | ticket yes, margin estimate |
| appliance-repair | $100 | $179 | $500 | per repair visit | 0.45 | $81 | $34 to $45 (LSA) | yes |
| pest-control | $108 | $172 | $2,500 | per first treatment | 0.45 | $77 | $64 (LSA, 2 sites) | yes |
| roofing | $395 | $1,173 | $16,000 | per first job, repair typical | 0.30 | $352 | $79 to $162 (LSA) | yes |
| concrete | $1,600 | $3,200 | $14,500 | per project, patio typical | 0.30 | $960 | null | yes |
| fencing | $304 | $2,600 | $12,000 | per project | 0.30 | $780 | $71 (LSA, low confidence) | yes |
| pools | $500 | $1,500 | $2,400 | per first year of service | 0.35 | $525 | $45 (search ads) | ticket yes, margin estimate |
| landscaping | $300 | $2,000 | $14,750 | per first year or one project | 0.25 | $500 | $37 to $59 (LSA) | yes |
| painting | $350 | $2,000 | $10,000 | per project | 0.35 | $700 | $33 to $46 (LSA) | yes |
| foundation-repair | $250 | $5,000 | $20,000 | per repair project | 0.35 | $1,750 | null | yes (margin is a broad proxy) |
| remodeling | $3,500 | $12,000 | $50,000 | per remodel project | 0.30 | $3,600 | $71 to $106 (LSA) | yes |
| tree-service | $200 | $700 | $3,000 | per job | 0.30 | $210 | $38 to $48 (LSA) | yes |

Example: a $3,000 site for an HVAC shop is $3,000 / $109 = about 28 extra repair visits, or about 1.2 replacements at $7,500 ($2,550 gross each at 0.34).

## Editor changes to researcher proposals

| categoryKey | Researcher proposal | Synthesis value | Why |
|---|---|---|---|
| tire-shop | $702 per set of four, 0.30 | $305 per visit, 0.27 | Not every visit is a full set; 0.30 was above the 27.0% tire margin |
| diesel-truck-repair | margin 0.40 | 0.35, estimate | No blended margin source; derived value shaded down |
| mobile-mechanic | margin 0.50 | 0.45, estimate | Borrowed from fixed-shop data, different model |
| auto-detailing | margin 0.50 | 0.35, estimate | The only anchor (car wash tunnel) leaves about 29% at store level |
| towing | typical $125, margin 0 | $88, 0.30 estimate | $125 was the top of AAA's range; margin 0 breaks `computeRoi` (SPEC uses `??`, which does not catch 0) |
| barber | margin 0.35 | 0.30 | Shop share for commission shops before product and rent |
| hair-salon, nail-salon | margin 0.40 | 0.35 | Commission plus product leaves 35% to 45% (hair), 25% to 50% (nails) |
| hvac | $1,000 blend, 0.40 | $320, 0.34 | Blend weights unsourced; SOI measured 33.9% |
| plumbing | $600 blend, 0.40 | $310, 0.34 | Same |
| electrical | $500 blend, 0.38 | $280, 0.32 | Same; HomeAdvisor $351 was unchecked, so unused |
| septic | $700 blend | $428 | Sourced pumping average |
| garage-door | $500 blend, 0.45 | $265, 0.35 | Blend unsourced; 0.45 rested on a target |
| restoration | margin 0.40 | 0.35, estimate | No gross margin source |
| pest-control | $400 blend, 0.50 | $172, 0.45 | Blend unsourced; Rollins excludes D&A and has scale |
| roofing | $3,200 blend | $1,173 | Blend unsourced; override to about $9,600 for replacement roofers |
| concrete | $4,500 blend | $3,200 | Lower of the two sourced jobs |
| pools | high $87,000 | high $2,400 | Keep one unit (service); builders use an override |
| landscaping | margin 0.30 | 0.25 | Was above its only source (BrightView 23.3%) |
| painting | $2,500, 0.40 | $2,000, 0.35 | Lower sourced average; SOI 34.8% measured |
| remodeling | $15,000 blend | $12,000 | Bathroom average |
| all rows | rentedLead 0 to 0 | null where unknown | A 0 lead cost divides by zero in `rentedLeadComparison` |

## Category reasoning and sources

### Auto

- **auto-repair.** Tekmetric's 2023 index: average repair order $585.91 (regions $533.14 to $697.65), total profit margin 53.67% to 57.78% by region. PartsTech 2025 (752 shops, via Aftermarket Matters wire copy; full report gated): 36% report $500 to $749, $250 to $499 a close second. CarMD: average check engine repair $554 in 2025. Typical $500 sits under all three. Do not use PartsTech's 51% to 60% parts gross profit: it conflicts with measured 25% to 39% and 32% to 35% parts margins. [Tekmetric PDF](https://cdn.prod.website-files.com/678cca1dba65076a9fd94f2d/678fcff9ab7bc1dc9c47eb64_Tekmetric%20Industry%20Index%202023-October-web.pdf), [Aftermarket Matters](https://www.aftermarketmatters.com/national-news/new-report-offers-shops-tips-on-improving-average-repair-orders/), [CarMD](https://www.prnewswire.com/news-releases/carmd-reports-record-check-engine-repair-costs-in-2025-as-aging-vehicles-drive-up-car-repair-trends-302749964.html).
- **auto-body-collision.** CCC Crash Course 2026: 2025 TCOR $4,818 overall, $5,721 for vehicles 6 years or newer, "$2,039 (+55.4%) more on average than vehicles 7 years or older", so $3,682 (derived). AAA 2023: $1,698 minor rear collision. Boyd/Gerber 2025 gross margin 46.4%; FenderBender 2025 parts gross profit 25% to 39%. [CCC](https://www.cccis.com/reports/crash-course-2026), [AAA](https://newsroom.aaa.com/2023/12/fixing-advanced-vehicle-systems-makes-up-over-one-third-of-repair-costs-following-a-crash/), [Boyd 40-F](https://www.sec.gov/Archives/edgar/data/2091467/000119312526112466/d106626dex992.htm).
- **tire-shop.** Monro FY2026: about 3.8 million vehicles serviced on $1,157.2M, about $305 per vehicle (derived; the 10-K does not say whether this counts visits or unique vehicles), gross margin 35.0% including labor and occupancy. Modern Tire Dealer 2025: advertised prices $117.75, $175.42 and $250.38 per tire for 195/65R15, 225/65R17 (top size, 5.9%) and 275/55R20; retail passenger tire margin 27.0%. Tire CPI up only 0.4% to August 2026. [Monro 10-K](https://www.sec.gov/Archives/edgar/data/0000876427/000087642726000007/mnro-20260328x10k.htm), [MTD PDF](https://img.moderntiredealer.com/files/base/ebm/moderntiredealer/document/2025/02/67be33a0a7763b49adfd0716-modern_tire_dealer_2025_facts_issue.pdf).
- **muffler-exhaust.** CarParts.com (retail prices): part $50 to $250 plus $70 to $90 labor. RepairPal (Sept 2026 estimate): Camry $587 to $623, national $1,138 to $1,190 (OEM parts). CarMD: catalytic converter $1,511. Monro: exhaust is only 1.3% of its sales.
- **diesel-truck-repair.** Fullbay via Fleet Maintenance: average invoice about $965 (2022 data, $118 labor rate). Fullbay 2025-2026: median labor $149 an hour, median tech pay $32; fifth report parts margin 21%. Schneider: PM about $300, brake overhaul "upwards of $2,000". Label the typical "2022 data".
- **mobile-mechanic.** Airtasker (May 2026) median $200 per job; AutoNation Mobile Service $120 to $600 routine repairs.
- **auto-detailing.** Thumbtack (April 2026) national average $144 to $254, ends $95 and $390. Mister Car Wash 2025 10-K: labor and chemicals 29% of revenue, other store costs 42% more.
- **towing.** AAA non-member "$50 to $125 for 5 miles or less" (undated membership sales page). Texas TDLR nonconsent cap $272 light duty, Texas only.

### Personal care

- **barber.** Squire State of Barbershops 2026 (13.9M appointments, about 7,000 shops): "$43 · National Average"; Midwest $35, Northeast and South $40, West $45. Squire 2023: commission splits "40/60 to 70/30 in the barber's favor". Corrected: "For context, the average client gets ~7 haircuts a year." (48.5 days between visits for returning clients only; about 48% are one-and-done.) Regis FY2026 company-owned salons about 28.4% before rent (floor). BLS: haircut CPI up 4.2%.
- **hair-salon.** KIM Report via Salon Today: Q1 2026 average service ticket $89.28 (10,000+ salons), $99.49 for mid-size. Zenoti 2026: commission 40% to 60%, 45% to 50% most common. Thumbtack: haircuts $35 to $150 or more, color $65 to $200 or more.
- **nail-salon.** Zenoti: older list basic manicure $15 to $30, basic pedicure $30 to $40; summary blurb (no methodology) gel $35 to $60, acrylic $45 to $75; product cost 10% to 15%; commission 40% to 60%.
- **tattoo.** Airtasker (Aug 2026) shop minimums $80 to $150; Tattooing 101 (undated, 2024 subhead) $150 to $210 an hour, half sleeve example $1,200; Bookedin (Jan 2026) 50/50 split most common.
- **pet-grooming.** Thumbtack $79 to $136 per full groom, average $104; APPA (July 2026) salon and mobile grooming spending fell in 2025, 51% groom at home; Learn2GroomDogs (2017) 38% to 44% commission. Pet services CPI up 4.6%.
- **general.** Derived: median of the 13 auto and personal care typicals in this file is $150. Replace with a category benchmark whenever possible.

### Home services and contractors

Margin anchors (IRS SOI, Returns of Active Corporations, Table 1, tax year 2022, corporations only, computed as 1 minus COGS over business receipts; [xlsx](https://www.irs.gov/pub/irs-soi/22co01ccr.xlsx)):

| SOI minor industry | Implied gross margin |
|---|---|
| Plumbing, heating, and air-conditioning contractors | 33.9% |
| Electrical contractors | 31.9% |
| Other specialty trade contractors (roofing, concrete, painting, fencing, pools, foundation, garage doors and more) | 34.8% |
| Other repair and maintenance (includes appliance repair) | 50.1% |

Other margin sources: NAHB 2026 Remodelers' Cost of Doing Business Study, 29.9% for 2024 ([NAHB](https://www.nahb.org/blog/2026/04/home-remodeling-profit-margin)); Rollins 2025, 52.8% excluding D&A ([Rollins](https://www.rollins.com/investors/press-releases/detail/426/rollins-inc-reports-fourth-quarter-and-full-year-2025-financial-results)); Davey Tree 2025, about 33.2% before and 29.4% after depreciation, depressed by a one-time $34.5M claims adjustment (2024 was about 35.5% before depreciation) ([Davey PDF](https://www.davey.com/media/dhvn01qx/2025-annual-report.pdf)); BrightView FY2025, 23.3%, commercial.

- **hvac.** HomeGuide repair $293 (range $144 to $451); HomeAdvisor repair about $350. Replacement: HomeAdvisor $7,500 ($5,000 to $12,500), HomeGuide $8,000. ServiceTitan advisor Chris Hunter described mid-market replacement tickets as "the $8,000, the $9,000, the $10,000 tickets" (anecdotal).
- **plumbing.** HomeGuide $280 (small repairs $125 to $350); HomeAdvisor $341. Water heater $600 to $3,100; repipe $3,100 to $5,500.
- **electrical.** HomeGuide small jobs $280 ($141 to $419); breaker box $1,475, 200 amp upgrade up to $4,000.
- **septic.** HomeAdvisor pumping $428 ($292 to $565), repair $1,829; HomeGuide new conventional system $3,500 to $8,500.
- **garage-door.** HomeAdvisor repair $265 ($155 to $379), replacement $1,231; HomeGuide two-car door up to $3,500. SearchLight's garage door LSA clients report a $1,145 average ticket, so $265 is very conservative.
- **restoration.** HomeAdvisor water damage $3,868 ($1,383 to $6,369, 2025); HomeGuide water $2,000 to $6,000, mold $1,500 to $6,000, fire $8,000 to $18,000.
- **appliance-repair.** HomeAdvisor $179 ($108 to $251); HomeGuide $200, refrigerator repair $125 to $500.
- **pest-control.** HomeAdvisor $172 per treatment; HomeGuide plans $300 to $900 a year; termite $225 to $2,500.
- **roofing.** HomeAdvisor repair $1,173 ($395 to $1,967), replacement $9,609; HomeGuide replacement $10,800 ($5,700 to $16,000).
- **concrete.** HomeGuide 20x20 patio $1,600 to $4,800; HomeAdvisor driveway $6,400 ($2,700 to $14,500).
- **fencing.** HomeAdvisor install $3,277, repair $618 ($304 to $948); HomeGuide install $4,000 to $12,000.
- **pools.** HomeGuide service $122 a month ($80 to $200), about $1,400 a year; leak repair $500 to $1,500. Builders: HomeAdvisor $65,909, HomeGuide $62,500.
- **landscaping.** HomeGuide maintenance $150 a month; HomeAdvisor projects $3,516; HomeGuide large jobs $2,000 to $4,000.
- **painting.** HomeAdvisor interior $2,022, exterior $3,178; HomeGuide full interior $2,900 to $8,800.
- **foundation-repair.** HomeAdvisor $5,174 ($2,225 to $8,133); HomeGuide cracks $250 to $800, settling $4,500 to $20,000.
- **remodeling.** HomeAdvisor bathroom $12,151, kitchen $26,945; HomeGuide kitchen $15,000 to $50,000.
- **tree-service.** HomeAdvisor removal $750; HomeGuide removal $850, trimming $650.

## Rented leads

### How the platforms charge

| Platform | Model | Published price |
|---|---|---|
| Google Local Services Ads | Pay per lead, auction priced: "When similar local businesses bid on the same lead, those bids determine how much the lead is worth." | None. From August 2026, US home services accounts move into Performance Max with pay-per-lead goals and "Manual bidding (such as setting a maximum cost-per-lead) is no longer supported". Older benchmarks may shift. |
| Angi Leads (HomeAdvisor) | Fee per matched lead plus membership: "Service providers who join HomeAdvisor's network pay an annual membership fee of $287.99" (FTC, 2022). Exact Match leads cost 50% more than Market Match. | Per lead dollar figures redacted in every public FTC filing |
| Thumbtack | Pro pays per lead, price varies by job, pros and market | None |
| Yelp | Cost per click inside a monthly budget | Yelp Ads "From $150/ month"; Upgrade Package $180; both from $270 |

### The number that matters for the pitch: cost per paying customer

SearchLight's February 2026 dataset (888 contractors, $6.72M LSA spend, 126,650 leads): "The average book rate on LSA leads is 43.9%. The average cost per paying customer is $233." Blended Google Ads: $104 per lead and $472 per paying customer; non-branded search $149 and $804. Garage door: $198 per paying customer. Roofing Q1 2026: about $731 per paying customer (derived from its table). Pitch sentence pattern: "A $2,000 site costs about the same as 9 customers rented through Google's Local Services Ads."

Price trend (99 Calls own accounts, Q2 2025 to Q2 2026): electrical up 51%, roofing up 45%, landscaping up 64.5%, appliance repair up 69%, plumbing down 5.6%.

### Rented lead sources

- SearchLight, LSA cost per lead by trade (Feb 2026): https://searchlightdigital.io/google-local-service-ads-cost-per-lead/
- SearchLight, garage door (Jan to Apr 2026): https://searchlightdigital.io/garage-door-google-lsa-cost-per-lead/
- SearchLight, roofing (Q1 2026): https://searchlightdigital.io/roofing-google-lsa-cost-per-lead/
- 99 Calls, LSA Lead Cost Estimator (Sept 2026): https://99calls.com/LSA-Cost-Estimator
- 99 Calls, 2025 vs 2026: https://99calls.com/blog/lsa-cost-per-lead-by-industry
- The Media Captain (Aug 2025, period not stated): https://www.themediacaptain.com/google-local-service-ad-statistics/
- LocaliQ all industries 2026 (labelled averages, corrected from "median"): https://localiq.com/blog/search-advertising-benchmarks/
- LocaliQ automotive 2026 (medians, 1,983 campaigns, Apr 2025 to Jun 2026): https://localiq.com/blog/automotive-search-advertising-benchmarks/
- LocaliQ home services (medians, 3,211 campaigns, Apr 2024 to Mar 2025): https://localiq.com/blog/home-services-search-advertising-benchmarks/
- Google LSA help: https://support.google.com/localservices/answer/10125017?hl=en and https://support.google.com/google-ads/answer/17213585?hl=en
- FTC HomeAdvisor press release (2022): https://www.ftc.gov/news-events/news/press-releases/2022/03/ftc-charges-homeadvisor-inc-cheating-businesses-including-small-businesses-seeking-leads-home
- Yelp pricing: https://business.yelp.com/local-business-pricing/

No usable rented lead figure: muffler-exhaust, diesel-truck-repair, mobile-mechanic, auto-detailing, towing, tattoo, concrete, foundation-repair.

## Website market prices

| Route | Range | JSON value | Source |
|---|---|---|---|
| Freelancer, basic small business site | "A small business can expect to pay between $1,000 to $5,000 for a basic website." $30 to $200 an hour | freelancer 1,000 to 5,000 | [Fiverr guide](https://www.fiverr.com/resources/guides/business/web-designer-costs) (editorial, low confidence) |
| Agency | "Web design agencies typically charge $2,000 to $100,000"; "Most web design projects reviewed on Clutch usually cost less than $10,000." US $100 to $149 an hour | agency 2,000 to 10,000 | [Clutch 2026](https://clutch.co/web-designers/pricing) |
| Agency, global survey | 59.9% charge $1,000 to $3,000 for a basic site; 63% of fixed price quotes $1,000 to $15,000; retainers $500 to $3,000 a month for 58% | context | [GoodFirms 2026](https://www.goodfirms.co/resources/website-construction-cost-survey) (31 countries, not US only) |
| Website as a service | SiteMonth $79 a month plus $399 setup up to $199 plus $899; Lifted Websites $200 to $500 a month, no build fee | subscription 79 to 500 a month | [SiteMonth](https://www.sitemonth.com/), [Lifted](https://liftedwebsites.com/waas-website-as-a-service/) |
| DIY builders (annual billing) | Wix Light $17, Core $29, Business $39; Squarespace Basic $19 ($25 monthly), Core $29 ($39 monthly); GoDaddy Basic $9.99 ($16.99 monthly, annual price promotional) | context | [Wix](https://www.wix.com/plans), [Squarespace](https://www.squarespace.com/pricing), [GoDaddy](https://www.godaddy.com/websites/ai-website-builder) |
| US labor reference | Median pay $47.85 an hour; web developers $92,650 a year, digital designers $104,000 (May 2025). Employee wages, not billing rates | context | [BLS OOH](https://www.bls.gov/ooh/computer-and-information-technology/web-developers.htm) |

Do not quote Clutch's "$38,105.39" average as a typical price: it is a mean skewed by large builds. Corrected: Clutch says "Most web design projects reviewed on Clutch lasts for 7 months", which is not an average length. Upwork rate pages returned 403; no Upwork figure is used.

Note for demos: Google's free business.site websites were turned off in March 2024 and redirected until June 10, 2024, then returned "page not found" ([Wayback copy of Google help 14368911](https://web.archive.org/web/20240219171136/https://support.google.com/business/answer/14368911?hl=en)). A business.site link on a profile counts as no website.

## Do not use

| id | Topic | Verdict | Why |
|---|---|---|---|
| ha-electrician | tickets-home-con | unchecked | HomeAdvisor electrician $351 average was never fact checked |
| servicecore-septic-net | tickets-home-con | refuted | Vendor blog repeating an unnamed Plumber Magazine figure; a net margin, not gross |
| rr-restoration-net | tickets-home-con | refuted | Secondary report of a members-only RIA survey of about 100 firms; net income, 2024 data |
| skimmer-pool-price-unverified | tickets-home-con | refuted | $216 a month appears only in search summaries; not on any Skimmer page |
| partstech-parts-gp-2025 | tickets-auto-pc | confirmed quote, not used | 51% to 60% self-reported parts GP conflicts with measured margins (likely markup confused with margin) |
| clutch-average-project | lead-costs | corrected, not used as a price | Skewed mean |
| 99calls disaster and damage restoration ($325, $343), general contractor ($126) | lead-costs | confirmed, excluded from ranges | 3 to 5 sites; categories not on Google's LSA list or skewed |
| 99calls masonry and paving as concrete stand-in | lead-costs | confirmed, excluded | 2 sites each, unofficial LSA categories |
| LocaliQ "Garages" $81.45 | lead-costs | confirmed, excluded | Undefined label, may not mean garage door repair |
| ServiceTitan 50% to 55%, 55% to 65%; PCA 50% | tickets-home-con | confirmed, target only | Pricing targets, never an industry average |
