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

import BlockData from './block-data'
import BlockHeader from './block-header'
import BlockLastCommit from './block-last-commit'

export default class BlockInner {
  constructor() {
    this.header = new BlockHeader()
    this.data = new BlockData()
    this.evidence = { evidence: [] }
    this.last_commit = new BlockLastCommit()
  }

  static create(element) {
    const self = new BlockInner()
    if (element) {
      self.header = BlockHeader.create(element.header)
      self.data = BlockData.create(element.data)
      self.evidence = element.evidence
      self.last_commit = BlockLastCommit.create(element.last_commit)
    }
    return self
  }
}
