"""
backend/tests/test_simulation.py
Automated Verification Suite — Dynamic Attack Simulation Engine
Project RedString
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from backend.api.main import app
from backend.api.simulation import simulation_engine


class TestAttackSimulation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Ensure clean state before each test
        simulation_engine.reset()

    def tearDown(self):
        # Reset back to baseline after each test
        simulation_engine.reset()

    def test_baseline_alert_status(self):
        """Verify baseline alert state reports no active attack."""
        res = self.client.get("/api/v1/alerts/latest")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["is_under_attack"])
        self.assertIn("incident_id", data)
        self.assertIn("timestamp_utc", data)

        # Non-prefixed alias
        res_alias = self.client.get("/alerts/latest")
        self.assertEqual(res_alias.status_code, 200)
        self.assertEqual(res_alias.json()["is_under_attack"], False)

    def test_custom_attack_launch_and_leaderboard_rank1(self):
        """
        Launch a custom attack (alias='Judge_Test', sleep 2 to 9)
        and verify Judge_Test ranks #1 on /api/v1/suspects/leaderboard
        with guilt probability > 85%.
        """
        payload = {
            "attacker_alias": "Judge_Test",
            "amount_usd": 42000000.0,
            "sleep_start_hour": 2,
            "sleep_end_hour": 9,
            "exploit_type": "Reentrancy Exploit",
            "boast_message": "Unchecked reentrancy drained 42M, peeled across mixers.",
        }

        # 1. Launch attack via /api/v1/attack/launch
        launch_res = self.client.post("/api/v1/attack/launch", json=payload)
        self.assertEqual(launch_res.status_code, 200)
        launch_data = launch_res.json()
        self.assertEqual(launch_data["status"], "launched")
        self.assertTrue(launch_data["is_under_attack"])
        self.assertEqual(launch_data["attacker_alias"], "Judge_Test")

        # 2. Check alert status
        alert_res = self.client.get("/api/v1/alerts/latest")
        self.assertEqual(alert_res.status_code, 200)
        alert_data = alert_res.json()
        self.assertTrue(alert_data["is_under_attack"])
        self.assertEqual(alert_data["attacker_alias"], "Judge_Test")
        self.assertEqual(alert_data["amount_usd"], 42000000.0)

        # 3. Query /api/v1/suspects/leaderboard
        board_res = self.client.get("/api/v1/suspects/leaderboard")
        self.assertEqual(board_res.status_code, 200)
        board_data = board_res.json()

        leaderboard = board_data.get("leaderboard", [])
        self.assertGreater(len(leaderboard), 0)

        # Primary suspect must be Judge_Test at Rank #1 with prob > 85%
        rank_1 = leaderboard[0]
        self.assertEqual(rank_1["handle"], "Judge_Test")
        self.assertEqual(rank_1["rank"], 1)
        self.assertGreater(
            rank_1["probability"],
            0.85,
            f"Expected probability > 0.85, got {rank_1['probability']}",
        )

        # Check sleep window detected matches 2:00
        self.assertEqual(rank_1["sleep_window"]["start_hour"], 2)

    def test_route_aliases_without_api_v1_prefix(self):
        """Verify that non-prefixed routes (e.g. /attack/launch) work identically."""
        payload = {
            "attacker_alias": "Alias_Test",
            "amount_usd": 15000000.0,
            "sleep_start_hour": 4,
            "sleep_end_hour": 11,
            "exploit_type": "Flashloan Arbitrage",
            "boast_message": "15M drained clean.",
        }
        res = self.client.post("/attack/launch", json=payload)
        self.assertEqual(res.status_code, 200)

        alert_res = self.client.get("/alerts/latest")
        self.assertEqual(alert_res.status_code, 200)
        self.assertEqual(alert_res.json()["attacker_alias"], "Alias_Test")

        board_res = self.client.get("/suspects/leaderboard")
        self.assertEqual(board_res.status_code, 200)
        top = board_res.json()["leaderboard"][0]
        self.assertEqual(top["handle"], "Alias_Test")
        self.assertGreater(top["probability"], 0.85)

    def test_dynamic_endpoints_during_simulation(self):
        """Verify standard telemetry endpoints resolve simulation data."""
        self.client.post("/api/v1/attack/launch", json={
            "attacker_alias": "Telemetry_Suspect",
            "amount_usd": 50000000.0,
            "sleep_start_hour": 1,
            "sleep_end_hour": 9,
        })

        # OSINT Feed
        osint_res = self.client.get("/api/v1/osint/feed")
        self.assertEqual(osint_res.status_code, 200)
        posts = osint_res.json()["posts"]
        self.assertTrue(any(p["author"] == "Telemetry_Suspect" for p in posts))

        # Blockchain Nodes
        chain_res = self.client.get("/api/v1/blockchain/nodes")
        self.assertEqual(chain_res.status_code, 200)
        summary = chain_res.json()["summary"]
        self.assertGreater(summary["total_wallets"], 30)

        # Correlation Timeline
        timeline_res = self.client.get("/api/v1/correlation/timeline")
        self.assertEqual(timeline_res.status_code, 200)
        self.assertEqual(
            timeline_res.json()["metadata"]["primary_suspect"],
            "Telemetry_Suspect",
        )

    def test_simulation_reset(self):
        """Verify simulation reset restores baseline data."""
        self.client.post("/api/v1/attack/launch", json={"attacker_alias": "Temp_Hacker"})
        self.assertTrue(self.client.get("/api/v1/alerts/latest").json()["is_under_attack"])

        # Reset
        reset_res = self.client.post("/api/v1/simulation/reset")
        self.assertEqual(reset_res.status_code, 200)
        self.assertFalse(reset_res.json()["is_under_attack"])

        # Check alert endpoint
        alert_res = self.client.get("/api/v1/alerts/latest")
        self.assertFalse(alert_res.json()["is_under_attack"])

        # Check leaderboard returns baseline (Ghost0x)
        board_res = self.client.get("/api/v1/suspects/leaderboard")
        self.assertEqual(board_res.status_code, 200)
        top = board_res.json()["leaderboard"][0]
        self.assertEqual(top["handle"], "Ghost0x")


if __name__ == "__main__":
    unittest.main()
