export type MessageRole = "user" | "agent";
export type Sentiment = "positive" | "negative";
export type Status = "new" | "in_progress" | "resolved" | "dismissed";
export type UserRole = "nam" | "category_manager" | "marketing_manager" | "vp_ecommerce";
export type DateRange = "7d" | "30d" | "all";
export type SortKey = "newest" | "oldest";

export type PositiveTag =
  | "accurate"
  | "actionable"
  | "clear_dollar_impact"
  | "well_sourced"
  | "saved_time"
  | "easy_to_follow";

export type NegativeTag =
  | "inaccurate_numbers"
  | "outdated_data"
  | "missing_context"
  | "not_actionable"
  | "wrong_scope"
  | "too_long_unclear"
  | "slow";

export type Tag = PositiveTag | NegativeTag;

export type User = {
  id: string;
  name: string;
  role: UserRole;
  account: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  title: string;
  userId: string;
  retailer: string;
  startedAt: string;
  messages: Message[];
};

export type Selection = {
  start: number;
  end: number;
  quote: string;
};

export type Feedback = {
  id: string;
  conversationId: string;
  messageId: string;
  authorId: string;
  createdAt: string;
  sentiment: Sentiment;
  tags: Tag[];
  comment: string;
  /** `null` means the feedback applies to the whole answer. */
  selection: Selection | null;
};

export type ActionState = "suggested" | "accepted" | "dismissed";

export type RecommendedAction = {
  id: string;
  label: string;
  rationale: string;
  suggestedOwner: string;
  state: ActionState;
};

export type ActivityType = "created" | "status" | "assignee" | "note" | "action";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  actor: string;
  at: string;
  detail: string;
};

export type Theme = {
  id: string;
  label: string;
  sentiment: Sentiment;
  summary: string;
  feedbackIds: string[];
  recommendedAction: string;
};

/** A feedback record joined with everything a list row needs. */
export type FeedbackRow = {
  feedback: Feedback;
  author: User;
  conversation: Pick<Conversation, "id" | "title" | "retailer" | "startedAt">;
  conversationFeedbackCount: number;
  status: Status;
  assignee: string | null;
  themeIds: string[];
};

export type FeedbackDetail = FeedbackRow & {
  conversation: Conversation;
  conversationUser: User;
  siblings: FeedbackRow[];
  actions: RecommendedAction[];
  activity: ActivityEvent[];
  themes: Theme[];
  prevId: string | null;
  nextId: string | null;
  position: number | null;
  listTotal: number;
};

export type ListQuery = {
  q?: string;
  sentiment?: Sentiment;
  tags?: Tag[];
  status?: Status;
  assignee?: string;
  role?: UserRole;
  theme?: string;
  conversation?: string;
  range?: DateRange;
  sort?: SortKey;
  page?: number;
};

export type ListResult = {
  rows: FeedbackRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type FeedbackPatch = {
  status?: Status;
  assignee?: string | null;
  note?: string;
};

export type Kpi = {
  value: number;
  previous: number | null;
};

export type TagCount = {
  tag: Tag;
  count: number;
  share: number;
};

export type DaySentiment = {
  date: string;
  positive: number;
  negative: number;
};

export type ThemeSummary = Theme & {
  count: number;
  previousCount: number;
  quotes: { feedbackId: string; text: string; author: string }[];
};

export type RoleCount = {
  role: UserRole;
  positive: number;
  negative: number;
};

export type Overview = {
  range: DateRange;
  total: Kpi;
  newCount: Kpi;
  positiveShare: Kpi;
  negativeShare: Kpi;
  unassignedOpen: Kpi;
  positive: number;
  negative: number;
  days: DaySentiment[];
  positiveTags: TagCount[];
  negativeTags: TagCount[];
  themes: ThemeSummary[];
  needsAttention: FeedbackRow[];
  roles: RoleCount[];
};
