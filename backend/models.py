from database import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    
 
    senha_hash = db.Column(db.String(200), nullable=True)
    
   
    is_google_user = db.Column(db.Boolean, default=False, nullable=False)
    google_id = db.Column(db.String(200), nullable=True, unique=True)
    picture = db.Column(db.String(500), nullable=True)
    
    
    reset_token = db.Column(db.String(128), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    
    def set_senha(self, senha):
        """Define senha hash (apenas para usuários normais)"""
        self.senha_hash = generate_password_hash(senha)
        
    def check_senha(self, senha):
        """Verifica senha (apenas para usuários normais)"""
        if not self.senha_hash:
            return False
        return check_password_hash(self.senha_hash, senha)
    
    def to_dict(self):
        """Converte usuário para dicionário"""
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'is_google_user': self.is_google_user,
            'picture': self.picture
        }