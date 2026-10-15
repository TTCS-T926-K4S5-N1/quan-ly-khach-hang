import pytest
from datetime import date
from decimal import Decimal
from app.models.opportunity import Opportunity

def create_sample_opportunity(db_session, owner_id=1, status="OPEN"):
    opp = Opportunity(
        name="Cơ hội test Close Won",
        customer_id=1,
        owner_id=owner_id,
        expected_value=Decimal("500000000"),
        stage_id=1,
        probability=60,
        expected_close_date=date(2026, 10, 30),
        status=status,
        version=1
    )
    db_session.add(opp)
    db_session.commit()
    db_session.refresh(opp)
    return opp

def test_close_won_success(client, db_session):
    """1. Đóng Thắng thành công với dữ liệu hợp lệ."""
    opp = create_sample_opportunity(db_session)
    
    payload = {
        "actual_close_value": 520000000,
        "signed_date": "2026-10-15",
        "win_reason_id": 1,
        "note": "Khách hàng đã ký hợp đồng 520 triệu"
    }
    
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    opp_data = data["data"]["opportunity"]
    assert opp_data["status"] == "WON"
    assert opp_data["actualAmount"] == 520000000
    assert opp_data["contractDate"] == "2026-10-15"

def test_close_won_missing_actual_amount(client, db_session):
    """2. Không cho đóng Thắng nếu thiếu giá trị chốt."""
    opp = create_sample_opportunity(db_session)
    
    payload = {
        "signed_date": "2026-10-15"
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload, headers=headers)
    assert response.status_code == 422
    assert "giá trị chốt" in response.text.lower() or "actual_close_value" in response.text

def test_close_won_missing_signed_date(client, db_session):
    """3. Không cho đóng Thắng nếu thiếu ngày ký."""
    opp = create_sample_opportunity(db_session)
    
    payload = {
        "actual_close_value": 500000000
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    response = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload, headers=headers)
    assert response.status_code == 422
    assert "ngày ký" in response.text.lower() or "signed_date" in response.text

def test_close_won_invalid_zero_or_negative_amount(client, db_session):
    """4. Không cho nhập giá trị chốt bằng 0 hoặc số âm."""
    opp = create_sample_opportunity(db_session)
    
    # Amount = 0
    payload_zero = {
        "actual_close_value": 0,
        "signed_date": "2026-10-15"
    }
    headers = {"X-User-Id": "1", "X-User-Role": "SALES_REP"}
    resp_zero = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload_zero, headers=headers)
    assert resp_zero.status_code == 422
    assert "lớn hơn 0" in resp_zero.text

    # Amount < 0
    payload_neg = {
        "actual_close_value": -500000,
        "signed_date": "2026-10-15"
    }
    resp_neg = client.post(f"/api/opportunities/{opp.id}/close-won", json=payload_neg, headers=headers)
    assert resp_neg.status_code == 422
    assert "lớn hơn 0" in resp_neg.text
