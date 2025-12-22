class Config:
    SECRET_KEY = "dev-secret"
    JWT_SECRET_KEY = "jwt-secret"
    SQLALCHEMY_DATABASE_URI = "sqlite:///db.sqlite3"
    SQLALCHEMY_TRACK_MODIFICATIONS = False