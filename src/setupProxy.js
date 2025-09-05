const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/local-api",
    createProxyMiddleware({
      target: "http://127.0.0.1:3000",
      changeOrigin: true,
      pathRewrite: {
        "^/local-api/": "",
      },
    })
  );
  app.use(
    "/api",
    createProxyMiddleware({
      target: `${process.env.AUTH_SERVICE_ENDPOINT}`,
      changeOrigin: true,
    })
  );
  app.use(
    "/service-api/api",
    createProxyMiddleware({
      target: `${process.env.API_SERVICE_ENDPOINT}`,
      changeOrigin: true,
      pathRewrite: {
        "^/service-api": "",
      },
    })
  );
};
