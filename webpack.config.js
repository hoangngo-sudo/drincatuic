const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

require("dotenv").config();

module.exports = (_, argv) => {
  const isProd = argv.mode === "production";

  return {
    mode: isProd ? "production" : "development",
    entry: {
      index: "./js/entries/index.js",
      registration: "./js/entries/registration.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProd ? "js/[name].[contenthash:8].js" : "js/[name].js",
      publicPath: "./",
      clean: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./index.html",
        filename: "index.html",
        chunks: ["runtime", "index"],
        inject: "body",
      }),
      new HtmlWebpackPlugin({
        template: "./registration.html",
        filename: "registration.html",
        chunks: ["runtime", "registration"],
        inject: "body",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "css", to: "css" },
          {
            from: "images",
            to: "images",
            globOptions: {
              ignore: ["**/bonfire.MP4", "**/sumoballgame.MP4"],
            },
          },
          { from: "assets", to: "assets" },
          { from: "favicon.ico", to: "favicon.ico" },
        ],
      }),
      new webpack.DefinePlugin({
        "process.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL || ""),
        "process.env.SUPABASE_PUBLIC_KEY": JSON.stringify(
          process.env.SUPABASE_PUBLIC_KEY || ""
        ),
      }),
    ],
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
      },
    },
    devtool: "source-map",
    performance: {
      hints: isProd ? "warning" : false,
      assetFilter: (filename) =>
        !(/\.(png|jpe?g|gif|webp|svg|ico|mp4|mov|woff2?)$/i.test(filename)),
    },
    devServer: {
      static: {
        directory: path.resolve(__dirname, "dist"),
      },
      open: true,
      hot: true,
      port: 8080,
      setupMiddlewares(middlewares, devServer) {
        // Chrome DevTools (v129+) probes this endpoint to discover workspace config.
        // Returning a 200 prevents the 404 noise and the resulting CSP violation report.
        devServer.app.get(
          "/.well-known/appspecific/com.chrome.devtools.json",
          (req, res) => {
            res.json({});
          }
        );
        return middlewares;
      },
    },
    externals: {
      gsap: "gsap",
      "gsap/ScrollTrigger": "ScrollTrigger",
      "gsap/ScrollSmoother": "ScrollSmoother",
    },
  };
};
