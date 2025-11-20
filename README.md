# 🌐 Frontend - FSM Platform

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-BADGE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)

Aplicación web frontend para la plataforma de Field Service Management (FSM), construida con **React + Vite**.

## 🚀 Deploy Rápido a Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

1. Haz clic en el botón "Deploy to Netlify"
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. ¡Listo! Tu sitio estará en línea en minutos

📖 **[Ver Guía Completa de Deployment](../../NETLIFY_DEPLOYMENT.md)**

---

## 📦 Instalación Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus URLs de backend
```

---

## 🔧 Comandos Disponibles

```bash
# Desarrollo local
npm run dev              # Inicia servidor en http://localhost:5173

# Build de producción
npm run build            # Genera build optimizado en /dist

# Preview del build
npm run preview          # Previsualiza build de producción
```

---

## 🌍 Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# Backend API Gateway
VITE_API_GATEWAY_URL=https://api.tudominio.com

# WebSocket para tiempo real
VITE_WEBSOCKET_URL=wss://ws.tudominio.com
```

> ⚠️ **Importante**: En Netlify, configura estas variables en `Site settings → Environment variables`

---

## 📁 Estructura del Proyecto

```
src/
├── components/        # Componentes reutilizables
├── pages/            # Páginas principales
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── WorkList.jsx
│   └── Chat.jsx
├── App.jsx           # Componente raíz
└── main.jsx          # Entry point
```

---

## 🎨 Tecnologías

- **React 18** - UI Library
- **React Router 6** - Routing
- **Vite 5** - Build tool & dev server
- **Axios** - HTTP client
- **Socket.io Client** - WebSocket para tiempo real

---

## 🔐 Autenticación

El frontend se conecta al servicio de autenticación en `VITE_API_GATEWAY_URL`. Las credenciales se almacenan en `localStorage`:

```javascript
localStorage.getItem('fsm_token')
localStorage.getItem('fsm_user')
```

---

## 🌐 Navegadores Soportados

- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Mobile browsers (iOS Safari, Chrome Android)

---

## 📱 Características

- ✅ Responsive design (mobile-first)
- ✅ Real-time updates con WebSocket
- ✅ Autenticación JWT
- ✅ Modo offline (Service Worker - pendiente)
- ✅ PWA ready (pendiente configuración)

---

## 🐛 Debugging

```bash
# Habilitar modo debug
VITE_ENABLE_DEBUG=true npm run dev

# Ver logs de red
# Abre DevTools → Network tab
```

---

## 🚀 Deployment

### Netlify (Recomendado)
- ✅ Deploy automático desde Git
- ✅ SSL gratis
- ✅ CDN global
- ✅ Preview deployments

Ver [guía completa de Netlify](../../NETLIFY_DEPLOYMENT.md)

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Alternativas
- GitHub Pages (requiere configuración adicional para SPA)
- AWS S3 + CloudFront
- Firebase Hosting

---

## 🧪 Testing (pendiente)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

---

## 📝 Notas

- El proyecto usa Vite, por lo que las variables de entorno **deben** comenzar con `VITE_`
- Los builds están optimizados automáticamente (minificación, tree-shaking, code splitting)
- Las rutas están configuradas para SPA (todas redirigen a `index.html`)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 💬 Soporte

¿Problemas con el deployment? Consulta:
- [NETLIFY_DEPLOYMENT.md](../../NETLIFY_DEPLOYMENT.md)
- [Issues de GitHub](https://github.com/tu-repo/issues)
- Documentación de Netlify: https://docs.netlify.com/
