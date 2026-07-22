#!/bin/bash
# ⚠️ 기존 사이트에 영향 없이 Push Stop만 추가 설치

# 1. /var/www/pushstop 디렉토리 생성
sudo mkdir -p /var/www/pushstop
sudo chown -R $USER:$USER /var/www/pushstop

# 2. Nginx 설정 심볼릭 링크
sudo cp ./deploy/nginx-pushstop.conf /etc/nginx/sites-available/pushstop.conf
sudo ln -sf /etc/nginx/sites-available/pushstop.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 3. SSL 구성 (필요시)
# sudo certbot --nginx -d pushstop.live -d www.pushstop.live

echo "서버 기본 세팅 완료. 이후 deploy.sh를 실행하세요."
