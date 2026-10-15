import pytest
from datetime import date
from decimal import Decimal
from app.models.opportunity import Opportunity

def create_closed_opportunity(db_session, owner_id=1, status="LOST"):
    opp = Opportunity(
        name="Cơ hội test Reopen",
        customer_id=1,
        owner_id=owner_id,
        expected_value=Decimal("300000000"),
        stage_id=1,
        probability=0,
        expected_close_date=date(2026, 11, 20),
        status=status,
        lost_reason="Giá cao" if status == "LOST" else None,
        actual_close_value=Decimal("300000000") if status == "WON" else None,
        version=1
    )
    db_session.add(opp)
    db_session.commit()
    db_session.refresh(opp)
    return opp

def test_sales_rep_cannot_reopen(client, db_session):
    """9. Nhân viên thông thường không thể mở lại cơ hội (403 Forbidden)."""
    opp = create_closed_opportunity(db_session, status="LOST")
    
    payload = {"reason": "Khách hàng muốn đàm phán lại"}
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/reopen", json=payload, headers=headers)
    assert response.status_code == 403
    assert "quyền" in response.text.lower()

def test_team_lead_can_reopen(client, db_session):
    """10. Trưởng nhóm có thể mở lại nếu nhập lý do hợp lệ."""
    opp = create_closed_opportunity(db_session, status="LOST")
    
    payload = {"reason": "Khách hàng tái khởi động dự án và muốn đàm phán lại"}
    headers = {"X-User-Id": "3", "X-User-Role": "TEAM_LEAD"}
    response = client.post(f"/api/opportunities/{opp.id}/reopen", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "OPEN"

def test_reopen_missing_reason_rejected(client, db_session):
    """11. Mở lại không có lý do phải bị từ chối (422)."""
    opp = create_closed_opportunity(db_session, status="LOST")
    
    payload = {"reason": "   "}
    headers = {"X-User-Id": "3", "X-User-Role": "TEAM_LEAD"}
    response = client.post(f"/api/opportunities/{opp.id}/reopen", json=payload, headers=headers)
    assert response.status_code == 422
    assert "lý do mở lại" in response.text.lower()
