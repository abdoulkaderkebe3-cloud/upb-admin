# UPB Admin — Panneau d'Administration

⚠️ **Repository privé** — Tableau de bord administrateur pour l'évaluation des enseignants de l'UPB.

## 🚀 Déploiement

### Développement local
```bash
npm install
npm run dev
```

### Variables d'environnement
Créer un fichier `.env` :
```
VITE_API_URL=http://localhost:3000/api
```

### Déploiement sur Vercel
1. Connecter ce repo **privé** à Vercel
2. Framework : **Vite**
3. Build command : `npm run build`
4. Output directory : `dist`
5. Ajouter la variable d'environnement `VITE_API_URL` avec l'URL du backend déployé

## 🔒 Sécurité
- Authentification par mot de passe + JWT
- Toutes les requêtes API incluent un token Bearer
- Les tokens expirent après 8 heures
- `noindex, nofollow` dans le HTML pour éviter l'indexation
