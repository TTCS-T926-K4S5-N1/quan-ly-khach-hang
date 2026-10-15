import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.opportunity_history import OpportunityHistory
from app.schemas.opportunity_history import OpportunityHistoryResponse
from app.repositories.opportunity_repository import opportunity_repo

ACTION_NAME_MAP = {
    "CREATE": "Khởi tạo cơ hội",
    "STAGE_CHANGE": "Chuyển giai đoạn",
    "CLOSE_WON": "Đóng Thắng cơ hội",
    "CLOSE_LOST": "Đóng Thua cơ hội",
    "REOPEN": "Mở lại cơ hội",
    "UPDATE": "Cập nhật thông tin",
}

class HistoryService:

    def log_event(
        self,
        db: Session,
        opportunity_id: int,
        action: str,
        old_status: Optional[str],
        new_status: Optional[str],
        reason: Optional[str],
        changed_by_id: Optional[int],
        changed_by_name: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> OpportunityHistory:
        """Create an audit log record for an opportunity state transition."""
        meta_str = json.dumps(metadata, ensure_ascii=False) if metadata else None
        record = OpportunityHistory(
            opportunity_id=opportunity_id,
            action=action,
            old_status=old_status,
            new_status=new_status,
            reason=reason,
            changed_by_id=changed_by_id,
            changed_by_name=changed_by_name,
            changed_at=datetime.utcnow(),
            metadata_json=meta_str
        )
        return opportunity_repo.save_history(db, record)

    def get_timeline(self, db: Session, opp_id: int) -> List[OpportunityHistoryResponse]:
        """Format history list into response objects."""
        raw_list = opportunity_repo.get_histories(db, opp_id)
        results = []
        for item in raw_list:
            meta = {}
            if item.metadata_json:
                try:
                    meta = json.loads(item.metadata_json)
                except Exception:
                    pass

            # Generate description
            desc = item.reason or f"Chuyển trạng thái từ {item.old_status or 'khởi tạo'} sang {item.new_status or ''}"
            if item.action == "CLOSE_WON":
                actual_val = meta.get("actual_close_value")
                if actual_val:
                    desc = f"Đóng Thắng thành công với Giá trị chốt: {int(actual_val):,} ₫".replace(",", ".")
            elif item.action == "CLOSE_LOST":
                comp = meta.get("winning_competitor")
                desc = f"Đóng Thua với lý do: {item.reason or 'Không xác định'}" + (f" | Đối thủ: {comp}" if comp else "")
            elif item.action == "REOPEN":
                desc = f"Cơ hội được mở lại từ trạng thái {item.old_status} sang Đang mở"

            results.append(
                OpportunityHistoryResponse(
                    id=item.id,
                    opportunityId=item.opportunity_id,
                    action=item.action,
                    actionNameVi=ACTION_NAME_MAP.get(item.action, "Hoạt động"),
                    fromStatus=item.old_status,
                    toStatus=item.new_status,
                    description=desc,
                    performedBy=item.changed_by_name,
                    performedAt=item.changed_at.strftime("%Y-%m-%d %H:%M:%S"),
                    reason=item.reason,
                    actualAmount=meta.get("actual_close_value"),
                    contractDate=meta.get("signed_date"),
                    winReason=meta.get("win_reason_name"),
                    lossReason=meta.get("lost_reason"),
                    competitor=meta.get("winning_competitor"),
                    notes=meta.get("note")
                )
            )
        return results

history_service = HistoryService()
