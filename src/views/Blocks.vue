<!--
  Copyright (C) 2022 LINE Corporation

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along
  with this program; if not, write to the Free Software Foundation, Inc.,
  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
-->

<template>
  <div>
    <b-card
      no-body
      class="text-truncate"
    >
      <b-card-header>
        <b-card-title>
          Blocks
        </b-card-title>
      </b-card-header>
      <b-table
        :items="blocks"
        :fields="list_fields"
        :sort-desc="true"
        sort-by="tokens"
        striped
        hover
        stacked="sm"
      >
        <!-- Column: Height -->
        <template #cell(height)="data">
          <router-link :to="{ name: 'block', params: { height: data.item.block.header.height }}">
            {{ data.item.block.header.height }}
          </router-link>
        </template>
        <template #cell(hash)="data">
          <small>{{ data.item.block_id.hash }}</small>
        </template>
        <template #cell(time)="data">
          {{ formatTime(data.item.block.header.time) }}
        </template>
        <template #cell(txs)="data">
          {{ length(data.item.block.data.txs) }}
        </template>

      </b-table>
    </b-card>
  </div>
</template>

<script>
import {
  BTable, BCard, BCardHeader, BCardTitle, VBTooltip,
} from 'bootstrap-vue'
import {
  getCachedValidators,
  getStakingValidatorByHex,
  toDay,
} from '@/libs/utils'
// import fetch from 'node-fetch'

export default {
  components: {
    BCard,
    BTable,
    BCardHeader,
    BCardTitle,
  },
  directives: {
    'b-tooltip': VBTooltip,
  },
  data() {
    return {
      islive: true,
      blocks: [],
      list_fields: [
        {
          key: 'height',
          sortable: true,
        },
        {
          key: 'hash',
          thClass: 'd-none d-lg-block',
          tdClass: 'd-none d-lg-block text-truncate',
        },
        {
          key: 'txs',
        },
        {
          key: 'time',
          thClass: 'd-none d-md-block',
          tdClass: 'd-none d-md-block',
        },
      ],
    }
  },
  created() {
    this.$http.getLatestBlock().then(res => {
      this.blocks.push(res)
      const list = []
      const { height } = res.block.header
      for (let i = 1; i < 20; i += 1) {
        list.push(height - i)
      }

      if (!getCachedValidators()) {
        this.$http.getValidatorList()
      }

      let promise = Promise.resolve()
      list.forEach(item => {
        promise = promise.then(() => new Promise(resolve => {
          this.$http.getBlockByHeight(item).then(b => {
            resolve()
            this.blocks.push(b)
          })
        }))
      })
      this.timer = setInterval(this.fetch, 6000)
    })
  },
  beforeDestroy() {
    this.islive = false
    clearInterval(this.timer)
  },
  methods: {
    length: v => (Array.isArray(v) ? v.length : 0),
    formatTime: v => toDay(v, 'time'),
    formatProposer(v) {
      return getStakingValidatorByHex(this.$http.config.chain_name, v)
    },
    fetch() {
      this.$http.getLatestBlock().then(b => {
        const has = this.blocks.findIndex(x => x.block.header.height === b.block.header.height)
        if (has < 0) this.blocks.unshift(b)
        if (this.blocks.length > 200) this.blocks.pop()
      })
    },
  },
}
</script>
