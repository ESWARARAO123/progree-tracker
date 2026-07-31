from sqlalchemy import Column, Integer, String, Enum as SAEnum
from app.db.base import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(SAEnum("ADMIN", "EMPLOYEE", name="user_role_enum", create_type=False), nullable=False, unique=True)
    description = Column(String, nullable=True)
