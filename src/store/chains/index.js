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

/*
 * @Description: file
 * @Autor: dingyiming
 * @Date: 2021-11-20 15:26:27
 * @LastEditors: Thang Pham
 * @LastEditTime: 2022-09-16 11:50:00
 */
import { isTestnet } from '@/libs/utils'
import { sha256 } from '@cosmjs/crypto'
import { toHex } from '@cosmjs/encoding'

let chains = {}

let configs = require.context('../../chains/mainnet', false, /\.json$/)
if (isTestnet()) {
  configs = require.context('../../chains/testnet', false, /\.json$/)
}

const update = {}
configs.keys().forEach(k => {
  const c = {
    ...configs(k),
    api: configs(k).api[window.appConfig.PHASE],
    sdk_version: configs(k).sdk_version[window.appConfig.PHASE],
  }
  update[c.chain_name] = c
})

chains = update
localStorage.setItem('chains', JSON.stringify(update))
const selected = chains['Ebony Testnet']

const avatarcache = localStorage.getItem('avatars')

export default {
  namespaced: true,
  state: {
    config: chains,
    selected,
    avatars: avatarcache ? JSON.parse(avatarcache) : {},
    height: 0,
    ibcChannels: {},
    quotes: {},
    defaultWallet: localStorage.getItem('default-wallet'),
    denoms: {},
    ibcPaths: {},
  },
  getters: {
    getchains: state => state.chains,
    getAvatarById: state => id => state.avatars[id],
  },
  mutations: {
    setup_sdk_version(state, info) {
      state.chains.config[info.chain_name].sdk_version = info.version
    },
    select(state, args) {
      state.chains.selected = state.chains.config[args.chain_name]
    },
    cacheAvatar(state, args) {
      state.chains.avatars[args.identity] = args.url
      localStorage.setItem('avatars', JSON.stringify(state.chains.avatars))
    },
    setHeight(state, height) {
      state.chains.height = height
    },
    setChannels(state, { chain, channels }) {
      state.chains.ibcChannels[chain] = channels
    },
    setQuotes(state, quotes) {
      state.quotes = quotes
    },
    setDefaultWallet(state, defaultWallet) {
      if (defaultWallet && defaultWallet.length > 0) {
        localStorage.setItem('default-wallet', defaultWallet)
        state.chains.defaultWallet = defaultWallet
      }
    },
    setIBCDenoms(state, denoms) {
      state.denoms = { ...state.denoms, ...denoms }
    },
    setIBCPaths(state, paths) {
      state.ibcPaths = paths
    },
  },
  actions: {
    async getQuotes(context) {
      fetch('https://price.ping.pub/quotes').then(data => data.json()).then(data => {
        context.commit('setQuotes', data)
      })
    },

    async getAllIBCDenoms(context, _this) {
      _this.$http.getAllIBCDenoms().then(x => {
        const denomsMap = {}
        const pathsMap = {}
        x.denom_traces.forEach(trace => {
          const hash = toHex(sha256(new TextEncoder().encode(`${trace.path}/${trace.base_denom}`)))
          const ibcDenom = `ibc/${hash.toUpperCase()}`
          denomsMap[ibcDenom] = trace.base_denom

          const path = trace.path.split('/')
          if (path.length >= 2) {
            pathsMap[ibcDenom] = {
              channel_id: path[path.length - 1],
              port_id: path[path.length - 2],
            }
          }
        })
        context.commit('setIBCDenoms', denomsMap)
        context.commit('setIBCPaths', pathsMap)
      })
    },
  },
}
