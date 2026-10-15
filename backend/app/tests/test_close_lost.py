import pytest
from datetime import date
from decimal import Decimal
from app.models.opportunity import Opportunity

def create_sample_opportunity(db_session, owner_id=1, status="OPEN"):
    opp = Opportunity(
        name="Cơ hội test Close Lost",
        customer_id=1,
        owner_id=owner_id,
        expected_value=Decimal("400000000"),
        stage_id=1,
        probability=40,
        expected_close_date=date(2026, 11, 20),
        status=status,
        version=1
    )
    db_session.add(opp)
    db_session.commit()
    db_session.refresh(opp)
    return opp

def test_close_lost_success(client, db_session):
    """5. Đóng Thua thành công khi có lý do hợp lệ."""
    opp = create_sample_opportunity(db_session)
    
    payload = {
        "lost_reason": "Giá cao",
        "winning_competitor": "Đối thủ A",
        "note": "Khách hàng nhận được báo giá thấp hơn từ Đối thủ A"
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-lost", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "LOST"
    assert data["data"]["lossReasonName"] == "Giá cao"
    assert data["data"]["competitorName"] == "Đối thủ A"

def test_close_lost_missing_reason(client, db_session):
    """6. Không cho đóng Thua nếu thiếu lý do."""
    opp = create_sample_opportunity(db_session)
    
    payload = {
        "winning_competitor": "Đối thủ B"
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-lost", json=payload, headers=headers)
    assert response.status_code == 422
    assert "lý do thua" in response.text.lower() or "lost_reason" in response.text

def test_close_lost_allow_empty_competitor(client, db_session):
    """7. Cho phép bỏ trống đối thủ thắng thầu."""
    opp = create_sample_opportunity(db_session)
    
    payload = {
        "lost_reason": "Không đủ ngân sách",
        "winning_competitor": None,
        "note": "Khách tự cắt giảm ngân sách nội bộ"
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-lost", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "LOST"

def test_close_lost_other_reason_requires_detail(client, db_session):
    """Nếu chọn 'Lý do khác', bắt buộc nhập chi tiết."""
    opp = create_sample_opportunity(db_session)
    
    # Missing detail
    payload_no_detail = {
        "lost_reason": "Lý do khác",
        "lost_reason_detail": ""
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-lost", json=payload_no_detail, headers=headers)
    assert response.status_code == 422
    assert "giải thích chi tiết" in response.text

    # With detail
    payload_with_detail = {
        "lost_reason": "Lý do khác",
        "lost_reason_detail": "Dự án bị hủy bỏ do công ty tái cơ cấu phòng ban"
    }
    res_ok = client.post(f"/api/opportunities/{opp.id}/close-lost", json=payload_with_detail, headers=headers)
    assert res_ok.status_code == 200
    assert res_ok.json()["data"]["status"] == "LOST"
