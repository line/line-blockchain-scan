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
import { getLocalChains } from '@/libs/local'
import { isTestnet } from '@/libs/utils'
import { sha256 } from '@cosmjs/crypto'
import { toHex } from '@cosmjs/encoding'

let chains = {}
const coingecko = {}

let configs = require.context('../../chains/mainnet', false, /\.json$/)
if (isTestnet()) {
  configs = require.context('../../chains/testnet', false, /\.json$/)
}

const update = {}
configs.keys().forEach(k => {
  const c = {
    ...configs(k),
    api: configs(k).api[window.appConfig.PHASE],
    dsvApi: configs(k).dsvApi[window.appConfig.PHASE],
    dsvRpc: configs(k).dsvRpc[window.appConfig.PHASE],
    sdk_version: configs(k).sdk_version[window.appConfig.PHASE],
  }
  update[c.chain_name] = c
  if (Array.isArray(c.assets)) {
    c.assets.forEach(x => {
      if (x.coingecko_id && x.coingecko_id !== '') coingecko[x.coingecko_id] = String(x.symbol).toUpperCase()
    })
  }
})

chains = update
localStorage.setItem('chains', JSON.stringify(update))
const selected = chains['Finschia Mainnet']

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
    isFetchingDenomsMetadata: false,
    selectedChainDenomsMetadata: {},
  },
  getters: {
    getchains: state => state.chains,
    getAvatarById: state => id => state.avatars[id],
    isFinschiaSelected: state => state.selected.chain_name === 'Finschia Mainnet',
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
      } else {
        state.chains.defaultWallet = null
      }
    },
    setIBCDenoms(state, denoms) {
      state.denoms = { ...state.denoms, ...denoms }
    },
    setIBCPaths(state, paths) {
      state.ibcPaths = paths
    },
    setIsFetchingDenomsMetadata(state, val) {
      state.isFetchingDenomsMetadata = val
    },
    setDenomsMetadata(state, denomsMetadata) {
      state.selectedChainDenomsMetadata = denomsMetadata
      const localChains = getLocalChains()
      const selectedChainName = state.selected.chain_name
      if (localChains[selectedChainName]) {
        const selectedChain = localChains[selectedChainName]
        if (denomsMetadata.metadatas) {
          if (denomsMetadata.metadatas.length) {
            const metadata = denomsMetadata.metadatas[0]
            const {
              base, display, symbol, denom_units: denomUnits,
            } = metadata

            selectedChain.assets[0].base = base

            // Make symbol format compatible with previous specs: https://wiki.linecorp.com/display/blockchain/LBS_v1.0.0_Task+List
            switch (state.selected.chain_name) {
              case 'Finschia Mainnet':
                // This display coin unit format is eventually changed to use only the symbol in v1.1.2: https://wiki.linecorp.com/pages/viewpage.action?spaceKey=blockchain&title=LBS_v1.1.2_Overview
                // but this switch case is reserved here just in case there are further modifications
                selectedChain.assets[0].symbol = symbol
                break
              case 'Ebony Testnet':
                // https://line-enterprise.slack.com/archives/C03PCPW8LTF/p1681714815967099?thread_ts=1681704409.995699&cid=C03PCPW8LTF
                // https://line-enterprise.slack.com/archives/C03PCPW8LTF/p1682589951294969?thread_ts=1682589119.778729&cid=C03PCPW8LTF
                // This display coin unit format is eventually changed to use only the symbol in v1.1.2: https://wiki.linecorp.com/pages/viewpage.action?spaceKey=blockchain&title=LBS_v1.1.2_Overview
                // but this switch case is reserved here just in case there are further modifications
                selectedChain.assets[0].symbol = symbol
                break
              default:
                selectedChain.assets[0].symbol = symbol
                break
            }
            if (denomUnits && denomUnits.length) {
              const unit = denomUnits.find(item => item.denom === display)
              if (unit) {
                const { exponent } = unit
                selectedChain.assets[0].exponent = exponent
              }
            }
          }
        }
      }
      localStorage.setItem('chains', JSON.stringify(localChains))
      state.isFetchingDenomsMetadata = false
    },
  },
  actions: {
    async getQuotes(context) {
      const keys = Object.keys(coingecko)
      if (keys.length > 0) {
        const currencies = 'usd,cny,eur,jpy,krw,sgd,hkd'
        fetch(`https://api.coingecko.com/api/v3/simple/price?include_24hr_change=true&vs_currencies=${currencies}&ids=${keys.join(',')}`).then(data => data.json()).then(data => {
          // use symbol as key instead of coingecko id
          const quotes = {}
          if (data && Object.keys(data)) {
            Object.keys(data).forEach(k => {
              quotes[coingecko[k]] = data[k]
            })
          }
          context.commit('setQuotes', quotes)
        })
      }
    },

    async getAllIBCDenoms(context, _this) {
      _this.$http.getAllIBCDenoms().then(x => {
        const denomsMap = {}
        const pathsMap = {}
        if (x && x.denom_traces) {
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
        }
      })
    },
    async getDenomsMetadata(context) {
      context.commit('setIsFetchingDenomsMetadata', true)
      return fetch(`${context.state.selected.api[0]}/cosmos/bank/v1beta1/denoms_metadata`).then(data => data.json()).then(data => {
        context.commit('setDenomsMetadata', data)
        return data
      })
    },
  },
}
