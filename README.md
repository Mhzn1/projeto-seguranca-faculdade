# 🔒 SecureAuth - Sistema Seguro de Gestão de Usuários

Um projeto de software prático demonstrando excelência e robustez na aplicação de práticas de Segurança da Informação no ambiente de desenvolvimento Web (Lógico). Constroído com ênfase na defesa profunda e proteção de dados sensíveis.

## 🛡️ Aspectos de Segurança Implementados

Este projeto não é apenas funcional, ele engloba controles ativos defensivos contra vulnerabilidades OWASP Top 10:

- **Autenticação via JWT Rotativo:** Sessões são cacheadas no banco de dados. Quando a sessão do usuário desloga ou a conta é banida, o JWT expirará em todos os nós, evitando sequestro de sessão permanente (*Session Hijacking*).
- **Criptografia de Informação Pessoal (PII):** CPF, Telefone e Nome Completo sofrem encriptação via chaves **AES-256** diretas na camada de transporte do banco de dados (dados intrinsecamente seguros contra Database Dumps).
- **Tratamento Seguro de Senhas:** Hashes por **Bcrypt** com carga de processamento *Cost=12*.
- **Role-Based Access Control (RBAC):** Proteção estrutural nos endpoints (Administrador, Moderador, Usuário), garantindo acesso ao Mínimo Privilégio.
- **Proteção de Camada HTTP:** Blindagem profunda usando `helmet`, bloqueando explorações do tipo XSS (Self-XSS) via sanitização de headers e isolamento MIME.
- **Defesas Anti-Abuso e DoS:** 
  - Limites restritivos de Rate-Limiting para todas as APIs de formulários.
  - Mitigação de Força Bruta: Caso exceda tentativas de falha em 5 minutos, a conta sofrerá "Lockout" sistemático.
- **Auditoria Transparente Limitada (Audit Logs):** Todos os eventos e logins com falhas da aplicação são controlados rigorosamente logados junto ao Endereço de IP - contudo sem salvar payloads expostos em texto.
- **Database Safety:** Uso persistente de Prepared Statements dentro do SQLite mitigando vetores de SQL Injection (SQLi) de raiz.

## 🛠️ Tecnologias Utilizadas

**Backend:** Node.js (v16/v18/v20) | Express.js | Better-SQLite3 | CryptoJs | JSONWebToken | BcryptJS
**Frontend:** React (TypeScript) | Vite | Tailwind CSS v3 | TanStack Query (React Query) | Axios

---

## 🚀 Como Iniciar o Projeto Localmente

O ambiente de desenvolvimento requer dois terminais abertos simultaneamente (um para o núcleo seguro do lado do Banco/API e outro para a UI do cliente).

### Passo 1: Dependências e Configuração

Na raiz do projeto (`secure-user-system/`), configure o `.env` (Pode utilizar os valores Padrão descritos como exemplo caso não tenha chaves em nuvem) e rode:

```bash
# Na raiz, baixe as dependencias do Backend API Node.js
npm install 

# Entre no client e instale o bundle frontend (UI framework)
cd client
npm install
```

*(Nota: O banco de dados SQLite recompila a engine C++ local da sua máquina, e será autoconfigurado nos passos).*

### Passo 2: Rodar o Backend (API na porta 3000)

Em um terminal novo, garanta que está no caminho base raiz (`secure-user-system`) e inicie:

```bash
node server.js
```
*Assim que ativar o Node, sua base de dados se formará automaticamente e registrará o perfil inicial.*

### Passo 3: Rodar o Frontend (React UI na porta 5173)

Abra um novo terminal dentro da aba da pasta cliente `secure-user-system/client` e dispare o motor Vite:

```bash
cd client
npm run dev
```

Abra o seu navegador de preferência e visite `http://localhost:5173/`.

---

## 🔑 Acessando o Sistema (Login Padrão)

A inteligência estruturadora (`database/init.js`) provisionou o primeiro usuário como **Administrador Global** para que você possa governar todo o ecossistema. 

Na tela de entrada da plataforma interativa, utilize a seguinte credencial pré-criada:

- **Usuário:**  `admin`
- **Senha:**  `Admin@123`

### Como testar características de Gestão:
1. Navegue para `Gestão de Usuários` e crie um bloqueio temporário (Toggled Status). Perceba que a sua própria conta não permitirá o auto-trancar a si mesmo.
2. Navegue pelos `Logs de Auditoria` e rastreie os acessos falhos e ações feitas no site através da conta do painel.
3. Observe no `Meu Perfil` as *Badges* das propriedades que carregam blindagem Criptográfica AES-256 da base.

---
*Este software foi concebido com rigorosos padrões de modelagem web, desenvolvido de desenvolvedores para desenvolvedores e avaliadores de infosec.*
