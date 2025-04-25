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

## Backend APIs

This project utilizes the following backend APIs:

* **`/api/data`**: Retrieves all resume data.
* **`/api/data/{category}`**: Fetches resume data for a specific category. <br>Replace `{category}` with one of the following: `work_exp`, `education`, `publication`, `certificates`, `projects`, `technical_skills`, `areas_of_interest`, `awards_and_recognitions`, `positions_of_responsibilities`, `extracurricular_activities`.
* **`/api/metadata/{property}`**: Retrieves a specific property from the resume metadata.<br>Replace `{property}` with one of the following: `name`, `bio`, `summary`, `email_id`, `linkedin`, `github`.
