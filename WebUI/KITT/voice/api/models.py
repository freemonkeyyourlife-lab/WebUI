import os
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DB_PATH = os.environ.get('VOICE_DB', 'sqlite:///./voice_db.sqlite')

engine = create_engine(DB_PATH, connect_args={"check_same_thread": False} if DB_PATH.startswith('sqlite') else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Voice(Base):
    __tablename__ = 'voices'
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(String, nullable=True)
    sample_path = Column(String)
    model_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True, index=True)
    voice_id = Column(String)
    type = Column(String)
    mode = Column(String, default='rvc')
    status = Column(String, default='queued')
    logs = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


def init_db():
    Base.metadata.create_all(bind=engine)
