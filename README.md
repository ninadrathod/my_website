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
