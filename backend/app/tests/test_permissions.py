import pytest
from datetime import date
from decimal import Decimal
from app.models.opportunity import Opportunity

def test_cannot_edit_or_reclose_closed_opportunity(client, db_session):
    """8. Không cho sửa / đóng lại cơ hội đã đóng (409 Conflict)."""
    opp = Opportunity(
        name="Cơ hội đã đóng",
        customer_id=1,
        owner_id=1,
        expected_value=Decimal("200000000"),
        status="WON",
        actual_close_value=Decimal("200000000"),
        version=2
    )
    db_session.add(opp)
    db_session.commit()
    db_session.refresh(opp)

    # Trying to close-won again
    payload_won = {
        "actual_close_value": 250000000,
        "signed_date": "2026-10-15"
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    res_won = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload_won, headers=headers)
    assert res_won.status_code == 409
    assert "đã đóng" in res_won.text.lower()

    # Trying to close-lost again
    payload_lost = {
        "lost_reason": "Giá cao"
    }
    res_lost = client.post(f"/api/opportunities/{opp.id}/close-lost", json=payload_lost, headers=headers)
    assert res_lost.status_code == 409
    assert "đã đóng" in res_lost.text.lower()

def test_user_cannot_access_unowned_opportunity(client, db_session):
    """15. Người dùng không được phép truy cập cơ hội ngoài phạm vi được cấp."""
    # Owned by user 2
    opp = Opportunity(
        name="Cơ hội của User 2",
        customer_id=1,
        owner_id=2,
        expected_value=Decimal("150000000"),
        status="OPEN",
        version=1
    )
    db_session.add(opp)
    db_session.commit()
    db_session.refresh(opp)

    # User 1 (SALES_REP) attempts to close user 2's opportunity
    payload = {
        "actual_close_value": 150000000,
        "signed_date": "2026-10-15"
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload, headers=headers)
    assert response.status_code == 403
    assert "quyền" in response.text.lower()
