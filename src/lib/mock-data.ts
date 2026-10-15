import type {
  ActivityEvent,
  Conversation,
  Feedback,
  MessageRole,
  RecommendedAction,
  Sentiment,
  Status,
  Tag,
  Theme,
  User,
} from "./types";

export const users: User[] = [
  { id: "u1", name: "Dana Brooks", role: "nam", account: "Glow Beauty Co." },
  { id: "u2", name: "Marcus Lee", role: "nam", account: "Peak Snacks" },
  { id: "u3", name: "Sofia Alvarez", role: "category_manager", account: "Glow Beauty Co." },
  { id: "u4", name: "Ken Watanabe", role: "category_manager", account: "Northfield Home" },
  { id: "u5", name: "Rachel Kim", role: "marketing_manager", account: "Peak Snacks" },
  { id: "u6", name: "Tom Becker", role: "vp_ecommerce", account: "Northfield Home" },
  { id: "u7", name: "Aisha Rahman", role: "nam", account: "Northfield Home" },
  { id: "u8", name: "Liam O'Connor", role: "marketing_manager", account: "Glow Beauty Co." },
];

type Turn = [MessageRole, string];

function conversation(
  id: string,
  title: string,
  userId: string,
  retailer: string,
  startedAt: string,
  turns: Turn[],
): Conversation {
  const start = new Date(startedAt).getTime();
  return {
    id,
    title,
    userId,
    retailer,
    startedAt,
    messages: turns.map(([role, content], index) => ({
      id: `${id}-m${index + 1}`,
      role,
      content,
      timestamp: new Date(start + index * 90_000).toISOString(),
    })),
  };
}

export const conversations: Conversation[] = [
  conversation("c01", "Why is Glow Beauty behind plan in Q3?", "u1", "Amazon US", "2026-09-24T14:00:00.000Z", [
    ["user", "Why are we behind plan for Q3 on Amazon?"],
    ["agent", "Glow Beauty is $412K (6.8%) behind the Q3 plan on Amazon US.\n\n• Units drove $318K of the gap. Ordered units fell 9% after the Sept 9 out-of-stock on Hydra Serum 30ml.\n• Price drove $94K. Average selling price dropped 2.1% as a third-party seller undercut the buy box.\n\nBiggest single lever: restock Hydra Serum 30ml, worth about $27K a week at the current run rate.\n\nSource: Amazon crawl, Sep 23 06:00 UTC."],
    ["user", "Break the units gap down by brand."],
    ["agent", "Units gap by brand, Q3 to date:\n\n• Glow Hydra: -$201K (63% of the units gap), almost all from Hydra Serum 30ml.\n• Glow Daily: -$84K, spread across 11 SKUs with lower search rank.\n• Glow Men: -$33K, mostly the Sept price test on the 3-pack.\n\nNext step: open Hydra Serum 30ml in Alerts to see the restock ETA.\n\nSource: Amazon crawl, Sep 23 06:00 UTC."],
  ]),
  conversation("c02", "Out-of-stock impact for Peak Snacks this week", "u2", "Walmart", "2026-09-25T15:30:00.000Z", [
    ["user", "What did out-of-stocks cost Peak Snacks on Walmart this week?"],
    ["agent", "Out-of-stocks cost Peak Snacks an estimated $86K on Walmart this week.\n\n• 14 SKUs were out of stock for at least one day.\n• Trail Mix Variety 24ct accounts for $31K. It has been out of stock since Sep 19.\n• Protein Bites Cocoa 12ct is back in stock as of Sep 24.\n\nSource: Walmart crawl, Sep 21 06:00 UTC."],
    ["user", "Protein Bites still shows out of stock on the site right now."],
    ["agent", "You're right. The Sep 24 restock I referenced came from a crawl that has since been superseded. Protein Bites Cocoa 12ct is still out of stock in 38% of tracked stores. Updated loss for this SKU: $12K this week.\n\nSource: Walmart crawl, Sep 25 06:00 UTC."],
  ]),
  conversation("c03", "Skincare category decline", "u3", "Amazon US", "2026-09-26T10:15:00.000Z", [
    ["user", "Why is skincare down 12% vs last month?"],
    ["agent", "Skincare is down $268K (12%) month over month on Amazon US.\n\n• Category demand is flat, so this is share loss, not a market dip.\n• Glow Daily Moisturizer lost the #1 organic rank for \"daily face moisturizer\" on Sep 14. That alone is worth about $96K.\n• Two competitor launches took 3.1 points of share.\n\nSource: Amazon crawl, Sep 25 06:00 UTC."],
    ["user", "Show me the SKUs driving the rank loss."],
    ["agent", "Top SKUs by lost revenue from rank changes:\n\n1. Glow Daily Moisturizer 50ml: -$96K, rank 1 → 4\n2. Glow Daily SPF 30: -$41K, rank 3 → 7\n3. Glow Daily Night Cream: -$18K, rank 5 → 9\n\nThese numbers are for all retailers combined."],
  ]),
  conversation("c04", "Lost Buy Box on Northfield Home", "u4", "Amazon US", "2026-09-28T13:00:00.000Z", [
    ["user", "Which Northfield SKUs lost the buy box this week and what's it costing?"],
    ["agent", "Northfield Home lost the buy box on 9 SKUs this week, costing about $54K.\n\n• Linen Duvet Queen: $22K. A third-party seller is 8% below MAP.\n• Oak Shelf 3-Tier: $14K. Your offer is suppressed for a pricing error.\n• 7 smaller SKUs: $18K combined.\n\nRecommended: file a MAP violation for Linen Duvet Queen and fix the price on Oak Shelf 3-Tier in Seller Central.\n\nSource: Amazon crawl, Sep 28 06:00 UTC."],
    ["user", "Turn that into a recurring weekly check."],
    ["agent", "Done. I set up a weekly Buy Box check for Northfield Home every Monday at 8am ET. It will flag any SKU losing more than $2K a week and include the seller and price gap."],
  ]),
  conversation("c05", "Missing promo badges during Circle Week", "u5", "Target", "2026-09-29T16:45:00.000Z", [
    ["user", "Are our Circle Week promos showing on Target.com?"],
    ["agent", "8 of 23 Peak Snacks promo SKUs are missing the Circle Week badge on Target.com.\n\nEstimated lost sales: $19K so far, based on a 14% conversion lift for badged items last Circle Week.\n\nSKUs missing the badge: Trail Mix Variety 24ct, Protein Bites Cocoa 12ct, Veggie Crisps 6pk, and 5 more.\n\nSource: Target crawl, Sep 29 06:00 UTC."],
    ["user", "Why are they missing?"],
    ["agent", "The most common cause is a promo set up after the Target cutoff. I can't confirm the cause for these SKUs from crawl data. Check the promo calendar in Target Partners Online."],
  ]),
  conversation("c06", "Q3 executive summary for Northfield Home", "u6", "Amazon US", "2026-10-01T09:00:00.000Z", [
    ["user", "Give me a one-paragraph Q3 summary for Northfield Home on Amazon I can drop into a board slide."],
    ["agent", "Northfield Home finished Q3 at $4.1M on Amazon US, 3% ahead of plan. Price held steady and units grew 5%, led by Linen Duvet Queen. The main risk going into Q4 is buy box loss on 9 SKUs, currently costing about $54K a week."],
    ["user", "Make it a slide."],
    ["agent", "Here is your slide: \"Northfield Home Q3 on Amazon\" with the summary, a units vs price bridge, and the top 3 risks. It took longer than usual because the bridge chart was regenerated."],
  ]),
  conversation("c07", "Low DC stock alert for Northfield Home", "u7", "Amazon US", "2026-10-02T11:20:00.000Z", [
    ["user", "Set up an alert when any Northfield SKU drops below 2 weeks of DC stock."],
    ["agent", "Done. You'll get a Low DC Stock alert when weeks of cover falls below 2.0 for any Northfield Home SKU on Amazon US. Right now 3 SKUs are already below: Oak Shelf 3-Tier (1.2 weeks), Linen Duvet King (1.6), and Wool Throw Grey (1.9)."],
    ["user", "What's the dollar risk on those 3?"],
    ["agent", "If none are replenished, projected lost sales over the next 4 weeks are $71K: Oak Shelf 3-Tier $38K, Linen Duvet King $21K, Wool Throw Grey $12K.\n\nSource: Amazon inventory feed, Oct 2 04:00 UTC."],
  ]),
  conversation("c08", "Hydra Serum performance on Walmart", "u1", "Walmart", "2026-10-04T14:10:00.000Z", [
    ["user", "How is Hydra Serum 30ml doing on Walmart?"],
    ["agent", "Hydra Serum 30ml on Walmart is $38K ahead of plan this month (+11%). Units are up 14% after the Sep 20 rollback, and price is down 3%."],
    ["user", "Drill into the SKU variants."],
    ["agent", "Variant performance for Hydra Serum:\n\n• 30ml: -$27K vs plan, out of stock since Sep 9\n• 50ml: +$12K vs plan\n• Travel 10ml: +$4K vs plan\n\nThe 30ml out-of-stock is the main drag."],
  ]),
  conversation("c09", "Glance view drop on Peak Snacks", "u2", "Amazon US", "2026-10-06T10:00:00.000Z", [
    ["user", "Glance views dropped 18% last week for Peak Snacks. Why?"],
    ["agent", "Glance views fell 18% ($44K in estimated sales) mainly because sponsored ad spend on \"healthy snacks\" was cut by 40% on Sep 29. Organic rank was stable for the top 10 SKUs.\n\nSource: Amazon crawl and ads data, Oct 5 06:00 UTC."],
    ["user", "What should I do?"],
    ["agent", "Consider reviewing your advertising strategy and optimizing your keyword bids to improve visibility."],
  ]),
  conversation("c10", "Price compression on Northfield Home", "u4", "Walmart", "2026-10-08T15:00:00.000Z", [
    ["user", "Are we losing money to price compression on Walmart?"],
    ["agent", "Yes. Average selling price for Northfield Home on Walmart fell 4.2% over 4 weeks, costing $63K. Most of it comes from Linen Duvet Queen, where Walmart matched a competitor's $89 price.\n\nUnits did not rise to offset it (+0.6%), so the price cut is not paying for itself.\n\nSource: Walmart crawl, Oct 8 06:00 UTC."],
    ["user", "Compare to Amazon."],
    ["agent", "On Amazon, ASP fell 1.1% over the same 4 weeks ($14K). Linen Duvet Queen is holding $99 on Amazon."],
  ]),
  conversation("c11", "Rating drop on Glow Daily SPF 30", "u8", "Amazon US", "2026-10-09T12:30:00.000Z", [
    ["user", "Has the rating drop on Glow Daily SPF 30 hurt sales?"],
    ["agent", "Glow Daily SPF 30 dropped from 4.4 to 4.1 stars on Sep 30. Conversion fell from 12.8% to 10.9% in the week after, about $9K in lost sales.\n\nTop complaint themes in new 1–2 star reviews: \"white cast\" (41%) and \"pilling under makeup\" (22%).\n\nSource: Amazon reviews crawl, Oct 9 06:00 UTC."],
    ["user", "Draft a response plan."],
    ["agent", "Here's a plan:\n1. Update the PDP to address white cast.\n2. Respond to recent negative reviews.\n3. Consider reformulation.\n4. Monitor rating weekly."],
  ]),
  conversation("c12", "Wool Throw Grey out of stock on Walmart", "u7", "Walmart", "2026-10-11T09:40:00.000Z", [
    ["user", "Is Wool Throw Grey out of stock on Walmart?"],
    ["agent", "Wool Throw Grey is out of stock in 22% of tracked Walmart stores, costing about $6K this week.\n\nSource: Walmart crawl, Oct 7 06:00 UTC."],
    ["user", "That crawl is 4 days old."],
    ["agent", "Correct. The latest Walmart crawl for this SKU is Oct 7 because the store-level crawl runs twice a week. I can't give a fresher number right now."],
  ]),
  conversation("c13", "Glow Beauty gap to plan on Target", "u3", "Target", "2026-10-12T13:15:00.000Z", [
    ["user", "Why is Glow Beauty behind plan on Target this month?"],
    ["agent", "Glow Beauty is $57K (9%) behind plan on Target this month.\n\n• Units: -$49K. Glow Daily lost 2 end-cap placements on Oct 1.\n• Price: -$8K from the Circle Week discount.\n\nNext steps: monitor the situation and review placements with your Target team."],
    ["user", "Which end caps?"],
    ["agent", "I don't have placement-level detail for Target. The end-cap change is inferred from a drop in in-store sales at 140 stores starting Oct 1."],
  ]),
  conversation("c14", "Weekly gap-to-plan dashboard for leadership", "u6", "Amazon US", "2026-10-13T08:30:00.000Z", [
    ["user", "Build me a dashboard of Northfield Home's weekly gap to plan by brand on Amazon."],
    ["agent", "Your dashboard \"Northfield weekly gap to plan\" is ready. It shows gap to plan by brand with a units vs price split, refreshed every Monday from the Amazon crawl."],
    ["user", "Add Walmart."],
    ["agent", "Walmart is added. The dashboard now has a retailer toggle. Rebuilding took about 90 seconds because each retailer is queried separately."],
  ]),
];

const conversationById = new Map(conversations.map((item) => [item.id, item]));

type Seed = {
  id: string;
  message: string;
  author: string;
  minutes: number;
  sentiment: Sentiment;
  tags: Tag[];
  comment: string;
  quote: string | null;
  status: Status;
  assignee: string | null;
  note?: string;
};

const seeds: Seed[] = [
  { id: "fb01", message: "c01-m2", author: "u1", minutes: 6, sentiment: "positive", tags: ["clear_dollar_impact", "saved_time"], comment: "Exactly the headline I paste into my weekly note. Dollar number first, no digging.", quote: "Glow Beauty is $412K (6.8%) behind the Q3 plan on Amazon US.", status: "resolved", assignee: "Maya Chen" },
  { id: "fb02", message: "c01-m2", author: "u1", minutes: 8, sentiment: "positive", tags: ["accurate", "easy_to_follow"], comment: "Units vs price split matched what our supply team saw.", quote: "Units drove $318K of the gap. Ordered units fell 9% after the Sept 9 out-of-stock on Hydra Serum 30ml.", status: "resolved", assignee: "Priya Shah" },
  { id: "fb03", message: "c01-m4", author: "u3", minutes: 240, sentiment: "negative", tags: ["inaccurate_numbers"], comment: "The 3-pack price test ended Aug 31. The September loss is from the listing suppression, not price.", quote: "Glow Men: -$33K, mostly the Sept price test on the 3-pack.", status: "in_progress", assignee: "Jordan Hale", note: "Confirmed with the catalog team that the listing was suppressed Sep 4–12." },
  { id: "fb04", message: "c01-m4", author: "u1", minutes: 12, sentiment: "negative", tags: ["not_actionable"], comment: "\"Open it in Alerts\" isn't a next step. Tell me who to call and what to ask for.", quote: null, status: "new", assignee: null },
  { id: "fb05", message: "c02-m2", author: "u2", minutes: 4, sentiment: "negative", tags: ["outdated_data"], comment: "Four-day-old crawl on an out-of-stock question. By the time I read it the answer was wrong.", quote: "Source: Walmart crawl, Sep 21 06:00 UTC.", status: "new", assignee: null },
  { id: "fb06", message: "c02-m2", author: "u2", minutes: 5, sentiment: "negative", tags: ["inaccurate_numbers", "outdated_data"], comment: "Told my buyer it was fixed. It wasn't.", quote: "Protein Bites Cocoa 12ct is back in stock as of Sep 24.", status: "in_progress", assignee: "Alex Okonkwo" },
  { id: "fb07", message: "c02-m4", author: "u2", minutes: 9, sentiment: "positive", tags: ["accurate", "clear_dollar_impact"], comment: "Good correction, and the per-SKU dollar number helps.", quote: null, status: "resolved", assignee: "Alex Okonkwo" },
  { id: "fb08", message: "c03-m2", author: "u3", minutes: 7, sentiment: "positive", tags: ["actionable", "easy_to_follow"], comment: "This one sentence changed the conversation with my VP.", quote: "Category demand is flat, so this is share loss, not a market dip.", status: "resolved", assignee: "Priya Shah" },
  { id: "fb09", message: "c03-m4", author: "u3", minutes: 10, sentiment: "negative", tags: ["missing_context", "wrong_scope"], comment: "I asked about Amazon. The drill-down silently switched to all retailers.", quote: "These numbers are for all retailers combined.", status: "in_progress", assignee: "Jordan Hale" },
  { id: "fb10", message: "c03-m4", author: "u8", minutes: 300, sentiment: "negative", tags: ["not_actionable"], comment: "Ranks without the search terms behind them. I can't brief the agency on this.", quote: null, status: "new", assignee: null },
  { id: "fb11", message: "c04-m2", author: "u4", minutes: 5, sentiment: "positive", tags: ["actionable", "clear_dollar_impact"], comment: "Two concrete actions with owners I can name. More of this.", quote: "Recommended: file a MAP violation for Linen Duvet Queen and fix the price on Oak Shelf 3-Tier in Seller Central.", status: "resolved", assignee: "Maya Chen" },
  { id: "fb12", message: "c04-m4", author: "u4", minutes: 8, sentiment: "positive", tags: ["saved_time"], comment: "The recurring check took 10 seconds. It used to be a Monday spreadsheet.", quote: null, status: "resolved", assignee: "Maya Chen" },
  { id: "fb13", message: "c04-m2", author: "u7", minutes: 180, sentiment: "negative", tags: ["missing_context"], comment: "Which seller? I need the seller ID to file anything.", quote: "A third-party seller is 8% below MAP.", status: "new", assignee: null },
  { id: "fb14", message: "c05-m2", author: "u5", minutes: 6, sentiment: "positive", tags: ["clear_dollar_impact", "well_sourced"], comment: "Showing the assumption behind the estimate made it easy to defend.", quote: "Estimated lost sales: $19K so far, based on a 14% conversion lift for badged items last Circle Week.", status: "resolved", assignee: "Priya Shah" },
  { id: "fb15", message: "c05-m4", author: "u5", minutes: 9, sentiment: "negative", tags: ["not_actionable"], comment: "\"Check the promo calendar\" is what I'd tell an intern. I wanted Ally to check.", quote: null, status: "in_progress", assignee: "Priya Shah" },
  { id: "fb16", message: "c05-m4", author: "u5", minutes: 10, sentiment: "negative", tags: ["missing_context"], comment: "Generic cause, not ours. Felt like a guess.", quote: "The most common cause is a promo set up after the Target cutoff.", status: "dismissed", assignee: "Priya Shah", note: "Duplicate of the not-actionable report on the same answer." },
  { id: "fb17", message: "c06-m2", author: "u6", minutes: 4, sentiment: "positive", tags: ["easy_to_follow", "clear_dollar_impact"], comment: "Board-ready in one shot.", quote: null, status: "resolved", assignee: "Alex Okonkwo" },
  { id: "fb18", message: "c06-m4", author: "u6", minutes: 8, sentiment: "negative", tags: ["slow"], comment: "The slide took almost two minutes. I gave up and screenshotted the paragraph.", quote: null, status: "in_progress", assignee: "Jordan Hale" },
  { id: "fb19", message: "c06-m2", author: "u6", minutes: 60, sentiment: "negative", tags: ["inaccurate_numbers"], comment: "$54K was this week's number, not a weekly run rate. The board will read it as recurring.", quote: "currently costing about $54K a week", status: "new", assignee: null },
  { id: "fb20", message: "c07-m2", author: "u7", minutes: 5, sentiment: "positive", tags: ["saved_time", "actionable"], comment: "Alert setup plus the three SKUs already at risk. Perfect.", quote: null, status: "resolved", assignee: "Maya Chen" },
  { id: "fb21", message: "c07-m4", author: "u7", minutes: 7, sentiment: "positive", tags: ["clear_dollar_impact"], comment: "Dollar risk is what I take to the supply planner.", quote: "projected lost sales over the next 4 weeks are $71K", status: "resolved", assignee: "Maya Chen" },
  { id: "fb22", message: "c07-m2", author: "u4", minutes: 200, sentiment: "negative", tags: ["outdated_data"], comment: "Oak Shelf got a PO on Oct 1. The inventory feed hasn't caught up.", quote: "Oak Shelf 3-Tier (1.2 weeks)", status: "new", assignee: null },
  { id: "fb23", message: "c08-m4", author: "u1", minutes: 6, sentiment: "negative", tags: ["wrong_scope", "missing_context"], comment: "That's the Amazon out-of-stock. On Walmart the 30ml is in stock. The drill-down jumped retailers.", quote: "30ml: -$27K vs plan, out of stock since Sep 9", status: "new", assignee: null },
  { id: "fb24", message: "c08-m4", author: "u1", minutes: 8, sentiment: "negative", tags: ["inaccurate_numbers"], comment: "Parent says +$38K, variants add up to -$11K. It doesn't reconcile.", quote: null, status: "in_progress", assignee: "Jordan Hale" },
  { id: "fb25", message: "c08-m2", author: "u1", minutes: 3, sentiment: "positive", tags: ["accurate"], comment: "The top-line number was right.", quote: null, status: "new", assignee: null },
  { id: "fb26", message: "c09-m2", author: "u2", minutes: 5, sentiment: "positive", tags: ["accurate", "well_sourced"], comment: "Nailed the ads cut. Our agency confirmed.", quote: null, status: "resolved", assignee: "Alex Okonkwo" },
  { id: "fb27", message: "c09-m4", author: "u2", minutes: 7, sentiment: "negative", tags: ["not_actionable"], comment: "Generic consultant answer. Which keywords, what bid?", quote: null, status: "new", assignee: null },
  { id: "fb28", message: "c09-m4", author: "u5", minutes: 150, sentiment: "negative", tags: ["not_actionable"], comment: "No bid numbers, no keyword list. Useless for a marketing manager.", quote: "optimizing your keyword bids", status: "in_progress", assignee: "Priya Shah" },
  { id: "fb29", message: "c10-m2", author: "u4", minutes: 6, sentiment: "positive", tags: ["actionable", "accurate"], comment: "That framing is exactly what I need for the Walmart buyer call.", quote: "Units did not rise to offset it (+0.6%), so the price cut is not paying for itself.", status: "new", assignee: null },
  { id: "fb30", message: "c10-m4", author: "u4", minutes: 8, sentiment: "positive", tags: ["easy_to_follow"], comment: "Quick, clean comparison.", quote: null, status: "resolved", assignee: "Jordan Hale" },
  { id: "fb31", message: "c10-m4", author: "u6", minutes: 220, sentiment: "negative", tags: ["outdated_data"], comment: "We dropped to $94 on Amazon on Oct 6.", quote: "Linen Duvet Queen is holding $99 on Amazon.", status: "new", assignee: null },
  { id: "fb32", message: "c11-m2", author: "u8", minutes: 5, sentiment: "positive", tags: ["well_sourced", "saved_time"], comment: "Review themes with percentages saved me a day of reading reviews.", quote: "Top complaint themes in new 1–2 star reviews: \"white cast\" (41%) and \"pilling under makeup\" (22%).", status: "resolved", assignee: "Priya Shah" },
  { id: "fb33", message: "c11-m4", author: "u8", minutes: 8, sentiment: "negative", tags: ["not_actionable", "too_long_unclear"], comment: "Steps 2–4 are filler. No owner, no timing, no dollar value.", quote: null, status: "in_progress", assignee: "Maya Chen" },
  { id: "fb34", message: "c11-m2", author: "u3", minutes: 260, sentiment: "positive", tags: ["clear_dollar_impact"], comment: "Connecting the star drop to dollars is the bit nobody else gives us.", quote: null, status: "new", assignee: null },
  { id: "fb35", message: "c12-m2", author: "u7", minutes: 3, sentiment: "negative", tags: ["outdated_data"], comment: "Four-day-old out-of-stock data again. This keeps happening on Walmart.", quote: "Source: Walmart crawl, Oct 7 06:00 UTC.", status: "new", assignee: null },
  { id: "fb36", message: "c12-m4", author: "u7", minutes: 6, sentiment: "positive", tags: ["accurate"], comment: "At least it was honest about the crawl schedule.", quote: null, status: "new", assignee: null },
  { id: "fb37", message: "c12-m2", author: "u2", minutes: 190, sentiment: "negative", tags: ["outdated_data", "inaccurate_numbers"], comment: "Our ops team saw 40% of stores out on Oct 10.", quote: null, status: "new", assignee: null },
  { id: "fb38", message: "c13-m2", author: "u3", minutes: 5, sentiment: "positive", tags: ["clear_dollar_impact", "easy_to_follow"], comment: "Units vs price split again. Love this format.", quote: "Units: -$49K. Glow Daily lost 2 end-cap placements on Oct 1.", status: "new", assignee: null },
  { id: "fb39", message: "c13-m2", author: "u3", minutes: 6, sentiment: "negative", tags: ["not_actionable"], comment: "\"Monitor the situation\" is not a next step.", quote: "Next steps: monitor the situation and review placements with your Target team.", status: "new", assignee: null },
  { id: "fb40", message: "c13-m4", author: "u8", minutes: 240, sentiment: "negative", tags: ["missing_context"], comment: "It should have said this was inferred in the first answer, not after I asked.", quote: null, status: "in_progress", assignee: "Jordan Hale" },
  { id: "fb41", message: "c14-m2", author: "u6", minutes: 4, sentiment: "positive", tags: ["saved_time"], comment: "This used to be an analyst ticket with a three-day turnaround.", quote: null, status: "new", assignee: null },
  { id: "fb42", message: "c14-m4", author: "u6", minutes: 7, sentiment: "negative", tags: ["slow"], comment: "90 seconds to add a retailer. It feels broken even if it isn't.", quote: null, status: "new", assignee: null },
  { id: "fb43", message: "c14-m4", author: "u4", minutes: 180, sentiment: "negative", tags: ["slow"], comment: "Same thing on my Walmart dashboard. Two minutes plus.", quote: "Rebuilding took about 90 seconds because each retailer is queried separately.", status: "new", assignee: null },
  { id: "fb44", message: "c14-m2", author: "u7", minutes: 300, sentiment: "positive", tags: ["actionable"], comment: "Units vs price per brand is the view my team asks for every week.", quote: "with a units vs price split", status: "new", assignee: null },
];

function selectionFor(conversationId: string, messageId: string, quote: string | null) {
  if (!quote) return null;
  const message = conversationById.get(conversationId)?.messages.find((item) => item.id === messageId);
  const start = message?.content.indexOf(quote) ?? -1;
  if (start < 0) {
    throw new Error(`Quote not found in ${messageId}: ${quote}`);
  }
  return { start, end: start + quote.length, quote };
}

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export const feedback: Feedback[] = seeds.map((seed) => {
  const conversationId = seed.message.split("-")[0];
  const started = conversationById.get(conversationId)?.startedAt ?? "";
  return {
    id: seed.id,
    conversationId,
    messageId: seed.message,
    authorId: seed.author,
    createdAt: addMinutes(started, seed.minutes),
    sentiment: seed.sentiment,
    tags: seed.tags,
    comment: seed.comment,
    selection: selectionFor(conversationId, seed.message, seed.quote),
  };
});

export const themes: Theme[] = [
  {
    id: "t1",
    label: "Stale crawl data in out-of-stock answers",
    sentiment: "negative",
    summary: "Out-of-stock answers cite crawls that are 3–4 days old, so people act on stock status that has already changed. Mostly Walmart store-level data.",
    feedbackIds: ["fb05", "fb06", "fb22", "fb31", "fb35", "fb37"],
    recommendedAction: "Show crawl age next to every stock number and warn when it is older than 48 hours.",
  },
  {
    id: "t2",
    label: "Dollar-first answers land well",
    sentiment: "positive",
    summary: "People praise answers that open with the dollar impact and the assumption behind it. They paste these straight into notes and slides.",
    feedbackIds: ["fb01", "fb07", "fb11", "fb14", "fb17", "fb21", "fb34"],
    recommendedAction: "Keep dollar-first as the default answer template and add these answers to the golden examples.",
  },
  {
    id: "t3",
    label: "Drill-downs lose retailer context",
    sentiment: "negative",
    summary: "When people drill from brand to SKU, Ally switches or combines retailers without saying so, and the numbers stop reconciling.",
    feedbackIds: ["fb09", "fb23", "fb24"],
    recommendedAction: "Carry retailer and time range through every drill-down and state them in the answer.",
  },
  {
    id: "t4",
    label: "Next steps are too generic",
    sentiment: "negative",
    summary: "Recommended next steps read like generic advice (\"monitor the situation\", \"review your strategy\") with no owner, number, or target.",
    feedbackIds: ["fb04", "fb10", "fb15", "fb27", "fb28", "fb33", "fb39"],
    recommendedAction: "Require each next step to name an owner, a specific SKU or keyword, and a dollar value.",
  },
  {
    id: "t5",
    label: "Units vs price split builds trust",
    sentiment: "positive",
    summary: "The units-versus-price breakdown of gap to plan is the most cited reason answers feel trustworthy.",
    feedbackIds: ["fb02", "fb29", "fb38", "fb44"],
    recommendedAction: "Extend the units vs price split to category and SKU tiers.",
  },
  {
    id: "t6",
    label: "Slides and dashboards are slow",
    sentiment: "negative",
    summary: "Turning an answer into a slide or dashboard takes 90 seconds to 2 minutes, and people abandon it.",
    feedbackIds: ["fb18", "fb42", "fb43"],
    recommendedAction: "Profile the slide and dashboard build path and show progress while it runs.",
  },
];

const ACTION_TEMPLATES: Record<Tag, Omit<RecommendedAction, "id" | "state">> = {
  inaccurate_numbers: {
    label: "Add to the evaluation set",
    rationale: "The numbers in this answer disagree with what the user saw. Capture it as a regression case.",
    suggestedOwner: "Ally eval team",
  },
  outdated_data: {
    label: "Report crawl freshness to Data Ops",
    rationale: "The answer relied on data older than the user's view of the retailer.",
    suggestedOwner: "Data Ops",
  },
  missing_context: {
    label: "Update the prompt to state scope and inference",
    rationale: "The answer left out which retailer, seller, or data source it was using.",
    suggestedOwner: "Ally prompt team",
  },
  wrong_scope: {
    label: "Review tier routing for drill-downs",
    rationale: "The drill-down answered for a different retailer or tier than the one asked about.",
    suggestedOwner: "Ally prompt team",
  },
  not_actionable: {
    label: "Add specific next steps to the answer template",
    rationale: "The recommendation had no owner, number, or target the user could act on.",
    suggestedOwner: "Ally prompt team",
  },
  too_long_unclear: {
    label: "Tighten answer length for this intent",
    rationale: "The user called out filler content in the answer.",
    suggestedOwner: "Ally prompt team",
  },
  slow: {
    label: "Profile latency for this flow",
    rationale: "The user abandoned or nearly abandoned the task while waiting.",
    suggestedOwner: "Platform team",
  },
  accurate: {
    label: "Add to the golden examples",
    rationale: "A confirmed-correct answer is a good reference for evaluation.",
    suggestedOwner: "Ally eval team",
  },
  actionable: {
    label: "Add to the golden examples",
    rationale: "The user called out a concrete, usable recommendation.",
    suggestedOwner: "Ally eval team",
  },
  clear_dollar_impact: {
    label: "Add to the golden examples",
    rationale: "Leading with the dollar impact worked for this user.",
    suggestedOwner: "Ally eval team",
  },
  well_sourced: {
    label: "Add to the golden examples",
    rationale: "The user trusted the answer because it showed its sources.",
    suggestedOwner: "Ally eval team",
  },
  saved_time: {
    label: "Add to the golden examples",
    rationale: "The user reports real time saved on a recurring task.",
    suggestedOwner: "Ally eval team",
  },
  easy_to_follow: {
    label: "Add to the golden examples",
    rationale: "The structure of this answer was easy to follow.",
    suggestedOwner: "Ally eval team",
  },
};

export type TrackingSeed = {
  feedbackId: string;
  status: Status;
  assignee: string | null;
  actions: RecommendedAction[];
  activity: ActivityEvent[];
};

const STATUS_TEXT: Record<Status, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const tracking: TrackingSeed[] = seeds.map((seed) => {
  const item = feedback.find((entry) => entry.id === seed.id)!;
  const author = users.find((user) => user.id === seed.author)!;

  const labels = new Set<string>();
  const actions: RecommendedAction[] = [];
  for (const tag of seed.tags) {
    const template = ACTION_TEMPLATES[tag];
    if (labels.has(template.label)) continue;
    labels.add(template.label);
    actions.push({ id: `${seed.id}-a${actions.length + 1}`, ...template, state: "suggested" });
  }
  if (seed.status === "dismissed") {
    for (const action of actions) action.state = "dismissed";
  } else if (seed.status !== "new" && actions[0]) {
    actions[0].state = "accepted";
  }

  const activity: ActivityEvent[] = [
    { id: `${seed.id}-e1`, type: "created", actor: author.name, at: item.createdAt, detail: "Submitted feedback in Ask Ally" },
  ];
  const push = (type: ActivityEvent["type"], actor: string, minutes: number, detail: string) =>
    activity.push({ id: `${seed.id}-e${activity.length + 1}`, type, actor, at: addMinutes(item.createdAt, minutes), detail });

  if (seed.assignee) push("assignee", "Maya Chen", 90, `Assigned to ${seed.assignee}`);
  if (seed.status !== "new" && actions[0]) {
    push("action", seed.assignee ?? "Maya Chen", 120, `${actions[0].state === "accepted" ? "Accepted" : "Dismissed"}: ${actions[0].label}`);
  }
  if (seed.status === "in_progress" || seed.status === "resolved") {
    push("status", seed.assignee ?? "Maya Chen", 125, `Status changed to ${STATUS_TEXT.in_progress}`);
  }
  if (seed.note) push("note", seed.assignee ?? "Maya Chen", 600, seed.note);
  if (seed.status === "resolved" || seed.status === "dismissed") {
    push("status", seed.assignee ?? "Maya Chen", 1440, `Status changed to ${STATUS_TEXT[seed.status]}`);
  }

  return { feedbackId: seed.id, status: seed.status, assignee: seed.assignee, actions, activity };
});
