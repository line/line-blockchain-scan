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
  <b-card v-if="assets">
    <b-card-title>
      Assets
    </b-card-title>
    <b-table
      :items="assets"
      :fields="cfield"
      hover
      striped
      sticky-header="true"
      responsive="xs"
    />
  </b-card>
</template>

<script>
import { BTable, BCardTitle, BCard } from 'bootstrap-vue'
import { formatTokenAmount, formatTokenDenom } from '@/libs/formatter'

export default {
  components: {
    BCard,
    BTable,
    BCardTitle,
  },
  data() {
    return {
      islive: true,
      assets: [],
      cfield: [
        {
          key: 'denom',
          label: 'coin(symbol)',
          formatter: this.formatDenom,
          tdClass: 'text-nowrap text-truncate overflow-hidden',
        },
        {
          key: 'abbr',
          label: 'Amount',
        },
      ],
    }
  },
  computed: {
    denoms() {
      return this.$store.state.chains.denoms
    },
  },
  created() {
    // Call getSelectedConfig to avoid error `TypeError: Cannot read properties of undefined (reading 'sdk_version')`
    // because `this.config` is undefined
    this.$http.getSelectedConfig()
    this.$http.getBankTotals().then(res => {
      const toshow = res?.sort() || []
      this.assets = toshow?.reverse().map(x => {
        const xh = x
        xh.abbr = formatTokenAmount(x.amount, 6, x.denom)
        return xh
      })
    })
  },
  beforeDestroy() {
    this.islive = false
  },
  methods: {
    formatDenom(v) {
      const trace = this.denoms[v]
      if (trace) {
        return `* ${formatTokenDenom(trace)}`
      }
      const formattedTokenDenom = formatTokenDenom(v)

      // Only this place use this format due to specs v1.1.2: https://wiki.linecorp.com/pages/viewpage.action?spaceKey=blockchain&title=LBS_v1.1.2_Overview
      // No check base on chain name ('Finschia Mainnet' or 'Ebony Testnet') for this switch case
      // because there will be 2 Finschia chains working on next v1.2.0
      // but the chain name is not defined yet
      let displayableFormattedTokenDenom
      switch (formattedTokenDenom) {
        case 'LN':
          displayableFormattedTokenDenom = 'FINSCHIA(FNSA)'
          break
        case 'FNSA':
          displayableFormattedTokenDenom = `FINSCHIA(${formattedTokenDenom})`
          break
        case 'TFNSA':
          displayableFormattedTokenDenom = `TEST FINSCHIA(${formattedTokenDenom})`
          break
        default:
          displayableFormattedTokenDenom = formattedTokenDenom
          break
      }
      return displayableFormattedTokenDenom
    },
  },
}
</script>

<style>
</style>
