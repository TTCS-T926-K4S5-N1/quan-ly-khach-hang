from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.opportunity import User, WinLossReason, Competitor
from app.schemas.opportunity import (
    CloseWonRequest,
    CloseLostRequest,
    UnifiedCloseRequest,
    ReopenRequest,
    OpportunityResponse,
    SalesTargetSummaryResponse
)
from app.schemas.opportunity_history import OpportunityHistoryResponse
from app.services.opportunity_service import opportunity_service
from app.services.history_service import history_service
from app.services.sales_target_service import sales_target_service

router = APIRouter(prefix="/api", tags=["opportunities"])

@router.get("/opportunities")
def list_opportunities(
    keyword: Optional[str] = Query(None, description="Tìm kiếm theo mã hoặc tên"),
    status: Optional[str] = Query(None, description="Lọc trạng thái OPEN, WON, LOST, ALL"),
    owner_id: Optional[int] = Query(None, alias="ownerId", description="Lọc theo người sở hữu"),
    page: int = Query(1, ge=1, description="Trang số"),
    size: int = Query(10, ge=1, le=100, description="Kích thước trang"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Lấy danh sách cơ hội kinh doanh kèm phân trang và tìm kiếm."""
    items, total = opportunity_service.search(
        db=db,
        keyword=keyword,
        status=status,
        owner_id=owner_id,
        page=page,
        size=size,
        current_user=current_user
    )
    return {
        "success": True,
        "message": "Lấy danh sách cơ hội thành công",
        "data": items,
        "total": total,
        "page": page,
        "size": size,
        "totalPages": (total + size - 1) // size if size > 0 else 1
    }

@router.get("/opportunities/{id}")
def get_opportunity(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Lấy chi tiết một cơ hội kinh doanh."""
    opp = opportunity_service.get_by_id(db, id, current_user)
    return {
        "success": True,
        "message": "Lấy thông tin cơ hội thành công",
        "data": opp
    }

@router.post("/opportunities/{id}/close-won")
def close_opportunity_won(
    id: int,
    request: CloseWonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """3.1. Đóng cơ hội kinh doanh Thắng."""
    opp = opportunity_service.close_won(db, id, request, current_user)
    quota = sales_target_service.get_user_summary(db, opp.ownerUserId)
    return {
        "success": True,
        "message": f"Đóng Thắng cơ hội thành công",
        "data": {
            "opportunity": opp,
            "quota": quota
        }
    }

@router.post("/opportunities/{id}/close-lost")
def close_opportunity_lost(
    id: int,
    request: CloseLostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """3.2. Đóng cơ hội kinh doanh Thua."""
    opp = opportunity_service.close_lost(db, id, request, current_user)
    return {
        "success": True,
        "message": f"Đóng Thua cơ hội thành công",
        "data": opp
    }

@router.post("/opportunities/{id}/close")
def unified_close_opportunity(
    id: int,
    request: UnifiedCloseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Unified endpoint supporting frontend POST /api/opportunities/{id}/close."""
    status_upper = request.status.upper()
    if status_upper == "WON":
        won_req = CloseWonRequest(
            actual_close_value=request.actual_close_value,
            signed_date=request.signed_date,
            win_reason_id=request.win_reason_id,
            note=request.note
        )
        opp = opportunity_service.close_won(db, id, won_req, current_user)
        quota = sales_target_service.get_user_summary(db, opp.ownerUserId)
        return {
            "success": True,
            "message": "Đóng Thắng cơ hội thành công",
            "data": {
                "opportunity": opp,
                "quota": quota
            }
        }
    elif status_upper == "LOST":
        lost_req = CloseLostRequest(
            lost_reason=request.lost_reason,
            lost_reason_detail=request.lost_reason_detail,
            winning_competitor=request.winning_competitor,
            note=request.note
        )
        opp = opportunity_service.close_lost(db, id, lost_req, current_user)
        return {
            "success": True,
            "message": "Đóng Thua cơ hội thành công",
            "data": opp
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Trạng thái đóng cơ hội phải là WON hoặc LOST."
        )

@router.post("/opportunities/{id}/reopen")
def reopen_opportunity(
    id: int,
    request: ReopenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """3.4. Mở lại cơ hội kinh doanh (chỉ Trưởng nhóm trở lên)."""
    opp = opportunity_service.reopen(db, id, request, current_user)
    return {
        "success": True,
        "message": f"Đã mở lại thành công cơ hội #{id}",
        "data": opp
    }

@router.get("/opportunities/{id}/history")
def get_opportunity_history(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Lấy lịch sử hoạt động và thay đổi trạng thái của cơ hội."""
    # Verify permission to view opportunity first
    opportunity_service.get_by_id(db, id, current_user)
    timeline = history_service.get_timeline(db, id)
    return {
        "success": True,
        "message": "Lấy lịch sử cơ hội thành công",
        "data": timeline
    }

@router.get("/users/{user_id}/sales-target-summary")
def get_sales_target_summary(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Lấy tóm tắt chỉ tiêu bán hàng của người sở hữu."""
    summary = sales_target_service.get_user_summary(db, user_id)
    return {
        "success": True,
        "message": "Lấy chỉ tiêu người sở hữu thành công",
        "data": summary
    }

@router.get("/win-loss-reasons")
def get_win_loss_reasons(
    type: Optional[str] = Query(None, description="WON hoặc LOST"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Danh mục lý do Thắng / Thua."""
    query = db.query(WinLossReason)
    if type:
        query = query.filter(WinLossReason.type == type.upper())
    items = query.all()
    return {
        "success": True,
        "data": [{"id": r.id, "name": r.name, "type": r.type} for r in items]
    }

@router.get("/competitors")
def get_competitors(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Danh mục đối thủ cạnh tranh."""
    items = db.query(Competitor).all()
    return {
        "success": True,
        "data": [{"id": c.id, "name": c.name} for c in items]
    }
