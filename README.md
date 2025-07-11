## Setting up the website

### Local Setup
To run this project locally, ensure you have Docker Desktop installed. Then:

1.  Clone the repository and navigate to the `my_website` directory.
2.  SMTP server for generating OTP. I have used gmail's SMTP server for my localhost (You may go through this video for reference).
3.  Create a .env file in ".upload-service" directory and add the following value based on your SMTP server configurations.
    ```bash
    # .env file for SMTP configuration
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=<your_email_id>@gmail.com
    SMTP_PASS=<generated_smtp_password>
    ADMIN_EMAILID=<email_id_where_you_would_receive_OTP_for_authentication>
    ```
4.  Execute the initial build command:
    ```bash
    make initial_build
    ```
    Now, you should be able to access frontend through the localhost.

### Additional `make` Commands

* `make down`: Stop the running containers.
* `make up`: Start the containers.
* `make rebuild`: Stop, rebuild, and restart the containers.
* `make destroy_project`: Stop and remove all containers and associated data.
                                                                                                 |
### Deploying Your Website with SSL/HTTPS

To deploy your website with an SSL certificate, follow these steps:

* **Deploy your code on a server:** Also note its public IP address.

* **Acquire a Domain Name:** Obtain a registered domain name from a trusted provider.

* **Frontend Configuration (`frontend/script.js`):**
    * Update the value of `const PUBLIC_IP`.
    * Set `PROD = true` within this file.

* **Nginx Configuration (`nginx/nginx.conf`):**
    * Initially, update the `server_name` directive to include your exact domain name(s) (e.g., `yourdomain.com www.yourdomain.com`).

* **DNS Mapping:** Map your domain name(s) to your server's public IP address using A/AAAA records in your DNS settings.

* **Initial Project Build (HTTP):** Build your project using the provided `Makefile`. Please note that your website will initially be accessible via HTTP (port 80).

* **Generate SSL Certificate:**
    * On your server, gain interactive access to the `nginx` Docker container: $docker ps exec -it my-website-nginx "/bin/sh"
    * Install certbot: $apk add certbot certbot-nginx
    * Run the Certbot command (e.g., `certbot --nginx` or a similar Certbot command configured for your setup) to generate the SSL certificate and private key. This command will typically create two files: `fullchain.pem` (the SSL certificate) and `privkey.pem` (the corresponding private key).

* **Copy Certificates:** Copy the content from the newly generated `fullchain.pem` and `privkey.pem` files into `nginx/fullchain.pem` and `nginx/privkey.pem` on your server's host machine, respectively.

* **Update Nginx Configuration for Production:**
    * Replace the content of your `nginx/nginx.conf` with the production-ready configuration from `nginx_for_prod/nginx.conf`.
    * Replace the content of your `nginx/Dockerfile` with the production-ready Dockerfile from `nginx_for_prod/Dockerfile`.

* **Final Project Rebuild:** Rebuild your Docker project to apply the updated Nginx configuration and activate HTTPS.

* **Changes to update_website.sh:** change the value of WEBSITE_DIR to actual directory location of "my_website" directory*

* **Change the script permission:**
  ```bash
  chmod +x update_script.sh
  ```

* **Commit all the changes locally, DO NOT PUSH**

* **To make sure git pull does not modify local changes**:
```bash
  git update-index --skip-worktree nginx/nginx.conf
  git update-index --skip-worktree nginx/Dockerfile
  git update-index --skip-worktree update_website.sh
```
* **Scheduling update_website.sh to pull new changes every day at 12 AM**:
    * Run `crontab -e` to open crontab
    * Add following line to the file `0 0 * * * <path_to_my_website>/update_website.sh`
    * Save and close
