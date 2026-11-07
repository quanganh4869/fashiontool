from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy declarative models in TrendMotion Studio.
    Business models will be declared in app.models in subsequent phases.
    """
