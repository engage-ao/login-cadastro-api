from flask import Blueprint, request, jsonify, redirect, url_for, current_app
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests as http_requests

from models import User
from database import db
from auth.utils import generate_reset_token, send_reset_email
from config import Config

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
        
        
        novo_usuario = User(
            nome=data["nome"],
            email=data["email"],
            is_google_user = False
        )
        novo_usuario.set_senha(data["senha"])
        
        db.session.add(novo_usuario)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Usuário criado com sucesso",
            "usuario": novo_usuario.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": f"Erro ao cadastrar: {str(e)}"
        }), 500

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
        
        # Verifica se é usuário Google
        if user.is_google_user:
            return jsonify({
                "success": False,
                "error": "Esta conta usa Google. Use 'Entrar com Google'"
            }), 401
        
        # Cria token JWT
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=24)
        )
        
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

@auth_bp.route("/auth/google", methods=["GET"])
def google_login():
    """Redireciona para autenticação Google"""
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={Config.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={Config.GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline"
    )
    return redirect(auth_url)

@auth_bp.route("/auth/google/callback", methods=["GET"])
def google_callback():
    """Processa retorno da autenticação Google"""
    try:
        
        code = request.args.get("code")
        
        if not code:
            return jsonify({
                "success": False,
                "error": "Código de autorização não fornecido"
            }), 400
        
        
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": Config.GOOGLE_CLIENT_ID,
            "client_secret": Config.GOOGLE_CLIENT_SECRET,
            "redirect_uri": Config.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        token_response = http_requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if "error" in token_json:
            return jsonify({
                "success": False,
                "error": f"Erro ao obter token: {token_json['error']}"
            }), 400
        
        
        id_info = id_token.verify_oauth2_token(
            token_json["id_token"],
            google_requests.Request(),
            Config.GOOGLE_CLIENT_ID
        )
        
        
        google_id = id_info["sub"]
        email = id_info["email"]
        nome = id_info.get("name", email.split("@")[0])
        picture = id_info.get("picture", "")
        
        
        user = User.query.filter_by(email=email).first()
        
        is_new_user = False 
        
        if user:
            if not user.is_google_user:
                return redirect(
                    f"http://localhost:4200/login?error=email_cadastrado_normal"
                )
            
            user.google_id = google_id
            user.nome = nome
            user.picture = picture
            db.session.commit()
        else:
            is_new_user = True
            user = User(
                nome=nome,
                email=email,
                is_google_user=True,
                google_id=google_id,
                picture=picture
            )
            db.session.add(user)
            db.session.commit()
        
        
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=24)
        )
        
        if is_new_user:
            return redirect(
                f"http://localhost:4200/dashboard?token={access_token}&user={user.id}&new_user=true"
            )
        else:
            return redirect(
                f"http://localhost:4200/dashboard?token={access_token}&user={user.id}"
            )
        
    except Exception as e:
        print(f"Erro no callback Google: {str(e)}")
        return redirect(
            f"http://localhost:4200/login?error=google_auth_failed"
        )

@auth_bp.route("/google-login", methods=["POST"])
def google_login_token():
    """Login com token do Google (para uso com biblioteca JavaScript)"""
    try:
        data = request.get_json()
        token = data.get("token")
        
        if not token:
            return jsonify({
                "success": False,
                "error": "Token do Google é obrigatório"
            }), 400
        
        # Verifica token do Google
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                Config.GOOGLE_CLIENT_ID
            )
            
            google_id = idinfo["sub"]
            email = idinfo["email"]
            nome = idinfo.get("name", email.split("@")[0])
            picture = idinfo.get("picture", "")
            
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "Token do Google inválido"
            }), 401
        
        user = User.query.filter_by(email=email).first()
        
        is_new_user = False 
        
        if user:
            if not user.is_google_user:
                return jsonify({
                    "success": False,
                    "error": "Este email já possui cadastro normal. Use login tradicional"
                }), 409
            
            user.google_id = google_id
            user.nome = nome
            user.picture = picture
            db.session.commit()
        else:
            is_new_user = True
            user = User(
                nome=nome,
                email=email,
                is_google_user=True,
                google_id=google_id,
                picture=picture
            )
            db.session.add(user)
            db.session.commit()
        
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=24)
        )
        
        if is_new_user:
            return jsonify({
                "success": True,
                "message": "Conta criada com sucesso! Bem-vindo",
                "access_token": access_token,
                "usuario": user.to_dict(),
                "is_new_user": True
            }), 200
        else:
            return jsonify({
                "success": True,
                "message": "Login com Google realizado com sucesso",
                "access_token": access_token,
                "usuario": user.to_dict(),
                "is_new_user": False
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": f"Erro no login com Google: {str(e)}"
        }), 500

@auth_bp.route("/esqueceuSenha", methods=["POST"])
def esqueceu_senha():
    """Envia email de recuperação de senha"""
    try:
        mail = current_app.extensions['mail']  
        
        data = request.get_json()
        email = data.get("email")
        
        if not email:
            return jsonify({
                "success": False,
                "error": "Email é obrigatório"
            }), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({
                "success": True,
                "message": "Se o email existir, você receberá o link de recuperação"
            }), 200
        
        if user.is_google_user:
            return jsonify({
                "success": True,
                "message": "Se o email existir, você receberá o link de recuperação"
            }), 200
        
        token, expiry = generate_reset_token()
        
        user.reset_token = token
        user.reset_token_expiry = expiry
        db.session.commit()
        
        email_sent = send_reset_email(mail, user.email, token)
        
        if not email_sent:
            return jsonify({
                "success": False,
                "error": "Erro ao enviar email. Tente novamente"
            }), 500
        
        return jsonify({
            "success": True,
            "message": "Link de recuperação enviado para o email"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": f"Erro ao processar solicitação: {str(e)}"
        }), 500

@auth_bp.route("/recuperarSenha", methods=["POST"])
def recuperar_senha():
    """Redefine senha usando token recebido por email"""
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
        
        db.session.commit()
        
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