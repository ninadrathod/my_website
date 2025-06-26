FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf

COPY fullchain.pem /etc/letsencrypt/live/meverse.in/
COPY privkey.pem /etc/letsencrypt/live/meverse.in/

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]