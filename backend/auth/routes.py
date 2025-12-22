from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

from models import User
from database import db
from auth.utils import generate_reset_token


auth_bp = Blueprint("auth", __name__)



@auth_bp.route("/cadastrar", methods=["POST"])
def cadastro():
    try:
        data = request.get_json()
        
        # Validação 1: Campos obrigatórios
        if not data or not data.get("nome") or not data.get("email") or not data.get("senha"):
            return jsonify({
                "success": False,
                "error": "Nome, email e senha são obrigatórios"
            }), 400
        
        # Validação 2: Senhas conferem
        if data.get("senha") != data.get("confirmar_senha"):
            return jsonify({
                "success": False,
                "error": "As senhas não conferem"
            }), 400
        
        # Validação 3: Email já existe
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({
                "success": False,
                "error": "Email já cadastrado"
            }), 409
        
        # Cria novo usuário
        novo_usuario = User(
            nome=data["nome"],
            email=data["email"]
        )
        novo_usuario.set_senha(data["senha"])
        
        # Salva no banco
        db.session.add(novo_usuario)
        db.session.commit()
        
        # Retorna sucesso
        return jsonify({
            "success": True,
            "message": "Usuário criado com sucesso",
            "usuario": novo_usuario.to_dict()
        }), 201
        
    except Exception as e:
        # Se der qualquer erro, desfaz alterações
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": f"Erro ao cadastrar: {str(e)}"
        }), 500


# ========================================
# ROTA 2: LOGIN
# ========================================
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        
        # Validação: Campos obrigatórios
        if not data or not data.get("email") or not data.get("senha"):
            return jsonify({
                "success": False,
                "error": "Email e senha são obrigatórios"
            }), 400
        
        # Busca usuário
        user = User.query.filter_by(email=data["email"]).first()
        
        # Verifica credenciais
        if not user or not user.check_senha(data["senha"]):
            return jsonify({
                "success": False,
                "error": "Email ou senha inválidos"
            }), 401
        
        # Cria token JWT
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=1)
        )
        
        # Retorna sucesso
        return jsonify({
            "success": True,
            "message": "Login realizado com sucesso",
            "access_token": access_token,
            "usuario": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erro ao fazer login: {str(e)}"
        }), 500


# ========================================
# ROTA 3: ESQUECEU SENHA
# ========================================
@auth_bp.route("/esqueceuSenha", methods=["POST"])
def esqueceu_senha():
    try:
        data = request.get_json()
        email = data.get("email")
        
        # Validação: Email obrigatório
        if not email:
            return jsonify({
                "success": False,
                "error": "Email é obrigatório"
            }), 400
        
        # Busca usuário
        user = User.query.filter_by(email=email).first()
        
        # Segurança: não revela se email existe
        if not user:
            return jsonify({
                "success": True,
                "message": "Se o email existir, você receberá o link"
            }), 200
        
        # Gera token
        token, expiry = generate_reset_token()
        
        # Guarda no banco
        user.reset_token = token
        user.reset_token_expiry = expiry
        db.session.commit()
        
        # Simula envio de email (MVP)
        reset_link = f"http://localhost:4200/recuperar-senha?token={token}"
        print("\n" + "="*60)
        print("📧 EMAIL SIMULADO - Recuperação de Senha")
        print("="*60)
        print(f"Para: {email}")
        print(f"Link: {reset_link}")
        print(f"Válido por 30 minutos")
        print("="*60 + "\n")
        
        # MODIFICAÇÃO: Em desenvolvimento, retorna o link também na resposta
        # REMOVA ISSO EM PRODUÇÃO por segurança!
        return jsonify({
            "success": True,
            "message": "Link de recuperação enviado para o email",
            "reset_link": reset_link  # APENAS PARA DESENVOLVIMENTO
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": f"Erro ao processar solicitação: {str(e)}"
        }), 500


# ========================================
# ROTA 4: RECUPERAR SENHA
# ========================================
@auth_bp.route("/recuperarSenha", methods=["POST"])
def recuperar_senha():
    try:
        data = request.get_json()
        
        token = data.get("token")
        nova_senha = data.get("nova_senha")
        confirmar_senha = data.get("confirmar_senha")
        
        # Validação 1: Campos obrigatórios
        if not token or not nova_senha or not confirmar_senha:
            return jsonify({
                "success": False,
                "error": "Token e senhas são obrigatórios"
            }), 400
        
        # Validação 2: Senhas conferem
        if nova_senha != confirmar_senha:
            return jsonify({
                "success": False,
                "error": "As senhas não conferem"
            }), 400
        
        # Busca usuário pelo token
        user = User.query.filter_by(reset_token=token).first()
        
        # Validação 3: Token existe
        if not user:
            return jsonify({
                "success": False,
                "error": "Token inválido"
            }), 400
        
        # Validação 4: Token expirou
        if user.reset_token_expiry < datetime.utcnow():
            return jsonify({
                "success": False,
                "error": "Token expirado. Solicite um novo link"
            }), 400
        
        # Atualiza senha
        user.set_senha(nova_senha)
        
        # Limpa token (uso único)
        user.reset_token = None
        user.reset_token_expiry = None
        
        # Salva no banco
        db.session.commit()
        
        # Retorna sucesso
        return jsonify({
            "success": True,
            "message": "Senha atualizada com sucesso! Faça login com a nova senha"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": f"Erro ao recuperar senha: {str(e)}"
        }), 500