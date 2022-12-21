import { getLocalChains } from './local'

export function numberWithCommas(x) {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export function formatTokenDenom(tokenDenom) {
  if (tokenDenom && tokenDenom.code === undefined) {
    let denom = tokenDenom.denom_trace ? tokenDenom.denom_trace.base_denom : tokenDenom
    const config = Object.values(getLocalChains())

    config.forEach(x => {
      if (x.assets) {
        const asset = x.assets.find(a => (a.base === denom))
        if (asset) denom = asset.symbol
      }
    })
    return denom.toUpperCase()
  }
  return ''
}

export function formatTokenAmount(tokenAmount, decimals = 2, tokenDenom = 'cony', format = true) {
  const denom = tokenDenom.denom_trace ? tokenDenom.denom_trace.base_denom : tokenDenom
  let amount = 0
  let exp = String(denom).startsWith('gravity') ? 18 : 6
  const config = Object.values(getLocalChains())

  config.forEach(x => {
    if (x.assets) {
      const asset = x.assets.find(a => (a.base === denom))
      if (asset) exp = asset.exponent
    }
  })
  amount = Number(Number(tokenAmount)) / (10 ** exp)
  if (amount > 10) {
    if (format) { return numberWithCommas(parseFloat(amount).toFixed(decimals)) }
    return parseFloat(amount).toFixed(decimals)
  }
  return parseFloat(amount).toFixed(exp)
}

export function formatToken(token, IBCDenom = {}, decimals = 2, withDenom = true) {
  if (token) {
    const denom = IBCDenom[token.denom] || token.denom
    if (withDenom) {
      return `${formatTokenAmount(token.amount, decimals, denom)} ${formatTokenDenom(denom)}`
    }
    return formatTokenAmount(token.amount, decimals, denom)
  }
  return token
}

export function tokenFormatter(tokens, denoms = {}) {
  if (Array.isArray(tokens)) {
    return tokens.map(t => formatToken(t, denoms, 2)).join(', ')
  }
  return formatToken(tokens, denoms, 2)
}

export function isConvertedKey(key) {
  const reservedKeys = ['amount', 'initial_deposit', 'value']
  return reservedKeys.includes(key)
}
