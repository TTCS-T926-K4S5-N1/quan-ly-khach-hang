# pyrefly: ignore [missing-import]
import pytest
from datetime import date, datetime
from decimal import Decimal
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.opportunity import User, Customer, PipelineStage, WinLossReason, Competitor, Opportunity
from app.core.security import hash_password

# Test SQLite in-memory or file database
TEST_DB_URL = "sqlite:///./test_crm.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    db = TestingSessionLocal()
    # Seed test users
    u1 = User(id=1, email="sales@crm.com", full_name="Sales Rep User", role="SALES_REP", hashed_password=hash_password("123"), is_active=True)
    u2 = User(id=2, email="sales2@crm.com", full_name="Other Sales Rep", role="SALES_REP", hashed_password=hash_password("123"), is_active=True)
    u3 = User(id=3, email="lead@crm.com", full_name="Team Leader User", role="TEAM_LEAD", hashed_password=hash_password("123"), is_active=True)
    u4 = User(id=4, email="admin@crm.com", full_name="Admin User", role="ADMIN", hashed_password=hash_password("123"), is_active=True)
    
    # Customer
    c1 = Customer(id=1, name="Công ty TNHH Khách Hàng Thử Nghiệm", contact_person="Anh A")
    
    # Stage
    s1 = PipelineStage(id=1, name="Đàm phán", stage_order=1, win_probability=50)
    
    # Win / Loss Reasons
    r1 = WinLossReason(id=1, name="Giải pháp tốt", type="WON")
    r2 = WinLossReason(id=2, name="Giá cao", type="LOST")
    r3 = WinLossReason(id=3, name="Lý do khác", type="LOST")

    db.add_all([u1, u2, u3, u4, c1, s1, r1, r2, r3])
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
