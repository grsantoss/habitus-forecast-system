# Collection Postman - Habitus Forecast API

## Importar Collection

1. Abra o Postman
2. Clique em **Import**
3. Cole o JSON abaixo ou importe do arquivo `postman_collection.json`

## Variáveis de Ambiente

Configure as seguintes variáveis no Postman:

- `base_url`: `http://localhost:5000/api`
- `token`: (será preenchido automaticamente após login)

## Autenticação

1. Execute a requisição **Login**
2. Copie o `access_token` da resposta
3. Configure na variável `token`
4. Todas as outras requisições usarão automaticamente o token

## Collection JSON

```json
{
  "info": {
    "name": "Habitus Forecast API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@habitus.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"nome\": \"Novo Usuário\",\n  \"email\": \"novo@exemplo.com\",\n  \"password\": \"senha123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/register",
              "host": ["{{base_url}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "url": {
              "raw": "{{base_url}}/auth/me",
              "host": ["{{base_url}}"],
              "path": ["auth", "me"]
            }
          }
        }
      ]
    },
    {
      "name": "Projetos",
      "item": [
        {
          "name": "Listar Projetos",
          "request": {
            "method": "GET",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "url": {
              "raw": "{{base_url}}/projetos",
              "host": ["{{base_url}}"],
              "path": ["projetos"]
            }
          }
        },
        {
          "name": "Criar Projeto",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"},
              {"key": "Content-Type", "value": "application/json"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"nome_cliente\": \"Cliente XYZ\",\n  \"data_base_estudo\": \"2025-01-01\",\n  \"saldo_inicial_caixa\": 100000.00\n}"
            },
            "url": {
              "raw": "{{base_url}}/projetos",
              "host": ["{{base_url}}"],
              "path": ["projetos"]
            }
          }
        }
      ]
    },
    {
      "name": "Upload",
      "item": [
        {
          "name": "Upload Planilha",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "file",
                  "type": "file",
                  "src": []
                }
              ]
            },
            "url": {
              "raw": "{{base_url}}/upload-planilha",
              "host": ["{{base_url}}"],
              "path": ["upload-planilha"]
            }
          }
        }
      ]
    },
    {
      "name": "Dashboard",
      "item": [
        {
          "name": "Get Stats",
          "request": {
            "method": "GET",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "url": {
              "raw": "{{base_url}}/dashboard/stats",
              "host": ["{{base_url}}"],
              "path": ["dashboard", "stats"]
            }
          }
        }
      ]
    }
  ]
}
```

## Scripts de Teste Automático

No Postman, você pode adicionar scripts de teste:

### Script para Login (Tests tab)

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.access_token);
    pm.test("Login successful", function () {
        pm.expect(jsonData.access_token).to.exist;
    });
}
```

### Script para Validar Resposta (Tests tab)

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has JSON body", function () {
    pm.response.to.be.json;
});
```

## Exportar Collection

1. No Postman, clique com botão direito na collection
2. Selecione **Export**
3. Escolha formato **Collection v2.1**
4. Salve como `postman_collection.json`

