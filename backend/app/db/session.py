import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base

logger = logging.getLogger("crm.db")

def create_db_engine():
    db_url = settings.DATABASE_URL
    try:
        # Try primary database engine (e.g. MySQL)
        if "sqlite" in db_url:
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                pool_size=10,
                max_overflow=20
            )
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected to database successfully: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return engine
    except Exception as e:
        logger.warning(
            f"Could not connect to configured DB ({e}). Falling back to SQLite database './crm_local.db'..."
        )
        fallback_url = "sqlite:///./crm_local.db"
        fallback_engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
        return fallback_engine

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to provide database session per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables and seed initial records if needed."""
    Base.metadata.create_all(bind=engine)
