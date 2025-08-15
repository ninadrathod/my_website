FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf

COPY fullchain.pem /etc/letsencrypt/live/<domain_name>/
COPY privkey.pem /etc/letsencrypt/live/<domain_name>/

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]