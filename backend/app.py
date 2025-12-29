from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail



from config import Config
from database import db
from auth.routes import auth_bp

app = Flask(__name__)
app.config.from_object(Config)


CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:4200",
            "http://127.0.0.1:4200"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Authorization"]
    }
})


db.init_app(app)
jwt = JWTManager(app)
mail = Mail(app)


app.extensions['mail'] = mail

app.register_blueprint(auth_bp)

with app.app_context():
    try:
        db.create_all()
        print("✅ Banco de dados inicializado!")
    except Exception as e:
        print(f"❌ Erro ao criar banco: {e}")
        exit(1)

if __name__ == "__main__":
    print("🚀 Servidor Flask iniciando...")
    print("🔗 Rodando em: http://127.0.0.1:5000")
    print("🔗 Frontend esperado em: http://localhost:4200")
    app.run(debug=True, port=5000, host='0.0.0.0')