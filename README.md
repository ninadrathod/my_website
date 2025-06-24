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

### Before publishing, make following changes:
* frontend/script.js: update value of "const PUBLIC_IP" and set "PROD = true"
* nginx/nginx.conf: update the value of "server_name" variable
