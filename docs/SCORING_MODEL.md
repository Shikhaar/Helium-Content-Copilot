# Scoring Model: Helium Content Copilot

## Mathematical Foundation

The Helium Content Copilot uses a **100% deterministic 5-factor scoring engine** to rank content opportunities on a 0–100 scale.

> [!IMPORTANT]
> The LLM provides qualitative strategic reasoning (the *"Why"*). All numeric scores are computed in pure Python by `ScoringService`. The LLM never computes or hallucinates numeric scores.

## Simple Plain-English Explanation (The "Report Card" Analogy)

Think of the 100-point opportunity score like a **5-subject report card** where each subject grades a different part of the e-commerce business:

### 1. Historical Performance (`25 / 25`)
- **The Question:** *"Does this format (e.g. Styling Reel) perform better than our regular feed posts?"*
- **In Simple Terms:** 
  - SNITCH’s average Instagram post gets **4.8%** engagement.
  - But whenever SNITCH posts a **Styling Reel**, it gets **8.8%** engagement ($1.8\times$ better than average).
  - Because it performs $1.8\times$ above baseline, it earns full marks: **25 out of 25**.

### 2. Product Relevance & Inventory (`20 / 25`)
- **The Question:** *"Are customers actually viewing/buying this item, and is it in stock?"*
- **In Simple Terms:**
  - The most popular item in the store has 10,000 views and 500 sales.
  - The **Oversized Linen Shirt** has **8,400 views** and **410 sales** (about 83% as popular as the top item).
  - $83\% \times 25\text{ points} = \mathbf{20.7 \approx 20\text{ points}}$.
  - **Stock Check:** Because it is **In Stock**, it keeps its full **20 / 25** points. *(If it were Out of Stock, the algorithm automatically cuts the score to 8/25 to prevent wasting marketing budget on unfulfillable items).*

### 3. Audience Fit (`18 / 20`)
- **The Question:** *"Do the people we are targeting (e.g. Young Millennials / Gen-Z) actually engage with this content?"*
- **In Simple Terms:**
  - Average audience engagement across all segments is **4.9%**.
  - But **Young Millennials** engage at **5.8%** on streetwear and styling content.
  - Because this audience interacts significantly above median, it earns **18 out of 20**.

### 4. Seasonal & Campaign Alignment (`15 / 15`)
- **The Question:** *"Is this the right product for the active campaign season?"*
- **In Simple Terms:**
  - Active Campaign: **Summer 2026**
  - Product: **Linen Shirt** (a classic summer piece)
  - Exact match = **15 out of 15**. *(A heavy winter wool coat in June would receive 5/15).*

### 5. Business Objective Fit (`15 / 15`)
- **The Question:** *"Does this format drive our marketing goal (e.g. Brand Awareness)?"*
- **In Simple Terms:**
  - Goal: **Brand Discovery & Awareness**
  - High-velocity video formats with $>1.5\times$ engagement rate are proven awareness drivers = **15 out of 15**.

$$\mathbf{\text{Total Score}} = \mathbf{25} + \mathbf{20} + \mathbf{18} + \mathbf{15} + \mathbf{15} = \mathbf{93 / 100}$$

---
## How Engagement Rate (ER) is Calculated from Raw Post Data

Before any opportunity scoring occurs, `AnalyticsService` calculates engagement rates dynamically from the raw post data in SQLite:

### 1. Individual Post Engagement Rate
For every single post in history:
```text
Post ER (%) = [(Likes + Comments + Shares + Saves) / Impressions] * 100
```
- **Example:** A post with 1,400 likes, 120 comments, 85 shares, 340 saves, and 25,000 impressions:
  $$\text{Post ER} = \frac{1,400 + 120 + 85 + 340}{25,000} \times 100 = \frac{1,945}{25,000} \times 100 = \mathbf{7.78\%}$$

### 2. Brand Baseline Engagement Rate (4.80%)
The average engagement rate across all standard feed posts (Carousels and Images):
```text
Brand Feed Average = (Sum of all Feed Post ERs) / (Total Feed Posts) = 4.80%
```
*(Reels are excluded from the feed baseline because algorithmic reach can inflate averages and skew format comparisons).*

### 3. Format & Audience Aggregations
- **Format Average:** e.g. **Reels** average **8.80%**, **Carousels** average **6.45%**, **Single Images** average **3.80%**.
- **Audience Average:** e.g. **Young Millennials** average **5.83%**, **Gen-Z** averages **5.74%**, **Metro Men** averages **4.52%**.

---
## The 5 Factors & Weights

| Factor | Weight | Evaluation Method | Primary Signal Source |
| :--- | :---: | :--- | :--- |
| **Historical Performance** | `/25` | Relative ratio against brand feed baseline | Historical post engagement rates by format & category |
| **Product Relevance** | `/25` | Demand index (views & sales) $\times$ inventory multiplier | Product catalog engagement & stock status |
| **Audience Fit** | `/20` | Target audience ER vs median audience benchmark ratio | Historical post metrics segmented by audience |
| **Seasonal Alignment** | `/15` | Discrete lookup against active campaign season | Product season vs Active Campaign |
| **Objective Fit** | `/15` | Discrete threshold lookup on format performance ratio | Format ER relative to brand feed baseline |
| **TOTAL** | **/100** | Sum of all 5 factors | Full Brand & Performance Context |

---
## Mathematical Formulas

### 1. Historical Performance Score ($S_{\text{hist}} \in [0, 25]$)

Measures how strongly this specific content format and category have historically performed compared to the brand's feed baseline.

$$\text{Ratio}_{\text{format}} = \frac{\text{ER}_{\text{format, category}}}{\text{ER}_{\text{brand\_feed}}}$$

$$S_{\text{hist}} = \min\left(25, \text{round}\left(25 \times \frac{\text{Ratio}_{\text{format}}}{\text{HISTORICAL\_BENCHMARK\_RATIO}}\right)\right)$$

- **Documented Constant:** `HISTORICAL_BENCHMARK_RATIO = 1.8`
  - *Rationale:* An engagement ratio of $1.8\times$ baseline represents top-tier D2C performance and receives full points ($25/25$).
  - For Styling Carousels: $\text{ER} = 8.20\%$, $\text{Feed Baseline} = 4.80\% \implies \text{Ratio} = 1.71 \implies S_{\text{hist}} = \min(25, \text{round}(25 \times 1.71 / 1.8)) = 24/25$.

---
### 2. Product Relevance Score ($S_{\text{prod}} \in [0, 25]$)

Combines consumer demand signals (views & sales) scaled against the current catalog maximums, modulated by inventory availability.

$$\text{DemandIndex} = 0.5 \times \left(\frac{\text{Views}_{\text{product}}}{\max(\text{Views})}\right) + 0.5 \times \left(\frac{\text{Sales}_{\text{product}}}{\max(\text{Sales})}\right)$$

$$\text{StockMultiplier} = \begin{cases} 
1.0 & \text{if In Stock} \\
0.6 & \text{if Low Stock} \\
0.4 & \text{if Out of Stock}
\end{cases}$$

$$S_{\text{prod}} = \min(25, \text{round}(25 \times \text{DemandIndex} \times \text{StockMultiplier}))$$

---
### 3. Audience Fit Score ($S_{\text{aud}} \in [0, 20]$)

Measures historical receptivity of the targeted audience segment.

$$\text{Ratio}_{\text{audience}} = \frac{\text{ER}_{\text{target\_audience}}}{\text{ER}_{\text{median\_audience}}}$$

$$S_{\text{aud}} = \min\left(20, \text{round}\left(20 \times \frac{\text{Ratio}_{\text{audience}}}{\text{AUDIENCE\_BENCHMARK\_RATIO}}\right)\right)$$

- **Documented Constant:** `AUDIENCE_BENCHMARK_RATIO = 1.1`

---
### 4. Seasonal Alignment Score ($S_{\text{season}} \in [0, 15]$)

Discrete rule-based mapping comparing product season against the active brand campaign (e.g. *"Summer 2026"*):

| Condition | Description | Points |
| :--- | :--- | :---: |
| **Exact Primary Match** | Product season matches active campaign season (e.g. Summer $\leftrightarrow$ Summer) | **15** |
| **Secondary Match** | Transitional or complementary season (e.g. Resort, Transitional) | **12** |
| **Evergreen** | All-season staple (e.g. *"All Season"*) | **10** |
| **Off-Season** | Counter-seasonal product (e.g. Winter in Summer) | **5** |

---
### 5. Business Objective Fit Score ($S_{\text{obj}} \in [0, 15]$)

Discrete rule-based threshold mapping evaluating if the chosen format drives the desired business objective based on historical efficiency:

| Historical Format Ratio ($\text{ER}_{\text{fmt}} / \text{ER}_{\text{baseline}}$) | Fit Classification | Points |
| :--- | :--- | :---: |
| $\ge 1.5\times$ | **Strong Match** (High-efficiency format) | **15** |
| $1.0\times - 1.49\times$ | **Good Match** (Meets average baseline) | **10** |
| $< 1.0\times$ | **Weak Match** (Sub-baseline efficiency) | **5** |

---
## Step-by-Step Hero Opportunity Walkthrough

**Opportunity:** *"3 Ways to Style the Oversized Linen Shirt This Summer"*  
**Product:** `prod_001` (Oversized Korean Linen Shirt)  
**Format:** Carousel (Styling) | **Audience:** Gen-Z | **Campaign:** Summer 2026  

1. **Historical Performance:**
   - Styling Carousel $\text{ER} = 8.20\%$, Feed Baseline $= 4.80\%$
   - $\text{Ratio} = 8.20 / 4.80 = 1.708$
   - $S_{\text{hist}} = \min(25, \text{round}(25 \times 1.708 / 1.8)) = \mathbf{24/25}$

2. **Product Relevance:**
   - Views: $14,200 / 14,200 = 1.0$
   - Sales: $1,050 / 1,680 = 0.625$
   - $\text{DemandIndex} = 0.5(1.0) + 0.5(0.625) = 0.8125$
   - $\text{StockMultiplier} = 1.0$ (In Stock)
   - $S_{\text{prod}} = \text{round}(25 \times 0.8125 \times 1.0) = \mathbf{20/25}$

3. **Audience Fit:**
   - Gen-Z Audience $\text{ER} = 5.74\%$, Median $= 5.79\%$
   - $\text{Ratio} = 5.74 / 5.79 = 0.991$
   - $S_{\text{aud}} = \min(20, \text{round}(20 \times 0.991 / 1.1)) = \mathbf{18/20}$

4. **Seasonal Alignment:**
   - Product Season: *"Summer"* | Active Campaign: *"Summer 2026"*
   - Exact Primary Match $\implies S_{\text{season}} = \mathbf{15/15}$

5. **Business Objective Fit:**
   - Ratio $= 1.71 \ge 1.5\times \implies$ Strong Match $\implies S_{\text{obj}} = \mathbf{15/15}$

$$\mathbf{S_{\text{total}} = 24 + 20 + 18 + 15 + 15 = 92 / 100}$$

---
## Confidence Indicator Engine

Confidence is calculated based on data depth and signal density, rather than just the score magnitude:

- **High Confidence:** $\ge 20$ historical posts, $\ge 6$ products in catalog, and total score $\ge 80$.
- **Medium Confidence:** $\ge 10$ historical posts, $\ge 3$ products in catalog, and total score $\ge 60$.
- **Low Confidence:** Limited historical data or weak signal density.
