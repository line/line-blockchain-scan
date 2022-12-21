export function getLocalObject(name) {
  const text = localStorage.getItem(name)
  if (text) {
    return JSON.parse(text)
  }
  return null
}

export function getLocalChains() {
  return getLocalObject('chains')
}

export function getLocalAccounts() {
  return getLocalObject('accounts')
}

export function getLocalTxHistory() {
  return getLocalObject('txHistory')
}

export function setLocalTxHistory(tx) {
  const newTx = tx
  const txs = getLocalTxHistory()
  if (txs) {
    txs.push(newTx)
    return localStorage.setItem('txHistory', JSON.stringify(txs))
  }
  return localStorage.setItem('txHistory', JSON.stringify([newTx]))
}
