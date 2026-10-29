
from getpass import getpass
from sqlalchemy import create_engine, text

database_url = getpass("Neon DATABASE_URL: ")
engine = create_engine(database_url, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        tables = connection.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)).scalars().all()

        print("\nDatabase jadvallari:")
        if tables:
            for table in tables:
                print("-", table)
        else:
            print("Public schema ichida jadvallar topilmadi.")

        vector = connection.execute(text("""
            SELECT extname, extversion
            FROM pg_extension
            WHERE extname = 'vector'
        """)).fetchone()

        print("\npgvector:", vector if vector else "O'rnatilmagan")

finally:
    engine.dispose()
