import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'zhaobiao-miniapp',
  date: '2026-3-14',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  plugins: [],
  defineConstants: {
    'process.env.TARO_APP_API_BASE': JSON.stringify(process.env.TARO_APP_API_BASE || ''),
  },
  copy: {
    patterns: [{ from: 'project.config.json', to: 'dist/' }],
    options: {},
  },
  mini: {
    postcss: {
      autoprefixer: { enable: true },
      cssModules: { enable: false },
    },
    miniCssExtractPluginOption: {
      ignoreOrder: true,
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: { enable: true },
      cssModules: { enable: false },
    },
  },
})
