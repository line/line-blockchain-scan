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
  <div v-if="!isFetchingDenomsMetadata">
    <b-alert
      variant="danger"
      :show="syncing"
    >
      <div class="alert-body">
        <span>No new blocks have been produced since  <strong>{{ latestTime }}</strong> </span>
      </div>
    </b-alert>
    <b-row>
      <b-col>
        <summary-parmeters-component
          :data="decoratedChain"
          :row-attributes="{ class: isFinschiaSelected ? '' : 'justify-content-center' }"
          :col-attributes="{ xl: isFinschiaSelected ? 2 : 4 }"
        />
      </b-col>
    </b-row>
    <b-row v-if="isFinschiaSelected">
      <b-col>
        <summary-parmeters-component :data="mint" />
      </b-col>
    </b-row>
    <b-row v-if="isFinschiaSelected">
      <b-col>
        <summary-parmeters-component :data="staking" />
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <summary-assets-component
          :row-attributes="{ class: 'justify-content-center' }"
        />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  BRow, BCol, BAlert,
} from 'bootstrap-vue'
import {
  isToken, percent, timeIn, toDay, toDuration,
} from '@/libs/utils'
import { formatTokenAmount, tokenFormatter } from '@/libs/formatter'

import SummaryParmetersComponent from './SummaryParmetersComponent.vue'
import SummaryAssetsComponent from './SummaryAssetsComponent.vue'

const TOOLTIP_MAP = {
  mint_denom: 'Type of coin to mint',
  inflation_rate_change: 'Maximum annual change in inflation rate',
  inflation_max: 'Maximum inflation rate',
  inflation_min: 'Minimum inflation rate',
  goal_bonded: 'Goal of percent bonded LINKs',
  blocks_per_year: 'Expected blocks per year',
  max_entries: 'Max entries for either unbonding delegation or redelegation',
  historical_entries: 'The number of historical entries to persist',
  unbonding_time: 'The time duration of unbonding',
  bond_denom: 'The bondable coin denomination',
}

export default {
  components: {
    BRow,
    BCol,
    BAlert,
    SummaryParmetersComponent,
    SummaryAssetsComponent,
  },
  data() {
    return {
      syncing: false,
      latestTime: '',
      marketData: null,
      chain: {
        title: '',
        class: 'border-primary',
        items: [
          { subtitle: 'height', icon: 'BoxIcon', color: 'light-success' },
          { subtitle: 'supply_circulation', icon: 'DollarSignIcon', color: 'light-danger' },
          { subtitle: 'bonded', icon: 'PercentIcon', color: 'light-warning' },
          { subtitle: 'inflation', icon: 'TrendingUpIcon', color: 'light-primary' },
          { subtitle: 'community_pool', icon: 'AwardIcon', color: 'light-success' },
        ],
      },
      mint: {
        title: 'Mint Parameters',
        items: null,
      },
      staking: {
        title: 'Staking Parameters',
        items: [],
      },
    }
  },
  computed: {
    ...mapGetters({
      isFinschiaSelected: 'chains/isFinschiaSelected',
    }),
    decoratedChain() {
      const items = [...this.chain.items]

      // Remove finschia-related items
      if (!this.isFinschiaSelected) {
        items.splice(4, 1) // remove `community_pool` item
        items.splice(2, 1) // remove `bonded` item
      }

      return {
        ...this.chain,
        items,
      }
    },
    isFetchingDenomsMetadata() {
      return this.$store.state.chains.isFetchingDenomsMetadata
    },
  },
  created() {
    // ensure getting denoms metadata first, then call other apis
    this.$store.dispatch('chains/getDenomsMetadata').then(() => {
      this.$http.getLatestBlock().then(res => {
        const height = this.chain.items.findIndex(x => x.subtitle === 'height')

        this.$set(this.chain, 'title', `Chain ID: ${res.block.header.chain_id}`)
        this.$set(this.chain.items[height], 'title', res.block.header.height)
        if (timeIn(res.block.header.time, 3, 'm')) {
          this.syncing = true
        } else {
          this.syncing = false
        }
        this.latestTime = toDay(res.block.header.time, 'long')
      })

      this.$http.getMarketChart().then(res => {
        this.marketData = res
      })

      this.$http.getStakingParameters().then(res => {
        const stakingParameters = { ...res }
        if (stakingParameters.max_validators) {
          delete stakingParameters.max_validators
        }
        this.staking = this.normalize(stakingParameters, 'Staking Parameters')
        Promise.all([this.$http.getStakingPool(), this.$http.getBankTotal(res.bond_denom)])
          .then(pool => {
            const bondedAndSupply = this.chain.items.findIndex(x => x.subtitle === 'supply_circulation')
            const tokenAmount = parseInt(formatTokenAmount(pool[1].amount, 0, stakingParameters.bond_denom, false), 10)
            const bondedRatio = this.chain.items.findIndex(x => x.subtitle === 'bonded')

            this.$set(this.chain.items[bondedRatio], 'title', `${percent(pool[0].bondedToken / pool[1].amount)}%`)
            this.$set(this.chain.items[bondedRatio], 'subtitleData', formatTokenAmount(pool[0].bondedToken, 0, stakingParameters.bond_denom))
            this.$set(this.chain.items[bondedAndSupply], 'title', tokenAmount.toLocaleString())
          })
      })
      this.$http.getMintingInflation().then(res => {
        const chainIndex = this.chain.items.findIndex(x => x.subtitle === 'inflation')
        this.$set(this.chain.items[chainIndex], 'title', `${percent(res)}%`)
      })
      this.$http.getMintParameters().then(res => {
        this.mint = this.normalize(res, 'Minting Parameters')
      })

      // Only getCommunityPool for Finschia
      // Specs: https://wiki.linecorp.com/display/blockchain/LBS_v1.1.1_Policies#LBS_v1.1.1_Policies-TASK#1-Add'Community_pool'valueto'Summary'screen(onlyforFinschia)
      if (this.isFinschiaSelected) {
        this.$http.getCommunityPool().then(res => {
          const formattedCommunityPoolAmountInDefaultDenom = formatTokenAmount(res.pool[0].amount, 0, res.pool[0].denom, true)

          const communityPoolIndex = this.chain.items.findIndex(x => x.subtitle === 'community_pool')
          this.$set(this.chain.items[communityPoolIndex], 'title', formattedCommunityPoolAmountInDefaultDenom)
        })
      }
    })
  },
  methods: {
    normalize(data, title) {
      if (!data) return null
      const items = this.makeItems(data)
      return {
        title,
        items,
      }
    },
    makeItems(data) {
      return Object.keys(data).map(k => {
        if (isToken(data[k])) {
          return { title: tokenFormatter(data[k]), subtitle: k, tooltip: TOOLTIP_MAP[k] }
        }
        if (typeof data[k] === 'boolean') {
          return { title: data[k], subtitle: k, tooltip: TOOLTIP_MAP[k] }
        }
        const d = Number(data[k])
        if (d < 1.01) {
          return { title: `${percent(d)}%`, subtitle: k, tooltip: TOOLTIP_MAP[k] }
        }
        if (d > 1000000000) {
          return { title: `${toDuration(d / 1000000)}`, subtitle: k, tooltip: TOOLTIP_MAP[k] }
        }
        return { title: data[k], subtitle: k, tooltip: TOOLTIP_MAP[k] }
      })
    },
  },
}
</script>

<style>

</style>
