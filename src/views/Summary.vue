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
          :data="chain"
        />
      </b-col>
    </b-row>
    <b-row v-if="marketChartData">
      <b-col>
        <b-card>
          <summary-price-chart
            :chart-data="marketChartData"
            :height="150"
            :min-height="150"
          />
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <summary-assets-component />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import {
  BRow, BCol, BAlert, BCard,
} from 'bootstrap-vue'
import {
  getUserCurrency, isToken, percent, timeIn, toDay, toDuration,
} from '@/libs/utils'
import { formatTokenAmount, tokenFormatter } from '@/libs/formatter'

import SummaryParmetersComponent from './SummaryParmetersComponent.vue'
import SummaryAssetsComponent from './SummaryAssetsComponent.vue'
import SummaryPriceChart from './SummaryPriceChart.vue'

export default {
  components: {
    BRow,
    BCol,
    BAlert,
    BCard,
    SummaryParmetersComponent,
    SummaryAssetsComponent,
    SummaryPriceChart,
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
          { subtitle: 'inflation', icon: 'TrendingUpIcon', color: 'light-primary' },
        ],
      },
    }
  },
  computed: {
    marketChartData() {
      if (this.marketData && this.marketData.prices) {
        const labels = this.marketData.prices.map(x => x[0])
        const data = this.marketData.prices.map(x => x[1])
        return {
          labels,
          datasets: [
            {
              label: `Price (${getUserCurrency().toUpperCase()})`,
              data,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              pointStyle: 'dash',
              barThickness: 15,
            },
          ],
        }
      }
      return null
    },
  },
  created() {
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
      Promise.all([this.$http.getStakingPool(), this.$http.getBankTotal(res.bond_denom)])
        .then(pool => {
          const bondedAndSupply = this.chain.items.findIndex(x => x.subtitle === 'supply_circulation')
          const tokenAmount = parseInt(formatTokenAmount(pool[1].amount, 0, res.bond_denom, false), 10)
          this.$set(this.chain.items[bondedAndSupply], 'title', tokenAmount.toLocaleString())
        })
    })
    this.$http.getMintingInflation().then(res => {
      const chainIndex = this.chain.items.findIndex(x => x.subtitle === 'inflation')
      this.$set(this.chain.items[chainIndex], 'title', `${percent(res)}%`)
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
          return { title: tokenFormatter(data[k]), subtitle: k }
        }
        if (typeof data[k] === 'boolean') {
          return { title: data[k], subtitle: k }
        }
        const d = Number(data[k])
        if (d < 1.01) {
          return { title: `${percent(d)}%`, subtitle: k }
        }
        if (d > 1000000000) {
          return { title: `${toDuration(d / 1000000)}`, subtitle: k }
        }
        return { title: data[k], subtitle: k }
      })
    },
  },
}
</script>

<style>

</style>
