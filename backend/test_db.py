import psycopg2

try:
    conn_params = {
        'host': 'localhost',
        'dbname': 'cardiovascular_db',
        'user': 'postgres',
        'password': 'chungadev',
        'options': "-c client_encoding='WIN1252'"
    }
    conn = psycopg2.connect(**conn_params)
    print("Connection successful!")
    cur = conn.cursor()
    cur.execute('SHOW client_encoding')
    print("Current client encoding:", cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
