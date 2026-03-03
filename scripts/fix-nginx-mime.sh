#!/bin/bash
# Fix CSS MIME type issue: serve _next/static directly from filesystem
# instead of proxying through Next.js (which returns text/plain for CSS)
# Run with: sudo bash scripts/fix-nginx-mime.sh

set -euo pipefail

NGINX_CONF="/etc/nginx/sites-available/stackquadrant.com"

echo "==> Backing up current config to ${NGINX_CONF}.bak"
cp "$NGINX_CONF" "${NGINX_CONF}.bak"

echo "==> Writing updated Nginx config (serve static files from filesystem)"
cat > "$NGINX_CONF" << 'EOF'
server {
    server_name stackquadrant.com www.stackquadrant.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3025;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Serve static files directly from filesystem with correct MIME types
    location /_next/static {
        alias /home/n00b73/wapplications/stackquadrant/.next/static;
        expires max;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        access_log off;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3025;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen [::]:443 ssl; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/stackquadrant.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/stackquadrant.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}
server {
    if ($host = www.stackquadrant.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = stackquadrant.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    server_name stackquadrant.com www.stackquadrant.com;

    listen 80;
    listen [::]:80;
    return 404; # managed by Certbot


}
EOF

echo "==> Ensuring Nginx can read the static files directory"
chmod o+rx /home/n00b73/wapplications/stackquadrant/.next/static
chmod -R o+r /home/n00b73/wapplications/stackquadrant/.next/static

echo "==> Testing Nginx config"
nginx -t

echo "==> Reloading Nginx"
systemctl reload nginx

echo "==> Verifying CSS MIME type through Nginx"
sleep 1
CONTENT_TYPE_NGINX=$(curl -sI https://stackquadrant.com/_next/static/chunks/d65ded6d86bc5ca6.css 2>/dev/null | grep -i "^content-type:" || echo "Could not fetch")
echo "    Through Nginx: $CONTENT_TYPE_NGINX"

echo ""
echo "==> Done. Backup saved at ${NGINX_CONF}.bak"
echo "    Rollback: sudo cp ${NGINX_CONF}.bak ${NGINX_CONF} && sudo systemctl reload nginx"
