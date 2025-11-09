#!/bin/bash
# ===============================
# PostgreSQL初期化スクリプト
# UTF-8エンコーディングとロケール設定
# ===============================

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- UTF-8エンコーディング確認
    SHOW SERVER_ENCODING;

    -- 日本語ロケール設定
    CREATE COLLATION IF NOT EXISTS ja_JP (locale = 'ja_JP.UTF-8');

    -- データベース情報表示
    SELECT version();
EOSQL

echo "PostgreSQL初期化完了"
