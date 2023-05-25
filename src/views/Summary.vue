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
          :row-attributes="{ class: isEitherFinschiaSelected ? '' : 'justify-content-center' }"
          :col-attributes="{ xl: isEitherFinschiaSelected ? '' : 4 }"
        />
      </b-col>
    </b-row>
    <b-row v-if="isEitherFinschiaSelected">
      <b-col>
        <summary-parmeters-component :data="mint" />
      </b-col>
    </b-row>
    <b-row v-if="isEitherFinschiaSelected">
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
import { formatTokenAmount, formatTokenDenom, tokenFormatter } from '@/libs/formatter'

import SummaryParmetersComponent from './SummaryParmetersComponent.vue'
import SummaryAssetsComponent from './SummaryAssetsComponent.vue'

const TOOLTIP_MAP = {
  inflation_rate_change: 'Maximum annual change in inflation rate',
  inflation_max: 'Maximum inflation rate',
  inflation_min: 'Minimum inflation rate',
  goal_bonded: 'Goal of percent bonded FNSAs',
  blocks_per_year: 'Expected blocks per year',
  max_entries: 'Max entries for either unbonding delegation or redelegation',
  historical_entries: 'The number of historical entries to persist',
  unbonding_time: 'The time duration of undelegate',
}

const DISPLAY_SUBTITLE_MAP = {
  inflation_rate_change: 'Inflation rate change',
  inflation_max: 'Inflation(max)',
  inflation_min: 'Inflation(min)',
  goal_bonded: 'Target bonded ratio',
  blocks_per_year: 'Blocks per year',
  max_entries: 'Max entries',
  historical_entries: 'Historical entries',
  unbonding_time: 'Undelegate wait time',
}

const REMOVED_ITEMS = [
  'mint_denom', // removed in v1.1.2. Specs: https://wiki.linecorp.com/display/blockchain/LBS_v1.1.2_Overview#LBS_v1.1.2_Overview-TASKS
  'bond_denom', // removed in v1.1.2. Specs: https://wiki.linecorp.com/display/blockchain/LBS_v1.1.2_Overview#LBS_v1.1.2_Overview-TASKS
]

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
          { subtitle: 'height', icon: 'BoxIcon', color: 'light-info' },
          {
            subtitle: 'supply_circulation', icon: 'DollarSignIcon', color: 'light-danger', displaySubtitle: 'Circulating supply',
          },
          { subtitle: 'bonded', icon: 'PercentIcon', color: 'light-warning' },
          { subtitle: 'inflation', icon: 'TrendingUpIcon', color: 'light-primary' },
          {
            subtitle: 'community_pool', icon: 'AwardIcon', color: 'light-success', displaySubtitle: 'Community pool',
          },
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
      isOldFinschiaSelected: 'chains/isOldFinschiaSelected',
    }),
    decoratedChain() {
      const items = [...this.chain.items]

      // Remove finschia-related items
      if (!this.isEitherFinschiaSelected) {
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
    isEitherFinschiaSelected() {
      return this.isFinschiaSelected || this.isOldFinschiaSelected
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
            this.$set(this.chain.items[bondedRatio], 'subtitleData', `${formatTokenAmount(pool[0].bondedToken, 0, stakingParameters.bond_denom)} ${formatTokenDenom(stakingParameters.bond_denom)}`)
            this.$set(this.chain.items[bondedAndSupply], 'title', `${tokenAmount.toLocaleString()} ${formatTokenDenom(stakingParameters.bond_denom)}`)
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
      if (this.isEitherFinschiaSelected) {
        this.$http.getCommunityPool().then(res => {
          const formattedCommunityPoolAmountInDefaultDenom = formatTokenAmount(res.pool[0].amount, 0, res.pool[0].denom, true)

          const communityPoolIndex = this.chain.items.findIndex(x => x.subtitle === 'community_pool')
          this.$set(this.chain.items[communityPoolIndex], 'title', `${formattedCommunityPoolAmountInDefaultDenom} ${formatTokenDenom(res.pool[0].denom)}`)
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
      const getDisplaySubtitle = k => {
        if (k in DISPLAY_SUBTITLE_MAP) return DISPLAY_SUBTITLE_MAP[k]
        return k
      }

      return Object.keys(data).filter(k => !REMOVED_ITEMS.includes(k)).map(k => {
        const tooltip = TOOLTIP_MAP[k]

        if (isToken(data[k])) {
          return {
            title: tokenFormatter(data[k]), subtitle: k, tooltip, displaySubtitle: getDisplaySubtitle(k),
          }
        }
        if (typeof data[k] === 'boolean') {
          return {
            title: data[k], subtitle: k, tooltip, displaySubtitle: getDisplaySubtitle(k),
          }
        }
        const d = Number(data[k])
        if (d < 1.01) {
          return {
            title: `${percent(d)}%`, subtitle: k, tooltip, displaySubtitle: getDisplaySubtitle(k),
          }
        }
        if (d > 1000000000) {
          return {
            title: `${toDuration(d / 1000000)}`, subtitle: k, tooltip, displaySubtitle: getDisplaySubtitle(k),
          }
        }
        return {
          title: data[k], subtitle: k, tooltip, displaySubtitle: getDisplaySubtitle(k),
        }
      })
    },
  },
}
</script>

<style>

</style>
