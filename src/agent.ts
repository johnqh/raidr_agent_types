/**
 * The raidr agent flow: a request → its intent → candidate sites (raidr MCP
 * servers labeled for that intent) → a run that calls the chosen sites and
 * streams results back.
 *
 * The run streams through the Vercel AI SDK's UI message stream. The custom
 * parts it carries are typed by {@link RaidrAgentDataParts}; the app uses
 * them as `UIMessage<never, RaidrAgentDataParts>`.
 */

/** The shape of an answer; picks the result view. */
export type ResultKind =
  | 'recipe'
  | 'product'
  | 'article'
  | 'place'
  | 'media'
  | 'financial'
  | 'generic';

export const RESULT_KINDS: readonly ResultKind[] = [
  'recipe',
  'product',
  'article',
  'place',
  'media',
  'financial',
  'generic',
];

/** A concrete value in the request, e.g. `{ name: 'dish', value: 'pad thai' }`. */
export interface IntentSlot {
  name: string;
  value: string;
}

/** What the user wants, as classified by the `classify-intent` endpoint. */
export interface AgentIntent {
  /** Lowercase slug, e.g. `recipe`. */
  intent: string;
  /** raidr site labels that can answer it, most relevant first. */
  labels: string[];
  slots: IntentSlot[];
  resultKind: ResultKind;
  /** Search query to send to the sites. */
  query: string;
}

/** How a site's signed-in token travels (raidr's `McpAuth.style`). */
export type SiteAuthStyle = 'none' | 'bearer' | 'header' | 'cookie';

/** One site the user can pick: a raidr MCP server. */
export interface CandidateSite {
  apiHost: string;
  title: string;
  description: string;
  labels: string[];
  /** The websites behind this API, e.g. `https://suno.com`. */
  siteOrigins: string[];
  toolCount: number;
  /** `none`: usable without signing in. */
  authStyle: SiteAuthStyle;
}

/** Body of `POST /intent`. */
export interface IntentRequest {
  request: string;
}

/** Answer of `POST /intent`. */
export interface IntentResponse {
  intent: AgentIntent;
  candidates: CandidateSite[];
}

/**
 * What the app needs to sign the user in to a site in a web view and
 * recognise the token: `GET /sites/:apiHost/auth`.
 */
export interface SiteAuthInfo {
  apiHost: string;
  /** Page to open; the site's home page when no login page is known. */
  loginUrl: string;
  auth: {
    style: SiteAuthStyle;
    headerName?: string;
    cookieName?: string;
    tokenPrefix?: string;
  };
  /** Path templates of endpoints that only answer when signed in. */
  userPaths: string[];
}

/** A site chosen for a run, with the user's token when it needs one. */
export interface RunSiteSelection {
  apiHost: string;
  /** The site token from the device's secure storage. Used for this run only, never stored. */
  token?: string;
}

/** The run's input, sent alongside the AI SDK chat request to `POST /runs`. */
export interface RunRequest {
  request: string;
  intent: AgentIntent;
  sites: RunSiteSelection[];
}

export interface RecipeDetails {
  /** With amounts, e.g. `200 g rice noodles`. */
  ingredients: string[];
  steps: string[];
  totalMinutes: number | null;
  servings: number | null;
}

export interface ResultField {
  label: string;
  value: string;
}

/** One answer card. */
export interface ResultItem {
  id: string;
  apiHost: string;
  siteTitle: string;
  title: string;
  summary: string;
  /** Absolute URL or empty. */
  imageUrl: string;
  /** Absolute URL or empty. */
  sourceUrl: string;
  /** Filled for `recipe` results. */
  recipe: RecipeDetails | null;
  fields: ResultField[];
}

export type SiteRunStatus =
  'queued' | 'planning' | 'calling' | 'extracting' | 'done' | 'failed';

/** Stream part `data-site-status`: one site's progress (id = apiHost, so it updates in place). */
export interface SiteStatusData {
  apiHost: string;
  title: string;
  status: SiteRunStatus;
  /** Why it failed, or what it is doing. */
  message?: string;
  resultCount?: number;
}

/** Stream part `data-call`: one API call (id = callId, so it updates in place). */
export interface CallData {
  callId: string;
  apiHost: string;
  tool: string;
  arguments: Record<string, unknown>;
  status: 'running' | 'ok' | 'error';
  /** Upstream HTTP status, when the call reached the site. */
  httpStatus?: number;
  durationMs?: number;
}

/** Stream part `data-run`: the run as a whole. */
export interface RunData {
  runId: string;
  status: 'running' | 'done' | 'failed';
  resultCount?: number;
}

/** The custom data parts of a run's UI message stream (`data-<key>`). */
export type RaidrAgentDataParts = {
  run: RunData;
  'site-status': SiteStatusData;
  call: CallData;
  result: ResultItem;
};

export type RunStatus = 'running' | 'done' | 'failed';

/** `GET /runs` row. */
export interface RunSummary {
  id: string;
  request: string;
  intent: AgentIntent;
  status: RunStatus;
  siteCount: number;
  resultCount: number;
  createdAt: string;
  finishedAt: string | null;
}

/** `GET /runs/:id`. */
export interface RunDetail extends RunSummary {
  sites: Array<{
    apiHost: string;
    status: SiteRunStatus;
    error: string | null;
  }>;
  results: ResultItem[];
}
