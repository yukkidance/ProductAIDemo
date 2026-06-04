"""
训练 XGBoost 航材消耗预测模型
合成 2000 行航材历史消耗,体现真实训练-推理闭环

输出:
- app/data/forecast_model.json  (XGBoost 原生 JSON,无需 joblib)
- app/data/forecast_meta.json   (特征列名 + 唯一值 + 评价指标,反 one-hot 用)
"""
import os
import sys
from pathlib import Path
import numpy as np
import pandas as pd
from xgboost import XGBRegressor

BACKEND_DIR = Path.cwd() / "backend"
os.chdir(BACKEND_DIR)

CATEGORICAL_COLS = ["part_type", "aircraft_model"]
NUMERIC_COLS = ["month", "check_plan", "season_factor", "historical_avg", "fleet_count"]


def gen_supply_chain_data(n=2000, seed=42):
    """合成航材消耗数据"""
    np.random.seed(seed)
    df = pd.DataFrame({
        "part_type": np.random.choice(["safety", "consumable"], n, p=[0.3, 0.7]),
        "aircraft_model": np.random.choice(["A320", "B737", "B777"], n),
        "month": np.random.randint(1, 13, n),
        "check_plan": np.random.randint(0, 5, n),
        "season_factor": np.round(np.random.uniform(0.8, 1.2, n), 3),
        "historical_avg": np.round(np.random.uniform(10, 500, n), 1),
        "fleet_count": np.random.randint(5, 80, n),
    })
    base = df["historical_avg"] * df["season_factor"]
    check_impact = 1 + 0.3 * df["check_plan"]
    fleet_impact = 1 + 0.005 * df["fleet_count"]
    type_impact = np.where(df["part_type"] == "safety", 0.7, 1.0)
    noise = np.random.normal(0, 15, n)
    df["actual"] = np.maximum(0, base * check_impact * fleet_impact * type_impact + noise)
    df["actual"] = df["actual"].round(2)
    return df


def main():
    print("[*] 生成合成航材数据...")
    df = gen_supply_chain_data()
    print(f"    总样本: {len(df)}, 列: {list(df.columns)}")

    df_enc = pd.get_dummies(df[NUMERIC_COLS + CATEGORICAL_COLS], columns=CATEGORICAL_COLS)
    feature_columns = df_enc.columns.tolist()
    X = df_enc.values
    y = df["actual"].values

    n = len(X)
    idx = np.arange(n)
    np.random.seed(42)
    np.random.shuffle(idx)
    split = int(n * 0.8)
    X_tr, X_te = X[:split], X[split:]
    y_tr, y_te = y[:split], y[split:]

    print("[*] 训练 XGBoost...")
    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
    )
    model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    pred = model.predict(X_te)
    mae = float(np.mean(np.abs(y_te - pred)))
    mask = y_te > 0
    mape = float(np.mean(np.abs((y_te[mask] - pred[mask]) / y_te[mask])) * 100) if mask.any() else 0.0
    print(f"[+] MAE:  {mae:.2f}")
    print(f"[+] MAPE: {mape:.2f}%")

    te_df = df.iloc[idx[split:]]
    sa_mask = te_df["part_type"].values == "safety"
    co_mask = ~sa_mask
    if sa_mask.any():
        sa_mae = float(np.mean(np.abs(y_te[sa_mask] - pred[sa_mask])))
        print(f"    安全件 MAE: {sa_mae:.2f} (关注漏报)")
    if co_mask.any():
        co_mae = float(np.mean(np.abs(y_te[co_mask] - pred[co_mask])))
        print(f"    消耗件 MAE: {co_mae:.2f} (关注误报)")

    import json
    model_path = "app/data/forecast_model.json"
    model.save_model(model_path)
    print(f"[+] XGBoost 模型已保存: {model_path}")

    meta = {
        "feature_columns": feature_columns,
        "categorical_values": {
            "part_type": sorted(df["part_type"].unique().tolist()),
            "aircraft_model": sorted(df["aircraft_model"].unique().tolist()),
        },
        "metrics": {"mae": mae, "mape": mape},
        "n_train": int(len(X_tr)),
        "n_test": int(len(X_te)),
    }
    meta_path = "app/data/forecast_meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"[+] 元信息已保存: {meta_path}")
    print(f"    特征数: {len(feature_columns)}")


if __name__ == "__main__":
    main()
