import secrets
from datetime import datetime, timedelta
from flask_mail import Message


def generate_reset_token():
    """Gera token de recuperação de senha"""
    token = secrets.token_hex(32)  
    expiry = datetime.utcnow() + timedelta(minutes=30)
    return token, expiry


def send_reset_email(mail, user_email, reset_token):
    """Envia email de recuperação de senha"""
    
    reset_link = f"http://localhost:4200/recuperar?token={reset_token}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ 
                font-family: 'Arial', sans-serif; 
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{ 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px;
                background: #ffffff;
            }}
            .header {{ 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; 
                padding: 30px; 
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{ 
                background: #f9f9f9; 
                padding: 40px 30px;
            }}
            .button {{ 
                display: inline-block; 
                padding: 14px 40px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                text-decoration: none; 
                border-radius: 8px; 
                margin: 20px 0;
                font-weight: bold;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }}
            .button:hover {{
                opacity: 0.9;
            }}
            .info-box {{
                background: white;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .footer {{ 
                text-align: center; 
                color: #666; 
                font-size: 12px; 
                margin-top: 30px;
                padding: 20px;
                background: #f0f0f0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">🔐 Recuperação de Senha</h1>
            </div>
            
            <div class="content">
                <p>Olá!</p>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                
                <center>
                    <a href="{reset_link}" class="button">Redefinir Minha Senha</a>
                </center>
                
                <div class="info-box">
                    <strong>⏰ Atenção:</strong> Este link expira em <strong>30 minutos</strong>.
                </div>
                
                <p><small>Se o botão não funcionar, copie e cole este link no navegador:</small></p>
                <p><small style="word-break: break-all; color: #667eea;">{reset_link}</small></p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #666;">
                    <strong>Não solicitou esta alteração?</strong><br>
                    Ignore este email. Sua senha permanecerá a mesma.
                </p>
            </div>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>&copy; 2024 Sistema de Autenticação. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg = Message(
        subject="🔐 Recuperação de Senha - Ação Necessária",
        recipients=[user_email],
        html=html_body
    )
    
    try:
        mail.send(msg)
        print(f"✅ Email enviado com sucesso para: {user_email}")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar email: {str(e)}")
        return False

