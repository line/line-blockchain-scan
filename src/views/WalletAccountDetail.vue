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
    <div v-if="!error">
      <b-card
        bg-variant="secondary"
        style="color: #fff"
      >
        <div
          class="d-flex flex-row align-items-center text-truncate"
        >
          <b-avatar
            id="address-qr"
            rounded
            size="52"
          >
            <feather-icon
              icon="CameraIcon"
              size="32"
            />
          </b-avatar>
          <div class="ml-2">
            <h3
              style="color: #fff"
              class="mb-0"
            >
              Address: <feather-icon
                icon="CopyIcon"
                size="18"
                @click="copy()"
              />
            </h3>
            {{ address }}
          </div>
        </div>
      </b-card>
      <b-card
        v-if="unbonding && unbonding.length > 0"
      >
        <b-card-header class="pt-0 pl-0 pr-0">
          <b-card-title>Unbonding Tokens</b-card-title>
        </b-card-header>
        <b-card-body class="pl-0 pr-0">
          <b-row
            v-for="item in unbonding"
            :key="item.validator_address"
          >
            <b-col cols="12">
              <span class="font-weight-bolder">From: <router-link :to="`../staking/${item.validator_address}`">{{ item.validator_address }}</router-link></span>
            </b-col>
            <b-col cols="12">
              <b-table
                :items="item.entries"
                class="mt-1"
                striped
                hover
                responsive="sm"
                stacked="sm"
              >
                <template #cell(completion_time)="data">
                  {{ formatDate(data.item.completion_time) }}
                </template>
                <template #cell(initial_balance)="data">
                  {{ data.item.initial_balance }}{{ stakingParameters.bond_denom }}
                </template>
                <template #cell(balance)="data">
                  {{ data.item.balance }}{{ stakingParameters.bond_denom }}
                </template>
              </b-table>
            </b-col>
          </b-row>
        </b-card-body>
      </b-card>
      <b-card title="Transactions">
        <b-table
          :items="txs"
          striped
          hover
          responsive="sm"
          stacked="sm"
        >
          <template #cell(height)="data">
            <router-link :to="`../blocks/${data.item.height}`">
              {{ data.item.height }}
            </router-link>
          </template>
          <template #cell(txhash)="data">
            <router-link :to="`../tx/${data.item.txhash}`">
              {{ formatHash(data.item.txhash) }}
            </router-link>
          </template>
        </b-table>

        <b-pagination
          v-if="Number(transactions.page_total) > 1"
          :total-rows="transactions.total_count"
          :per-page="transactions.limit"
          :value="transactions.page_number"
          align="center"
          class="mt-1"
          @change="pageload"
        />
      </b-card>
      <b-popover
        target="address-qr"
        variant="dark"
        triggers="hover"
        placement="bottom"
      >
        <vue-qr :text="address" />
      </b-popover>
      <div id="txevent" />
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import {
  BCard, BAvatar, BPopover, BTable, BRow, BCol, BCardHeader, BCardTitle, BCardBody, VBModal, VBTooltip, BPagination,
} from 'bootstrap-vue'
import FeatherIcon from '@/@core/components/feather-icon/FeatherIcon.vue'
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'
import Ripple from 'vue-ripple-directive'
import VueQr from 'vue-qr'
import {
  toDay,
  toDuration, abbrMessage, abbrAddress, getUserCurrency, getUserCurrencySign,
} from '@/libs/utils'
import {
  formatTokenAmount, formatTokenDenom, tokenFormatter, numberWithCommas,
} from '@/libs/formatter'

export default {
  components: {
    BRow,
    BCol,
    BCard,
    BAvatar,
    BPopover,
    BTable,
    FeatherIcon,
    VueQr,
    BCardHeader,
    BCardTitle,
    BCardBody,
    BPagination,
    // eslint-disable-next-line vue/no-unused-components
    ToastificationContent,
  },
  directives: {
    'b-modal': VBModal,
    'b-tooltip': VBTooltip,
    Ripple,
  },
  data() {
    const { address } = this.$route.params
    return {
      currency: getUserCurrencySign(),
      totalCurrency: 0,
      address,
      account: null,
      assets: [],
      redelegations: [],
      unbonding: [],
      quotes: {},
      transactions: [],
      stakingParameters: {},
      error: null,
    }
  },
  computed: {
    txs() {
      if (this.transactions.txs) {
        return this.transactions.txs.map(x => ({
          height: Number(x.height),
          txhash: x.txhash,
          msgs: abbrMessage(x.tx.msg ? x.tx.msg : x.tx.value.msg),
          time: toDay(x.timestamp),
        }))
      }
      return []
    },
    denoms() {
      return this.$store.state.chains.denoms
    },
  },
  created() {
    this.initial()
    this.$http.getTxsBySender(this.address).then(res => {
      this.transactions = res
    })
    this.$http.getStakingParameters().then(res => {
      this.stakingParameters = res
    })
  },
  mounted() {
    const elem = document.getElementById('txevent')
    elem.addEventListener('txcompleted', () => {
      this.initial()
    })
  },
  methods: {
    initial() {
      this.$http.getStakingUnbonding(this.address).then(res => {
        this.unbonding = res.unbonding_responses || res
      })
    },
    formatNumber(v) {
      return numberWithCommas(v)
    },
    pageload(v) {
      this.$http.getTxsBySender(this.address, v).then(res => {
        this.transactions = res
      })
    },
    formatHash: abbrAddress,
    formatDenom(v) {
      return formatTokenDenom(this.denoms[v] ? this.denoms[v] : v)
    },
    formatAmount(v, dec = 2, denom = 'uatom', format = true) {
      return formatTokenAmount(v, dec, denom, format)
    },
    formatToken(v) {
      return tokenFormatter(v, this.denoms)
    },
    formatCurrency(amount, denom) {
      const qty = this.formatAmount(amount, 2, denom, false)
      const d2 = this.formatDenom(denom)
      const userCurrency = getUserCurrency()
      const quote = this.$store.state.chains.quotes[d2]
      if (quote) {
        const price = quote[userCurrency]
        return parseFloat((qty * price).toFixed(2))
      }
      return 0
    },
    formatDate: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    formatTime: v => toDay(Number(v) * 1000),
    formatLength: v => toDuration(Number(v) * 1000),
    copy() {
      this.$copyText(this.address).then(() => {
        this.$toast({
          component: ToastificationContent,
          props: {
            title: 'Address copied',
            icon: 'BellIcon',
          },
        })
      }, e => {
        this.$toast({
          component: ToastificationContent,
          props: {
            title: `Failed to copy address! ${e}`,
            icon: 'BellIcon',
            variant: 'danger',
          },
        })
      })
    },
  },
}
</script>
