const { defineConfig } = require("vite");

// Espelha os rewrites de URL amigável configurados em vercel.json
// (/produto/:id -> pages/produto.html, /categoria/:cat -> pages/categoria.html)
// para que `npm run dev` se comporte igual à produção.
function urlsAmigaveisPlugin() {
  return {
    name: "urls-amigaveis",
    configureServer(servidor) {
      servidor.middlewares.use((req, res, next) => {
        if (/^\/produto\/[^/]+$/.test(req.url)) {
          req.url = "/pages/produto.html";
        } else if (/^\/categoria\/[^/]+$/.test(req.url)) {
          req.url = "/pages/categoria.html";
        }
        next();
      });
    },
  };
}

module.exports = defineConfig({
  plugins: [urlsAmigaveisPlugin()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
