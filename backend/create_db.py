from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import urllib.parse

# Construct the admin URL connecting to the default 'postgres' database
password = urllib.parse.quote_plus('Gaurav@4201')
admin_url = f"postgresql://postgres:{password}@localhost:5432/postgres"

engine = create_engine(admin_url)

from sqlalchemy import text

with engine.connect() as conn:
    # psycopg2 needs isolation_level AUTOCOMMIT for creating databases
    conn.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    
    # Check if database exists
    res = conn.execute(text("SELECT 1 FROM pg_database WHERE datname='smartstudy'"))
    if not res.fetchone():
        print("Creating database 'smartstudy'...")
        conn.execute(text("CREATE DATABASE smartstudy"))
        print("Database created successfully.")
    else:
        print("Database 'smartstudy' already exists.")
