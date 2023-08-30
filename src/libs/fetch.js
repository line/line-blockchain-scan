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

import fetch from 'node-fetch'
// import axios from 'axios'
import store from '@/store'
import compareVersions from 'compare-versions'
import {
  AuthInfo, Fee, SignerInfo, TxBody, TxRaw,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { toBase64 } from '@cosmjs/encoding'
import {
  Proposal, ProposalTally, Proposer, StakingPool, Votes, Deposit,
  Validator, StakingParameters, Block, ValidatorDistribution, StakingDelegation, WrapStdTx, getUserCurrency,
} from './utils'
import OsmosAPI from './osmos'

function commonProcess(res, key = 'result') {
  if (res && Object.keys(res).includes(key)) {
    return res[key]
  }
  return res
}

// 头像
export function keybase(identity) {
  return fetch(`https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`)
    .then(res => res.json())
}

export default class ChainFetch {
  constructor() {
    this.osmosis = new OsmosAPI()
    this.EndpointVersion = {
      certik: 'v1alpha1',
    }
  }

  getEndpointVersion() {
    return this.EndpointVersion[this.config.chain_name] || ' 1'
  }

  getSelectedConfig() {
    let chain = store.state.chains.selected
    const lschains = localStorage.getItem('chains')
    if (lschains) {
      chain = JSON.parse(lschains)[chain.chain_name]
    }
    if (!chain.sdk_version) {
      chain.sdk_version = '0.4'
    }

    this.config = chain
    return this.config
  }

  isModuleLoaded(name) {
    if (this.config.unload_module) {
      return !this.config.unload_module.includes(name)
    }
    return true
  }

  async getNodeInfo() {
    return this.get('/node_info')
  }

  async getLatestBlock(config = null) {
    const conf = config || this.getSelectedConfig()
    if (conf.chain_name === 'injective') {
      return ChainFetch.fetch('https://tm.injective.network', '/block').then(data => Block.create(commonProcess(data)))
    }
    return this.get(`/lbm/base/ostracon/v1/blocks/latest?${new Date().getTime()}`, config).then(data => Block.create(Block.transformData(data)))
  }

  async getBlockByHeight(height, config = null) {
    const conf = config || this.getSelectedConfig()
    if (conf.chain_name === 'injective') {
      return ChainFetch.fetch('https://tm.injective.network', `/block?height=${height}`).then(data => Block.create(commonProcess(data)))
    }
    return this.get(`/lbm/base/ostracon/v1/blocks/${height}`, config).then(data => Block.create(Block.transformData(data)))
  }

  async getSlashingSigningInfo(config = null) {
    return this.get('/lbm/slashing/v1/signing_infos?pagination.limit=500', config)
  }

  async getTxs(hash, config = null) {
    const conf = config || this.getSelectedConfig()
    const ver = conf.sdk_version || '0.41'
    // /cosmos/tx/v1beta1/txs/{hash}
    if (ver && compareVersions(ver, '0.5') < 0) {
      return this.get(`/txs/${hash}`).then(data => WrapStdTx.create(data, ver))
    }
    return this.get(`/cosmos/tx/v1beta1/txs/${hash}`).then(data => WrapStdTx.create(data, ver))
  }

  async getTxsBySenderLegacy(sender, page = 1) {
    return this.get(`/txs?transfer.sender=${sender}&page=${page}&limit=20`)
  }

  async getTxsBySender(sender, offset = 0, limit = 20) {
    if (/^[a-z]+1[a-z\d]{58}$/.test(sender)) {
      // If `sender` is a contract address, call API with ?events=transfer.sender=
      return this.get(`/cosmos/tx/v1beta1/txs?events=transfer.sender=%27${sender}%27&pagination.offset=${offset}&pagination.limit=${limit}&pagination.reverse=true&order_by=ORDER_BY_DESC`)
    }
    // Otherwise call confirmed API
    // Confirmed by Jinseong Cho nim: https://line-enterprise.slack.com/archives/C03PCPW8LTF/p1681783734962159?thread_ts=1681701153.834079&cid=C03PCPW8LTF
    return this.get(`/cosmos/tx/v1beta1/txs?events=message.sender=%27${sender}%27&pagination.offset=${offset}&pagination.limit=${limit}&pagination.reverse=true&order_by=ORDER_BY_DESC`)
  }

  async getTxsByRecipient(recipient) {
    return this.get(`/txs?message.recipient=${recipient}`)
  }

  async getTxsByHeight(height) {
    return this.get(`/txs?tx.height=${height}`)
  }

  async getValidatorDistribution(address) {
    return Promise.all([
      this.get(`/cosmos/distribution/v1beta1/validators/${address}/commission`),
      this.get(`/cosmos/distribution/v1beta1/validators/${address}/outstanding_rewards`),
    ]).then(data => {
      const ret = ValidatorDistribution.create({
        operator_address: address,
        self_bond_rewards: data[1].rewards.rewards,
        val_commission: data[0].commission.commission,
      })
      return ret
    })
  }

  async getStakingDelegatorDelegation(delegatorAddr, validatorAddr) {
    return this.get(`/cosmos/staking/v1beta1/validators/${validatorAddr}/delegations/${delegatorAddr}`).then(data => StakingDelegation.create(commonProcess(data, 'delegation_response')))
  }

  async getBankTotal(denom) {
    return this.get(`/cosmos/bank/v1beta1/supply/${denom}`).then(data => commonProcess(data, 'amount'))
  }

  async getBankTotals() {
    if (compareVersions(this.config.sdk_version, '0.5') < 0) {
      return this.get('/lbm/bank/v1/supply').then(data => commonProcess(data)?.supply)
    }
    return this.get('/cosmos/bank/v1beta1/supply').then(data => data.supply)
  }

  async getStakingPool() {
    return this.get('/cosmos/staking/v1beta1/pool').then(data => new StakingPool().init(commonProcess(data, 'pool')))
  }

  async getFoundationParams() {
    return this.get('/lbm/foundation/v1/params').then(data => commonProcess(data))
  }

  async getMintingInflation() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/cosmos/mint/v1beta1/inflation').then(data => Number(commonProcess(data, 'inflation')))
    }
    return null
  }

  async getStakingParameters() {
    return this.get('/cosmos/staking/v1beta1/params').then(data => {
      this.getSelectedConfig()
      return StakingParameters.create(commonProcess(data, 'params'), this.config.chain_name)
    })
  }

  async getValidatorList(config = null) {
    return this.get('/cosmos/staking/v1beta1/validators', config).then(data => {
      const vals = commonProcess(data, 'validators').map(i => new Validator().init(i))
      localStorage.setItem(`validators-${this.config.chain_name}`, JSON.stringify(vals))
      return vals
    })
  }

  async getValidatorUnbondedList() {
    return this.get('/cosmos/staking/v1beta1/validators?status=BOND_STATUS_UNBONDED').then(data => {
      const result = commonProcess(data)
      const vals = result.validators ? result.validators : result
      return vals.map(i => new Validator().init(i))
    })
  }

  async getValidatorListByStatus(status) {
    return this.get(`/cosmos/staking/v1beta1/validators?status=${status}&pagination.limit=500`).then(data => {
      const result = commonProcess(data)
      const vals = result.validators ? result.validators : result
      return vals.map(i => new Validator().init(i))
    })
  }

  async getValidatorListByHeight(height, offset) {
    return this.get(`/lbm/base/ostracon/v1/validatorsets/${height}?pagination.limit=100&pagination.offset=${offset}`).then(data => commonProcess(data))
  }

  async getStakingValidator(address) {
    return this.get(`/cosmos/staking/v1beta1/validators/${address}`).then(data => new Validator().init(commonProcess(data, 'validator')))
  }

  async getSlashingParameters() {
    if (this.isModuleLoaded('slashing')) {
      return this.get('/slashing/parameters').then(data => commonProcess(data))
    }
    return null
  }

  async getMintParameters() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/cosmos/mint/v1beta1/params').then(data => commonProcess(data, 'params'))
    }
    return null
  }

  async getDistributionParameters() {
    return this.get('/cosmos/distribution/v1beta1/params').then(data => commonProcess(data, 'params'))
  }

  async getGovernanceParameterDeposit() {
    return this.get('/gov/parameters/deposit').then(data => commonProcess(data))
  }

  async getGovernanceParameterTallying() {
    return this.get('/gov/parameters/tallying').then(data => commonProcess(data))
  }

  async getGovernanceParameterVoting() {
    return this.get('/gov/parameters/voting').then(data => commonProcess(data))
  }

  async getGovernanceTally(pid, total) {
    return this.get(`/cosmos/gov/v1beta1/proposals/${pid}/tally`).then(data => new ProposalTally().init(commonProcess(data, 'tally'), total))
  }

  async getGovernance(pid) {
    return this.get(`/cosmos/gov/v1beta1/proposals/${pid}`).then(data => {
      const p = new Proposal().init(commonProcess(data, 'proposal'), 0)
      p.versionFixed(this.config.sdk_version)
      return p
    })
  }

  async getGovernanceProposer(pid) {
    if (this.config.chain_name === 'certik') {
      return this.get(`/shentu/gov/v1alpha1/${pid}/proposer`).then(data => new Proposer().init(commonProcess(data)))
    }
    return this.get(`/gov/proposals/${pid}/proposer`).then(data => new Proposer().init(commonProcess(data)))
  }

  async getGovernanceDeposits(pid) {
    if (this.config.chain_name === 'certik') {
      return this.get(`/shentu/gov/v1alpha1/proposals/${pid}/deposits`).then(data => {
        const result = commonProcess(data)
        return Array.isArray(result) ? result.reverse().map(d => new Deposit().init(d)) : result
      })
    }
    return this.get(`/cosmos/gov/v1beta1/proposals/${pid}/deposits`).then(data => {
      const result = commonProcess(data)
      return Array.isArray(result) ? result.reverse().map(d => new Deposit().init(d)) : result
    })
  }

  async getGovernanceVotes(pid, next = '', limit = 50) {
    if (compareVersions(this.config.sdk_version, '0.5') < 0) {
      return this.get(`/gov/proposals/${pid}/votes`).then(data => ({
        votes: commonProcess(data).map(d => new Votes().init(d)),
        pagination: {},
      }))
    }
    if (this.config.chain_name === 'certik') {
      return this.get(`/shentu/gov/v1alpha1/proposals/${pid}/votes?pagination.key=${encodeURIComponent(next)}&pagination.limit=${limit}`)
    }
    return this.get(`/cosmos/gov/v1beta1/proposals/${pid}/votes?pagination.key=${encodeURIComponent(next)}&pagination.limit=${limit}`)
  }

  async getGovernanceList() {
    const url = this.config.chain_name === 'certik'
      ? '/shentu/gov/v1alpha1/proposals?pagination.limit=500'
      : '/cosmos/gov/v1beta1/proposals?pagination.limit=500'
    return Promise.all([this.get(url), this.get('/cosmos/staking/v1beta1/pool')]).then(data => {
      const pool = new StakingPool().init(commonProcess(data[1], 'pool'))
      let proposals = commonProcess(data[0])
      if (Array.isArray(proposals.proposals)) {
        proposals = proposals.proposals
      }
      const ret = []
      if (proposals) {
        proposals.forEach(e => {
          const g = new Proposal().init(e, pool.bondedToken)
          g.versionFixed(this.config.sdk_version)
          ret.push(g)
        })
      }
      return ret
    })
  }

  async getAuthAccount(address, config = null) {
    return this.get('/cosmos/auth/v1beta1/accounts/'.concat(address), config).then(data => {
      const result = commonProcess(data, 'account')
      return result.value ? result : { value: result }
    })
  }

  async getBankAccountBalance(address) {
    return this.get('/cosmos/bank/v1beta1/balances/'.concat(address)).then(data => commonProcess(data, 'balances'))
  }

  async getStakingReward(address, config = null) {
    if (compareVersions(config ? config.sdk_version : this.config.sdk_version, '0.5') < 0) {
      return this.get(`/distribution/delegators/${address}/rewards`, config).then(data => commonProcess(data))
    }
    return this.get(`/cosmos/distribution/v1beta1/delegators/${address}/rewards`, config).then(data => commonProcess(data))
  }

  async getStakingValidators(address) {
    return this.get(`/cosmos/distribution/v1beta1/delegators/${address}/validators`).then(data => commonProcess(data))
  }

  async getStakingDelegations(address, config = null) {
    if (compareVersions(config ? config.sdk_version : this.config.sdk_version, '0.5') < 0) {
      return this.get(`/staking/delegators/${address}/delegations`, config).then(data => commonProcess(data).map(x => {
        const xh = x
        if (!xh.delegation) {
          xh.delegation = {
            validator_address: x.validator_address,
            delegator_address: x.delegator_address,
          }
        }
        return xh
      }))
    }
    return this.get(`/cosmos/staking/v1beta1/delegations/${address}`, config).then(data => commonProcess(data))
  }

  async getStakingRedelegations(address, config = null) {
    if (compareVersions(config ? config.sdk_version : this.config.sdk_version, '0.5') < 0) {
      return this.get(`/staking/redelegations?delegator=${address}`, config).then(data => commonProcess(data))
    }
    return this.get(`/cosmos/staking/v1beta1/delegators/${address}/redelegations`, config).then(data => commonProcess(data))
  }

  async getStakingUnbonding(address, config = null) {
    if (compareVersions(config ? config.sdk_version : this.config.sdk_version, '0.5') < 0) {
      return this.get(`/staking/delegators/${address}/unbonding_delegations`, config).then(data => commonProcess(data))
    }
    return this.get(`/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`, config).then(data => commonProcess(data))
  }

  async getBankBalances(address, config = null) {
    return this.get('/cosmos/bank/v1beta1/balances/'.concat(address), config).then(data => commonProcess(data))
  }

  async getCommunityPool(config = null) {
    return this.get('/cosmos/distribution/v1beta1/community_pool', config, true).then(data => commonProcess(data))
  }

  async getAllIBCDenoms(config = null) {
    return this.get('/ibc/applications/transfer/v1/denom_traces?pagination.limit=500', config).then(data => commonProcess(data))
  }

  async getIBCDenomTrace(hash, config = null) {
    const h = hash.substring(hash.indexOf('/') + 1)
    return this.get('/ibc/applications/transfer/v1/denom_traces/'.concat(h), config).then(data => commonProcess(data))
  }

  async getIBCChannels(config = null, key = null) {
    if (key) {
      return this.get('/ibc/core/channel/v1/channels?pagination.key='.concat(key), config).then(data => commonProcess(data))
    }
    return this.get('/ibc/core/channel/v1/channels?pagination.limit=1000', config).then(data => commonProcess(data))
  }

  // eslint-disable-next-line camelcase
  async getIBCChannelClientState(channel_id, port_id, config = null) {
    // eslint-disable-next-line camelcase
    return this.get(`/ibc/core/channel/v1/channels/${channel_id}/ports/${port_id}/client_state`, config).then(data => commonProcess(data))
  }

  // eslint-disable-next-line camelcase
  async getIBCChannel(channel_id, port_id, config = null) {
    // eslint-disable-next-line camelcase
    return this.get(`/ibc/core/channel/v1/channels/${channel_id}/ports/${port_id}`, config).then(data => commonProcess(data))
  }

  static async getBankBalance(baseurl, address) {
    return ChainFetch.fetch(baseurl, '/bank/balances/'.concat(address)).then(data => commonProcess(data))
  }

  async getGravityPools() {
    return this.get('/cosmos/liquidity/v1beta1/pools').then(data => commonProcess(data))
  }

  async getMarketChart(days = 14, coin = null) {
    const conf = this.getSelectedConfig()
    const currency = getUserCurrency()
    if (conf.assets[0] && conf.assets[0].coingecko_id) {
      return ChainFetch.fetch(' https://api.coingecko.com', `/api/v3/coins/${coin || conf.assets[0].coingecko_id}/market_chart?vs_currency=${currency}&days=${days}`)
    }
    return null
  }

  // CoinMarketCap
  static async fetchCoinMarketCap(url) {
    const host = 'https://price.ping.pub'
    return fetch(host + url).then(response => response.json())
  }

  static async fetchTokenQuote(symbol) {
    return ChainFetch.fetchCoinMarketCap(`/quote/${symbol}`)
  }

  // Simulate Execution of tx
  async simulate(msgs, memo = '', fee, config = null) {
    const txString = toBase64(TxRaw.encode({
      bodyBytes: TxBody.encode(
        TxBody.fromPartial({
          messages: msgs,
          memo,
        }),
      ).finish(),
      authInfoBytes: AuthInfo.encode({
        signerInfos: [
          SignerInfo.fromPartial({
            modeInfo: {
              single: {
                mode: 127,
              },
              multi: undefined,
            },
            sequence: '0',
          }),
        ],
        fee: Fee.fromPartial({
          amount: [{ amount: fee.amount, denom: fee.denom }],
        }),
      }).finish(),
      signatures: [new Uint8Array(64)],
    }).finish())
    const txRaw = {
      tx_bytes: txString,
    }
    const result = await this.post('/cosmos/tx/v1beta1/simulate', txRaw, config, true)

    return result.gas_info.gas_used
  }

  // Tx Submit
  async broadcastTx(bodyBytes, config = null) {
    const txString = toBase64(TxRaw.encode(bodyBytes).finish())
    const txRaw = {
      tx_bytes: txString,
      mode: 'BROADCAST_MODE_SYNC', // BROADCAST_MODE_SYNC, BROADCAST_MODE_BLOCK, BROADCAST_MODE_ASYNC
    }
    return this.post('/cosmos/tx/v1beta1/txs', txRaw, config, true).then(res => {
      if (res.code && res.code !== 0) {
        throw new Error(res.message)
      }
      if (res.tx_response && res.tx_response.code !== 0) {
        throw new Error(res.tx_response.raw_log)
      }
      return res
    })
  }

  async post(url = '', data = {}, config = null, useDsvApi = false) {
    if (!config) {
      this.getSelectedConfig()
    }
    const apiKey = useDsvApi ? 'dsvApi' : 'api'
    const conf = config || this.config
    const index = this.getApiIndex(config)
    // Default options are marked with *
    const response = await fetch((Array.isArray(conf[apiKey]) ? conf[apiKey][index] : conf[apiKey]) + url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      // mode: 'cors', // no-cors, *cors, same-origin
      // credentials: 'same-origin', // redirect: 'follow', // manual, *follow, error
      // referrerPolicy: 'origin', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      headers: {
        'Content-Type': 'text/plain',
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    // const response = axios.post((config ? config.api : this.config.api) + url, data)
    return response.json() // parses JSON response into native JavaScript objects
  }

  async get(url, config = null) {
    if (!config) {
      this.getSelectedConfig()
    }
    const conf = config || this.config
    const finalurl = (Array.isArray(conf.api) ? conf.api[this.getApiIndex(config)] : conf.api) + url
    // finalurl = finalurl.replaceAll('v1beta1', this.getEndpointVersion())
    const ret = await fetch(finalurl).then(response => response.json())
    return ret
  }

  getApiIndex(config = null) {
    const conf = config || this.config
    const index = Number(localStorage.getItem(`${conf.chain_name}-api-index`) || 0)
    return index < conf.api.length ? index : 0
  }

  async getUrl(url) {
    this.getSelectedConfig()
    return fetch(url).then(res => res.json())
  }

  static fetch(host, url) {
    const ret = fetch((Array.isArray(host) ? host[0] : host) + url).then(response => response.json())
    return ret
  }

  async getRegionAllowed() {
    const apiKey = 'dsvApi'
    const conf = this.config
    const index = this.getApiIndex(conf)
    const url = `${conf[apiKey][index]}/region-allowed`
    return fetch(url).then(response => response.json())
  }
}

// export default chainAPI
