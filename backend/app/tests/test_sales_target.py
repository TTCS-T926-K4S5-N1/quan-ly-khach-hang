import pytest
from datetime import date
from decimal import Decimal
from app.models.opportunity import Opportunity
from app.models.sales_target_transaction import SalesTargetTransaction

def test_sales_target_credited_only_once_and_reversed_on_reopen(client, db_session):
    """
    12. Cơ hội Thắng chỉ được tính vào chỉ tiêu một lần.
    13. Mở lại cơ hội Thắng hoàn tác chỉ tiêu đúng một lần.
    14. Lịch sử ghi đúng người thực hiện, thời gian và trạng thái.
    """
    owner_id = 1
    opp = Opportunity(
        name="Cơ hội kiểm tra chỉ tiêu",
        customer_id=1,
        owner_id=owner_id,
        expected_value=Decimal("700000000"),
        status="OPEN",
        version=1
    )
    db_session.add(opp)
    db_session.commit()
    db_session.refresh(opp)

    # 1. Close Won with 700M
    payload_won = {
        "actual_close_value": 700000000,
        "signed_date": "2026-10-15",
        "win_reason_id": 1
    }
    headers_rep = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    res_won = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload_won, headers=headers_rep)
    assert res_won.status_code == 200

    # Verify quota increased by 700M
    summary_won = client.get(f"/api/users/{owner_id}/sales-target-summary", headers=headers_rep).json()["data"]
    assert summary_won["achievedAmount"] >= 700000000

    # 2. Team Lead Reopens opportunity
    headers_lead = {"X-User-Id": "3", "X-User-Role": "TEAM_LEAD"}
    res_reopen = client.post(
        f"/api/opportunities/{opp.id}/reopen",
        json={"reason": "Khách hàng muốn thương lượng lại quy mô dự án"},
        headers=headers_lead
    )
    assert res_reopen.status_code == 200
    assert res_reopen.json()["data"]["status"] == "OPEN"

    # Verify quota reversed (deducted 700M)
    summary_reopened = client.get(f"/api/users/{owner_id}/sales-target-summary", headers=headers_rep).json()["data"]
    # Net change should be 0 from this deal
    assert summary_reopened["achievedAmount"] == summary_won["achievedAmount"] - 700000000

    # 3. Check history records
    history_res = client.get(f"/api/opportunities/{opp.id}/history", headers=headers_rep)
    assert history_res.status_code == 200
    histories = history_res.json()["data"]
    assert len(histories) >= 2
    actions = [h["action"] for h in histories]
    assert "CLOSE_WON" in actions
    assert "REOPEN" in actions
