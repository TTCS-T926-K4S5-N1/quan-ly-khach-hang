from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

class SalesTargetTransaction(Base):
    __tablename__ = "sales_target_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    opportunity_id = Column(BigInteger, ForeignKey("opportunities.id"), nullable=False, index=True)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False) # Positive for WON_CREDIT, negative for REOPEN_REVERSAL
    transaction_type = Column(String(30), nullable=False) # 'WON_CREDIT', 'REOPEN_REVERSAL'
    idempotency_key = Column(String(120), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    opportunity = relationship("Opportunity", back_populates="sales_transactions")
    owner = relationship("User", foreign_keys=[owner_id])

    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_sales_target_idempotency"),
    )
