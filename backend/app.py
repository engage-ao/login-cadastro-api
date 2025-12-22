from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database import db
from auth.routes import auth_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp)

with app.app_context():
    db.create_all()

if __name__ =="__main__":
    app.run(debug=True)