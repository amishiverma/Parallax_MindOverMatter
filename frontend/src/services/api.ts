/**
 * api.ts — Typed API service layer for GHOST ATTACKS / Project RedString frontend.
 * Provides live backend polling with graceful local fallback data and scanning states.
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
  matched_bedtime_chart: SleepCyclePoint[];
  evidence_log: string[];
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
  },
  {
    wallet_id: "0x89f2...aa10",
    amount: 14200000,
    timestamp: "02:15:33 UTC",
    hop_level: 1,
    parent_wallet: "0x7a1b...4e92",
    is_cashout_door: false,
  },
  {
    wallet_id: "0x33b1...cc84",
    amount: 18500000,
    timestamp: "02:16:48 UTC",
    hop_level: 1,
    parent_wallet: "0x7a1b...4e92",
    is_cashout_door: false,
  },
  {
    wallet_id: "0x91d4...01ff",
    amount: 9300000,
    timestamp: "02:17:15 UTC",
    hop_level: 2,
    parent_wallet: "0x89f2...aa10",
    is_cashout_door: false,
  },
  {
    wallet_id: "0x66f0...99bb",
    amount: 4500000,
    timestamp: "02:18:02 UTC",
    hop_level: 3,
    parent_wallet: "0x91d4...01ff",
    is_cashout_door: true,
  },
];

const DEFAULT_CORRELATIONS: CorrelationEvent[] = [
  {
    osint_id: "osint-101",
    wallet_id: "0x7a1b...4e92",
    correlation_reason: "Timestamp delta 129s between Telegram broadcast and bridge routing",
    timestamp: "02:16:11 UTC",
  },
  {
    osint_id: "osint-102",
    wallet_id: "0x89f2...aa10",
    correlation_reason: "Bytecode signature matches PR patch commit author key",
    timestamp: "02:18:40 UTC",
  },
  {
    osint_id: "osint-103",
    wallet_id: "0x66f0...99bb",
    correlation_reason: "Exact OTC volume matching Railgun shielding deposit",
    timestamp: "02:22:05 UTC",
  },
];

const DEFAULT_BEDTIME_CHART: SleepCyclePoint[] = Array.from({ length: 24 }, (_, hour) => {
  const isDormant = hour >= 4 && hour <= 10;
  return {
    hour,
    suspect_posts: isDormant ? 0 : Math.floor(Math.sin(hour / 3) * 6 + 7),
    wallet_txs: isDormant ? 0 : Math.floor(Math.cos(hour / 4) * 8 + 10),
  };
});

const DEFAULT_SUSPECTS: SuspectLeaderboardItem[] = [
  {
    suspect_alias: "Aleksei Voronin (0x_Alek)",
    guilt_score_percentage: 94.8,
    matched_bedtime_chart: DEFAULT_BEDTIME_CHART,
    evidence_log: [
      "Circadian dormancy window matched 04:00 - 11:00 UTC (UTC+3 Moscow/Kyiv)",
      "Reentrancy commit key fingerprint matched PGP signature on darknet forum",
      "Gas tip price spike correlates to within 840ms of OSINT Telegram message",
      "Railgun shielded pool exit target bound to associated OTC exchange account",
    ],
  },
  {
    suspect_alias: "Victor Vance (CipherX)",
    guilt_score_percentage: 42.1,
    matched_bedtime_chart: DEFAULT_BEDTIME_CHART,
    evidence_log: [
      "Circadian window partial match (UTC-5 New York)",
      "Solidity compiler optimization flags match previous testnet deployer",
    ],
  },
];

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useForensicData() {
  const [osint, setOsint] = useState<OsintFeedItem[]>(DEFAULT_OSINT);
  const [nodes, setNodes] = useState<BlockchainNode[]>(DEFAULT_NODES);
  const [correlations, setCorrelations] = useState<CorrelationEvent[]>(DEFAULT_CORRELATIONS);
  const [suspects, setSuspects] = useState<SuspectLeaderboardItem[]>(DEFAULT_SUSPECTS);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function checkBackend() {
      try {
        const [osintRes, nodesRes, corrRes, suspectsRes] = await Promise.allSettled([
          fetch(`${BASE_URL}/api/v1/osint/feed`, { signal: AbortSignal.timeout(2000) }),
          fetch(`${BASE_URL}/api/v1/blockchain/nodes`, { signal: AbortSignal.timeout(2000) }),
          fetch(`${BASE_URL}/api/v1/correlation/timeline`, { signal: AbortSignal.timeout(2000) }),
          fetch(`${BASE_URL}/api/v1/suspects/leaderboard`, { signal: AbortSignal.timeout(2000) }),
        ]);

        let hasLive = false;

        if (osintRes.status === "fulfilled" && osintRes.value.ok) {
          const data = await osintRes.value.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setOsint(data);
            hasLive = true;
          }
        }

        if (nodesRes.status === "fulfilled" && nodesRes.value.ok) {
          const data = await nodesRes.value.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setNodes(data);
            hasLive = true;
          }
        }

        if (corrRes.status === "fulfilled" && corrRes.value.ok) {
          const data = await corrRes.value.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setCorrelations(data);
            hasLive = true;
          }
        }

        if (suspectsRes.status === "fulfilled" && suspectsRes.value.ok) {
          const data = await suspectsRes.value.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setSuspects(data);
            hasLive = true;
          }
        }

        if (isMounted) {
          setIsLiveBackend(hasLive);
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
    const interval = setInterval(checkBackend, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    osint,
    nodes,
    correlations,
    suspects,
    isLiveBackend,
    isLoading,
  };
}
