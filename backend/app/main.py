from datetime import datetime, date
from decimal import Decimal
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request, status
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.exceptions import RequestValidationError
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.db.session import init_db, SessionLocal
from app.models.opportunity import (
    User, Customer, PipelineStage, WinLossReason, Competitor, Opportunity
)
from app.models.opportunity_history import OpportunityHistory
from app.core.security import hash_password
from app.routers.opportunities import router as opportunities_router

def seed_initial_data():
    """Populate default users, customers, stages, win/loss reasons and sample opportunities."""
    db = SessionLocal()
    try:
        # Seed Users
        if db.query(User).count() == 0:
            users = [
                User(
                    id=1,
                    email="hieu.nv@crm.com",
                    full_name="Nguyễn Văn Hiếu",
                    role="SALES_REP",
                    hashed_password=hash_password("123456"),
                    is_active=True
                ),
                User(
                    id=2,
                    email="trang.lt@crm.com",
                    full_name="Lê Thu Trang",
                    role="SALES_REP",
                    hashed_password=hash_password("123456"),
                    is_active=True
                ),
                User(
                    id=3,
                    email="nam.tv@crm.com",
                    full_name="Trần Văn Nam",
                    role="TEAM_LEAD",
                    hashed_password=hash_password("123456"),
                    is_active=True
                ),
                User(
                    id=4,
                    email="admin@crm.com",
                    full_name="Quản Trị Viên",
                    role="ADMIN",
                    hashed_password=hash_password("123456"),
                    is_active=True
                ),
            ]
            db.add_all(users)
            db.commit()

        # Seed Customers
        if db.query(Customer).count() == 0:
            customers = [
                Customer(id=1, name="Tập đoàn Công nghệ Viễn thông VNP", contact_person="Nguyễn Văn Hùng", phone="0912 345 678", email="hung.nv@vnp-group.vn"),
                Customer(id=2, name="Công ty Cổ phần Thương mại Vinagroup", contact_person="Trần Thị Mai", phone="0988 765 432", email="mai.tran@vinagroup.com.vn"),
                Customer(id=3, name="Dược phẩm Quốc tế Fast Pharma", contact_person="Lê Hoàng Nam", phone="0903 112 233", email="nam.le@fastpharma.vn"),
                Customer(id=4, name="Ngân hàng TMCP An Bình Thịnh Vượng", contact_person="Phạm Đức Minh", phone="0977 889 900", email="minh.pd@abtc.com.vn"),
                Customer(id=5, name="Logistics Toàn Cầu SmartLog", contact_person="Hoàng Kim Oanh", phone="0934 556 778", email="oanh.hk@smartlog.vn"),
            ]
            db.add_all(customers)
            db.commit()

        # Seed Pipeline Stages
        if db.query(PipelineStage).count() == 0:
            stages = [
                PipelineStage(id=1, name="Tiếp cận ban đầu", stage_order=1, win_probability=10),
                PipelineStage(id=2, name="Khảo sát nhu cầu", stage_order=2, win_probability=30),
                PipelineStage(id=3, name="Đề xuất giải pháp", stage_order=3, win_probability=60),
                PipelineStage(id=4, name="Đàm phán hợp đồng", stage_order=4, win_probability=80),
                PipelineStage(id=5, name="Chốt thành công", stage_order=5, win_probability=100, is_won=True),
                PipelineStage(id=6, name="Đóng thất bại", stage_order=6, win_probability=0, is_lost=True),
            ]
            db.add_all(stages)
            db.commit()

        # Seed Win/Loss Reasons
        if db.query(WinLossReason).count() == 0:
            reasons = [
                WinLossReason(id=1, name="Giải pháp kỹ thuật tối ưu vượt trội", type="WON"),
                WinLossReason(id=2, name="Giá cả cạnh tranh & ưu đãi tốt", type="WON"),
                WinLossReason(id=3, name="Chất lượng dịch vụ hỗ trợ khách hàng", type="WON"),
                WinLossReason(id=4, name="Mối quan hệ và uy tín thương hiệu", type="WON"),
                WinLossReason(id=5, name="Thời gian triển khai nhanh", type="WON"),
                WinLossReason(id=6, name="Giá cao", type="LOST"),
                WinLossReason(id=7, name="Khách hàng chọn đối thủ", type="LOST"),
                WinLossReason(id=8, name="Sản phẩm không đáp ứng nhu cầu", type="LOST"),
                WinLossReason(id=9, name="Không đủ ngân sách", type="LOST"),
                WinLossReason(id=10, name="Khách hàng hoãn quyết định", type="LOST"),
                WinLossReason(id=11, name="Chăm sóc khách hàng chưa tốt", type="LOST"),
                WinLossReason(id=12, name="Lý do khác", type="LOST"),
            ]
            db.add_all(reasons)
            db.commit()

        # Seed Competitors
        if db.query(Competitor).count() == 0:
            comps = [
                Competitor(id=1, name="Viettel Solutions"),
                Competitor(id=2, name="FPT Information System"),
                Competitor(id=3, name="MISA JSC"),
                Competitor(id=4, name="CMC Telecom"),
                Competitor(id=5, name="Base.vn"),
                Competitor(id=6, name="Đối thủ khác"),
            ]
            db.add_all(comps)
            db.commit()

        # Seed Opportunities
        if db.query(Opportunity).count() == 0:
            opps = [
                Opportunity(
                    id=101,
                    name="Gói giải pháp Chuyển đổi số Doanh nghiệp VNP",
                    customer_id=1,
                    owner_id=1,
                    expected_value=Decimal("850000000"),
                    stage_id=3,
                    probability=60,
                    expected_close_date=date(2026, 10, 30),
                    status="OPEN",
                    version=1
                ),
                Opportunity(
                    id=102,
                    name="Hệ thống Quản lý Khách hàng CRM Cloud cho Vinagroup",
                    customer_id=2,
                    owner_id=1,
                    expected_value=Decimal("420000000"),
                    stage_id=4,
                    probability=80,
                    expected_close_date=date(2026, 10, 25),
                    status="OPEN",
                    version=1
                ),
                Opportunity(
                    id=103,
                    name="Triển khai ERP & Tích hợp Kế toán Fast Pharma",
                    customer_id=3,
                    owner_id=1,
                    expected_value=Decimal("600000000"),
                    stage_id=5,
                    probability=100,
                    expected_close_date=date(2026, 10, 5),
                    status="WON",
                    actual_close_value=Decimal("620000000"),
                    signed_date=date(2026, 10, 5),
                    win_reason_id=1,
                    close_note="Khách hàng đánh giá rất cao demo hệ thống.",
                    closed_by_id=1,
                    closed_at=datetime(2026, 10, 5, 16, 45),
                    version=2
                ),
                Opportunity(
                    id=104,
                    name="Nâng cấp Hạ tầng Mạng & Bảo mật Trung tâm Dữ liệu",
                    customer_id=4,
                    owner_id=2,
                    expected_value=Decimal("1200000000"),
                    stage_id=6,
                    probability=0,
                    expected_close_date=date(2026, 10, 2),
                    status="LOST",
                    lost_reason="Giá cao",
                    winning_competitor="FPT Information System",
                    close_note="Bên mua cắt giảm 30% ngân sách IT quý 4.",
                    closed_by_id=2,
                    closed_at=datetime(2026, 10, 2, 11, 0),
                    version=2
                ),
                Opportunity(
                    id=105,
                    name="Phần mềm Quản lý Kho Thông minh SmartLogistics",
                    customer_id=5,
                    owner_id=2,
                    expected_value=Decimal("350000000"),
                    stage_id=2,
                    probability=40,
                    expected_close_date=date(2026, 11, 15),
                    status="OPEN",
                    version=1
                ),
            ]
            db.add_all(opps)
            db.commit()

            # Seed initial histories for 101 and 103
            histories = [
                OpportunityHistory(
                    opportunity_id=101,
                    action="CREATE",
                    old_status=None,
                    new_status="OPEN",
                    reason="Khởi tạo cơ hội kinh doanh mới",
                    changed_by_name="Nguyễn Văn Hiếu",
                    changed_at=datetime(2026, 9, 10, 9, 30)
                ),
                OpportunityHistory(
                    opportunity_id=103,
                    action="CREATE",
                    old_status=None,
                    new_status="OPEN",
                    reason="Khởi tạo cơ hội",
                    changed_by_name="Nguyễn Văn Hiếu",
                    changed_at=datetime(2026, 8, 20, 10, 0)
                ),
                OpportunityHistory(
                    opportunity_id=103,
                    action="CLOSE_WON",
                    old_status="OPEN",
                    new_status="WON",
                    reason="Đóng Thắng cơ hội thành công",
                    changed_by_name="Nguyễn Văn Hiếu",
                    changed_at=datetime(2026, 10, 5, 16, 45),
                    metadata_json='{"actual_close_value": 620000000, "signed_date": "2026-10-05", "win_reason_name": "Giải pháp kỹ thuật tối ưu vượt trội"}'
                ),
            ]
            db.add_all(histories)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed Data
    init_db()
    seed_initial_data()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API cho chức năng Đóng Cơ Hội Kinh Doanh Thắng / Thua (POINT 76)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": exc.status_code,
            "message": exc.detail
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "Dữ liệu không hợp lệ."
    if errors:
        first_err = errors[0]
        field = first_err.get("loc", [""])[-1]
        msg = f"{first_err.get('msg', 'Dữ liệu không hợp lệ')} ({field})"
    from fastapi.encoders import jsonable_encoder
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "code": 422,
            "message": msg,
            "details": jsonable_encoder(errors)
        }
    )

# Include Routers
app.include_router(opportunities_router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "point": "76: Đóng Cơ Hội Kinh Doanh Thắng / Thua"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}
