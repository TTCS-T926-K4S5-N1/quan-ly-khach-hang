from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.opportunity import Opportunity, User, Customer, WinLossReason
from app.schemas.opportunity import (
    CloseWonRequest,
    CloseLostRequest,
    ReopenRequest,
    OpportunityResponse
)
from app.repositories.opportunity_repository import opportunity_repo
from app.services.history_service import history_service
from app.services.sales_target_service import sales_target_service
from app.core.permissions import can_user_reopen, can_user_access_opportunity

class OpportunityService:

    def format_opportunity(self, opp: Opportunity) -> OpportunityResponse:
        """Format an Opportunity ORM model into the OpportunityResponse schema."""
        cust_name = opp.customer.name if opp.customer else "Khách hàng"
        contact = opp.customer.contact_person if opp.customer else None
        owner_name = opp.owner.full_name if opp.owner else "Chuyên viên phụ trách"
        stage_name = opp.stage.name if opp.stage else ("Chốt thành công" if opp.status == "WON" else ("Đóng thất bại" if opp.status == "LOST" else "Đang mở"))
        win_reason_name = opp.win_reason.name if opp.win_reason else None

        return OpportunityResponse(
            id=opp.id,
            code=f"OPP-{str(opp.id).zfill(4)}",
            name=opp.name,
            customerId=opp.customer_id,
            customerName=cust_name,
            contactName=contact,
            amount=float(opp.expected_value or 0),
            stageId=opp.stage_id,
            stageName=stage_name,
            probability=opp.probability,
            expectedCloseDate=opp.expected_close_date.strftime("%Y-%m-%d") if opp.expected_close_date else None,
            status=opp.status,
            actualAmount=float(opp.actual_close_value) if opp.actual_close_value is not None else None,
            contractDate=opp.signed_date.strftime("%Y-%m-%d") if opp.signed_date else None,
            winReasonName=win_reason_name,
            winNotes=opp.close_note if opp.status == "WON" else None,
            lossReasonName=opp.lost_reason,
            otherReasonDetails=opp.lost_reason_detail,
            competitorName=opp.winning_competitor,
            lossNotes=opp.close_note if opp.status == "LOST" else None,
            ownerUserId=opp.owner_id,
            ownerName=owner_name,
            createdAt=opp.created_at.strftime("%Y-%m-%d %H:%M:%S") if opp.created_at else None,
            updatedAt=opp.updated_at.strftime("%Y-%m-%d %H:%M:%S") if opp.updated_at else None,
        )

    def close_won(
        self,
        db: Session,
        opp_id: int,
        req: CloseWonRequest,
        current_user: User
    ) -> OpportunityResponse:
        """
        3.1. Đóng cơ hội Thắng:
        - Kiểm tra tồn tại, đang mở.
        - Kiểm tra quyền truy cập.
        - Giá trị chốt > 0, ngày ký hợp lệ.
        - Chuyển status = 'WON'.
        - Ghi nhận chỉ tiêu người sở hữu.
        - Ghi lịch sử hoạt động.
        - Transaction commit all.
        """
        opp = opportunity_repo.get_by_id(db, opp_id, for_update=True)
        if not opp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy cơ hội kinh doanh với mã #{opp_id}."
            )

        # 3.3. Từ chối đóng lại cơ hội đã đóng (409 Conflict)
        if opp.status in ("WON", "LOST"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cơ hội đã đóng, không thể thực hiện thao tác này. Vui lòng liên hệ Trưởng nhóm nếu cần mở lại."
            )

        # Kiểm tra quyền truy cập
        if not can_user_access_opportunity(current_user.id, current_user.role, opp.owner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập hoặc đóng cơ hội này."
            )

        # Validation checks
        if not req.actual_close_value or req.actual_close_value <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Giá trị chốt thực tế phải lớn hơn 0."
            )
        if not req.signed_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Vui lòng nhập ngày ký hợp đồng."
            )

        old_status = opp.status
        opp.status = "WON"
        opp.actual_close_value = req.actual_close_value
        opp.signed_date = req.signed_date
        opp.win_reason_id = req.win_reason_id
        opp.close_note = req.note
        opp.closed_by_id = current_user.id
        opp.closed_at = datetime.utcnow()
        opp.probability = 100
        opp.version += 1

        # Cập nhật chỉ tiêu cho người sở hữu
        sales_target_service.credit_won_opportunity(db, opp, req.actual_close_value)

        # Ghi lịch sử hoạt động
        win_reason_obj = db.query(WinLossReason).filter(WinLossReason.id == req.win_reason_id).first() if req.win_reason_id else None
        win_reason_name = win_reason_obj.name if win_reason_obj else None

        history_service.log_event(
            db=db,
            opportunity_id=opp.id,
            action="CLOSE_WON",
            old_status=old_status,
            new_status="WON",
            reason=req.note or "Đóng Thắng cơ hội thành công",
            changed_by_id=current_user.id,
            changed_by_name=current_user.full_name,
            metadata={
                "actual_close_value": float(req.actual_close_value),
                "signed_date": req.signed_date.strftime("%Y-%m-%d"),
                "win_reason_name": win_reason_name,
                "note": req.note
            }
        )

        db.commit()
        db.refresh(opp)
        return self.format_opportunity(opp)

    def close_lost(
        self,
        db: Session,
        opp_id: int,
        req: CloseLostRequest,
        current_user: User
    ) -> OpportunityResponse:
        """
        3.2. Đóng cơ hội Thua:
        - Kiểm tra tồn tại, đang mở.
        - Kiểm tra quyền truy cập.
        - Kiểm tra lý do thua.
        - Chuyển status = 'LOST'.
        - Không cộng chỉ tiêu.
        - Ghi lịch sử hoạt động.
        """
        opp = opportunity_repo.get_by_id(db, opp_id, for_update=True)
        if not opp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy cơ hội kinh doanh với mã #{opp_id}."
            )

        if opp.status in ("WON", "LOST"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cơ hội đã đóng, không thể thực hiện thao tác này. Vui lòng liên hệ Trưởng nhóm nếu cần mở lại."
            )

        if not can_user_access_opportunity(current_user.id, current_user.role, opp.owner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập hoặc đóng cơ hội này."
            )

        if not req.lost_reason or not req.lost_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Vui lòng chọn lý do thua."
            )

        if req.lost_reason in ("Lý do khác", "OTHER", "Lý do khác...") and (not req.lost_reason_detail or not req.lost_reason_detail.strip()):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Vui lòng nhập nội dung giải thích chi tiết khi chọn 'Lý do khác'."
            )

        old_status = opp.status
        opp.status = "LOST"
        opp.lost_reason = req.lost_reason
        opp.lost_reason_detail = req.lost_reason_detail
        opp.winning_competitor = req.winning_competitor
        opp.close_note = req.note
        opp.closed_by_id = current_user.id
        opp.closed_at = datetime.utcnow()
        opp.probability = 0
        opp.version += 1

        # Ghi lịch sử
        history_service.log_event(
            db=db,
            opportunity_id=opp.id,
            action="CLOSE_LOST",
            old_status=old_status,
            new_status="LOST",
            reason=req.lost_reason,
            changed_by_id=current_user.id,
            changed_by_name=current_user.full_name,
            metadata={
                "lost_reason": req.lost_reason,
                "lost_reason_detail": req.lost_reason_detail,
                "winning_competitor": req.winning_competitor,
                "note": req.note
            }
        )

        db.commit()
        db.refresh(opp)
        return self.format_opportunity(opp)

    def reopen(
        self,
        db: Session,
        opp_id: int,
        req: ReopenRequest,
        current_user: User
    ) -> OpportunityResponse:
        """
        3.4. Mở lại cơ hội:
        - Chỉ vai trò TEAM_LEAD, MANAGER, ADMIN.
        - Lý do mở lại bắt buộc.
        - Hoàn tác chỉ tiêu nếu mở lại cơ hội Thắng.
        - Chuyển status = 'OPEN'.
        - Ghi lịch sử hoạt động.
        """
        # Kiểm tra vai trò
        if not can_user_reopen(current_user.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền mở lại cơ hội. Chức năng này chỉ dành cho Trưởng nhóm trở lên."
            )

        opp = opportunity_repo.get_by_id(db, opp_id, for_update=True)
        if not opp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy cơ hội kinh doanh với mã #{opp_id}."
            )

        if opp.status not in ("WON", "LOST"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cơ hội hiện đang mở, không cần mở lại."
            )

        if not req.reason or not req.reason.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Vui lòng nhập lý do mở lại cơ hội."
            )

        old_status = opp.status

        # Nếu mở lại cơ hội Thắng: hoàn tác chỉ tiêu
        if old_status == "WON":
            sales_target_service.reverse_reopened_opportunity(db, opp)

        opp.status = "OPEN"
        opp.probability = 50
        opp.version += 1

        # Ghi lịch sử
        history_service.log_event(
            db=db,
            opportunity_id=opp.id,
            action="REOPEN",
            old_status=old_status,
            new_status="OPEN",
            reason=req.reason.strip(),
            changed_by_id=current_user.id,
            changed_by_name=f"{current_user.full_name} ({current_user.role})",
            metadata={
                "reopened_reason": req.reason.strip(),
                "reversed_won": old_status == "WON"
            }
        )

        db.commit()
        db.refresh(opp)
        return self.format_opportunity(opp)

    def get_by_id(self, db: Session, opp_id: int, current_user: User) -> OpportunityResponse:
        opp = opportunity_repo.get_by_id(db, opp_id)
        if not opp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy cơ hội #{opp_id}"
            )
        if not can_user_access_opportunity(current_user.id, current_user.role, opp.owner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền xem cơ hội này."
            )
        return self.format_opportunity(opp)

    def search(
        self,
        db: Session,
        keyword: Optional[str] = None,
        status: Optional[str] = None,
        owner_id: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        current_user: Optional[User] = None
    ) -> Tuple[List[OpportunityResponse], int]:
        items, total = opportunity_repo.search(db, keyword, status, owner_id, page, size, current_user)
        return [self.format_opportunity(o) for o in items], total

opportunity_service = OpportunityService()
