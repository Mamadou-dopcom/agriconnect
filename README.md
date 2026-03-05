# 🌾 AgriConnect — Next.js + PostgreSQL + Prisma

## Stack technique
- **Next.js 14** — Frontend + API Routes (tout en un)
- **PostgreSQL** — Base de données
- **Prisma** — ORM (gestion base de données simple)
- **NextAuth.js** — Authentification JWT
- **Tailwind CSS** — Design
- **Recharts** — Graphiques

---

## 🚀 Installation (5 étapes)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer la base de données
```bash
# Copier le fichier de config
cp .env.example .env

# Modifier .env avec vos infos PostgreSQL :
# DATABASE_URL="postgresql://postgres:MOT_DE_PASSE@localhost:5432/agriconnect"
# NEXTAUTH_SECRET="une_chaine_secrete_longue"
```

### 3. Créer les tables et générer les données de test
```bash
# Créer les tables dans PostgreSQL
npm run db:push

# Générer les données de test
npm run db:seed
```

### 4. Lancer le projet
```bash
npm run dev
```

### 5. Ouvrir dans le navigateur
```
http://localhost:3000
```

---

## 🧪 Comptes de test

| Rôle | Téléphone | Mot de passe |
|------|-----------|--------------|
| 👑 Admin | 338200000 | agriconnect123 |
| 👨‍🌾 Agriculteur | 771234567 | agriconnect123 |
| 🛒 Acheteur | 778901234 | agriconnect123 |

---

## 📁 Structure du projet

```
agriconnect/
├── app/
│   ├── api/                    ← API Routes (backend)
│   │   ├── auth/               ← Authentification
│   │   ├── products/           ← Produits CRUD
│   │   ├── orders/             ← Commandes
│   │   └── admin/              ← Stats admin
│   ├── (auth)/                 ← Pages login/register
│   ├── (buyer)/                ← Pages acheteur
│   ├── (farmer)/               ← Pages agriculteur
│   └── (admin)/                ← Dashboard admin
├── components/
│   ├── admin/                  ← Composants admin
│   ├── buyer/                  ← Composants acheteur
│   └── farmer/                 ← Composants agriculteur
├── lib/
│   ├── prisma.js               ← Client Prisma
│   └── auth.js                 ← Helpers auth
├── prisma/
│   ├── schema.prisma           ← Schéma base de données
│   └── seed.js                 ← Données de test
└── .env                        ← Configuration (NE PAS committer)
```

---

## 🌐 Déploiement en production

### Sur Vercel (recommandé — gratuit) :
1. Push sur GitHub
2. Connecter le repo sur vercel.com
3. Ajouter les variables d'environnement dans Vercel
4. Deploy automatique à chaque push !

### Base de données en production :
- **Neon** (gratuit) → neon.tech
- **Supabase** (gratuit) → supabase.com
- **Railway** → railway.app

---

## 📞 Support

Reviens vers Claude avec le message d'erreur exact si tu bloques !
```
