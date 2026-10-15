from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.opportunity import Opportunity, User, Customer, PipelineStage
from app.models.opportunity_history import OpportunityHistory
from app.models.sales_target_transaction import SalesTargetTransaction
from app.core.permissions import RoleEnum

class OpportunityRepository:

    def get_by_id(self, db: Session, opp_id: int, for_update: bool = False) -> Optional[Opportunity]:
        """Fetch opportunity by ID, optionally acquiring pessimistic row lock."""
        query = db.query(Opportunity).filter(Opportunity.id == opp_id, Opportunity.is_deleted == False)
        if for_update:
            try:
                # with_for_update works on MySQL and Postgres
                query = query.with_for_update()
            except Exception:
                pass
        return query.first()

    def search(
        self,
        db: Session,
        keyword: Optional[str] = None,
        status: Optional[str] = None,
        owner_id: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        current_user: Optional[User] = None
    ) -> Tuple[List[Opportunity], int]:
        """Search and paginate opportunities with scoping by role."""
        query = db.query(Opportunity).filter(Opportunity.is_deleted == False)

        # Scope by role
        if current_user and current_user.role.upper() == RoleEnum.SALES_REP.value:
            query = query.filter(Opportunity.owner_id == current_user.id)

        # Keyword filter
        if keyword and keyword.strip():
            kw = f"%{keyword.strip().lower()}%"
            query = query.outerjoin(Customer, Opportunity.customer_id == Customer.id).filter(
                or_(
                    func.lower(Opportunity.name).like(kw),
                    func.lower(Customer.name).like(kw)
                )
            )

        # Status filter
        if status and status.strip() and status.upper() != "ALL":
            query = query.filter(Opportunity.status == status.upper())

        # Owner filter
        if owner_id and owner_id > 0:
            query = query.filter(Opportunity.owner_id == owner_id)

        total = query.count()
        items = query.order_by(Opportunity.id.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    def save_history(self, db: Session, history_item: OpportunityHistory) -> OpportunityHistory:
        """Persist an audit trail event."""
        db.add(history_item)
        return history_item

    def get_histories(self, db: Session, opp_id: int) -> List[OpportunityHistory]:
        """Get history timeline for an opportunity."""
        return db.query(OpportunityHistory).filter(
            OpportunityHistory.opportunity_id == opp_id
        ).order_by(OpportunityHistory.id.desc()).all()

    def save_sales_transaction(
        self, db: Session, transaction: SalesTargetTransaction
    ) -> SalesTargetTransaction:
        """Persist a sales target ledger transaction."""
        db.add(transaction)
        return transaction

    def get_sales_target_transactions(self, db: Session, owner_id: int) -> List[SalesTargetTransaction]:
        """Fetch all target credit/reversals for an owner."""
        return db.query(SalesTargetTransaction).filter(
            SalesTargetTransaction.owner_id == owner_id
        ).all()

opportunity_repo = OpportunityRepository()
