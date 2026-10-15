from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class OpportunityHistory(Base):
    __tablename__ = "opportunity_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    opportunity_id = Column(BigInteger, ForeignKey("opportunities.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False) # 'CREATE', 'STAGE_CHANGE', 'CLOSE_WON', 'CLOSE_LOST', 'REOPEN'
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=True)
    reason = Column(Text, nullable=True)
    changed_by_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    changed_by_name = Column(String(100), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    metadata_json = Column(Text, nullable=True)

    opportunity = relationship("Opportunity", back_populates="histories")
    changed_by = relationship("User", foreign_keys=[changed_by_id])
