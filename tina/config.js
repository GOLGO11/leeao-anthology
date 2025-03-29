import { defineConfig } from "tinacms";

export const apiURL = "https://api.tina.io";
export const clientId = "6aa4c727-47ab-4366-9095-b7f7ef92282c";  // 你的 Client ID
export const siteURL = "https://golgo11.github.io/leeao-anthology";  // 你的站点 URL

export default defineConfig({
  clientId: clientId,
  branch: "main",  // 你需要确认分支名
  token: process.env.TINA_TOKEN,  // 通常在环境变量中设置
  build: {
    outputFolder: "public",  // Hugo 默认输出目录
    publicFolder: "static",  // Hugo 默认静态资源目录
    basePath: "leeao-anthology",  // GitHub Pages 子路径
  },
  media: {
    tina: {
      publicFolder: "static",
      mediaRoot: "images",  // 假设你的媒体文件存放在 static/images
    },
  },
  schema: {
    collections: [
      // 你的内容集合定义
    ],
  },
});