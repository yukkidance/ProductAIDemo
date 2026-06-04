"""
灌入 SQLite 演示数据库
表: orders / production / oee / workhours
"""
import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

import sqlite3

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
os.chdir(BACKEND_DIR)

DB_PATH = BACKEND_DIR / "app" / "data" / "production.db"
os.makedirs(DB_PATH.parent, exist_ok=True)

random.seed(42)

LINES = ["A线", "B线", "C线"]
MODELS = ["A320", "B737NG", "B777", "A330"]
CUSTOMERS = ["国航", "东航", "南航", "海航", "深航", "厦航"]
TEAMS = ["甲班", "乙班", "丙班", "丁班"]


def gen_orders(n=300):
    """订单表"""
    rows = []
    statuses = ["已交付", "生产中", "排产中", "已取消"]
    for i in range(n):
        days_ago = random.randint(1, 180)
        rows.append((
            f"ORD{2024000 + i}",
            (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            random.choice(MODELS),
            random.choice(CUSTOMERS),
            round(random.uniform(5000, 50000), 2),
            random.choices(statuses, weights=[60, 25, 10, 5])[0],
        ))
    return rows


def gen_production(n=400):
    """产量表"""
    rows = []
    for i in range(n):
        days_ago = random.randint(1, 120)
        rows.append((
            i + 1,
            (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            random.choice(LINES),
            random.choice(MODELS),
            random.randint(0, 8),
            round(random.uniform(0, 24), 1),
        ))
    return rows


def gen_oee(n=300):
    """OEE 表 - 故意让 B 线偏低,便于演示"""
    rows = []
    for i in range(n):
        days_ago = random.randint(1, 90)
        line = random.choice(LINES)
        # B 线 OEE 偏低,讲故事用
        base = {"A线": 0.85, "B线": 0.68, "C线": 0.82}[line]
        availability = round(base + random.uniform(-0.05, 0.05), 3)
        performance = round(base + random.uniform(-0.05, 0.05), 3)
        quality = round(0.95 + random.uniform(-0.02, 0.02), 3)
        oee = round(availability * performance * quality, 3)
        rows.append((
            i + 1,
            (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            line,
            availability,
            performance,
            quality,
            oee,
        ))
    return rows


def gen_workhours(n=400):
    """工时表"""
    rows = []
    for i in range(n):
        days_ago = random.randint(1, 120)
        line = random.choice(LINES)
        planned = random.randint(60, 120)
        actual = planned + random.randint(-15, 25)
        overtime = max(0, actual - planned - random.randint(0, 10))
        rows.append((
            i + 1,
            (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            line,
            random.choice(TEAMS),
            planned,
            actual,
            overtime,
        ))
    return rows


def main():
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE orders (
        order_id TEXT PRIMARY KEY,
        order_date TEXT,
        aircraft_model TEXT,
        customer TEXT,
        amount REAL,
        status TEXT
    );
    CREATE TABLE production (
        id INTEGER PRIMARY KEY,
        date TEXT,
        line TEXT,
        aircraft_model TEXT,
        units INTEGER,
        hours REAL
    );
    CREATE TABLE oee (
        id INTEGER PRIMARY KEY,
        date TEXT,
        line TEXT,
        availability REAL,
        performance REAL,
        quality REAL,
        oee_value REAL
    );
    CREATE TABLE workhours (
        id INTEGER PRIMARY KEY,
        date TEXT,
        line TEXT,
        team TEXT,
        planned_hours INTEGER,
        actual_hours INTEGER,
        overtime_hours INTEGER
    );
    """)

    cur.executemany(
        "INSERT INTO orders VALUES (?,?,?,?,?,?)", gen_orders()
    )
    cur.executemany(
        "INSERT INTO production VALUES (?,?,?,?,?,?)", gen_production()
    )
    cur.executemany(
        "INSERT INTO oee VALUES (?,?,?,?,?,?,?)", gen_oee()
    )
    cur.executemany(
        "INSERT INTO workhours VALUES (?,?,?,?,?,?,?)", gen_workhours()
    )

    conn.commit()

    # 统计
    for tbl in ["orders", "production", "oee", "workhours"]:
        cur.execute(f"SELECT COUNT(*) FROM {tbl}")
        print(f"[+] {tbl}: {cur.fetchone()[0]} 行")

    conn.close()
    print(f"[+] 数据库已生成: {DB_PATH}")


if __name__ == "__main__":
    main()
