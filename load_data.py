import pymongo
import json
import os
import datetime


def get_illustration_files(base_directory=None):
    """
    Gets a list of file names from the 'backend/illustrations/' subdirectory.

    Args:
        base_directory (str, optional): The base directory from which to start.
                                        If None, uses the current working directory
                                        where the script is being run.

    Returns:
        list: A list of file names (strings) found in the illustrations directory.
              Returns an empty list if the directory does not exist or is empty.
    """
    if base_directory is None:
        base_directory = os.getcwd() # Get the current working directory

    illustrations_dir = os.path.join(base_directory, "backend", "illustrations")

    file_list = []
    if os.path.isdir(illustrations_dir):
        # Iterate over all entries in the directory
        for entry_name in os.listdir(illustrations_dir):
            full_path = os.path.join(illustrations_dir, entry_name)
            # Check if it's actually a file (and not a subdirectory)
            if os.path.isfile(full_path):
                file_list.append(entry_name)
        return file_list
    else:
        print(f"Error: Directory '{illustrations_dir}' not found.")
        return []

# Load data from the JSON file
def load_data_from_json(filepath):
    """Loads data from a JSON file."""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {filepath}")
        return None

# MongoDB connection and insertion
def insert_data_to_mongodb(data, connection_string, database_name, collection_name):
    """Inserts data into a MongoDB collection."""
    try:
        client = pymongo.MongoClient(connection_string)
        db = client[database_name]
        collection = db[collection_name]

        # Delete all existing data in the collection
        delete_result = collection.delete_many({})
        print(f"Deleted {delete_result.deleted_count} existing documents from {collection_name}.")

        # Insert the new data
        if data:
            insert_result = collection.insert_many(data)
            print(f"Inserted {len(insert_result.inserted_ids)} new documents into {collection_name}!")
        else:
            print("No data to insert.")

        client.close()
    except pymongo.errors.ConnectionFailure as e:
        print(f"Error: Could not connect to MongoDB: {e}")
    except pymongo.errors.PyMongoError as e:
        print(f"Error during insertion: {e}")


# --- NEW FUNCTION: manage_illustration_paths_collection ---
def manage_illustration_paths_collection(illustration_files,connection_string,database_name,collection_name="illustration_paths"):
    """
    Manages the specified MongoDB collection for illustration paths.
    1. Checks if the collection exists (implicitly via count_documents).
    2. Compares the number of documents in the collection with the number of provided files.
    3. If counts don't match, it deletes all existing data and inserts the new illustration file names.

    Args:
        illustration_files (list): A list of strings, where each string is an illustration file name.
        connection_string (str): The MongoDB connection string.
        database_name (str): The name of the database.
        collection_name (str): The name of the collection for illustration paths.
    """
    try:
        client = pymongo.MongoClient(connection_string)
        db = client[database_name]
        collection = db[collection_name]

        # 1. Get current count of documents in the collection
        current_doc_count = collection.count_documents({})
        print(f"Collection '{collection_name}' currently has {current_doc_count} documents.")

        # 2. Prepare data for insertion (convert list of strings to list of dicts)
        # Each file name will be stored as a document like {"path": "file.jpg"}
        illustration_documents = [{"path": filename} for filename in illustration_files] # Changed here
        expected_doc_count = len(illustration_documents)
        print(f"Expected number of documents based on illustration files: {expected_doc_count}")

        # 3. Check if number of documents == len(illustration_files)
        if current_doc_count != expected_doc_count:
            print(f"Mismatch detected! Current count ({current_doc_count}) != expected count ({expected_doc_count}). Updating collection.")

            # 4. If not equal: delete all and add new strings
            delete_result = collection.delete_many({})
            print(f"Deleted {delete_result.deleted_count} existing documents from '{collection_name}'.")

            if illustration_documents:
                insert_result = collection.insert_many(illustration_documents)
                print(f"Inserted {len(insert_result.inserted_ids)} new documents into '{collection_name}'!")
            else:
                print("No illustration paths to insert.")
        else:
            print(f"Collection '{collection_name}' is already up-to-date (counts match). No action taken.")

        client.close()
    except pymongo.errors.ConnectionFailure as e:
        print(f"Error: Could not connect to MongoDB: {e}")
    except pymongo.errors.PyMongoError as e:
        print(f"Error during collection management for '{collection_name}': {e}")

# Main execution
if __name__ == "__main__":
    datapath = os.path.join(os.getcwd(), "data.json")  # resume data
    metadatapath = os.path.join(os.getcwd(), "metadata.json")  # resume metadata
   
    connection_string = "mongodb://admin:qwerty@localhost:27017/"  # Replace with your MongoDB connection string
    database_name = "resume_database"
    collection1_name = "resume_data"
    collection2_name = "resume_metadata"
    illustration_paths_collection_name = "illustration_paths"
    
    # ---------- get list of files in illustration directory ----------------
    # illustration_files = get_illustration_files()
    # if illustration_files:
    #     print("Files in backend/illustrations/ directory:")
    #     for filename in illustration_files:
    #         print(f"- {filename}")
    # else:
    #     print("No illustration files found or directory does not exist.")
    
    # -----------------------------------------------------------------------

    data = load_data_from_json(datapath)
    if data:
        insert_data_to_mongodb(data, connection_string, database_name, collection1_name)
    
    metadata = load_data_from_json(metadatapath)
    if metadata:
        metadata[0]['update_ts'] = datetime.datetime.now() # Get the current timestamp
        print(metadata)
        insert_data_to_mongodb(metadata, connection_string, database_name, collection2_name)

    # manage_illustration_paths_collection(
    #     illustration_files,
    #     connection_string,
    #     database_name)