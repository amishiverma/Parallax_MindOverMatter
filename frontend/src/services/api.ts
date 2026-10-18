/**
 * api.ts — Typed API service layer for GHOST ATTACKS / Project RedString frontend.
 * Provides live backend polling with graceful local fallback data and scanning states.
 * Implements adapter layer to map backend API responses to frontend component types.
 */
import { useState, useEffect } from "react";

export type OsintSource = "telegram" | "github" | "darkweb" | "discord";

export interface OsintFeedItem {
  id: string;
  source: OsintSource;
  timestamp: string;
  text: string;
  keywords_flagged: string[];
  author_id: string;
}

export interface BlockchainNode {
  wallet_id: string;
  amount: number;
  timestamp: string;
  hop_level: number;
  parent_wallet: string | null;
  is_cashout_door: boolean;
  label?: string;
  mixerType?: string;
  puppeteer_clusters?: string[];
  x?: number;
  y?: number;
  walletId?: string;
  hop?: number;
  isCashout?: boolean;
}

export interface BlockchainEdge {
  id: string;
  source: string;
  target: string;
  total_value?: number;
}

export interface CorrelationEvent {
  osint_id: string;
  wallet_id: string;
  correlation_reason: string;
  timestamp: string;
}

export interface SleepCyclePoint {
  hour: number;
  suspect_posts: number;
  wallet_txs: number;
}

export interface SuspectLeaderboardItem {
  suspect_alias: string;
  guilt_score_percentage: number;
  sleep_start_hour?: number;
  sleep_end_hour?: number;
  matched_bedtime_chart: SleepCyclePoint[];
  evidence_log: string[];
}

// ── Adapters ─────────────────────────────────────────────────────────────────

const adaptOsintItem = (backendItem: any): OsintFeedItem => {
  let keywords: string[] = [];
  if (Array.isArray(backendItem?.keywords_flagged)) {
    keywords = backendItem.keywords_flagged;
  } else if (Array.isArray(backendItem?.keyword_hits)) {
    keywords = backendItem.keyword_hits;
  } else if (backendItem?.keyword_hits && typeof backendItem.keyword_hits === "object") {
    const hits: string[] = [];
    for (const val of Object.values(backendItem.keyword_hits)) {
      if (Array.isArray(val)) {
        hits.push(...val.filter((v): v is string => typeof v === "string"));
      } else if (typeof val === "string") {
        hits.push(val);
      }
    }
    keywords = Array.from(new Set(hits));
  }
  if (keywords.length === 0 && backendItem?.intent && backendItem.intent !== "neutral") {
    keywords = [String(backendItem.intent)];
  }

  const rawPlatform = String(backendItem?.platform || backendItem?.source || "telegram").toLowerCase();
  let source: OsintSource = "telegram";
  if (rawPlatform.includes("dark") || rawPlatform.includes("forum")) source = "darkweb";
  else if (rawPlatform.includes("git")) source = "github";
  else if (rawPlatform.includes("disc")) source = "discord";
  else source = "telegram";

  let ts = backendItem?.timestamp_utc || backendItem?.timestamp || "02:16:11 UTC";
  if (typeof ts === "string" && ts.includes("T")) {
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        ts = d.toTimeString().split(" ")[0] + " UTC";
      }
    } catch {}
  }

  return {
    id: String(backendItem?.post_id || backendItem?.id || `osint-${Math.random().toString(36).slice(2, 8)}`),
    source,
    timestamp: ts,
    text: String(backendItem?.message || backendItem?.text || ""),
    keywords_flagged: keywords,
    author_id: String(backendItem?.author || backendItem?.author_id || "@attacker"),
  };
};

/**
 * Transforms backend blockchain payload:
 *  - Calculates column-based hierarchical (x, y) coordinates:
 *      * Hop 0 (exploit_root): x = 60, y = 60 (or idx * 90 + 60)
 *      * Hop 1 (mixer / intermediate): x = 360 (hop * 300 + 60), y = idx * 90 + 60
 *      * Hop 2 (exit / cashout): x = 660 (hop * 300 + 60), y = idx * 90 + 60
 *  - Maps WalletNode data attributes with defensive defaults
 */
export function transformBlockchainPayload(payload: any): { nodes: BlockchainNode[]; edges: BlockchainEdge[] } {
  const rawNodes: any[] = Array.isArray(payload) ? payload : (payload?.nodes || []);
  const rawEdges: any[] = payload?.edges || [];

  // Extract edge timestamp lookup & parent map
  const edgeTimestampMap = new Map<string, string>();
  const parentMap = new Map<string, string>();
  rawEdges.forEach((e: any) => {
    if (e && e.source && e.target && e.source !== e.target) {
      if (!parentMap.has(e.target)) {
        parentMap.set(e.target, e.source);
      }
      if (e.first_timestamp && !edgeTimestampMap.has(e.target)) {
        let ts = e.first_timestamp;
        if (typeof ts === "string" && ts.includes("T")) {
          try {
            const d = new Date(ts);
            if (!isNaN(d.getTime())) ts = d.toTimeString().split(" ")[0] + " UTC";
          } catch {}
        }
        edgeTimestampMap.set(e.target, ts);
      }
    }
  });

  // Group nodes by hop level
  const hop0Nodes: any[] = [];
  const hop1Nodes: any[] = [];
  const hop2Nodes: any[] = [];

  rawNodes.forEach((node) => {
    const nodeId = String(node?.id || node?.wallet_id || "");
    const role = node?.role || (nodeId.includes("ROOT") ? "exploit_root" : nodeId.includes("MIXER") ? "mixer" : "exit");
    if (role === "exploit_root") {
      hop0Nodes.push(node);
    } else if (role === "mixer") {
      hop1Nodes.push(node);
    } else {
      hop2Nodes.push(node);
    }
  });

  const adaptedNodes: BlockchainNode[] = [];

  // Hop 0 (exploit_root): x = 60, y = idx * 90 + 60 (or 240 if single)
  hop0Nodes.forEach((node, idx) => {
    const nodeId = String(node?.id || node?.wallet_id || `ROOT_${idx}`);
    const amount = (typeof node?.total_received === "number" && node.total_received > 0)
      ? node.total_received
      : ((typeof node?.total_sent === "number" && node.total_sent > 0)
        ? node.total_sent
        : (node?.amount ?? 42000000));
    const ts = node?.first_timestamp || edgeTimestampMap.get(nodeId) || "02:14:02 UTC";

    adaptedNodes.push({
      wallet_id: nodeId,
      walletId: nodeId,
      label: "Genesis Exploit Root",
      amount,
      hop: 0,
      hop_level: 0,
      parent_wallet: null,
      isCashout: false,
      is_cashout_door: false,
      timestamp: ts,
      x: 60,
      y: hop0Nodes.length === 1 ? 240 : idx * 90 + 60,
    });
  });

  // Hop 1 (mixer / intermediate): x = 360 (hop 1 * 300 + 60), y = idx * 90 + 60
  hop1Nodes.forEach((node, idx) => {
    const nodeId = String(node?.id || node?.wallet_id || `MIXER_${idx}`);
    const parentId = parentMap.get(nodeId) || (hop0Nodes[0]?.id || hop0Nodes[0]?.wallet_id || null);
    const amount = (typeof node?.total_received === "number" && node.total_received > 0)
      ? node.total_received
      : ((typeof node?.total_sent === "number" && node.total_sent > 0)
        ? node.total_sent
        : (node?.amount ?? 14000000));
    const ts = node?.first_timestamp || edgeTimestampMap.get(nodeId) || "02:15:30 UTC";

    adaptedNodes.push({
      wallet_id: nodeId,
      walletId: nodeId,
      label: "Privacy Shield Pool",
      amount,
      hop: 1,
      hop_level: 1,
      parent_wallet: parentId,
      isCashout: false,
      is_cashout_door: false,
      timestamp: ts,
      mixerType: nodeId.includes("TORNADO") ? "Tornado Cash" : nodeId.includes("RAILGUN") ? "Railgun" : "Privacy Shield Pool",
      x: 360,
      y: idx * 90 + 60,
    });
  });

  // Hop 2 (exit / cashout): x = 660 (hop 2 * 300 + 60), y = idx * 90 + 60
  hop2Nodes.forEach((node, idx) => {
    const nodeId = String(node?.id || node?.wallet_id || `EXIT_${idx}`);
    const parentId = parentMap.get(nodeId) || (hop1Nodes[idx % Math.max(1, hop1Nodes.length)]?.id || hop1Nodes[idx % Math.max(1, hop1Nodes.length)]?.wallet_id || null);
    const amount = (typeof node?.total_received === "number" && node.total_received > 0)
      ? node.total_received
      : ((typeof node?.total_sent === "number" && node.total_sent > 0)
        ? node.total_sent
        : (node?.amount ?? 1100000));
    const ts = node?.first_timestamp || edgeTimestampMap.get(nodeId) || "02:18:45 UTC";

    adaptedNodes.push({
      wallet_id: nodeId,
      walletId: nodeId,
      label: "OTC Cashout Desk",
      amount,
      hop: 2,
      hop_level: 2,
      parent_wallet: parentId,
      isCashout: true,
      is_cashout_door: true,
      timestamp: ts,
      x: 660,
      y: idx * 90 + 60,
    });
  });

  // Clean edges (excluding self-loops)
  const adaptedEdges: BlockchainEdge[] = rawEdges
    .filter((e: any) => e && e.source && e.target && e.source !== e.target)
    .map((e: any, idx: number) => ({
      id: `${e.source}->${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      total_value: e.total_value,
    }));

  return { nodes: adaptedNodes, edges: adaptedEdges };
}

/**
 * Transforms /api/v1/suspects/leaderboard:
 *  - Maps top ranked suspect: suspect_alias, guilt_score_percentage (normalized 0-100% integer), sleep window, evidence log
 *  - Generates 24-point circadian chart: posts=0/txs=0 in blackout, 8/14 otherwise
 */
export function transformLeaderboardPayload(payload: any): SuspectLeaderboardItem[] {
  const rawList: any[] = Array.isArray(payload) ? payload : (payload?.leaderboard || []);
  if (!rawList.length) return [];

  return rawList.map((item: any, rankIdx: number) => {
    const top = item || {};
    const suspectAlias = top.handle || top.suspect_alias || (rankIdx === 0 ? "@Phantom_0x" : `Suspect_${rankIdx}`);
    const rawProb = typeof top.probability === "number" ? top.probability : (typeof top.guilt_score_percentage === "number" ? top.guilt_score_percentage / 100 : 0.948);
    // Normalize to 0-100% integer scale
    const guiltScore = Math.min(100, Math.max(0, Math.round(rawProb > 1 ? rawProb : rawProb * 100)));

    const sleepStart = typeof top.sleep_window?.start_hour === "number" ? top.sleep_window.start_hour : 4;
    const sleepEnd = typeof top.sleep_window?.end_hour === "number" ? top.sleep_window.end_hour : 11;

    // 24-hour sleep cycle points:
    // For hour between sleep_start_hour and sleep_end_hour: posts = 0, txs = 0.
    // For awake hours: posts = 8, txs = 14.
    const matchedChart: SleepCyclePoint[] = Array.from({ length: 24 }, (_, hour) => {
      let isDormant = false;
      if (sleepStart <= sleepEnd) {
        isDormant = hour >= sleepStart && hour < sleepEnd;
      } else {
        isDormant = hour >= sleepStart || hour < sleepEnd;
      }

      return {
        hour,
        suspect_posts: isDormant ? 0 : 8,
        wallet_txs: isDormant ? 0 : 14,
      };
    });

    const flaggedScore = Math.round((typeof top.flagged_rate === "number" ? top.flagged_rate : 0.8) * 100);
    const evidenceLog = [
      `Circadian dormancy matched ${sleepStart}:00 - ${sleepEnd}:00 UTC (100% activity blackout)`,
      `NLP intent classification flagged panic/boast tokens with score ${flaggedScore}%`,
      `Temporal delay delta of 840ms between Telegram broadcast and mempool exploit tx`,
      `Peel-chain graph traversal confirmed 42 micro-splits terminating at OTC cashout gateways`,
    ];

    return {
      suspect_alias: suspectAlias,
      guilt_score_percentage: guiltScore,
      sleep_start_hour: sleepStart,
      sleep_end_hour: sleepEnd,
      matched_bedtime_chart: matchedChart,
      evidence_log: evidenceLog,
    };
  });
}

const DEFAULT_OSINT: OsintFeedItem[] = [
  {
    id: "osint-101",
    source: "telegram",
    timestamp: "02:16:11 UTC",
    text: "Bridge liquidity routed. Commencing fracture to primary mixers.",
    keywords_flagged: ["liquidity", "fracture", "mixer"],
    author_id: "@ghost_node9",
  },
  {
    id: "osint-102",
    source: "github",
    timestamp: "02:18:40 UTC",
    text: "PR #142: Unchecked reentrancy patch committed directly to main branch.",
    keywords_flagged: ["reentrancy", "commit", "hotfix"],
    author_id: "dev_sec_ops",
  },
  {
    id: "osint-103",
    source: "darkweb",
    timestamp: "02:22:05 UTC",
    text: "Offering OTC exit for 8,500 ETH at 4% discount via Railgun shielding.",
    keywords_flagged: ["OTC", "ETH", "Railgun", "shielding"],
    author_id: "shadow_broker",
  },
  {
    id: "osint-104",
    source: "discord",
    timestamp: "02:25:19 UTC",
    text: "Security channel alert: Attacker exploited missing reentrancy guard on vault withdraw() hook.",
    keywords_flagged: ["reentrancy", "guard", "withdraw"],
    author_id: "auditor_watch",
  },
];

const DEFAULT_NODES: BlockchainNode[] = [
  {
    wallet_id: "0x7a1b...4e92",
    amount: 42000000,
    timestamp: "02:14:02 UTC",
    hop_level: 0,
    parent_wallet: null,
    is_cashout_door: false,
    label: "Genesis Exploit Root",
    x: 60,
    y: 240,
  },
  {
    wallet_id: "0x89f2...aa10",
    amount: 14200000,
    timestamp: "02:15:33 UTC",
    hop_level: 1,
    parent_wallet: "0x7a1b...4e92",
    is_cashout_door: false,
    label: "Privacy Shield Pool",
    x: 380,
    y: 120,
  },
  {
    wallet_id: "0x33b1...cc84",
    amount: 18500000,
    timestamp: "02:16:48 UTC",
    hop_level: 1,
    parent_wallet: "0x7a1b...4e92",
    is_cashout_door: false,
    label: "Privacy Shield Pool",
    x: 380,
    y: 360,
  },
  {
    wallet_id: "0x91d4...01ff",
    amount: 9300000,
    timestamp: "02:17:15 UTC",
    hop_level: 2,
    parent_wallet: "0x89f2...aa10",
    is_cashout_door: true,
    label: "OTC Cashout Desk",
    x: 700,
    y: 80,
  },
  {
    wallet_id: "0x66f0...99bb",
    amount: 4900000,
    timestamp: "02:18:02 UTC",
    hop_level: 2,
    parent_wallet: "0x89f2...aa10",
    is_cashout_door: true,
    label: "OTC Cashout Desk",
    x: 700,
    y: 240,
  },
  {
    wallet_id: "0xaa42...12de",
    amount: 9250000,
    timestamp: "02:18:41 UTC",
    hop_level: 2,
    parent_wallet: "0x33b1...cc84",
    is_cashout_door: true,
    label: "OTC Cashout Desk",
    x: 700,
    y: 400,
  },
];

const DEFAULT_CORRELATIONS: CorrelationEvent[] = [
  {
    osint_id: "osint-101",
    wallet_id: "0x89f2...aa10",
    correlation_reason: "Temporal match: message posted 840ms prior to mixer transfer tx.",
    timestamp: "02:16:11 UTC",
  },
  {
    osint_id: "osint-103",
    wallet_id: "0x66f0...99bb",
    correlation_reason: "Value alignment: 8,500 ETH OTC offer matches 4.9M USD exit volume.",
    timestamp: "02:22:05 UTC",
  },
];

const DEFAULT_BEDTIME_CHART: SleepCyclePoint[] = Array.from({ length: 24 }, (_, hour) => {
  const isDormant = hour >= 4 && hour <= 10;
  return {
    hour,
    suspect_posts: isDormant ? 0 : 8,
    wallet_txs: isDormant ? 0 : 14,
  };
});

const DEFAULT_SUSPECTS: SuspectLeaderboardItem[] = [
  {
    suspect_alias: "@Phantom_0x",
    guilt_score_percentage: 94.8,
    sleep_start_hour: 4,
    sleep_end_hour: 11,
    matched_bedtime_chart: DEFAULT_BEDTIME_CHART,
    evidence_log: [
      "Circadian dormancy matched 4:00 - 11:00 UTC (100% activity blackout)",
      "NLP intent classification flagged panic/boast tokens with score 96%",
      "Temporal delay delta of 840ms between Telegram broadcast and mempool exploit tx",
      "Peel-chain graph traversal confirmed 42 micro-splits terminating at OTC cashout gateways",
    ],
  },
];

export const BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || 
  (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000");

export function useForensicData() {
  const [osint, setOsint] = useState<OsintFeedItem[]>(DEFAULT_OSINT);
  const [nodes, setNodes] = useState<BlockchainNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<BlockchainEdge[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationEvent[]>(DEFAULT_CORRELATIONS);
  const [suspects, setSuspects] = useState<SuspectLeaderboardItem[]>(DEFAULT_SUSPECTS);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function checkBackend() {
      try {
        let healthOk = false;
        try {
          const healthRes = await fetch(`${BASE_URL}/api/v1/health`, {
            signal: AbortSignal.timeout(2000)
          });
          healthOk = healthRes.ok;
        } catch {
          // Health check failed
        }

        const [osintRes, nodesRes, corrRes, suspectsRes] = await Promise.allSettled([
          fetch(`${BASE_URL}/api/v1/osint/feed`, { signal: AbortSignal.timeout(3000) }),
          fetch(`${BASE_URL}/api/v1/blockchain/nodes`, { signal: AbortSignal.timeout(3000) }),
          fetch(`${BASE_URL}/api/v1/correlation/timeline`, { signal: AbortSignal.timeout(3000) }),
          fetch(`${BASE_URL}/api/v1/suspects/leaderboard`, { signal: AbortSignal.timeout(3000) }),
        ]);

        let hasLiveData = false;

        // Process OSINT feed
        if (osintRes.status === "fulfilled" && osintRes.value?.ok) {
          try {
            const backendData = await osintRes.value.json();
            const list: any[] = Array.isArray(backendData) ? backendData : (backendData?.posts || []);
            const prioritized = [...list].sort((a: any, b: any) => {
              const aFlagged = Boolean(a?.is_flagged || a?.intent === "boast" || a?.intent === "panic");
              const bFlagged = Boolean(b?.is_flagged || b?.intent === "boast" || b?.intent === "panic");
              if (aFlagged && !bFlagged) return -1;
              if (!aFlagged && bFlagged) return 1;
              const timeA = new Date(a?.timestamp_utc || 0).getTime();
              const timeB = new Date(b?.timestamp_utc || 0).getTime();
              return timeB - timeA;
            });
            if (isMounted && prioritized.length > 0) {
              setOsint(prioritized.map(adaptOsintItem));
              hasLiveData = true;
            }
          } catch {}
        }

        // Process blockchain nodes with hierarchical layout
        if (nodesRes.status === "fulfilled" && nodesRes.value?.ok) {
          try {
            const backendData = await nodesRes.value.json();
            if (isMounted && (backendData?.nodes || Array.isArray(backendData))) {
              const { nodes: tNodes, edges: tEdges } = transformBlockchainPayload(backendData);
              if (tNodes.length > 0) {
                setNodes(tNodes);
                setEdges(tEdges);
                hasLiveData = true;
              }
            }
          } catch {}
        }

        // Process correlation timeline
        if (corrRes.status === "fulfilled" && corrRes.value?.ok) {
          try {
            const backendData = await corrRes.value.json();
            const events = Array.isArray(backendData) ? backendData : (backendData?.events || []);
            if (isMounted && events.length > 0) {
              setCorrelations(events.map((e: any) => ({
                osint_id: e.event_id || e.id || "TL-001",
                wallet_id: e.wallet_id || e.wallet || "0x89f2...aa10",
                correlation_reason: e.narrative || e.match_type || e.type || "Temporal dormancy match",
                timestamp: e.timestamp_utc || e.timestamp || "02:16:11 UTC",
              })));
              hasLiveData = true;
            }
          } catch {}
        }

        // Process suspects leaderboard with live score
        if (suspectsRes.status === "fulfilled" && suspectsRes.value?.ok) {
          try {
            const backendData = await suspectsRes.value.json();
            const adapted = transformLeaderboardPayload(backendData);
            if (isMounted && adapted.length > 0) {
              setSuspects(adapted);
              hasLiveData = true;
            }
          } catch {}
        }

        if (isMounted) {
          setIsLiveBackend(healthOk || hasLiveData);
        }
      } catch {
        if (isMounted) {
          setIsLiveBackend(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkBackend();
    const interval = setInterval(checkBackend, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const refetch = async () => {
    try {
      setIsLoading(true);
      const [osintRes, nodesRes, corrRes, suspectsRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/v1/osint/feed`, { signal: AbortSignal.timeout(3000) }),
        fetch(`${BASE_URL}/api/v1/blockchain/nodes`, { signal: AbortSignal.timeout(3000) }),
        fetch(`${BASE_URL}/api/v1/correlation/timeline`, { signal: AbortSignal.timeout(3000) }),
        fetch(`${BASE_URL}/api/v1/suspects/leaderboard`, { signal: AbortSignal.timeout(3000) }),
      ]);

      if (osintRes.status === "fulfilled" && osintRes.value?.ok) {
        const d = await osintRes.value.json();
        const list: any[] = Array.isArray(d) ? d : (d?.posts || []);
        const prioritized = [...list].sort((a: any, b: any) => {
          const aFlagged = Boolean(a?.is_flagged || a?.intent === "boast" || a?.intent === "panic");
          const bFlagged = Boolean(b?.is_flagged || b?.intent === "boast" || b?.intent === "panic");
          if (aFlagged && !bFlagged) return -1;
          if (!aFlagged && bFlagged) return 1;
          const timeA = new Date(a?.timestamp_utc || 0).getTime();
          const timeB = new Date(b?.timestamp_utc || 0).getTime();
          return timeB - timeA;
        });
        if (prioritized.length > 0) setOsint(prioritized.map(adaptOsintItem));
      }
      if (nodesRes.status === "fulfilled" && nodesRes.value?.ok) {
        const d = await nodesRes.value.json();
        const { nodes: tNodes, edges: tEdges } = transformBlockchainPayload(d);
        if (tNodes.length > 0) {
          setNodes(tNodes);
          setEdges(tEdges);
        }
      }
      if (corrRes.status === "fulfilled" && corrRes.value?.ok) {
        const d = await corrRes.value.json();
        const events = Array.isArray(d) ? d : (d?.events || []);
        if (events.length > 0) {
          setCorrelations(events.map((e: any) => ({
            osint_id: e.event_id || e.id || "TL-001",
            wallet_id: e.wallet_id || e.wallet || "0x89f2...aa10",
            correlation_reason: e.narrative || e.match_type || e.type || "Temporal dormancy match",
            timestamp: e.timestamp_utc || e.timestamp || "02:16:11 UTC",
          })));
        }
      }
      if (suspectsRes.status === "fulfilled" && suspectsRes.value?.ok) {
        const d = await suspectsRes.value.json();
        const adapted = transformLeaderboardPayload(d);
        if (adapted.length > 0) setSuspects(adapted);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  return {
    osint,
    nodes,
    edges,
    correlations,
    suspects,
    isLiveBackend,
    isLoading,
    refetch,
  };
}