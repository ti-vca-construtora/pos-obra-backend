📄 README.md — Template NestJS + Prisma + JWT + Roles
# NestJS Template – Auth, Roles, Prisma e MySQL

Template base para APIs REST com NestJS, Prisma e MySQL, já preparado com:
- Autenticação JWT
- Controle de acesso por roles
- Hash de senha
- Seed automático de ADMIN
- Estrutura organizada para crescimento

Ideal para iniciar novos projetos sem retrabalho.

---

## 🚀 Tecnologias

- **NestJS**
- **Prisma ORM**
- **MySQL**
- **JWT (Passport)**
- **bcrypt**
- **class-validator**
- **TypeScript**

---

## 📁 Estrutura do Projeto



src/
├─ auth/
│ ├─ auth.controller.ts
│ ├─ auth.service.ts
│ ├─ auth.module.ts
│ ├─ jwt.strategy.ts
│ ├─ guards/
│ │ ├─ jwt-auth.guard.ts
│ │ └─ roles.guard.ts
│ ├─ decorators/
│ │ ├─ public.decorator.ts
│ │ └─ roles.decorator.ts
│ └─ dto/
│ ├─ login.dto.ts
│ └─ register.dto.ts
│
├─ prisma/
│ ├─ prisma.service.ts
│ └─ prisma.module.ts
│
└─ users/
├─ users.controller.ts
├─ users.service.ts
└─ dto/


---

## ⚙️ Configuração Inicial

### 1️⃣ Clonar o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd nestjs-template

2️⃣ Instalar dependências
npm install

3️⃣ Configurar variáveis de ambiente

Crie o arquivo .env na raiz:

DATABASE_URL="mysql://root@localhost:3306/app_db"
JWT_SECRET="super-secret-key"


Certifique-se de que o banco de dados já existe no MySQL.

4️⃣ Rodar as migrations
npx prisma migrate dev

5️⃣ Rodar o seed (ADMIN)
npx prisma db seed


Usuário criado automaticamente:

email: admin@admin.com
senha: admin123
role: ADMIN

6️⃣ Subir o projeto
npm run start:dev


Servidor disponível em:

http://localhost:3000

🔐 Autenticação
🔹 Registrar usuário
POST /auth/register

{
  "email": "user@teste.com",
  "password": "123456",
  "nome": "Usuário"
}

🔹 Login
POST /auth/login

{
  "email": "user@teste.com",
  "password": "123456"
}


Resposta:

{
  "access_token": "...",
  "user": {
    "id": 1,
    "email": "user@teste.com",
    "nome": "Usuário",
    "role": "USER"
  }
}

🔹 Dados do usuário logado
GET /auth/me
Authorization: Bearer TOKEN

🛡️ Controle de Acesso
🔸 Proteger rota com JWT
@UseGuards(JwtAuthGuard)

🔸 Proteger rota por role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')

🔸 Tornar rota pública
@Public()

📌 Padrões Importantes

Senhas sempre armazenadas com bcrypt

Nunca retornar senha em respostas

Roles vêm do JWT (novo login = novo role)

Guards devem seguir a ordem:

@UseGuards(JwtAuthGuard, RolesGuard)