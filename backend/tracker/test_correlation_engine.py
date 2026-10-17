import pytest
from correlation_engine import calculate_sleep_correlation

def test_calculate_sleep_correlation():
    # Arrange: Suspect sleeps from 2 AM to 7 AM
    suspect_profile = {"suspect_id": "DarkWeb_User99", "sleep_start_hour": 2, "sleep_end_hour": 7}
    
    # Wallet A: Active ONLY during the day (Matching human hours)
    wallet_a_txs = [
        {"wallet_id": "Wallet_A", "timestamp": "2023-10-27T10:15:00"},
        {"wallet_id": "Wallet_A", "timestamp": "2023-10-27T14:30:00"},
        {"wallet_id": "Wallet_A", "timestamp": "2023-10-27T22:00:00"},
    ]
    
    # Wallet B: Active during the suspect's sleep hours (Bot or different timezone)
    wallet_b_txs = [
        {"wallet_id": "Wallet_B", "timestamp": "2023-10-27T03:00:00"},
        {"wallet_id": "Wallet_B", "timestamp": "2023-10-27T04:30:00"},
        {"wallet_id": "Wallet_B", "timestamp": "2023-10-27T12:00:00"},
    ]

    # Act
    result_a = calculate_sleep_correlation(suspect_profile, wallet_a_txs)
    result_b = calculate_sleep_correlation(suspect_profile, wallet_b_txs)

    # Assert
    # Wallet A should have a high score because 0 transactions happened between 2 and 7.
    assert result_a["correlation_score"] >= 0.8, f"Expected high score for Wallet A, got {result_a['correlation_score']}"
    assert result_a["wallet_id"] == "Wallet_A"
    
    # Wallet B should have a low score because 2 out of 3 transactions happened during sleep hours.
    assert result_b["correlation_score"] < 0.5, f"Expected low score for Wallet B, got {result_b['correlation_score']}"
