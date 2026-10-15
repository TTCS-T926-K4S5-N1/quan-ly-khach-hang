from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.sales_target_transaction import SalesTargetTransaction
from app.models.opportunity import Opportunity, User
from app.schemas.opportunity import SalesTargetSummaryResponse
from app.repositories.opportunity_repository import opportunity_repo

class SalesTargetService:

    def credit_won_opportunity(
        self,
        db: Session,
        opportunity: Opportunity,
        actual_amount: Decimal
    ) -> Optional[SalesTargetTransaction]:
        """
        Record sales credit for the owner of a newly won opportunity.
        Uses idempotency_key to prevent duplicate credits.
        """
        idempotency_key = f"WON_OPP_{opportunity.id}_VER_{opportunity.version}"
        
        # Check if already credited for this transition
        existing = db.query(SalesTargetTransaction).filter(
            SalesTargetTransaction.idempotency_key == idempotency_key
        ).first()
        if existing:
            return existing

        tx = SalesTargetTransaction(
            opportunity_id=opportunity.id,
            owner_id=opportunity.owner_id,
            amount=actual_amount,
            transaction_type="WON_CREDIT",
            idempotency_key=idempotency_key
        )
        return opportunity_repo.save_sales_transaction(db, tx)

    def reverse_reopened_opportunity(
        self,
        db: Session,
        opportunity: Opportunity
    ) -> Optional[SalesTargetTransaction]:
        """
        Reverse previously recorded sales credit when a WON opportunity is reopened.
        Reverses exactly once per reopen transition.
        """
        if not opportunity.actual_close_value or opportunity.actual_close_value <= 0:
            return None

        idempotency_key = f"REOPEN_OPP_{opportunity.id}_VER_{opportunity.version}"
        existing = db.query(SalesTargetTransaction).filter(
            SalesTargetTransaction.idempotency_key == idempotency_key
        ).first()
        if existing:
            return existing

        # Negative amount to reverse the credit
        reversal_amount = -Decimal(str(opportunity.actual_close_value))

        tx = SalesTargetTransaction(
            opportunity_id=opportunity.id,
            owner_id=opportunity.owner_id,
            amount=reversal_amount,
            transaction_type="REOPEN_REVERSAL",
            idempotency_key=idempotency_key
        )
        return opportunity_repo.save_sales_transaction(db, tx)

    def get_user_summary(self, db: Session, user_id: int) -> SalesTargetSummaryResponse:
        """Calculate total achieved quota and count for an owner."""
        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.full_name if user else f"Nhân viên #{user_id}"

        # Sum of all credit & reversal amounts
        total_achieved = db.query(func.coalesce(func.sum(SalesTargetTransaction.amount), 0)).filter(
            SalesTargetTransaction.owner_id == user_id
        ).scalar() or Decimal(0)

        # Count WON deals currently open or won
        won_deals_count = db.query(Opportunity).filter(
            Opportunity.owner_id == user_id,
            Opportunity.status == "WON",
            Opportunity.is_deleted == False
        ).count()

        target_amount = Decimal(1000000000) # 1 Billion VND
        percentage = int(min(100, max(0, (total_achieved / target_amount) * 100)))

        return SalesTargetSummaryResponse(
            userId=user_id,
            userName=user_name,
            period="Tháng 10/2026",
            targetAmount=float(target_amount),
            achievedAmount=float(total_achieved),
            achievedPercentage=percentage,
            wonCount=won_deals_count
        )

sales_target_service = SalesTargetService()
