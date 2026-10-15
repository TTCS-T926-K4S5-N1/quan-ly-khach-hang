from typing import Optional
from pydantic import BaseModel

class OpportunityHistoryResponse(BaseModel):
    id: int
    opportunityId: int
    action: str
    actionNameVi: str
    fromStatus: Optional[str] = None
    toStatus: Optional[str] = None
    description: str
    performedBy: str
    performedAt: str
    reason: Optional[str] = None
    actualAmount: Optional[float] = None
    contractDate: Optional[str] = None
    winReason: Optional[str] = None
    lossReason: Optional[str] = None
    competitor: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
