import requests

def test_backend():
    print("🧪 Testando conexão com backend...\n")
    
    try:
        # Teste 1: Servidor está rodando?
        response = requests.get("http://localhost:5000/")
        print("❌ Rota / não existe (normal)")
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Servidor Flask não está rodando!")
        print("   Execute: python app.py")
        return False
    except:
        pass
    
    # Teste 2: Cadastro funciona?
    try:
        data = {
            "nome": "Teste Usuario",
            "email": "teste@teste.com",
            "senha": "Teste123",
            "confirmar_senha": "Teste123"
        }
        
        response = requests.post(
            "http://localhost:5000/cadastrar",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"✅ Cadastro testado: Status {response.status_code}")
        print(f"   Resposta: {response.json()}\n")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar cadastro: {str(e)}")
        return False

if __name__ == "__main__":
    test_backend()