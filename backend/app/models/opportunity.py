from datetime import datetime, date
# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Column, Integer, BigInteger, String, Numeric, Date, DateTime,
    ForeignKey, Text, Boolean
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False, default="SALES_REP") # SALES_REP, TEAM_LEAD, MANAGER, ADMIN
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    opportunities = relationship("Opportunity", back_populates="owner", foreign_keys="Opportunity.owner_id")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    company = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    opportunities = relationship("Opportunity", back_populates="customer")

class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    stage_order = Column(Integer, default=1)
    win_probability = Column(Integer, default=0)
    is_won = Column(Boolean, default=False)
    is_lost = Column(Boolean, default=False)

class WinLossReason(Base):
    __tablename__ = "win_loss_reasons"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(String(10), nullable=False) # 'WON' or 'LOST'

class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=True, index=True)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    expected_value = Column(Numeric(15, 2), default=0.0)
    stage_id = Column(BigInteger, ForeignKey("pipeline_stages.id"), nullable=True)
    probability = Column(Integer, default=0)
    expected_close_date = Column(Date, nullable=True)
    
    # Status: 'OPEN', 'WON', 'LOST'
    status = Column(String(20), nullable=False, default="OPEN", index=True)
    
    # Close Won details
    actual_close_value = Column(Numeric(15, 2), nullable=True)
    signed_date = Column(Date, nullable=True)
    win_reason_id = Column(BigInteger, ForeignKey("win_loss_reasons.id"), nullable=True)
    
    # Close Lost details
    lost_reason = Column(String(255), nullable=True)
    lost_reason_detail = Column(Text, nullable=True)
    winning_competitor = Column(String(255), nullable=True)
    
    # Close Note & Closure Actor
    close_note = Column(Text, nullable=True)
    closed_by_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Optimistic locking
    version = Column(Integer, default=1, nullable=False)
    
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="opportunities")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="opportunities")
    closed_by = relationship("User", foreign_keys=[closed_by_id])
    stage = relationship("PipelineStage")
    win_reason = relationship("WinLossReason")
    histories = relationship("OpportunityHistory", back_populates="opportunity", cascade="all, delete-orphan", order_by="desc(OpportunityHistory.id)")
    sales_transactions = relationship("SalesTargetTransaction", back_populates="opportunity", cascade="all, delete-orphan")
