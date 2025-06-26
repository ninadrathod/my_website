## Local Setup

To run this project locally, ensure you have Docker Desktop installed. Then:

1.  Clone the repository and navigate to the `my_website` directory.
2.  Execute the initial build command:
    ```bash
    make initial_build
    ```
    This will make the backend accessible at `http://localhost:3001` and the frontend at `http://localhost:3000`.

### Additional `make` Commands

* `make down`: Stop the running containers.
* `make up`: Start the containers.
* `make rebuild`: Stop, rebuild, and restart the containers.
* `make destroy_project`: Stop and remove all containers and associated data.
                                                                                                 |
### Command to access mongodb data from terminal window: 
mongosh mongodb://admin:qwerty@localhost:27017

### Deploying Your Website with SSL/HTTPS

To deploy your website with an SSL certificate, follow these steps:

* **Acquire a Domain Name:** Obtain a registered domain name from a trusted provider.

* **Frontend Configuration (`frontend/script.js`):**
    * Update the value of `const PUBLIC_IP`.
    * Set `PROD = true` within this file.

* **Nginx Configuration (`nginx/nginx.conf`):**
    * Initially, update the `server_name` directive to include your exact domain name(s) (e.g., `yourdomain.com www.yourdomain.com`).

* **DNS Mapping:** Map your domain name(s) to your server's public IP address using A/AAAA records in your DNS settings.

* **Initial Project Build (HTTP):** Build your project using the provided `Makefile`. Please note that your website will initially be accessible via HTTP (port 80).

* **Generate SSL Certificate:**
    * On your server, gain interactive access to the `nginx` Docker container.
    * Run the Certbot command (e.g., `cert --nginx` or a similar Certbot command configured for your setup) to generate the SSL certificate and private key. This command will typically create two files: `fullchain.pem` (the SSL certificate) and `privkey.pem` (the corresponding private key).

* **Copy Certificates:** Copy the content from the newly generated `fullchain.pem` and `privkey.pem` files into `nginx/fullchain.pem` and `nginx/privkey.pem` on your server's host machine, respectively.

* **Update Nginx Configuration for Production:**
    * Replace the content of your `nginx/nginx.conf` with the production-ready configuration from `nginx_for_prod/nginx.conf`.
    * Replace the content of your `nginx/Dockerfile` with the production-ready Dockerfile from `nginx_for_prod/Dockerfile`.

* **Final Project Rebuild:** Rebuild your Docker project to apply the updated Nginx configuration and activate HTTPS.
