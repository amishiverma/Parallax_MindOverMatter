---
name: tasks-plan
description: Plan for the 4 remaining surgical tasks from the pasted mandate
metadata:
  type: project
---

1. simulation.py: Add wallet_splits & mixer_type to AttackLaunchRequest; use wallet_splits for exit wallet count; use mixer_type for Hop 1 mixer tags; store raw boast_message in OSINT feed.
2. frontend/src/services/api.ts + App.tsx: Add decoded_payload to OsintFeedItem; render decoded badge in OSINT card.
3. backend/correlation_engine/correlator.py: Verify NLP sensitivity (flagged_posts==0 → 0 NLP contribution → ~75% guilt; flagged_posts>0 → full points → ~95-98% guilt).
4. Verify: npm run build in frontend; test Base64 payload + 8 wallets + Tornado Cash; test "hi" + 10 wallets.