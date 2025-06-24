FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY certificate.crt /etc/ssl/certs/
COPY private.key /etc/ssl/private/

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]