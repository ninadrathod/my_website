import pymongo
import json
import os
import datetime

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

# Main execution
if __name__ == "__main__":
    datapath = os.path.join(os.getcwd(), "data.json")  # resume data
    metadatapath = os.path.join(os.getcwd(), "metadata.json")  # resume metadata
   
    connection_string = "mongodb://admin:qwerty@localhost:27017/"  # Replace with your MongoDB connection string
    database_name = "resume_database"
    collection1_name = "resume_data"
    collection2_name = "resume_metadata"

    data = load_data_from_json(datapath)
    if data:
        insert_data_to_mongodb(data, connection_string, database_name, collection1_name)
    
    metadata = load_data_from_json(metadatapath)
    if metadata:
        metadata[0]['update_ts'] = datetime.datetime.now() # Get the current timestamp
        print(metadata)
        insert_data_to_mongodb(metadata, connection_string, database_name, collection2_name)