#!/bin/bash
set -e
cd /var/www/pushstop

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🧹 Cleaning up old obsolete files..."
rm -rf src/app/api/auth/google src/app/api/auth/kakao src/app/api/auth/naver src/services/auth.ts


echo "🗄️ Running database migrations..."
npx prisma db push --accept-data-loss
npx prisma generate

echo "🏗️ Building Next.js application..."
npm run build

echo "🔨 Building WebSocket server..."
npx tsc --project tsconfig.server.json

echo "🚀 Restarting PM2 processes..."
pm2 reload deploy/ecosystem.config.js || pm2 start deploy/ecosystem.config.js

echo "✅ Push Stop 배포 완료!"
