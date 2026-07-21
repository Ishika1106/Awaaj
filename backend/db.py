import logging
import os

from dotenv import load_dotenv
from gridfs import GridFSBucket
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

from backend.logger import CustomFormatter

load_dotenv()

db_client = None
_fs_bucket = None

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(CustomFormatter())
logger.addHandler(handler)


def get_database():
    global db_client
    endpoint = os.getenv("MONGO_ENDPOINT")
    if not endpoint:
        logger.warning("MONGO_ENDPOINT not set, database unavailable")
        return None

    if db_client is not None:
        try:
            db_client.admin.command("ping")
            return db_client["SheBuilds"]
        except ConnectionFailure:
            logger.warning("Lost database connection, attempting to reconnect...")
            db_client = None
            _fs_bucket = None

    try:
        db_client = MongoClient(
            endpoint,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            retryWrites=True,
        )
        db_client.admin.command("ping")
        logger.info("Connected to the database")
        return db_client["SheBuilds"]
    except Exception as e:
        logger.error(f"Error connecting to the database: {e}")
        db_client = None
        return None


def get_gridfs_bucket():
    global _fs_bucket
    if _fs_bucket is None:
        db = get_database()
        if db is not None:
            _fs_bucket = GridFSBucket(db, bucket_name="images")
    return _fs_bucket


