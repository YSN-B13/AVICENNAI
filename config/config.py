import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')
    SECRET_KEY = os.environ.get('SECRET_KEY')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    ARCADE_API_KEY = os.environ.get('ARCADE_API_KEY')
    ARCADE_USER_ID = os.environ.get('ARCADE_USER_ID')
