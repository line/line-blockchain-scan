/*
 * Copyright (C) 2022 LINE Corporation
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const productionGzipExtensions = ['js', 'css']

const {
  npm_package_version: appVersion,
  npm_package_config_hotfixVersion: hotfixVersion,
  npm_package_config_qaVersion: qaVersion,
} = process.env

const version = `${appVersion}.${hotfixVersion}.${qaVersion}`

process.env.VUE_APP_VERSION = version // https://cli.vuejs.org/guide/mode-and-env.html#using-env-variables-in-client-side-code

const plugins = [
  new BundleAnalyzerPlugin({
    analyzerMode: 'disabled',
    openAnalyzer: false,
  }),
  new CompressionWebpackPlugin({
    test: new RegExp(`\\.(${productionGzipExtensions.join('|')})$`),
    threshold: 8192,
    minRatio: 0.8,
  }),
  new HtmlWebpackPlugin({
    inject: false,
    template: './src/maintenance.html',
    filename: 'maintenance.html',
  }),
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(
    new SentryWebpackPlugin({
      url: 'https://sentry-uit.line-apps.com',
      org: 'sentry-uit',
      project: 'dosi-vault-extension',
      include: './dist',
      release: process.env.VUE_APP_VERSION,
      deploy: {
        env: process.env.PHASE,
      },
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  )
}

module.exports = {
  publicPath: '/',
  productionSourceMap: true,
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          includePaths: ['./node_modules', './src/assets'],
        },
      },
    },
    extract: {
      filename: process.env.NODE_ENV === 'production'
        ? `[name].${version}.[hash:8].css`
        : `[name].${version}.css`,
      chunkFilename: process.env.NODE_ENV === 'production'
        ? `[name].${version}.[hash:8].css`
        : `[name].${version}.css`,
    },
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@themeConfig': path.resolve(__dirname, 'themeConfig.js'),
        '@core': path.resolve(__dirname, 'src/@core'),
        '@validations': path.resolve(__dirname, 'src/@core/utils/validations/validations.js'),
        '@axios': path.resolve(__dirname, 'src/libs/axios'),
      },
    },
    plugins,
    output: {
      filename: process.env.NODE_ENV === 'production'
        ? `[name].${version}.[hash:8].js`
        : `[name].${version}.js`,
    },
  },
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        // eslint-disable-next-line no-param-reassign
        options.transformAssetUrls = {
          img: 'src',
          image: 'xlink:href',
          'b-avatar': 'src',
          'b-img': 'src',
          'b-img-lazy': ['src', 'blank-src'],
          'b-card': 'img-src',
          'b-card-img': 'src',
          'b-card-img-lazy': ['src', 'blank-src'],
          'b-carousel-slide': 'img-src',
          'b-embed': 'src',
        }
        return options
      })
    // We won't include config/appConfig.js in bundle.
    // Its main purpose is to mimic the config/appConfig.js, which is produced by Kubernetes, on local environments
    config.plugin('copy').tap(([options]) => {
      options[0].ignore.push('config/appConfig.js')
      return [options]
    })
  },
  transpileDependencies: ['vue-echarts', 'resize-detector'],
  devServer: {
    proxy: {
      '/api': {
        target: 'https://cosmos.api.ping.pub/',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
}
