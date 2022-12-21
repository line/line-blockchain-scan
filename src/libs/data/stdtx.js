import compareVersions from 'compare-versions'
import { formatTokenAmount, isConvertedKey } from '../formatter'
import Token from './token'

function denomConverter(msg) {
  const convertedDenom = {
    tcony: 'TLN',
    cony: 'LN',
  }
  const convertedKey = {
    denom: 'coin',
  }

  const findMatch = (value, pool) => {
    const matchedKey = Object.keys(pool).find(cd => cd === value)
    return matchedKey ? pool[matchedKey] : value
  }

  const replaceDenom = denom => {
    if (Array.isArray(denom)) return denom.map(d => replaceDenom(d))
    if (typeof denom === 'object') {
      return Object.keys(denom).reduce((final, k) => {
        const title = findMatch(k, convertedKey)
        return {
          ...final,
          [title]: (isConvertedKey(k) && typeof denom[k] === 'string') ? `${formatTokenAmount(denom[k], 6, denom.denom)}` : replaceDenom(denom[k]),
        }
      }, {})
    }
    return findMatch(denom, convertedDenom)
  }

  return replaceDenom(msg)
}

export default class StdTx {
  constructor() {
    this.type = ''
    this.fee = [new Token()]
    this.gas = 0
    this.memo = ''
    this.messages = null
    this.signatures = []
    this.timeout_height = 0
  }

  static create(element, version = '0.40') {
    const self = new StdTx()
    if (compareVersions(version, '0.40') < 1) {
      self.type = element.type
      self.fee = element.value.fee.amount
      self.gas = element.value.fee.gas
      self.memo = element.value.memo
      self.messages = denomConverter(element.value.msg)
      self.signatures = element.value.signatures
      self.timeout_height = 0
    } else {
      self.type = element['@type']
      self.fee = element.auth_info.fee.amount
      self.gas = element.auth_info.fee.gas_limit
      self.memo = element.body.memo
      self.messages = denomConverter(element.body.messages)
      self.signatures = element.signatures
      self.timeout_height = element.body.timeout_height
    }
    return self
  }
}
