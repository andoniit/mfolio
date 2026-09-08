import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";
import {
  dim,
  ga4BatchRunReports,
  ga4Config,
  ga4RunRealtimeReport,
  GA4Error,
  isoDate,
  label,
  metric,
  type GA4Report,
  type GA4ReportRequest,
  type GA4Row,
} from "@/lib/ga4";

/** `node:crypto` signs the service-account assertion, so this cannot run on the edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** What the range picker in the app offers. */
const ALLOWED_DAYS = [7, 28, 90, 365];
const DEFAULT_DAYS = 28;

/** Every list on the analytics screen, in the order the screen shows them. */
const TOP_LIMIT = 12;
const PAGE_LIMIT = 15;

type Breakdown = { label: string; sublabel?: string; views: number; users: number; sessions: number };

/**
 * Everything the iOS analytics screen shows, in one request.
 *
 * Same reasoning as `/api/admin/summary`: the phone should make one call, not
 * ten. GA4's Data API caps a batch at five reports, so this is three HTTP
 * round trips to Google (two batches plus realtime) behind one to the site.
 *
 * The service-account key stays on the server — the phone never sees a Google
 * credential, only the numbers.
 */
export async function GET(req: Request) {
  const auth = await verifyAdmin(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = ga4Config();
  if (!config.ok) {
    // Deliberately a 200: "not set up yet" is a screen the app draws, with the
    // steps on it, rather than a red error the owner has to decode.
    return NextResponse.json({ configured: false, reason: config.reason });
  }
  const creds = config.creds;

  const requested = Number(new URL(req.url).searchParams.get("days"));
  const days = ALLOWED_DAYS.includes(requested) ? requested : DEFAULT_DAYS;

  const current = { startDate: `${days - 1}daysAgo`, endDate: "today" };
  const previous = { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo` };

  const SUMMARY_METRICS = [
    "screenPageViews",
    "activeUsers",
    "newUsers",
    "sessions",
    "engagementRate",
    "averageSessionDuration",
  ].map((name) => ({ name }));

  const BREAKDOWN_METRICS = ["screenPageViews", "activeUsers", "sessions"].map((name) => ({ name }));

  const byViews = [{ metric: { metricName: "screenPageViews" }, desc: true }];

  const requests: GA4ReportRequest[] = [
    // 0 — this period and the one before it, so the app can show a trend.
    { dateRanges: [current, previous], metrics: SUMMARY_METRICS },
    // 1 — views per day, oldest first, empty days kept so the chart has no gaps.
    {
      dateRanges: [current],
      dimensions: [{ name: "date" }],
      metrics: BREAKDOWN_METRICS,
      orderBys: [{ dimension: { dimensionName: "date" } }],
      keepEmptyRows: true,
      limit: 400,
    },
    // 2 — countries
    { dateRanges: [current], dimensions: [{ name: "country" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: TOP_LIMIT },
    // 3 — regions, qualified by country ("Maharashtra" alone is ambiguous)
    { dateRanges: [current], dimensions: [{ name: "region" }, { name: "country" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: TOP_LIMIT },
    // 4 — cities, qualified by region and country
    { dateRanges: [current], dimensions: [{ name: "city" }, { name: "region" }, { name: "country" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: PAGE_LIMIT },
    // 5 — pages
    { dateRanges: [current], dimensions: [{ name: "pagePath" }, { name: "pageTitle" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: PAGE_LIMIT },
    // 6 — phone vs laptop vs tablet
    { dateRanges: [current], dimensions: [{ name: "deviceCategory" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: 8 },
    // 7 — how they arrived (search, social, direct…)
    { dateRanges: [current], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: 10 },
    // 8 — and specifically who sent them
    { dateRanges: [current], dimensions: [{ name: "sessionSource" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: 10 },
    // 9 — browsers
    { dateRanges: [current], dimensions: [{ name: "browser" }], metrics: BREAKDOWN_METRICS, orderBys: byViews, limit: 8 },
  ];

  try {
    const [reports, realtime] = await Promise.all([
      ga4BatchRunReports(creds, requests),
      // Realtime is a separate endpoint and a nice-to-have: if it fails (it has
      // its own quota) the rest of the screen should still render.
      ga4RunRealtimeReport(creds, {
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        limit: 10,
      }).catch(() => null),
    ]);

    const [summary, daily, countries, regions, cities, pages, devices, channels, sources, browsers] = reports;

    return NextResponse.json({
      configured: true,
      propertyId: creds.propertyId,
      days,
      generatedAt: new Date().toISOString(),
      totals: totalsFor(summary, 0),
      previousTotals: totalsFor(summary, 1),
      daily: dailyRows(daily),
      realtimeUsers: realtimeTotal(realtime),
      realtimeCountries: realtime ? simpleBreakdown(realtime) : [],
      countries: breakdown(countries),
      regions: breakdown(regions, 1),
      cities: breakdown(cities, 1, 2),
      pages: pageRows(pages),
      devices: breakdown(devices),
      channels: breakdown(channels),
      sources: breakdown(sources),
      browsers: breakdown(browsers),
    });
  } catch (error) {
    const status = error instanceof GA4Error ? error.status : 502;
    const message =
      error instanceof GA4Error ? error.message : "Could not reach Google Analytics. Try again in a moment.";
    console.error("[analytics]", message);
    return NextResponse.json({ error: message }, { status });
  }
}

/* ------------------------------------------------------------------- shaping */

type Totals = {
  views: number;
  users: number;
  newUsers: number;
  sessions: number;
  engagementRate: number;
  avgSessionSeconds: number;
};

const EMPTY_TOTALS: Totals = {
  views: 0,
  users: 0,
  newUsers: 0,
  sessions: 0,
  engagementRate: 0,
  avgSessionSeconds: 0,
};

/**
 * With two date ranges GA4 returns one row per range, tagged with a
 * `dateRange` dimension it adds itself — `date_range_0` is the current period.
 */
function totalsFor(report: GA4Report | undefined, index: number): Totals {
  const rows = report?.rows ?? [];
  const row =
    rows.find((r) => dim(r, 0) === `date_range_${index}`) ?? (rows.length === 1 && index === 0 ? rows[0] : undefined);
  if (!row) return EMPTY_TOTALS;

  return {
    views: metric(row, 0),
    users: metric(row, 1),
    newUsers: metric(row, 2),
    sessions: metric(row, 3),
    engagementRate: metric(row, 4),
    avgSessionSeconds: metric(row, 5),
  };
}

function dailyRows(report: GA4Report | undefined) {
  return (report?.rows ?? []).map((row) => ({
    date: isoDate(dim(row, 0)),
    views: metric(row, 0),
    users: metric(row, 1),
    sessions: metric(row, 2),
  }));
}

/**
 * A top-N list. `sub` indices name the dimensions that qualify the label —
 * a city means little without its region and country.
 */
function breakdown(report: GA4Report | undefined, ...sub: number[]): Breakdown[] {
  return (report?.rows ?? []).map((row) => {
    const parts = sub.map((i) => label(dim(row, i), "")).filter(Boolean);
    return {
      label: label(dim(row, 0)),
      ...(parts.length > 0 ? { sublabel: parts.join(", ") } : {}),
      views: metric(row, 0),
      users: metric(row, 1),
      sessions: metric(row, 2),
    };
  });
}

/** Realtime reports carry one metric, so the shared shape needs padding. */
function simpleBreakdown(report: GA4Report): Breakdown[] {
  return (report.rows ?? [])
    .map((row) => ({ label: label(dim(row, 0)), views: 0, users: metric(row, 0), sessions: 0 }))
    .sort((a, b) => b.users - a.users);
}

function realtimeTotal(report: GA4Report | null): number {
  if (!report) return 0;
  const total = report.totals?.[0];
  if (total) return metric(total, 0);
  return (report.rows ?? []).reduce((sum: number, row: GA4Row) => sum + metric(row, 0), 0);
}

/** Pages keep the path as the identity and the title as the human hint. */
function pageRows(report: GA4Report | undefined): Breakdown[] {
  return (report?.rows ?? []).map((row) => {
    const title = label(dim(row, 1), "");
    return {
      label: label(dim(row, 0), "/"),
      ...(title ? { sublabel: title } : {}),
      views: metric(row, 0),
      users: metric(row, 1),
      sessions: metric(row, 2),
    };
  });
}
