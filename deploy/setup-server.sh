#!/bin/bash
# ⚠️ 기존 사이트에 영향 없이 Push Stop만 추가 설치

# 1. /var/www/pushstop 디렉토리 생성
sudo mkdir -p /var/www/pushstop
sudo chown -R $USER:$USER /var/www/pushstop

# 5. 환경 변수 설정
if [ ! -f .env ]; then
  echo "📄 Creating .env file..."
  cat <<EOF > .env
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
NEXT_PUBLIC_SITE_URL="https://pushstop.live"
SESSION_SECRET="super-secret-session-key-32-chars-!"
NEXTAUTH_URL="https://pushstop.live"
NEXTAUTH_SECRET="super-secret-session-key-32-chars-!"
SENS_ACCESS_KEY="mock_access"
SENS_SECRET_KEY="mock_secret"
SENS_SERVICE_ID="mock_service"
SENS_PHONE_NUMBER="01000000000"
EOF
else
  echo "📄 .env file already exists. Skipping creation to preserve keys."
fi

# 2. Nginx 설정 심볼릭 링크
sudo cp ./deploy/nginx-pushstop.conf /etc/nginx/sites-available/pushstop.conf
sudo ln -sf /etc/nginx/sites-available/pushstop.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 3. SSL 구성 (필요시)
# sudo certbot --nginx -d pushstop.live -d www.pushstop.live

echo "서버 기본 세팅 완료. 이후 deploy.sh를 실행하세요."
