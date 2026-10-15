from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator, model_validator

class CloseWonRequest(BaseModel):
    """
    3.1. Dữ liệu bắt buộc đóng Thắng:
    - Giá trị chốt thực tế: số lớn hơn 0
    - Ngày ký hợp đồng: ngày hợp lệ
    """
    actual_close_value: Optional[Decimal] = Field(None, alias="actualAmount")
    signed_date: Optional[date] = Field(None, alias="contractDate")
    win_reason_id: Optional[int] = Field(None, alias="winReasonId")
    note: Optional[str] = Field(None, alias="notes")

    @model_validator(mode="before")
    @classmethod
    def populate_fields(cls, data: Any):
        if isinstance(data, dict):
            # Support both snake_case and camelCase aliases
            if "actual_close_value" not in data and "actualAmount" in data:
                data["actual_close_value"] = data["actualAmount"]
            if "signed_date" not in data and "contractDate" in data:
                data["signed_date"] = data["contractDate"]
            if "win_reason_id" not in data and "winReasonId" in data:
                data["win_reason_id"] = data["winReasonId"]
            if "note" not in data and "notes" in data:
                data["note"] = data["notes"]
        return data

    @field_validator("actual_close_value")
    @classmethod
    def validate_amount(cls, v):
        if v is None:
            raise ValueError("Vui lòng nhập giá trị chốt thực tế.")
        if v <= 0:
            raise ValueError("Giá trị chốt thực tế phải lớn hơn 0.")
        return v

    @field_validator("signed_date")
    @classmethod
    def validate_date(cls, v):
        if v is None:
            raise ValueError("Vui lòng nhập ngày ký hợp đồng.")
        return v

    class Config:
        populate_by_name = True

class CloseLostRequest(BaseModel):
    """
    3.2. Dữ liệu bắt buộc đóng Thua:
    - Lý do thua. Nếu chọn "Lý do khác", bắt buộc nhập chi tiết giải thích.
    - Đối thủ thắng thầu (không bắt buộc).
    - Ghi chú (không bắt buộc).
    """
    lost_reason: Optional[str] = Field(None, alias="lossReasonName")
    lost_reason_detail: Optional[str] = Field(None, alias="otherReasonDetails")
    winning_competitor: Optional[str] = Field(None, alias="competitorName")
    note: Optional[str] = Field(None, alias="notes")

    @model_validator(mode="before")
    @classmethod
    def populate_fields(cls, data: Any):
        if isinstance(data, dict):
            if "lost_reason" not in data and "lossReasonName" in data:
                data["lost_reason"] = data["lossReasonName"]
            if "lost_reason_detail" not in data and "otherReasonDetails" in data:
                data["lost_reason_detail"] = data["otherReasonDetails"]
            if "winning_competitor" not in data and "competitorName" in data:
                data["winning_competitor"] = data["competitorName"]
            if "note" not in data and "notes" in data:
                data["note"] = data["notes"]
        return data

    @field_validator("lost_reason")
    @classmethod
    def validate_reason(cls, v):
        if not v or not v.strip():
            raise ValueError("Vui lòng chọn hoặc nhập lý do thua.")
        return v.strip()

    @model_validator(mode="after")
    def validate_other_reason(self):
        reason = self.lost_reason or ""
        if reason in ("Lý do khác", "OTHER", "Lý do khác..."):
            detail = self.lost_reason_detail or ""
            if not detail.strip():
                raise ValueError("Vui lòng nhập nội dung giải thích chi tiết khi chọn 'Lý do khác'.")
        return self

    class Config:
        populate_by_name = True

class UnifiedCloseRequest(BaseModel):
    """
    Unified payload supporting /api/opportunities/{id}/close
    with {"status": "WON", ...} or {"status": "LOST", ...}
    """
    status: str
    # WON fields
    actual_close_value: Optional[Decimal] = Field(None, alias="actualAmount")
    signed_date: Optional[date] = Field(None, alias="contractDate")
    win_reason_id: Optional[int] = Field(None, alias="winReasonId")
    # LOST fields
    lost_reason: Optional[str] = Field(None, alias="lossReasonName")
    lost_reason_detail: Optional[str] = Field(None, alias="otherReasonDetails")
    winning_competitor: Optional[str] = Field(None, alias="competitorName")
    note: Optional[str] = Field(None, alias="notes")

    @model_validator(mode="before")
    @classmethod
    def populate_fields(cls, data: Any):
        if isinstance(data, dict):
            if "actual_close_value" not in data and "actualAmount" in data:
                data["actual_close_value"] = data["actualAmount"]
            if "signed_date" not in data and "contractDate" in data:
                data["signed_date"] = data["contractDate"]
            if "win_reason_id" not in data and "winReasonId" in data:
                data["win_reason_id"] = data["winReasonId"]
            if "lost_reason" not in data and "lossReasonName" in data:
                data["lost_reason"] = data["lossReasonName"]
            if "lost_reason_detail" not in data and "otherReasonDetails" in data:
                data["lost_reason_detail"] = data["otherReasonDetails"]
            if "winning_competitor" not in data and "competitorName" in data:
                data["winning_competitor"] = data["competitorName"]
            if "note" not in data and "notes" in data:
                data["note"] = data["notes"]
        return data

    class Config:
        populate_by_name = True

class ReopenRequest(BaseModel):
    """
    3.4. Dữ liệu bắt buộc mở lại cơ hội:
    - Lý do mở lại, không được để trống.
    """
    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v):
        if not v or not v.strip():
            raise ValueError("Vui lòng nhập lý do mở lại cơ hội.")
        if len(v.strip()) < 3:
            raise ValueError("Lý do mở lại phải có ít nhất 3 ký tự.")
        return v.strip()

class OpportunityResponse(BaseModel):
    id: int
    code: str
    name: str
    customerId: Optional[int] = None
    customerName: Optional[str] = None
    contactName: Optional[str] = None
    amount: float = 0.0
    stageId: Optional[int] = None
    stageName: Optional[str] = None
    probability: int = 0
    expectedCloseDate: Optional[str] = None
    status: str
    
    # Won details
    actualAmount: Optional[float] = None
    contractDate: Optional[str] = None
    winReasonName: Optional[str] = None
    winNotes: Optional[str] = None
    
    # Lost details
    lossReasonName: Optional[str] = None
    otherReasonDetails: Optional[str] = None
    competitorName: Optional[str] = None
    lossNotes: Optional[str] = None
    
    # Ownership & Timestamps
    ownerUserId: int
    ownerName: str
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

class SalesTargetSummaryResponse(BaseModel):
    userId: int
    userName: str
    period: str
    targetAmount: float
    achievedAmount: float
    achievedPercentage: int
    wonCount: int
