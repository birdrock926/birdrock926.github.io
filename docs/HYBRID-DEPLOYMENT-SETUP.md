# 🌐 ハイブリッドデプロイメント構成ガイド

**Cloudflare Pages + 無料VPS + 自宅Ubuntuサーバー**の3層構成セットアップガイド

---

## 📊 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────┐
│                    読者                              │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│  Cloudflare Pages (CDN - 無料)                      │
│  - 静的アセット (JS/CSS/画像)                        │
│  - エッジキャッシュ（高速配信）                       │
└────────────────────┬────────────────────────────────┘
                     │ 動的コンテンツ
                     ▼
┌─────────────────────────────────────────────────────┐
│  無料VPS (Oracle/Render - 無料)                     │
│  - Astro SSR サーバー (Node.js)                     │
│  - Caddy (リバースプロキシ + HTTPS)                 │
│  - 動的ページ生成                                    │
└────────────────────┬────────────────────────────────┘
                     │ Cloudflare Tunnel（暗号化）
                     ▼
┌─────────────────────────────────────────────────────┐
│  自宅Ubuntu サーバー (プライベート)                  │
│  - Strapi CMS (管理画面)                            │
│  - PostgreSQL (データベース)                        │
│  - メディアストレージ（無制限）                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 メリット

✅ **コスト**: 月額 ¥400-650（電気代+ドメイン代のみ）
✅ **パフォーマンス**: Cloudflare CDNで高速配信
✅ **セキュリティ**: 自宅IPアドレスを公開不要
✅ **スケーラビリティ**: メディアストレージ無制限
✅ **柔軟性**: 管理画面を自宅LANで高速アクセス

---

## 📋 前提条件

### 必要なもの

- [ ] 自宅Ubuntuサーバー（ラズパイ4 / 中古PC / NASなど）
- [ ] インターネット接続（固定IPアドレス不要）
- [ ] ドメイン（Cloudflareで管理）
- [ ] GitHubアカウント
- [ ] Cloudflareアカウント（無料）
- [ ] Oracle Cloudアカウント（無料）またはRender.com

### 推奨スペック

| 項目 | 自宅サーバー | VPS |
|------|-------------|-----|
| CPU | 2コア以上 | 1 vCPU |
| メモリ | 4GB以上 | 1-2GB |
| ストレージ | 100GB以上 | 10GB |

---

## 🚀 セットアップ手順

---

## ステップ1: 自宅Ubuntuサーバーのセットアップ

### 1-1. Ubuntuのインストールと更新

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# 必要なパッケージ
sudo apt install -y curl git wget
```

### 1-2. Dockerのインストール

```bash
# Docker公式スクリプトでインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 現在のユーザーをdockerグループに追加
sudo usermod -aG docker $USER

# Docker Compose V2
sudo apt install -y docker-compose-plugin

# 再ログイン（dockerグループ反映のため）
exit
# 再度SSH接続
```

### 1-3. プロジェクトのクローン

```bash
# ホームディレクトリに配置
cd ~
git clone https://github.com/birdrock926/birdrock926.github.io.git
cd birdrock926.github.io
```

### 1-4. 環境変数の設定

```bash
# deployment/home-server ディレクトリへ移動
cd deployment/home-server

# .env.exampleをコピー
cp .env.example .env

# シークレット生成
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "API_TOKEN_SALT=$(openssl rand -base64 32)" >> .env
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)" >> .env

# .envを編集
nano .env
```

**編集する項目:**

```env
# データベースパスワード（強力なものに変更）
DATABASE_PASSWORD=your-super-secure-password-here

# Cloudflare Tunnelトークン（後で設定）
CLOUDFLARE_TUNNEL_TOKEN=

# メール設定（Gmailの例）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yoursite.com
COMMENTS_CONTACT_EMAIL=admin@yoursite.com
```

### 1-5. Cloudflare Tunnelの設定

#### A. Cloudflare Dashboardでトンネル作成

```bash
# ブラウザで開く
https://dash.cloudflare.com/
```

1. **Zero Trust** > **Access** > **Tunnels** を開く
2. **Create a tunnel** をクリック
3. トンネル名: `home-strapi-cms`
4. **Save tunnel** をクリック
5. **トークンをコピー**（`eyJh...`で始まる長い文字列）

#### B. トークンを.envに追加

```bash
nano .env
# CLOUDFLARE_TUNNEL_TOKEN=<コピーしたトークン> を貼り付け
```

#### C. Public Hostname設定

Cloudflare Tunnelの設定画面で：

- **Subdomain**: `cms`
- **Domain**: `yoursite.com`（あなたのドメイン）
- **Service Type**: `HTTP`
- **URL**: `http://strapi:1337`

### 1-6. Strapiの起動

```bash
cd ~/birdrock926.github.io/deployment/home-server

# Docker Composeで起動
docker compose up -d

# ログ確認
docker compose logs -f strapi

# 起動完了まで待機（1-3分）
```

### 1-7. Strapi管理画面にアクセス

#### 自宅LANからアクセス:

```
http://localhost:1337/admin
または
http://192.168.x.x:1337/admin
```

#### 外部からアクセス（Cloudflare Tunnel経由）:

```
https://cms.yoursite.com/admin
```

#### 初回セットアップ:

1. 管理者アカウントを作成
2. ユーザー名、メールアドレス、パスワードを入力
3. **Let's start** をクリック

---

## ステップ2: VPS（Astro SSR）のセットアップ

### 2-1. Oracle Cloud Always Free VMの作成

```bash
# Oracle Cloudにログイン
https://cloud.oracle.com/
```

#### VMインスタンス作成:

1. **Compute** > **Instances** > **Create Instance**
2. 設定:
   - **Name**: `astro-frontend`
   - **Image**: `Ubuntu 22.04 Minimal`
   - **Shape**: `VM.Standard.A1.Flex (ARM)`
   - **OCPU**: `1`
   - **Memory**: `6GB`
   - **SSH Key**: 自分の公開鍵をアップロード
3. **Create** をクリック
4. **パブリックIPアドレスをメモ**

#### ファイアウォール設定:

```bash
# インスタンスの詳細ページで
# Primary VNIC > Subnet > Default Security List

# Ingress Rules（インバウンド）に追加:
- Source CIDR: 0.0.0.0/0
- Destination Port Range: 80,443
- Protocol: TCP
```

### 2-2. VPSにSSH接続

```bash
ssh ubuntu@<VPSのパブリックIP>
```

### 2-3. VPSのセットアップ

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# Docker & Docker Composeインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo apt install -y docker-compose-plugin

# 再ログイン
exit
ssh ubuntu@<VPSのパブリックIP>

# プロジェクトをクローン
cd ~
git clone https://github.com/birdrock926/birdrock926.github.io.git
cd birdrock926.github.io
```

### 2-4. VPS環境変数の設定

```bash
cd deployment/vps

# .env.exampleをコピー
cp .env.example .env

# .envを編集
nano .env
```

**編集内容:**

```env
# あなたのドメイン
DOMAIN=yoursite.com

# Strapi API URL（Cloudflare Tunnel経由）
STRAPI_URL=https://cms.yoursite.com

# サイトURL
PUBLIC_SITE_URL=https://yoursite.com

# コメント機能
PUBLIC_COMMENTS_ENABLED=true
PUBLIC_COMMENTS_REQUIRE_APPROVAL=false

# Google Analytics（オプション）
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2-5. VPSでDockerコンテナ起動

```bash
cd ~/birdrock926.github.io/deployment/vps

# ビルド & 起動
docker compose up -d --build

# ログ確認
docker compose logs -f

# 動作確認
curl http://localhost:4321/health
# → "OK" が返ればOK
```

---

## ステップ3: Cloudflare Pagesのセットアップ

### 3-1. Cloudflare Pages プロジェクト作成

```bash
# Cloudflare Dashboardにログイン
https://dash.cloudflare.com/
```

#### プロジェクト作成:

1. **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
2. GitHubアカウントを連携
3. リポジトリ選択: `birdrock926/birdrock926.github.io`
4. **Begin setup**

#### ビルド設定:

```
Framework preset: None
Build command: (空欄)
Build output directory: web/dist/client
Root directory: (空欄)
```

> **注**: GitHub Actionsでビルドするため、Cloudflare Pagesのビルドは無効化

#### 環境変数:

```
STRAPI_URL=https://cms.yoursite.com
PUBLIC_SITE_URL=https://yoursite.com
```

### 3-2. カスタムドメイン設定

1. **Pages** > `あなたのプロジェクト` > **Custom domains**
2. **Set up a custom domain** をクリック
3. ドメイン入力: `yoursite.com`
4. DNS設定が自動で追加される

### 3-3. GitHub Actionsシークレット設定

```bash
# GitHubリポジトリにアクセス
https://github.com/birdrock926/birdrock926.github.io/settings/secrets/actions
```

#### 追加するシークレット:

```
CLOUDFLARE_API_TOKEN=<Cloudflare APIトークン>
CLOUDFLARE_ACCOUNT_ID=<CloudflareアカウントID>
CLOUDFLARE_PROJECT_NAME=<Cloudflare Pagesプロジェクト名>
CLOUDFLARE_ZONE_ID=<CloudflareゾーンID>
STRAPI_URL=https://cms.yoursite.com
PUBLIC_SITE_URL=https://yoursite.com
PUBLIC_COMMENTS_ENABLED=true
```

#### Cloudflare API トークンの取得:

1. **Cloudflare Dashboard** > **My Profile** > **API Tokens**
2. **Create Token** > **Edit Cloudflare Workers** テンプレート
3. **Permissions**:
   - `Account - Cloudflare Pages - Edit`
   - `Zone - Cache Purge - Purge`
4. **Continue to summary** > **Create Token**
5. トークンをコピー

---

## ステップ4: DNS設定

### Cloudflare DNSレコード追加

```
# メインサイト（Cloudflare Pages）
Type: CNAME
Name: yoursite.com
Target: yoursite.pages.dev
Proxy: ON（オレンジ雲）

# VPS（SSRサーバー）
Type: A
Name: vps
Target: <VPSのパブリックIP>
Proxy: OFF（グレー雲）

# CMS（Cloudflare Tunnel）
Type: CNAME
Name: cms
Target: <tunnel-id>.cfargotunnel.com
Proxy: ON（オレンジ雲）
```

---

## ステップ5: 動作確認

### 各層の確認

```bash
# 1. 自宅Strapi（管理画面）
curl https://cms.yoursite.com/_health
# → {"status":"ok"}

# 2. VPS SSRサーバー
curl https://vps.yoursite.com/health
# → "OK"

# 3. Cloudflare Pages
curl https://yoursite.com
# → HTMLが返る
```

### ブラウザで確認

```
# メインサイト
https://yoursite.com

# Strapi管理画面
https://cms.yoursite.com/admin

# VPS直接アクセス（デバッグ用）
https://vps.yoursite.com
```

---

## 🔄 デプロイフロー

### 記事公開時の流れ

```
1. Strapiで記事を編集・公開
   ↓
2. Webhook → GitHub Actions起動
   ↓
3. Astro ビルド（静的アセット生成）
   ↓
4. Cloudflare Pagesにデプロイ
   ↓
5. Cloudflare CDNキャッシュクリア
   ↓
6. 読者がアクセス:
   - 静的ファイル → Cloudflare Pages（CDN）
   - 動的ページ → VPS SSR
   - データ取得 → 自宅Strapi
```

---

## 🛠️ トラブルシューティング

### 自宅Strapiにアクセスできない

```bash
# Cloudflare Tunnelのステータス確認
cd ~/birdrock926.github.io/deployment/home-server
docker compose logs cloudflared

# トンネルが起動しているか確認
docker compose ps

# トンネル再起動
docker compose restart cloudflared
```

### VPS SSRが起動しない

```bash
# ログ確認
cd ~/birdrock926.github.io/deployment/vps
docker compose logs astro

# 再ビルド
docker compose down
docker compose up -d --build
```

### Cloudflare Pagesがビルド失敗

```bash
# GitHub Actionsログ確認
https://github.com/birdrock926/birdrock926.github.io/actions

# シークレット設定を再確認
Settings > Secrets and variables > Actions
```

---

## 💰 月額コスト

| 項目 | 月額 | 備考 |
|------|------|------|
| 自宅Ubuntu電気代 | ¥300-500 | 30-50W消費 |
| Oracle Cloud VPS | ¥0 | Always Free |
| Cloudflare Pages | ¥0 | 無料プラン |
| Cloudflare Tunnel | ¥0 | 無料 |
| ドメイン | ¥100-150 | .com年額÷12 |
| **合計** | **¥400-650** | 🎉 |

---

## 📚 次のステップ

- [ ] [セキュリティ強化ガイド](./SECURITY-HARDENING.md)
- [ ] [バックアップ設定](./BACKUP-SETUP.md)
- [ ] [監視・アラート設定](./MONITORING-SETUP.md)
- [ ] [パフォーマンス最適化](./PERFORMANCE-OPTIMIZATION.md)

---

## 🔗 関連リンク

- [Cloudflare Tunnelドキュメント](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Pagesドキュメント](https://developers.cloudflare.com/pages/)
- [Astro SSRドキュメント](https://docs.astro.build/en/guides/server-side-rendering/)
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)

---

## ❓ よくある質問

**Q: 自宅サーバーが停止したらサイトもダウンしますか？**
A: VPS側でキャッシュを実装すれば、一時的な停止でも継続配信可能です。

**Q: 固定IPアドレスは必要ですか？**
A: 不要です。Cloudflare Tunnelを使用するため動的IPでも問題ありません。

**Q: データベースのバックアップは？**
A: 自動バックアップスクリプトを[BACKUP-SETUP.md](./BACKUP-SETUP.md)で解説しています。

---

🎉 セットアップ完了です！質問があれば Issue を作成してください。
