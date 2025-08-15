#!/bin/bash

# Check if WEBSITE_DIR is provided as the first argument
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_website_directory>"
    echo "Example: $0 /home/ninad/Documents/my_website"
    exit 1
fi

# Define variables for paths
WEBSITE_DIR="$1" # Get WEBSITE_DIR from the first command-line argument

# --- Navigate to the website directory FIRST ---
# This ensures all subsequent relative paths and commands
# are executed from from within the specified directory
echo "Changing directory to $WEBSITE_DIR..."
cd "$WEBSITE_DIR" || { echo "Failed to change directory to $WEBSITE_DIR. Exiting." >&2; exit 1; }

# Now that we are in WEBSITE_DIR, define LOG_DIR as a relative path
LOG_DIR="pull_logs"
# Use a timestamp for unique log files
LOG_FILE="${LOG_DIR}/pull_$(date +\%Y\%m\%d_\%H\%M\%S).log"

# --- Create log directory if it does not exist (now relative to my_website) ---
mkdir -p "$LOG_DIR" || { echo "Failed to create log directory $LOG_DIR. Exiting." >&2; exit 1; }

# --- Redirect all script output (stdout and stderr) to the log file ---
# This ensures all messages, including errors, are captured.
exec > "$LOG_FILE" 2>&1

echo "--- Script started at $(date) ---"

echo "Running git pull origin main..."

# --- Execute git pull and capture its output and status ---
PULL_OUTPUT=$(git pull origin main 2>&1)
PULL_STATUS=$? # Capture the exit status of the git pull command

echo "--- Git Pull Output ---"
echo "$PULL_OUTPUT"
echo "--- End Git Pull Output ---"

# --- Check if git pull was successful ---
if [ $PULL_STATUS -ne 0 ]; then
    echo "Git pull failed with exit status $PULL_STATUS. Please check the log for details."
else
    echo "Git pull completed successfully."

    # --- Check for keywords in the git pull output ---
    if echo "$PULL_OUTPUT" | grep -qE "(backend/|upload-service|nginx)"; then
        echo "Keywords 'backend/', 'upload-service', or 'nginx' found in updated files."
        echo "Activating virtual environment and running 'make rebuild'..."

        # --- Activate virtual environment ---
        source venv/bin/activate || { echo "Failed to activate virtual environment. Exiting rebuild process."; exit 1; }

        # --- Execute make rebuild ---
        make rebuild PROD=true
        MAKE_STATUS=$?

        # Deactivate the virtual environment to clean up (optional)
        deactivate

        if [ $MAKE_STATUS -ne 0 ]; then
            echo "'make rebuild' failed with exit status $MAKE_STATUS. Please check the log for details."
        else
            echo "'make rebuild' completed successfully."
        fi
    else
        echo "No relevant keywords found in updated files. 'make rebuild' skipped."
    fi
fi

echo "--- Script finished at $(date) ---"