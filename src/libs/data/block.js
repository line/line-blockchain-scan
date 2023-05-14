import { fromBase64, toHex } from '@cosmjs/encoding'

import BlockId from './block-id'
import BlockInner from './block-inner'

export function getValueByKey(obj, key) {
  const keyParts = key.split('.')
  let value = obj

  keyParts.forEach(part => {
    value = value[part]
  })

  return value
}

function setValueByKey(obj, key, newValue) {
  const keyParts = key.split('.')
  let value = obj

  for (let i = 0; i < keyParts.length - 1; i += 1) {
    value = value[keyParts[i]]
  }

  value[keyParts[keyParts.length - 1]] = newValue
}

function deleteValueByKey(obj, key) {
  const keyParts = key.split('.')
  let value = obj

  for (let i = 0; i < keyParts.length - 1; i += 1) {
    value = value[keyParts[i]]
  }

  delete value[keyParts[keyParts.length - 1]]
}

export default class Block {
  constructor() {
    this.block_id = new BlockId()
    this.block = new BlockInner()
  }

  static create(element) {
    const self = new Block()
    self.block_id = BlockId.create(element.block_id)
    self.block = BlockInner.create(element.block)
    return self
  }

  static transformData(data) {
    const obj = JSON.parse(JSON.stringify(data))

    // Keys of a response of block information that has base64 values.
    // Try calling API for reference: https://lbs-ebonynw.line-apps-alpha.com/lbm/base/ostracon/v1/blocks/25989107
    const decodeKeys = [
      'block.header.app_hash',
      'block.header.consensus_hash',
      'block.header.data_hash',
      'block.header.evidence_hash',
      'block.header.last_block_id.hash',
      'block.header.last_block_id.part_set_header.hash',
      'block.header.last_commit_hash',
      'block.header.last_results_hash',
      'block.header.next_validators_hash',
      'block.header.proof',
      'block.header.validators_hash',
      'block.last_commit.block_id.hash',
      'block.last_commit.block_id.part_set_header.hash',
      'block_id.hash',
      'block_id.part_set_header.hash',
    ]

    decodeKeys.forEach(key => {
      const value = getValueByKey(obj, key)
      if (value) {
        // Confirmed with mainnet team: https://line-enterprise.slack.com/archives/C03PCPW8LTF/p1682043719678499?thread_ts=1681701153.834079&cid=C03PCPW8LTF
        setValueByKey(obj, key, toHex(fromBase64(value)).toUpperCase())
      }
    })

    // Keys that need to be renamed to keep compatible with previous interface.
    const renameKeys = [
      { from: 'block_id.part_set_header', to: 'block_id.parts' },
      { from: 'block.header.last_block_id.part_set_header', to: 'block.header.last_block_id.parts' },
      { from: 'block.last_commit.block_id.part_set_header', to: 'block.last_commit.block_id.parts' },
    ]

    renameKeys.forEach(key => {
      setValueByKey(obj, key.to, getValueByKey(obj, key.from))
      deleteValueByKey(obj, key.from)
    })

    const blockIdFlagMap = {
      BLOCK_ID_FLAG_UNKNOWN: 0,
      BLOCK_ID_FLAG_ABSENT: 1,
      BLOCK_ID_FLAG_COMMIT: 2,
      BLOCK_ID_FLAG_NIL: 3,
    }

    if (Array.isArray(getValueByKey(obj, 'block.last_commit.signatures'))) {
      obj.block.last_commit.signatures.forEach(item => {
        if (item.validator_address) {
          setValueByKey(item, 'validator_address', toHex(fromBase64(item.validator_address)).toUpperCase())
        }
        if (item.block_id_flag && item.block_id_flag in blockIdFlagMap) {
          setValueByKey(item, 'block_id_flag', blockIdFlagMap[item.block_id_flag])
        }
      })
    }

    return obj
  }
}
