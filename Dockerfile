# Dockerfile

# ベースイメージとしてNode.jsの軽量バージョンを使用
FROM node:20-slim

# OSの依存関係をインストール
# Puppeteer (Chromium) をヘッドレスモードで実行するために必要なライブラリ
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libcurl4 \
    libdrm2 \
    libgbm1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# アプリケーションコードを格納するディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピーし、依存関係をインストール
# このステップを分離することで、コード変更時のキャッシュを効率的に利用できます
COPY package*.json ./
RUN npm install

# 重要なステップ: ユーザー権限を下げてセキュリティを確保
# root以外のユーザーを作成し、そのユーザーでアプリケーションを実行します
RUN groupadd -r ppuser && useradd -r -g ppuser -G audio,video ppuser
RUN chown -R ppuser:ppuser /app
USER ppuser

# アプリケーションコードをコピー
COPY . .

# Node.jsサーバーのポートを公開 (Expressがリッスンするポート)
EXPOSE 3000

# アプリケーションの起動コマンド
# Puppeteerを安定させるための起動引数はserver.js内で設定済み
CMD ["npm", "start"]
