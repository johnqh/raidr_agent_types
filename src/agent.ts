/**
 * The raidr agent flow: a request → its intent → candidate sites (raidr MCP
 * servers labeled for that intent) → a run that calls the chosen sites and
 * streams results back.
 *
 * The run streams through the Vercel AI SDK's UI message stream. The custom
 * parts it carries are typed by {@link RaidrAgentDataParts}; the app uses
 * them as `UIMessage<never, RaidrAgentDataParts>`.
 */

import type { McpManifest } from '@sudobility/raidr_types';

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

/**
 * How the user picks sites and how results are shown:
 * - `single`: one site; one detailed result (the best of what it returns).
 * - `best`: several sites; results are compared and one best is shown (e.g. travel booking).
 * - `all`: several sites; every result is listed together (e.g. apartment search).
 */
export type SelectionMode = 'single' | 'best' | 'all';

export const SELECTION_MODES: readonly SelectionMode[] = [
  'single',
  'best',
  'all',
];

/** Who the request is for. Usually the user alone. */
export interface IntentWho {
  kind: 'self' | 'party';
  /** Number of people including the user, when known. */
  partySize?: number;
  /** e.g. `2 adults, 1 child`. */
  description?: string;
}

/** When. `start`/`end` are ISO 8601 (date or date-time) resolved against the user's clock. */
export interface IntentWhen {
  /** The user's words, e.g. `tonight`, `next weekend`. */
  text: string;
  start?: string;
  end?: string;
}

/** One place the request names. */
export interface IntentPlace {
  name: string;
  role?: 'area' | 'origin' | 'destination' | 'stop';
}

/**
 * Where. `current`: near the device (location is asked for); `place`: one
 * named place; `places`: several (e.g. a trip's origin and destination).
 */
export interface IntentWhere {
  kind: 'current' | 'place' | 'places';
  places: IntentPlace[];
}

/**
 * What the user wants, understood with the six W's in mind (the
 * `understand-intent` endpoint). A W that does not apply is `null`.
 */
export interface AgentIntent {
  /** Whether this request requires the device's current location (`where.kind === 'current'`). */
  location_needed: boolean;
  /** Lowercase slug, e.g. `recipe`. */
  intent: string;
  /** raidr site labels that can answer it, most relevant first. */
  labels: string[];
  slots: IntentSlot[];
  resultKind: ResultKind;
  /** Search query to send to the sites. */
  query: string;
  /** The action, e.g. `find events`. */
  what: string;
  who: IntentWho | null;
  /** Constraints or preferences, e.g. `cheapest`, `under $2000/month`. */
  how: string | null;
  when: IntentWhen | null;
  where: IntentWhere | null;
  why: string | null;
  selection: SelectionMode;
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
  /** Why it was suggested for this intent (from site ranking). */
  reason?: string;
  /**
   * The site's largest raster icon (apple-touch-icon, web-app manifest icon
   * or favicon), absolute https. Absent when none was found.
   */
  iconUrl?: string;
  /**
   * Web search results on this site for the request (at most 3), when the
   * `plan-search` step chose to search and the search found the site.
   */
  searchHits?: SearchHit[];
}

/**
 * The `plan-search` step's decision: search the web first for this request.
 * A request naming a specific thing (an artist's concert tickets, a product
 * model) benefits; a generic one ("events around me") does not, and gets no
 * plan.
 */
export interface SearchPlan {
  /** The query to send, in the language people in `country` search in. */
  query: string;
  /**
   * ISO 3166-1 alpha-2 of the region whose web to search (`CN` gets Chinese
   * sites), usually the user's; null searches worldwide.
   */
  country: string | null;
  /** Why searching helps (for logs and the UI). */
  reason: string;
}

/** One web search result. */
export interface SearchHit {
  /** Absolute http(s) URL. */
  url: string;
  title: string;
  snippet: string;
}

/** What the optional search did for `POST /intent`. */
export interface SearchSummary {
  query: string;
  country: string | null;
  /** Results the engine returned. */
  hits: number;
  /** Catalog sites (apiHosts) the results led to. */
  matched: string[];
  /** Result origins not in the catalog, queued for crawling. */
  queued: string[];
  /** Set when the search itself failed (the flow went on without it). */
  error?: string;
}

/** Body of `POST /intent`. */
export interface IntentRequest {
  request: string;
  /** ISO 3166-1 alpha-2 of the device's region, e.g. `US`. Ranks sites. */
  country?: string;
  /** BCP 47, e.g. `en-US`. */
  locale?: string;
  /** IANA zone, e.g. `America/Los_Angeles`; resolves `when`. */
  timeZone?: string;
  /** ISO 8601 of the device clock; resolves `when`. */
  now?: string;
}

/** Answer of `POST /intent`. */
export interface IntentResponse {
  intent: AgentIntent;
  candidates: CandidateSite[];
  /** Present when the request was searched first (`plan-search`). */
  search?: SearchSummary;
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
  /** Tools `prepare` chose, most useful first; the planner sees these first. */
  tools?: string[];
}

/** The run's input, sent alongside the AI SDK chat request to `POST /runs`. */
export interface RunRequest {
  request: string;
  intent: AgentIntent;
  /** Sent only after foreground location permission is granted. */
  location?: GeoLocation;
  sites: RunSiteSelection[];
  /** The user's answers to the prepared form, keyed by {@link FormField.name}. */
  inputs?: Record<string, FormValue>;
}

// =============================================================================
// Prepare: per chosen site, which tools, whether sign-in is needed, which inputs
// =============================================================================

/** Per-endpoint auth from raidr's API docs (`ApiEndpoint.auth`). */
export type ToolAuth = 'none' | 'user' | 'api_key';

/** A value the user entered in the prepared form. */
export type FormValue = string | number | boolean | string[];

export type FormFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'boolean';

/**
 * One input the user is asked for before the run. Names are canonical
 * snake_case (`category`, `keyword`, `start_date`, `price_max`, `party_size`…)
 * so the same field from several sites is asked once.
 */
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  description?: string;
  options?: { value: string; label: string }[];
  /** Prefilled from the intent when it already says it. */
  default?: FormValue;
}

/**
 * Whether a site needs the user signed in for this request:
 * `required` — the request is about the user's own data (or every useful tool is signed-in only);
 * `fallback` — tools are flagged signed-in but the request is public: run without asking (with a stored token if the user has one), ask only on 401/403;
 * `none`.
 */
export type SiteLogin = 'required' | 'fallback' | 'none';

/** `prepare` result for one site. */
export interface SitePlan {
  apiHost: string;
  title: string;
  tools: string[];
  login: SiteLogin;
  /** Shown to the user when `login !== 'none'`. */
  loginReason?: string;
  /** Set when the site cannot serve this request (it is then left out). */
  unsupported?: string;
}

/** Body of `POST /prepare`. */
export interface PrepareRequest {
  request: string;
  intent: AgentIntent;
  sites: string[];
  location?: GeoLocation;
}

/** Answer of `POST /prepare`: per-site plans plus one merged form. */
export interface PrepareResponse {
  sites: SitePlan[];
  form: FormField[];
}

/** An API response field: `endpoint` is the endpoint key (`GET /event/{id}`), `field` a dotted path with `[]` for array items (`entries[].event.url`). */
export interface ResponseFieldRef {
  endpoint: string;
  field: string;
}

/**
 * A page on the site (raidr `SiteRoute`), found by raidr_crawler in the site's
 * routing code. Results get their page URL from these deterministically:
 * a `urlFields` value read from the result's response item, or `url` filled
 * from the item's fields named by each param's `sources`. Never generated.
 */
export interface SitePageRoute {
  /** Absolute template, e.g. `https://luma.com/{slug}`. */
  url: string;
  description?: string;
  params: { name: string; description?: string; sources: ResponseFieldRef[] }[];
  /** Response fields that hold this page's full URL. */
  urlFields: ResponseFieldRef[];
  /** How raidr found the route, strongest first (`router` > `code` > `response` > `visited` > `link`); ranks routes. */
  sources?: SitePageRouteSource[];
  /** Query parameter names the site adds to this URL; fewer is preferred. */
  query?: string[];
}

/** raidr's `SiteRouteSource`: how a route was found, strongest first. */
export type SitePageRouteSource =
  'router' | 'code' | 'response' | 'visited' | 'link';

/** Every {@link SitePageRouteSource}, strongest first. */
export const SITE_PAGE_ROUTE_SOURCES: readonly SitePageRouteSource[] = [
  'router',
  'code',
  'response',
  'visited',
  'link',
];

/**
 * Where a result came from, so its page URL can be built from the raw
 * response: the call, and the JSON path of the item inside its body
 * (`entries[3]`, or `` for the whole body).
 */
export interface ResultSource {
  callId: string;
  tool: string;
  /** The tool's endpoint key (`GET /discover/bootstrap-page`). */
  endpoint: string;
  itemPath: string;
}

/** Everything the agent needs about one site: `GET /sites/:apiHost/context`. */
export interface SiteContext {
  manifest: McpManifest;
  /** Tool name → its endpoint's auth; tools without an API-doc match are absent. */
  toolAuth: Record<string, ToolAuth>;
  /** Page routes of the site's origins (capped). */
  routes: SitePageRoute[];
}

/** Geographic coordinates in decimal degrees. */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
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
  /** Location of this result, when the extractor can identify one. */
  location?: GeoLocation | null;
  id: string;
  apiHost: string;
  siteTitle: string;
  title: string;
  summary: string;
  /** Absolute URL or empty. */
  imageUrl: string;
  /** Absolute URL or empty. */
  sourceUrl: string;
  /**
   * The result's page on the site, built from {@link SitePageRoute}s and the
   * raw response item (host is one of the site's origins); empty when no route
   * maps to the item. Opened in the browser.
   */
  pageUrl: string;
  source?: ResultSource;
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
  /**
   * Set on a failed site when every call it made was refused with 401/403:
   * the app offers "Sign in to <site> and retry".
   */
  needsSignIn?: boolean;
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

/** Stream part `data-best` (`best`/`single` runs): the chosen result. */
export interface BestData {
  resultId: string;
  reason: string;
}

/** One copy of a merged result: which result, and what sets it apart. */
export interface ResultGroupMember {
  resultId: string;
  /** Short difference from the other copies, e.g. "$85 · GA"; '' when none. */
  note: string;
}

/**
 * Results that are the same thing (the same concert on two ticket sites),
 * shown as one item. `members[0]` is the one the item shows; at least two.
 */
export interface ResultGroup {
  members: ResultGroupMember[];
}

/**
 * Stream part `data-groups` (`all` runs, after every site finished): the
 * duplicates merged by the `dedupe` step. Results in no group stand alone.
 */
export interface GroupsData {
  groups: ResultGroup[];
}

/** The custom data parts of a run's UI message stream (`data-<key>`). */
export type RaidrAgentDataParts = {
  run: RunData;
  'site-status': SiteStatusData;
  call: CallData;
  result: ResultItem;
  best: BestData;
  groups: GroupsData;
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
  best?: BestData | null;
  /** Merged duplicates of an `all` run; absent or [] when none. */
  groups?: ResultGroup[];
}

// =============================================================================
// Local mode: the device calls the LLM provider and the sites itself
// =============================================================================

/** Providers the app can call directly with the user's own key. */
export type LocalLlmProvider =
  'openai' | 'anthropic' | 'deepseek' | 'openrouter';

/** Every {@link LocalLlmProvider}, in the app's default order. */
export const LOCAL_LLM_PROVIDERS: readonly LocalLlmProvider[] = [
  'openai',
  'anthropic',
  'deepseek',
  'openrouter',
];

/** One model decision in the agent flow (one ShapeShyft endpoint each). */
export type AgentStep =
  | 'understand'
  | 'plan-search'
  | 'rank-sites'
  | 'prepare'
  | 'plan'
  | 'extract'
  | 'pick-best'
  | 'dedupe';

export const AGENT_STEPS: readonly AgentStep[] = [
  'understand',
  'plan-search',
  'rank-sites',
  'prepare',
  'plan',
  'extract',
  'pick-best',
  'dedupe',
];

/** Body of `POST /llm/payload`. For `understand` the server adds `vocabulary` itself. */
export interface LlmPayloadRequest {
  step: AgentStep;
  input: Record<string, unknown>;
  provider: LocalLlmProvider;
  model?: string;
}

/**
 * The provider request ShapeShyft `/prompt` builds: the device adds the auth
 * header (`auth.header: auth.prefix + key`) and sends it. A structural copy
 * of ShapeShyft's `AiProviderRequest` (whose `provider` is its `LlmProvider`).
 */
export interface AiProviderRequest {
  provider: string;
  model: string;
  method: 'POST';
  /** Full chat URL. */
  url: string;
  /** Non-secret headers, e.g. `content-type`, `anthropic-version`. */
  headers: Record<string, string>;
  /** Where the user's key goes: `{ header: 'Authorization', prefix: 'Bearer ' }` or `{ header: 'x-api-key', prefix: '' }`. */
  auth: { header: string; prefix: string };
  /** Exactly what a server-side invoke would send. */
  body: Record<string, unknown>;
}

/** Answer of `POST /llm/payload`. */
export interface LlmPayloadResponse {
  request: AiProviderRequest;
}

/** Body of `POST /candidates`: the intent's labels, most relevant first. Unranked label matches (local mode ranks them with `rank-sites`). */
export interface CandidatesRequest {
  labels: string[];
}

/** Body of `POST /runs/import`: a run the device ran locally, for History. */
export interface RunImportRequest {
  request: string;
  intent: AgentIntent;
  status: 'done' | 'failed';
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  finishedAt: string;
  sites: { apiHost: string; status: 'done' | 'failed'; error?: string }[];
  /** Finished calls only (`ok` or `error`). */
  calls: CallData[];
  results: ResultItem[];
  best?: BestData | null;
  groups?: ResultGroup[];
}

/**
 * Caps `POST /runs/import` enforces (the server answers 400 above them).
 * `sites` matches `POST /runs`; a run plans at most 4 rounds of 3 calls per
 * site and extracts at most 10 results per site.
 */
export const RUN_IMPORT_LIMITS = {
  sites: 8,
  calls: 200,
  results: 100,
} as const;

/**
 * Answer of `GET /sites/:apiHost/icon`: the domain the site is known by (its
 * first origin's host without `www.`) and its largest raster icon, or null.
 */
export interface SiteIconResponse {
  domain: string;
  iconUrl: string | null;
}

/**
 * One row of `GET /sites/search?q=`: a site whose domain contains the query
 * and that has something to sign in to (`authStyle` is never `'none'`).
 * `apiHost` is what `GET /sites/:apiHost/auth` and the login web view take.
 */
export interface SiteSearchHit {
  /** The site's host without `www.` (`suno.com`). */
  domain: string;
  origin: string;
  apiHost: string;
  title: string;
  authStyle: SiteAuthStyle;
}

/** Answer of `POST /runs/import`. */
export interface RunImportResponse {
  runId: string;
}
