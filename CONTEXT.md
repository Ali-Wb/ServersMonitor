# VPS Health Dashboard — Project Context

> **Last updated:** March 2026
> **Stack:** Next.js 16.1 · React 19.2 · TypeScript 5 (strict) · Tailwind CSS v4 · shadcn/ui CLI v4 · TanStack Query v5 · Recharts · Zod · C++17

---

## What Is This Project?

This is a full-stack, production-grade **VPS Health Dashboard** system consisting of three components:

1. **A C/C++ agent** (`vpsmon-agent`) — a lightweight daemon on each VPS. Collects metrics in real time, stores tiered history in SQLite, exposes a rate-limited and optionally TLS-secured TCP JSON API with IP allowlisting, dispatches multi-channel alerts, performs anomaly detection, enforces maintenance windows, tracks SLA uptime, persists alert cooldown state across restarts, watches config files via inotify, and schedules recurring email reports.

2. **A Next.js web frontend** (`vpsmon-web`) — a production-quality dashboard. Real-time metrics with per-panel configurable refresh intervals via a React context, drag-and-drop layout, server groups, health scoring, multi-server comparison, metric snapshot diff, deploy webhook auto-annotations, alert acknowledgment, incident comments, per-metric alert silencing, public share links, login audit log, and more.

3. **`vpsmon-tui`** — a standalone C++ ncurses terminal dashboard connecting to agents via the TCP protocol, for SSH sessions without a browser. Supports TLS, API key authentication, and a `--light-bg` flag for light-background terminals.

---

## Monorepo Structure

```
vpsmon/
├── agent/
│   ├── src/
│   │   ├── collectors/
│   │   │   ├── cpu_collector.cpp
│   │   │   ├── ram_collector.cpp
│   │   │   ├── disk_collector.cpp        # I/O + latency + linear-regression prediction
│   │   │   ├── network_collector.cpp     # counter-wrap detection + monthly bandwidth
│   │   │   ├── process_collector.cpp
│   │   │   ├── service_watcher.cpp
│   │   │   ├── port_collector.cpp
│   │   │   ├── gpu_collector.cpp
│   │   │   ├── docker_collector.cpp      # 5s stat cache
│   │   │   ├── fd_collector.cpp
│   │   │   ├── dns_probe.cpp
│   │   │   ├── healthcheck_runner.cpp
│   │   │   ├── uptime_tracker.cpp        # SLA heartbeat logging
│   │   │   ├── config_watcher.cpp        # inotify config file change detection
│   │   │   └── collector.cpp             # CollectorOrchestrator
│   │   ├── storage/
│   │   │   ├── sqlite.cpp                # integrity check wrapper
│   │   │   └── metrics_store.cpp         # tiered downsampling + anomaly + cooldown persistence
│   │   ├── server/
│   │   │   ├── tcp_server.cpp            # per-IP rate limiting + IP allowlist
│   │   │   ├── tls_server.cpp
│   │   │   └── request.cpp
│   │   ├── alerts/
│   │   │   ├── alert_engine.cpp          # thresholds + anomaly + watchdog + maintenance
│   │   │   ├── maintenance_window.cpp
│   │   │   └── channels/
│   │   │       ├── slack_channel.cpp
│   │   │       ├── discord_channel.cpp
│   │   │       ├── telegram_channel.cpp
│   │   │       ├── smtp_channel.cpp      # also used for recurring reports
│   │   │       ├── pagerduty_channel.cpp
│   │   │       └── webhook_channel.cpp
│   │   ├── config/
│   │   │   └── config.cpp
│   │   └── util/
│   │       ├── logger.cpp
│   │       ├── signals.cpp
│   │       └── self_updater.cpp          # GitHub release self-update (TLS=1 required)
│   ├── tui/
│   │   └── main_tui.cpp                  # vpsmon-tui: ncurses, TLS, API key auth, --light-bg
│   ├── include/
│   ├── tests/
│   ├── vendor/sqlite3/
│   ├── scripts/
│   │   └── install.sh
│   ├── Makefile
│   ├── vpsmon.conf.example
│   └── vpsmon-agent.service
│
├── web/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                              # Server list (search + groups)
│   │   ├── servers/[id]/page.tsx                 # Per-server detail
│   │   ├── compare/page.tsx                      # Multi-server comparison (up to 4)
│   │   ├── groups/page.tsx                       # Server group management
│   │   ├── groups/[groupId]/page.tsx             # Group dashboard
│   │   ├── share/[token]/page.tsx                # Public read-only share page
│   │   ├── settings/
│   │   │   ├── page.tsx                          # General + keys + intervals + audit log
│   │   │   ├── thresholds/page.tsx
│   │   │   ├── maintenance/page.tsx
│   │   │   └── silences/page.tsx                 # Per-metric alert silencing
│   │   └── api/
│   │       ├── auth/verify/route.ts
│   │       ├── auth/keys/route.ts
│   │       ├── auth/keys/[keyId]/route.ts
│   │       ├── health/route.ts
│   │       ├── openapi.json/route.ts
│   │       ├── webhook/deploy/route.ts
│   │       ├── share/route.ts                    # Create/revoke public share tokens
│   │       ├── share/[token]/snapshot/route.ts   # Public snapshot endpoint (no auth)
│   │       ├── groups/route.ts
│   │       ├── groups/[groupId]/route.ts
│   │       └── servers/[id]/
│   │           ├── snapshot/route.ts
│   │           ├── history/route.ts
│   │           ├── alerts/route.ts
│   │           ├── alerts/[alertId]/route.ts
│   │           ├── alerts/[alertId]/comments/route.ts
│   │           ├── ping/route.ts
│   │           ├── health/route.ts
│   │           ├── export/route.ts               # CSV/JSON/PDF (light-mode colors, customizable)
│   │           ├── bandwidth/route.ts
│   │           ├── annotations/route.ts
│   │           ├── annotations/[id]/route.ts
│   │           ├── test-alert/route.ts
│   │           ├── uptime/route.ts
│   │           ├── logs/route.ts
│   │           ├── silences/route.ts             # GET/POST per-metric silences
│   │           ├── silences/[id]/route.ts        # DELETE
│   │           └── update/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── panels/
│   │   ├── charts/           # Sparkline, HistoryGraph, LatencySparkline
│   │   ├── layout/           # DashboardLayout, ServerCard, ServerSearch
│   │   ├── alerts/           # AlertTicker, AlertHistory, NotificationCenter
│   │   ├── groups/           # GroupCard, GroupSelector
│   │   └── settings/         # ThresholdEditor, ThemeToggle, KeyManager,
│   │                         # TestAlertButton, MaintenanceWindowEditor,
│   │                         # AuditLogTable, SilenceEditor, ShareManager
│   ├── lib/
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── format.ts
│   │   ├── servers.ts
│   │   ├── auth.ts           # bcrypt key store + audit log + safe file-not-found handling
│   │   ├── mock.ts           # serverId-seeded deterministic data
│   │   ├── schemas.ts        # Zod schemas — single source of truth
│   │   ├── openapi.ts        # auto-generated from schemas
│   │   ├── annotations.ts
│   │   ├── thresholds.ts
│   │   ├── groups.ts
│   │   ├── maintenance.ts    # cron evaluator with explicit feature set
│   │   ├── silences.ts       # per-metric alert silencing CRUD
│   │   ├── share.ts          # public share token management
│   │   ├── comments.ts
│   │   ├── widgets.ts
│   │   └── report.tsx        # PDF with light-mode colors + customizable sections
│   ├── hooks/
│   │   ├── useMetrics.ts
│   │   ├── useLayout.ts
│   │   ├── useKeyboard.ts
│   │   └── useTheme.ts
│   ├── providers/
│   │   ├── QueryProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── IntervalsProvider.tsx  # SSR-safe panel interval context
│   ├── proxy.ts
│   └── next.config.ts
│
└── README.md
```

---

## Frontend Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 16.1** | Turbopack, `proxy.ts`, `"use cache"`, async params |
| Language | **TypeScript 5** | Strict, no `any` |
| Styling | **Tailwind CSS v4** | CSS-first `@theme {}`, no config file |
| Components | **shadcn/ui CLI v4** | `npx shadcn@latest` |
| Validation | **Zod** | `lib/schemas.ts` is source of truth |
| Data Fetching | **TanStack Query v5** | `isPending`, per-panel intervals via `IntervalsProvider` |
| Drag & Drop | **@dnd-kit** | Panel reordering |
| Charts | **Recharts** | History graphs + annotation markers |
| PDF Export | **@react-pdf/renderer** | Light-mode colors always |
| Icons | **Lucide React** | |
| Error Tracking | **Sentry** | `@sentry/nextjs` |
| Runtime | **Node.js 20.9.0+** | |

---

## Critical Framework Rules (MUST FOLLOW IN EVERY TASK)

**Next.js 16:**
1. `proxy.ts` replaces `middleware.ts` — both file name AND exported function name are `proxy`
2. `params` / `searchParams` are Promises — always `const { id } = await params`
3. All routes dynamic by default — use `"use cache"` + `cacheLife()` to opt in
4. Turbopack is default — no `--turbopack` flag
5. `reactCompiler: true` in next.config.ts — never write `useMemo`/`useCallback`
6. Node.js 20.9.0+ required

**Tailwind v4:** No `tailwind.config.ts`. `@import "tailwindcss"`. Tokens in `@theme {}`.

**TanStack Query v5:** `isPending` not `isLoading`. `QueryClientProvider` in `"use client"` wrapper. `refetchInterval` per query.

**Zod schema-first:** `lib/schemas.ts` defines all shapes. Types are `z.infer<>`. OpenAPI auto-generated via `zod-to-json-schema`. Route handlers validate with `.safeParse()`.

---

## Agent: Full Metrics Collected

| Category | Metric | Source |
|---|---|---|
| CPU | Usage % per-core + aggregate, temperature, load avg 1/5/15 | `/proc/stat`, `/sys/class/thermal/` |
| RAM | Total/used/free/cached/buffers, swap | `/proc/meminfo` |
| Disk | Per-mount usage, I/O throughput, I/O latency, **linear regression prediction** | `statvfs()`, `/proc/diskstats` |
| Network | Per-iface rates, **counter-wrap detection**, monthly bandwidth | `/proc/net/dev` |
| Processes | Top N by CPU: PID, name, CPU%, MEM%, RSS, state | `/proc/[pid]/stat`, `/proc/[pid]/status` |
| Services | Systemd active/failed/stopped | `systemctl is-active` via `popen()` |
| Ports | Listening TCP/UDP + owning process | `/proc/net/tcp`, `/proc/net/tcp6`, `/proc/[pid]/fd/` |
| GPU | NVIDIA via `nvidia-smi`; AMD via `/sys/class/drm/` | subprocess + sysfs |
| Docker | Containers: CPU%, MEM%, state, uptime — **5s stat cache** | `/var/run/docker.sock` |
| File Descriptors | System open/limit/%, top 5 consumers | `/proc/sys/fs/file-nr`, `/proc/[pid]/fd/` |
| DNS | Latency per host, success/fail | Raw UDP socket |
| Healthchecks | Exit code, stdout, duration per command | `fork+exec` with timeout |
| Uptime | Agent heartbeats for SLA % computation | SQLite `uptime_log` |
| Config changes | inotify watch on configurable `/etc/` files | `inotify` API |
| System | Uptime seconds, hostname | `/proc/uptime`, `gethostname()` |

---

## Data Storage: Tiered Downsampling

Four resolution tiers keep DB size bounded indefinitely:

| Tier | Resolution | Kept for | Written by |
|---|---|---|---|
| `metrics_raw` | 1 second | 2 hours | Every collector cycle |
| `metrics_1min` | 1 minute | 48 hours | Downsampler thread (AVG per 60s bucket) |
| `metrics_5min` | 5 minutes | 7 days | Downsampler thread |
| `metrics_1hour` | 1 hour | `retention_days` (default 30d) | Downsampler thread |

`queryHistory(metric, fromTimestamp)` selects the correct tier transparently based on `fromTimestamp` age. The downsampler thread wakes every 60 seconds. Steady-state total: ~12,816 rows per metric regardless of agent uptime.

The downsampler **writes aggregated rows before deleting source rows** to prevent data loss on process kill mid-operation.

---

## Alert Cooldown Persistence

**Gap fixed:** The agent's `AlertEngine` previously held cooldown timestamps in memory only. On restart (including SIGHUP config reload or process crash), all cooldowns were lost, causing every active alert to re-fire immediately.

**Solution:** Cooldown state is persisted to a dedicated SQLite table:

```sql
CREATE TABLE alert_cooldowns (
  metric TEXT PRIMARY KEY,
  last_fired_ms INTEGER NOT NULL
);
```

On `AlertEngine` startup: load all rows into `cooldowns_` map.
On every alert trigger: write to the table (upsert) before dispatching channels.
On SIGHUP reload: reload config but keep cooldowns_ in memory (no restart, no re-fire).
On crash+restart: read from DB — cooldowns are intact.

---

## Anomaly Detection

Z-score alerting against same-hour historical baseline. Requires ≥ `min_datapoints` (default 14) hours of data for the current hour-of-day. Activates naturally after ~2 weeks of operation.

### Algorithm

Every hour, compute baseline for that hour-of-day from last 7 days of `metrics_1hour`:
- `mean[metric][hour]` = AVG of all rows where `hour(timestamp) == current_hour`
- `stddev[metric][hour]` = STDDEV of same rows
- Stored in `anomaly_baseline(metric, hour, mean, stddev, computed_at)`

On each snapshot evaluation:
```
z = (currentValue - mean) / stddev
```

If `|z| > threshold_sigma` (default 3.0) AND `stddev >= 0.5` (avoid noise alerts):
- Fire alert: `"Anomaly: CPU at 40% (3.2σ above typical for this hour)"`
- Mark `is_anomaly=1`, store `anomaly_sigma=z` in the alert row
- Subject to normal cooldown

**Anomaly resolution:** When `|z|` drops back below `threshold_sigma`, the anomaly engine sets `resolved_at` on the active anomaly alert — same resolution mechanism as threshold alerts.

### Config

```ini
[anomaly]
enabled = true
threshold_sigma = 3.0
min_datapoints = 14
```

---

## Maintenance Windows

### Architecture — Known Split-Brain Limitation

There are two separate maintenance checks that may disagree:

1. **Frontend-level suppression** (`maintenance.ts` on web server): The `/api/servers/[id]/alerts` route checks `isInMaintenanceWindow(serverId)`. If active, each alert has `suppressed: true`. This affects only the dashboard display — alerts still get dispatched to Slack/PagerDuty by the agent.

2. **Agent-level suppression** (optional): If `VPSMON_MAINTENANCE_CHECK_URL` is configured in the agent, the agent polls this URL every 30 seconds and suppresses channel dispatch when `{"active":true}` is returned. This URL can be `https://your-web-server/api/maintenance-status?serverId=vps-01`.

**Recommended setup for full suppression:** Set `VPSMON_MAINTENANCE_CHECK_URL` in the agent config to point at the web server's maintenance status endpoint. Without this, the agent will still send Slack/PagerDuty alerts during a maintenance window defined in the web UI.

This limitation is documented in the README and settings UI.

### Schedule Format

Windows stored in `maintenance.json` (`VPSMON_MAINTENANCE_PATH`).

Schedule field formats:
- `"cron:0 2 * * 0"` — recurring, standard 5-field cron
- `"once:1712345678000"` — one-time, starts at unix ms timestamp

### Supported Cron Syntax (Explicit Scope)

The built-in cron evaluator in `maintenance.ts` supports **exactly** these features:

| Feature | Example | Supported |
|---|---|---|
| Exact value | `5` | ✓ |
| Wildcard | `*` | ✓ |
| Step | `*/5` | ✓ |
| Range | `1-5` | ✓ |
| List | `1,15,20` | ✓ |
| Last day of month (`L`) | `L` in DOM field | ✗ NOT supported |
| Hash (`#`) | `2#3` | ✗ NOT supported |
| Named months/days | `MON`, `JAN` | ✗ NOT supported |

If an unsupported feature is used, `isInMaintenanceWindow()` logs a warning and returns `false` (conservative — no suppression). The settings UI validates the cron expression before saving and shows an error for unsupported syntax.

The **same feature set** is implemented in the C++ `RecurringReportScheduler`. Both implementations must evaluate the same expressions identically. Tests verify this.

---

## Per-Metric Alert Silencing

In addition to maintenance windows (time-based suppression), users can permanently silence a specific metric alert on a specific server. Example: "disk /data is at 87% and I know — stop alerting me until I manually re-enable it."

### Storage

`VPSMON_SILENCES_PATH` env var (default: `./silences.json`).

```json
[
  {
    "id": "sil_abc123",
    "serverId": "vps-01",
    "metric": "disk_/data",
    "reason": "Intentionally over threshold during data migration",
    "createdBy": "admin",
    "createdAt": 1712345678000,
    "expiresAt": null
  }
]
```

### How It Works

- The `/api/servers/[id]/alerts` route also checks `silences.ts` for each alert's metric
- Silenced alerts have `suppressed: true` (same field as maintenance suppression, with `suppressedReason: 'silence'`)
- The agent-level dispatch is NOT suppressed by silences (only frontend display) — same limitation as maintenance windows
- Silences can have an optional `expiresAt` for auto-expiry
- Admin-only to create/delete

### UI

Settings → Silences: table showing active silences with server, metric, reason, created-by, expiry. Delete button to lift a silence.

On the alert row in `AlertHistory`: if the alert is suppressed by a silence, show a gray "Silenced" badge with the reason in a Tooltip. An "Edit silence" link goes to the silence management page.

---

## Public Share Links

Admins can generate a **read-only public share link** for a single server's current snapshot. This lets external stakeholders see live server status without needing an API key.

### How It Works

- `POST /api/share` creates a share token: a random 32-char URL-safe string stored in `shares.json` (`VPSMON_SHARES_PATH`)
- Token records: `{ id, serverId, createdBy, createdAt, expiresAt (optional), label }`
- The share page at `/share/[token]` is a stripped-down read-only dashboard showing: CPU, RAM, disk, network, services, health score, uptime %
- `/api/share/[token]/snapshot` is a **public** API route (no Authorization header required) that returns the snapshot for the server bound to that token — checked in `proxy.ts` public paths
- Expired tokens return 410 Gone
- Admin can revoke (delete) any token at any time

### Security

- Tokens are generated with `crypto.randomBytes(32).toString('base64url')`
- They are **not** in the standard `/api/*` path so the proxy.ts auth gate does not block them
- The share page does NOT expose: processes, ports, logs, annotations, alert history — only aggregate health data
- Share tokens are listed in Settings → Share Links (admin only)

---

## History Query: Max Points Downsampling

**Gap fixed:** Large history queries returning thousands of raw rows can cause multi-MB responses when multiple panels poll simultaneously.

The `history` command now accepts an optional `maxPoints` parameter:

```json
{ "cmd": "history", "metric": "cpu", "duration": 86400, "maxPoints": 200 }
```

If `maxPoints` is specified and the number of rows exceeds it, the agent performs **time-bucket averaging** to downsample the response:
- Divide the time range into `maxPoints` equal buckets
- For each bucket: return AVG of all values in that bucket, timestamp = bucket midpoint
- If a bucket is empty: skip it (no gap-filling)

The frontend always passes `maxPoints: 300` for Recharts graphs (300 data points is sufficient for any visible chart width). This caps each history response at ~300 points × ~16 bytes = ~5KB regardless of the time range or tier.

The agent's `dispatch()` for `history` passes `maxPoints` down to `queryHistory()` which applies the bucketing post-query.

---

## Webhook Secret Required Policy

**Gap fixed:** The deploy webhook previously allowed all requests if `VPSMON_WEBHOOK_SECRET` was not configured.

**New behavior:** The `/api/webhook/deploy` route handler checks `VPSMON_WEBHOOK_SECRET` at startup. If the env var is **not set**, every POST returns `503 Service Unavailable` with body `{"error":"Webhook not configured — set VPSMON_WEBHOOK_SECRET"}`. This makes the misconfiguration explicit rather than silently allowing unsigned requests.

---

## Auth: Safe File-Not-Found Handling

**Gap fixed:** If `keys.json` is deleted while the web server is running, the 5-second in-memory cache expires. On the next request, reading the non-existent file would throw an unhandled error crashing the route handler.

**Solution in `getKeyStore()`:**

```typescript
try {
  const raw = await fs.readFile(path, 'utf8')
  // parse and return
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
    // File was deleted after initial load. Treat as empty = auth disabled.
    // LOG a warning so the operator knows.
    console.warn('[auth] keys.json was deleted — auth is now disabled until file is restored')
    return []
  }
  throw err  // Re-throw genuine I/O errors
}
```

Additionally: the `verifyApiKeyCached()` sync path has the same guard — if the cached keys array is populated but the file disappears, the next cache refresh will log the warning and return `[]` (auth disabled), never throw.

---

## IntervalsProvider: SSR Safety

**Gap fixed:** `IntervalsProvider` reads from `localStorage` on mount, but Next.js 16 SSR runs components on the server where `localStorage` does not exist. An unguarded `localStorage.getItem()` in a component throws a `ReferenceError` during server rendering.

**Solution:** The provider uses a safe accessor:

```typescript
function safeGetIntervals(): Record<string, number> {
  if (typeof window === 'undefined') return {}  // SSR: return empty, use defaults
  try {
    const raw = localStorage.getItem('vpsmon-intervals')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
```

All `getInterval(panelId, defaultMs)` calls fall back to `defaultMs` during SSR and hydrate to user-configured values client-side. This is correct — panels don't render on the server anyway in this project (all panels are `'use client'`).

---

## vpsmon-tui: Full Specification

A standalone C++ ncurses binary connecting to agents via TCP.

### CLI

```bash
vpsmon-tui --host 127.0.0.1 --port 7070
vpsmon-tui --host 10.0.0.1 --port 7070 --key myapikey  # authenticated
vpsmon-tui --host 10.0.0.1 --port 7070 --tls           # TLS (requires VPSMON_TLS=1 at compile time)
vpsmon-tui --light-bg                                   # adjust colors for light-background terminals
vpsmon-tui --servers vps-01:127.0.0.1:7070,vps-02:10.0.0.2:7070
```

### API Key Authentication in TUI

All requests from the TUI include the key as a JSON field:
```json
{ "cmd": "snapshot", "key": "myapikey" }
```

The agent's TCP server checks the `key` field when auth is enabled (when `tui_auth_enabled = true` in config, or when any `allowed_ips` are set). The TUI stores the key in memory only — never written to disk.

### TLS in TUI

The TUI TLS path uses `SSL_connect()` and is only compiled when `VPSMON_TLS=1`. If TLS is not compiled in and `--tls` is passed: print error and exit. The `Makefile` `tui-tls` target builds the TUI with TLS support.

### Light-Background Terminal Support (`--light-bg`)

When `--light-bg` is set, the TUI swaps its color pairs:
```
init_pair(1, COLOR_GREEN,   COLOR_WHITE)  // replaces BLACK background
init_pair(2, COLOR_YELLOW,  COLOR_WHITE)
init_pair(3, COLOR_RED,     COLOR_WHITE)
init_pair(4, COLOR_BLUE,    COLOR_WHITE)  // header (replaces CYAN)
```
Text that was white becomes black (for readability on light background).

---

## Agent Self-Update: TLS Requirement

**Gap documented:** The `SelfUpdater` fetches from `api.github.com` which requires HTTPS. A plain HTTP connection to port 443 will fail.

**Behavior:**
- Self-update (`--update` flag or `{"cmd":"update"}`) requires `TLS=1` to be compiled in
- At startup, if `--update` is detected AND `VPSMON_TLS` is not defined: print error `"Self-update requires TLS support. Recompile with: make TLS=1"` and exit 1
- In the `dispatch()` handler for `"update"`: return `{"ok":false,"error":"self-update requires TLS support — recompile with make TLS=1"}` if `!VPSMON_TLS`
- The README documents this requirement clearly: "Self-update requires `make TLS=1`"

---

## Custom Widget Expression Evaluator: Full Specification

**Gap fixed:** Previous spec was ambiguous about arrays and error cases.

### Supported Syntax

```
expression ::= term (('+' | '-') term)*
term        ::= factor (('*' | '/') factor)*
factor      ::= number | field_path | '(' expression ')' | math_func
field_path  ::= identifier ('.' identifier | '[' index ']')*
math_func   ::= 'Math.min(' expression ',' expression ')'
              | 'Math.max(' expression ',' expression ')'
number      ::= [0-9]+ ('.' [0-9]+)?
index       ::= [0-9]+
```

### Array Access

Arrays are accessed by numeric index: `disks[0].usagePercent`, `network[0].rxBytesPerSec`.

The settings UI shows a preview of available field paths computed from the latest snapshot structure. When a user types in the expression box, the preview evaluates live against mock data and shows the computed value.

### Error Cases

| Situation | Behavior |
|---|---|
| Path does not exist | Return `NaN`, display `"—"` |
| Division by zero | Return `NaN`, display `"—"` |
| Array index out of bounds | Return `NaN`, display `"—"` |
| Malformed expression (parse error) | Return `NaN`, display `"ERR"` with red color |
| Infinite loop potential | Not possible — no loops in grammar |
| Result is `Infinity` | Display `"∞"` in amber |
| Result is negative | Display as-is (some derived metrics may be negative) |

---

## Cron Evaluator: Consistent Specification

Both `maintenance.ts` (TypeScript/Node.js) and `recurring_report_scheduler.cpp` (C++) must implement **exactly the same cron evaluator** supporting the same feature set. See "Supported Cron Syntax" section above.

Tests in `test_maintenance.cpp` and `lib/__tests__/maintenance.test.ts` use the **same test vectors** to verify both implementations agree:

| Expression | Expected human description | Must trigger at | Must NOT trigger at |
|---|---|---|---|
| `0 2 * * *` | Daily at 2:00 AM | Monday 02:00 | Monday 02:01 |
| `0 8 * * 1` | Every Monday at 8:00 AM | Mon 08:00 | Tue 08:00 |
| `*/5 * * * *` | Every 5 minutes | :00, :05, :10 | :01, :03 |
| `0 0 1,15 * *` | 1st and 15th of month | 1st 00:00, 15th 00:00 | 2nd 00:00 |
| `0 9-17 * * 1-5` | Weekdays 9–5 | Mon 09:00, Fri 17:00 | Sat 09:00 |

---

## PDF Report: Customizable Sections

**Gap fixed:** Previous spec had no customization options.

`generateSummaryReport()` accepts an `options` parameter:

```typescript
interface ReportOptions {
  sections: ('cover' | 'summary' | 'cpu' | 'ram' | 'disk' | 'network' | 'uptime' | 'alerts' | 'healthchecks')[]
  companyName?: string   // shown on cover page; defaults to hostname
  logoBase64?: string    // base64 PNG, shown on cover page; optional
  periodLabel?: string   // overrides the auto-generated "Last 7 days" label
}
```

The export route reads `sections` from query params: `?format=pdf&sections=cover,summary,cpu,ram,disk`

The export UI in the dashboard has checkboxes for each section and an optional company name input.

---

## Health Score: Trending and Alerting

**Gap addressed:** The health score is computed client-side from snapshots but never stored, trended, or alerted on.

**Solution:** The `CollectorOrchestrator` computes a simplified server-side health score after each snapshot and writes it as a metric:

```
metric name: "health_score"
value: same 0-100 algorithm as frontend
written to: metrics_raw (and thus downsampled through all tiers)
```

This means:
- Health score history is available in history graphs (HistoryGraph for metric `"health_score"`)
- Health score can be used in custom widget expressions: `health_score` (resolved via special-case in evaluator)
- The anomaly detector runs on `health_score` like any other metric
- A health score alert fires if score drops below a configurable `health_score_threshold` (default: 50)

New agent config:
```ini
[alerts]
health_score_threshold = 50   # alert if computed health score drops below this
```

---

## Alert Silencing vs Maintenance Windows: Comparison

| Feature | Maintenance Window | Per-Metric Silence |
|---|---|---|
| Scope | All alerts on a server | One specific metric on one server |
| Duration | Time-bounded (cron or one-time) | Indefinite (optional expiry) |
| Frontend suppression | ✓ | ✓ |
| Agent dispatch suppression | ✓ (with MAINTENANCE_CHECK_URL) | ✗ frontend-only |
| Use case | Planned maintenance | Known-acceptable condition |
| Auth required | Admin | Admin |

---

## GDPR / Audit Log Data Retention

The audit log records IP addresses which may be considered personal data in some jurisdictions. The system handles this with:

- **Configurable retention:** `VPSMON_AUDIT_RETENTION_DAYS` env var (default: 90). Entries older than this are pruned on each write.
- **IP anonymization:** `VPSMON_AUDIT_ANONYMIZE_IPS=true` replaces the last octet of IPv4 addresses with `0` and the last 64 bits of IPv6 with `::` before storing. This is enabled by default in the `.env.local.example`.
- **Opt-out:** `VPSMON_AUDIT_ENABLED=false` disables the audit log entirely.

These options are documented in the README under "Privacy and Compliance".

---

## Design Principles

- **No vibe-coded slop.** Every component typed. No `any`. No approximation.
- **Schema-first.** Zod schemas in `schemas.ts` are the canonical truth for all shapes.
- **Bounded storage.** Tiered downsampling + maxPoints keep DB and response sizes constant.
- **Cooldown persistence.** Alert cooldowns survive agent restarts — no alert storms.
- **Auth by default.** All `/api/*` requires valid key unless explicitly disabled.
- **Safe file handling.** Atomic writes everywhere. Safe ENOENT handling in auth.
- **Deterministic mocks.** Seeded by serverId for meaningful multi-server testing.
- **Dual threshold clarity.** Agent alerting thresholds and frontend display thresholds are explicitly separate systems.
- **Observable.** Sentry, Web Vitals, agent health, version mismatch, login audit, config change detection, health score trending.
- **Explicit limitations documented.** Maintenance window split-brain, self-update TLS requirement, cron feature set scope — all documented in CONTEXT.md and README.

---

## Key Constraints

- Agent is **Linux-only** (reads `/proc`, `/sys`). Ubuntu 22.04+ primary.
- Agent core: only SQLite (bundled) + optional OpenSSL for TLS/self-update/TUI-TLS.
- **Self-update requires TLS=1** — `api.github.com` is HTTPS-only.
- Alert **cooldowns persisted to SQLite** — survive restarts, no re-fire storms.
- Docker stats **cached 5s**. Network counter **wrap detection**. Per-IP **rate limiting**. **IP allowlist**.
- API keys stored as **bcrypt hashes** with optional expiry. **Login audit log** with configurable retention + IP anonymization.
- SQLite **integrity check + auto-recovery** on startup.
- **Tiered downsampling** keeps DB bounded. **maxPoints** caps response size.
- **Anomaly detection** activates after 2 weeks. Anomaly alerts have `resolved_at` set when Z-score normalizes.
- **Maintenance windows** suppress frontend display. Agent-level suppression requires `VPSMON_MAINTENANCE_CHECK_URL`.
- **Per-metric silences** suppress frontend display only.
- **Public share links** expose health-only read-only view; processes/ports/logs/annotations NOT included.
- **Webhook endpoint returns 503 if `VPSMON_WEBHOOK_SECRET` is not set** — no open endpoints.
- **`IntervalsProvider` is SSR-safe** — `typeof window` guard prevents SSR crashes.
- **Cron evaluator has explicit documented feature set** — same features in both TypeScript and C++ implementations.
- **Custom widget array access** via `field[0].subfield` syntax — explicitly specified.
- **PDF always uses light-mode colors** — never dark theme regardless of user preference.
- **No `useMemo`/`useCallback`** — React Compiler handles memoization.

---

## Full Config File Reference (`/etc/vpsmon.conf`)

```ini
[server]
port = 7070
bind = 127.0.0.1
tls = false
tls_cert = /etc/vpsmon/cert.pem
tls_key  = /etc/vpsmon/key.pem
rate_limit_rps = 10
allowed_ips =                          # empty = allow all; comma-separated to restrict
tui_auth_enabled = false               # require key field in TUI requests

[poll]
interval_ms = 1000

[alerts]
cpu_threshold = 90
ram_threshold = 85
disk_threshold = 90
fd_threshold = 80
health_score_threshold = 50            # alert if health score drops below this
alert_duration_s = 30
startup_warmup_s = 5                   # suppress all alerts for N seconds after startup

[anomaly]
enabled = true
threshold_sigma = 3.0
min_datapoints = 14

[channels]
enabled = slack, webhook
slack_webhook_url = https://hooks.slack.com/...
discord_webhook_url = https://discord.com/api/webhooks/...
telegram_bot_token = 123456:ABC-DEF
telegram_chat_id = -1001234567890
smtp_host = smtp.example.com
smtp_port = 587
smtp_user = alerts@example.com
smtp_pass = secret
smtp_from = alerts@example.com
smtp_to   = admin@example.com
pagerduty_integration_key = abc123
webhook_url = https://example.com/hook
webhook_template = {"text":"${message}","metric":"${metric}","value":${value}}

[maintenance]
check_url =                            # if set, agent polls this URL for maintenance status
                                       # expected response: {"active":true/false}

[services]
watch = nginx, sshd, postgresql, redis

[docker]
enabled = true
socket = /var/run/docker.sock
cache_ttl_s = 5

[gpu]
enabled = auto
backend = auto

[dns]
enabled = true
check_hosts = 1.1.1.1, 8.8.8.8, google.com
interval_s = 30

[healthchecks]
web_up    = curl -sf http://localhost:80/health
db_up     = pg_isready -U postgres
interval_s = 60
timeout_s  = 10

[config_watch]
enabled = true
files = /etc/ssh/sshd_config, /etc/nginx/nginx.conf, /etc/crontab, /etc/hosts

[bandwidth]
enabled = true
reset_day = 1

[prediction]
disk_enabled = true
disk_history_hours = 168

[uptime]
enabled = true
heartbeat_interval_s = 60

[recurring_reports]
enabled = false
schedule = cron:0 8 * * 1             # cron: or once:<unix_ms>
recipients = admin@example.com
period_days = 7

[history]
db_path = /var/lib/vpsmon/metrics.db
retention_days = 30
```

---

## Extended Wire Protocol

All commands: JSON with `\n` terminator. All responses: `{"ok":bool,"ts":ms,"data":...}`.

The optional `"key"` field is accepted on all commands for TUI authentication:
`{ "cmd": "snapshot", "key": "myapikey" }`

| Command | Notes |
|---|---|
| `snapshot` | Full metrics snapshot. `data` is Snapshot object. |
| `history` | Accepts `metric`, `duration` (seconds), `maxPoints` (optional, default unbounded). |
| `alerts` | Returns alerts with `resolvedAt`, `acknowledged`, `isAnomaly`, `anomalySigma`. |
| `ping` | Returns `"pong"`. |
| `health` | Returns version, dbSizeBytes, totalMetricRows, tlsEnabled, anomalyEnabled, cooldownsPersisted. |
| `bandwidth` | Accepts `period`: `day`/`week`/`month`. |
| `test-alert` | Returns `{"channelsTriggered":[...]}`. |
| `resolve-alert` | Accepts `alert_id`. |
| `acknowledge-alert` | Accepts `alert_id`, `acknowledged_by`. |
| `logs` | Accepts `lines` (max 500). Returns `{"lines":[...]}`. |
| `uptime` | Accepts `period`: `day`/`week`/`month`. |
| `update` | Loopback-only. **Requires TLS=1 compilation.** Returns `{"status":"initiated"}`. |
| `set-anomaly-baseline` | Forces immediate baseline recompute for all metrics. |

---

## Coding Guidelines

These guidelines apply to every file in this project. Codex must follow all of them on every task, without being reminded. They are not suggestions — they are requirements.

---

### General Principles

**Write code for the reader, not the compiler.** Every function, variable, and type should communicate its intent without requiring a comment. If a comment is needed to explain *what* code does, the code should be rewritten. Comments explain *why*, not *what*.

**One thing per function.** A function that does more than one thing should be split. If you cannot describe a function's purpose in a single sentence without the word "and", split it.

**Explicit over implicit.** Never rely on default behavior that is not obvious. Always be explicit about types, return values, error paths, and intent. Implicit `undefined` returns, implicit type coercions, and implicit fallbacks to defaults are bugs waiting to happen.

**No dead code.** Do not leave commented-out code, unused imports, unused variables, or unused functions. If something is no longer needed, delete it completely.

**No magic numbers or strings.** Every numeric constant with a non-obvious meaning must be a named constant. Every string used as a key, identifier, or selector must be defined in one place. `const ALERT_COOLDOWN_TTL_S = 30` is correct. `30` scattered through the code is not.

---

### TypeScript / React Guidelines

#### Types and Schemas

```typescript
// CORRECT: derive types from Zod schemas — never write interfaces manually
import { z } from 'zod'
export const UserSchema = z.object({ id: z.string(), role: z.enum(['admin', 'readonly']) })
export type User = z.infer<typeof UserSchema>

// WRONG: manually written interface that can drift from schema
interface User { id: string; role: 'admin' | 'readonly' }
```

- **Never use `any`**. If a type is genuinely unknown, use `unknown` and narrow it explicitly.
- **Never use `as` type assertions** unless you have verified the shape manually and left a comment explaining why.
- **Always type function parameters and return values** explicitly. Never rely on inference for public function signatures.
- All optional fields use `z.nullable()` in Zod schemas, not `z.optional()` — the agent sends `null`, not `undefined`.
- All API response data must be validated with `Schema.safeParse()` before use. On parse failure, throw an `ApiError`.

#### Components

```typescript
// CORRECT: explicit props interface derived from schema or manually declared
interface CpuPanelProps {
  cpu: CpuMetrics
  history: HistoryPoint[]
  isPending?: boolean
}
export function CpuPanel({ cpu, history, isPending = false }: CpuPanelProps) { ... }

// WRONG: no explicit interface, props inlined
export function CpuPanel({ cpu, history, isPending }: { cpu: any, history: any[], isPending?: boolean }) { ... }
```

- Every component has an explicitly named props interface directly above it.
- Every component is a named function export, never a default arrow function. `export function CpuPanel()` not `export default () =>`.
- **Never use `useMemo`, `useCallback`, or `React.memo`**. React Compiler (enabled in `next.config.ts`) handles memoization automatically. Writing these manually conflicts with the compiler and will produce incorrect behavior.
- **Never use `useEffect` for data fetching**. Use TanStack Query hooks exclusively.
- `useEffect` is permitted only for: DOM event listeners, `setInterval`/`setTimeout`, third-party library initialization, and `localStorage` reads on mount.
- All `useEffect` calls must return a cleanup function when they register any listener or timer.
- All client components must have `'use client'` as the very first line — before any imports.
- Components must handle all three data states explicitly: `isPending` (show skeleton), `isError` (show error state), and data present (show content). There is no fourth state.

#### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `CpuPanel`, `AlertHistory` |
| Hooks | camelCase prefixed with `use` | `useSnapshot`, `useLatencyHistory` |
| Utility functions | camelCase | `formatBytes`, `getThresholdColor` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_HISTORY_POINTS`, `WELL_KNOWN_PORTS` |
| Types/Interfaces | PascalCase | `Snapshot`, `AlertEvent` |
| Zod schemas | PascalCase suffixed with `Schema` | `SnapshotSchema`, `AlertEventSchema` |
| Route handlers | lowercase with hyphens (file system) | `snapshot/route.ts`, `alert-comments/route.ts` |
| Event handlers | camelCase prefixed with `on` or `handle` | `onRefresh`, `handleDragEnd` |
| Boolean props | camelCase prefixed with `is`/`has`/`can` | `isPending`, `hasError`, `isOnline` |
| Files | kebab-case for utilities, PascalCase for components | `format.ts`, `CpuPanel.tsx` |

#### File Structure Rules

- One component per file. A file named `CpuPanel.tsx` exports exactly one component: `CpuPanel`.
- Helper components that only exist to support one parent component may be in the same file but are not exported.
- All imports are grouped and ordered: 1) React and Next.js, 2) third-party libraries, 3) internal absolute imports (`@/lib/...`, `@/components/...`), 4) relative imports. A blank line separates each group.
- No barrel files (`index.ts`) — import directly from the source file.

#### Styling

```typescript
// CORRECT: Tailwind classes, cn() for conditional classes
<div className={cn('font-mono text-4xl', getThresholdColor(cpu.usage))}>

// WRONG: inline styles, string concatenation, hardcoded colors
<div style={{ color: cpu.usage > 85 ? '#ef4444' : '#22c55e', fontFamily: 'monospace' }}>
```

- **Never use inline styles**. All styles use Tailwind classes.
- **Never hardcode hex colors**. Use CSS variables (`var(--color-destructive)`) or Tailwind classes that map to them.
- **Never hardcode theme-specific colors**. Use semantic classes (`text-muted-foreground`, `bg-card`, `border-border`) that adapt to light/dark mode automatically.
- Use `cn()` from `lib/utils.ts` for all conditional className logic.
- All metric values (numbers, units, timestamps) use `className="font-mono"`.
- All threshold-colored values use `getThresholdColor()` from `lib/format.ts` — never hardcode `text-red-400` directly.
- Responsive breakpoints use Tailwind prefixes only: `sm:`, `md:`, `lg:`, `xl:`. Never write CSS media queries inside component files.
- Animations use the pre-defined keyframes from `globals.css`. Never define new keyframes in component files.

#### Error Handling

```typescript
// CORRECT: explicit error boundary with typed error
async function fetchAgentHealth(serverId: string): Promise<AgentHealth> {
  const res = await fetch(`/api/servers/${serverId}/health`, { cache: 'no-store' })
  if (res.status === 401) throw new ApiError(401, 'Unauthorized')
  if (!res.ok) throw new ApiError(res.status, `Agent health fetch failed: ${res.statusText}`)
  const json = await res.json()
  const parsed = AgentHealthSchema.safeParse(json.data)
  if (!parsed.success) throw new ApiError(500, 'Invalid agent health response shape')
  return parsed.data
}

// WRONG: swallow errors, return undefined, ignore parse failures
async function fetchAgentHealth(serverId: string) {
  try {
    const res = await fetch(`/api/servers/${serverId}/health`)
    return await res.json()
  } catch { return undefined }
}
```

- Every `async` function that can fail must either return a typed result or throw a typed error. Never return `undefined` on failure.
- Every `try/catch` block must handle the error explicitly. An empty `catch {}` is never acceptable.
- API route handlers must catch all errors and return structured JSON: `{ ok: false, error: 'message' }` with an appropriate HTTP status. Never let an exception propagate to Next.js's default error handler in production routes.
- All user-facing error messages must be human-readable. Stack traces and internal error codes must never reach the browser.

#### API Route Handlers

```typescript
// CORRECT: Next.js 16 async params, Zod validation, typed response
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params                          // ALWAYS await params in Next.js 16
  const { searchParams } = new URL(request.url)
  const duration = Number(searchParams.get('duration') ?? '3600')
  if (isNaN(duration) || duration < 1) {
    return NextResponse.json({ ok: false, error: 'Invalid duration' }, { status: 400 })
  }
  const server = getServer(id)
  if (!server) return NextResponse.json({ ok: false, error: 'Server not found' }, { status: 404 })
  // ...
}
```

- **Always `await params`** — this is a Next.js 16 breaking change. Forgetting this causes runtime errors.
- **Always validate query parameters** with Zod or explicit checks before using them.
- **Always check role** from `X-User-Role` header for admin-only routes. Return `403` with `{ ok: false, error: 'Forbidden' }` if role is `readonly`.
- **Never use `"use cache"`** on routes that proxy to the agent — agent data is always dynamic.
- **Always return `NextResponse.json()`** — never use `Response.json()` or raw strings.

---

### C++ Guidelines

#### Code Style

- **C++17 features are available and encouraged**: structured bindings, `std::optional`, `std::variant`, `std::string_view`, `if constexpr`, fold expressions.
- **Indentation**: 2 spaces. No tabs. Ever.
- **Braces**: always on the same line as the statement (`if (x) {`, not `if (x)\n{`).
- **Line length**: soft limit of 100 characters. Never exceed 120.
- **Header guards**: use `#pragma once` — never old-style `#ifndef` guards.

#### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Classes | PascalCase | `MetricsStore`, `AlertEngine` |
| Methods | camelCase | `queryHistory()`, `writeMetricBatch()` |
| Private members | camelCase suffixed with `_` | `running_`, `prevStats_` |
| Local variables | camelCase | `rxDelta`, `totalRows` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CLIENTS`, `CACHE_TTL_S` |
| Enums | PascalCase for type, SCREAMING_SNAKE_CASE for values | `enum class LogLevel { DEBUG, INFO }` |
| Files | snake_case | `metrics_store.cpp`, `cpu_collector.hpp` |
| Namespaces | lowercase | `vpsmon::storage` |

#### Class Design

```cpp
// CORRECT: RAII, explicit ownership, no raw owning pointers
class MetricsStore {
public:
  explicit MetricsStore(const std::string& dbPath);  // explicit on single-arg constructors
  ~MetricsStore();                                    // defined in .cpp, not inline
  MetricsStore(const MetricsStore&) = delete;         // no copy
  MetricsStore& operator=(const MetricsStore&) = delete;
  MetricsStore(MetricsStore&&) = default;             // move is fine
private:
  Database db_;        // value member, not pointer
  std::thread thread_; // owns the thread
};

// WRONG: raw pointer members, missing delete, implicit copy
class MetricsStore {
  Database* db;        // who owns this?
  pthread_t thread;    // raw POSIX handle
};
```

- All single-argument constructors are marked `explicit`.
- All classes that are not meant to be copied declare `= delete` on copy constructor and copy assignment.
- **No raw owning pointers**. Use `std::unique_ptr` if heap allocation is needed. Prefer value members.
- Destructors are always defined in the `.cpp` file, even if empty — this prevents implicit inline destructors from requiring complete type definitions in headers.
- All member variables are initialized either in the class body or the constructor initializer list. Never in the constructor body unless assignment is truly needed.

#### Threading

```cpp
// CORRECT: atomic flag, mutex protects shared data, join on stop
class TcpServer {
public:
  void start() {
    running_.store(true);
    thread_ = std::thread(&TcpServer::acceptLoop, this);
  }
  void stop() {
    running_.store(false);
    if (thread_.joinable()) thread_.join();  // always join, never detach owned threads
  }
private:
  void acceptLoop() {
    while (running_.load()) { ... }
  }
  std::atomic<bool> running_{false};
  std::thread thread_;
  mutable std::shared_mutex mutex_;    // shared_mutex for read-write separation
};
```

- All shared state accessed from multiple threads must be protected by a `std::mutex` or `std::shared_mutex`.
- Use `std::atomic<bool>` for stop flags — never a plain `bool`.
- **Never detach threads that the class owns**. Always join on destruction. A detached thread that accesses class members after the class is destroyed is undefined behavior.
- Use `std::lock_guard` for exclusive locks, `std::shared_lock` for read locks. Never call `mutex.lock()` directly.
- Locks must be held for the minimum possible time. Never hold a lock while doing I/O, sleeping, or calling external code.

#### Error Handling

```cpp
// CORRECT: throw with descriptive message, catch at boundary
void Database::exec(const std::string& sql) {
  if (sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, nullptr) != SQLITE_OK) {
    throw std::runtime_error("SQLite exec failed [" + sql.substr(0, 50) + "]: "
                              + sqlite3_errmsg(db_));
  }
}

// WRONG: return code checking scattered everywhere, silent failures
int result = sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, nullptr);
if (result != SQLITE_OK) { /* sometimes checked, sometimes not */ }
```

- Throw `std::runtime_error` (or a subclass) for unrecoverable errors. Include enough context in the message to diagnose the problem from a log file alone.
- Catch exceptions at system boundaries: the TCP request handler, the collector loop, the downsampler thread. Never let an exception propagate out of a thread — it will call `std::terminate`.
- Each background thread's main loop must wrap its body in `try/catch(std::exception&)` and log the error before continuing or exiting.
- **Never use `errno` directly**. Call `strerror(errno)` immediately after the failing call and store it as a string before any other system call.
- System calls that can return `EINTR` (read, write, accept, poll) must retry on `EINTR`.

#### Memory Management

- Prefer stack allocation over heap allocation.
- Prefer `std::string` over `char*`. Prefer `std::vector` over `new[]`.
- When C APIs require `char*` output buffers, use `std::vector<char>` with `.data()`.
- Never use `malloc`/`free`. Never use `new`/`delete` directly — use smart pointers.
- All resources that require cleanup (file descriptors, sockets, SSL contexts) must be wrapped in RAII types with destructors that clean up unconditionally.

#### JSON Serialization (Manual — No External Library)

Since the agent builds JSON manually, follow these rules without exception:

```cpp
// CORRECT: escape strings, handle null, use snprintf for doubles
static std::string jsonStr(const std::string& s) {
  std::string out = "\"";
  for (char c : s) {
    switch (c) {
      case '"':  out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n";  break;
      case '\r': out += "\\r";  break;
      case '\t': out += "\\t";  break;
      default:
        if (static_cast<unsigned char>(c) < 0x20) {
          char buf[8]; snprintf(buf, sizeof(buf), "\\u%04x", c); out += buf;
        } else { out += c; }
    }
  }
  return out + "\"";
}

static std::string jsonDouble(double v) {
  if (v == -1.0) return "null";    // sentinel value for "unavailable"
  char buf[32]; snprintf(buf, sizeof(buf), "%.6g", v); return buf;
}
```

- Every string value must go through `jsonStr()` before being embedded in JSON output.
- Doubles use `"%.6g"` format (no trailing zeros, no scientific notation for typical values).
- The sentinel value `-1.0` serializes as `null`. Never serialize it as a number.
- JSON field names in C++ serializers must exactly match the camelCase names in `lib/schemas.ts`. Any mismatch will cause Zod parse failures in the frontend.
- After writing a serializer, mentally verify its output against the corresponding TypeScript schema.

#### Logging

```cpp
// CORRECT: structured, includes relevant context
LOG_INFO("Alert fired: metric=" + metric + " value=" + std::to_string(value)
          + " threshold=" + std::to_string(threshold) + " severity=" + severity);

// WRONG: too vague to diagnose anything from
LOG_INFO("Alert fired");
```

- Every significant state transition must be logged at INFO level: startup, shutdown, config reload, alert fired, alert resolved, DB repaired, connection accepted.
- Every error must be logged at ERROR level with the full error message and enough context to reproduce the situation.
- WARN is for non-fatal situations that an operator should be aware of: counter wrap detected, Docker stat cache miss, maintenance window active.
- DEBUG is for per-cycle data: individual metric values, timing information. Only enable with `--verbose`.
- Never log secrets, passwords, API keys, or full SQL queries containing user data.

---

### File Header Comments

Every source file must begin with a brief comment block (3–5 lines) stating what the file does, what it owns, and any critical behavioral notes. Keep it factual and concise.

```cpp
// metrics_store.cpp
// Owns the SQLite database. Implements tiered metric downsampling (raw→1min→5min→1hour),
// anomaly baseline computation, alert cooldown persistence, and uptime heartbeat logging.
// Thread-safe: a dedicated downsampler thread runs every 60s alongside the collector.
```

```typescript
// lib/auth.ts
// Server-side API key management. Keys stored as bcrypt hashes in keys.json.
// All writes use atomicWrite() (tmp+rename). getKeyStore() handles ENOENT safely.
// Client-side helpers (getStoredApiKey etc.) are safe to import in browser code.
// Never import bcryptjs in client components — it will bloat the browser bundle.
```

---

### What Codex Must Never Do

These are hard prohibitions. If any task requires doing one of these things, stop and think about why — the task description likely has an alternative approach that doesn't require it.

**TypeScript/React:**
- Never use `any` — not even as a temporary placeholder
- Never use `// @ts-ignore` or `// @ts-nocheck`
- Never use `as unknown as X` to force a type cast
- Never mutate props or state directly — always create new objects/arrays
- Never call `setState` inside a render
- Never use `document.getElementById` or direct DOM manipulation — use React refs
- Never import server-only modules (`fs`, `path`, `crypto`) in client components
- Never import `bcryptjs` in client components — server-side only
- Never use `localStorage` directly in components — use `IntervalsProvider` or the auth helpers
- Never hardcode environment variables — always read from `process.env`
- Never use `JSON.parse` without a `try/catch` and Zod validation

**C++:**
- Never use `goto`
- Never use `union` for type punning — use `memcpy` or `std::bit_cast`
- Never call `exit()` from anywhere except `main()` — use exceptions or return values
- Never use global mutable state outside of the singleton `Logger`
- Never use `sprintf` — always use `snprintf` with explicit buffer size
- Never use `gets` — use `fgets`
- Never `#include` `.cpp` files
- Never write platform-specific code other than Linux/Ubuntu — this project is Linux-only
- Never write recursive functions in hot paths (collector loop, JSON serializer) — use iteration

---

### Code Review Checklist

Before completing any task, verify:

- [ ] All TypeScript types are explicit — no inferred `any`, no missing return types
- [ ] All Zod schemas validate their data before it's used
- [ ] All `await params` calls are present in Next.js 16 route handlers and pages
- [ ] All error paths return a structured response — no bare `throw` that reaches the user
- [ ] All C++ threads are joined (not detached) on class destruction
- [ ] All C++ strings embedded in JSON pass through `jsonStr()` escaping
- [ ] All JSON field names match their TypeScript schema counterparts exactly
- [ ] All file writes use `atomicWrite()` — no direct `fs.writeFile()` on shared files
- [ ] All Tailwind classes use CSS variables or semantic tokens — no hardcoded colors
- [ ] No `useMemo`, `useCallback`, or `React.memo` anywhere
- [ ] No `useEffect` used for data fetching
- [ ] All `'use client'` directives are the very first line of client component files
- [ ] All panels handle `isPending`, `isError`, and data states explicitly
- [ ] All metric numbers rendered with `className="font-mono"`
- [ ] All threshold colors use `getThresholdColor()` — not hardcoded Tailwind color classes
- [ ] Source file begins with a brief header comment

---

## Glossary

| Term | Meaning |
|---|---|
| `agent` | The C++ daemon running on a VPS |
| `vpsmon-tui` | Standalone ncurses terminal dashboard binary (supports TLS + API key) |
| `snapshot` | Point-in-time reading of all metrics |
| `panel` | A UI widget showing one metric category |
| `sparkline` | Mini inline SVG history graph |
| `tiered downsampling` | Auto-aggregation of old data into lower-res buckets |
| `maxPoints` | Optional history query parameter to cap response size |
| `anomaly detection` | Z-score alerting against same-hour historical baseline |
| `anomaly resolution` | Setting `resolvedAt` when Z-score drops back below threshold |
| `cooldown persistence` | Alert cooldowns stored in SQLite — survive agent restarts |
| `maintenance window` | Scheduled period where alerts are suppressed (frontend-level and optionally agent-level) |
| `per-metric silence` | Indefinite suppression of a specific metric's alerts (frontend-level only) |
| `health score` | 0–100 weighted composite, computed both frontend and agent-side for trending |
| `server group` | Named collection of servers with shared settings |
| `SLA uptime` | Agent heartbeat-tracked reachability %, shown per period |
| `alert acknowledgment` | Manually marking an alert as seen/investigated |
| `alert comment` | Timestamped incident note on an alert |
| `config file watcher` | inotify-based detection of /etc/ file changes |
| `deploy webhook` | CI/CD → `POST /api/webhook/deploy` → auto-annotation (requires WEBHOOK_SECRET) |
| `recurring report` | Scheduled HTML email summary via SMTP |
| `login audit log` | Record of every auth attempt with configurable retention + IP anonymization |
| `atomic write` | tmp file + rename to prevent partial-write corruption |
| `counter wrap` | `/proc/net/dev` counter reset to 0 after reboot/interface reset |
| `daysUntilFull` | Linear regression prediction of disk-full date |
| `snapshot diff` | Frontend tool comparing two snapshots side-by-side |
| `custom widget` | User-defined derived metric expression panel with array access |
| `IP allowlist` | Agent TCP: reject connections from non-whitelisted IPs |
| `key expiry` | Optional `expiresAt` on API keys; expired keys rejected |
| `startup warmup` | N-second window after agent start where alerts are suppressed |
| `process watchdog` | Cross-reference services + processes to detect ghost/died processes |
| `IntervalsProvider` | SSR-safe React context for per-panel refresh intervals |
| `public share link` | Time-limited read-only URL exposing aggregate health for one server |
| `split-brain maintenance` | When frontend suppresses alerts but agent still dispatches to channels |
| `self-update TLS requirement` | Self-update requires TLS=1 compilation — `api.github.com` is HTTPS-only |
| `proxy.ts` | Next.js 16 replacement for `middleware.ts`; auth gate |
| `isPending` | TanStack Query v5 loading state (not `isLoading`) |
| `"use cache"` | Next.js 16 explicit opt-in caching directive |
| `@theme {}` | Tailwind v4 CSS block for design tokens |
| `schemas.ts` | Zod schema file — source of truth for all API shapes |
| `mock mode` | `VPSMON_MOCK=true` — routes return serverId-seeded fake data |
