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
  <div class="navbar-container d-flex content align-items-center">

    <!-- Nav Menu Toggler -->
    <ul class="nav navbar-nav d-lg-none">
      <li class="nav-item">
        <b-link
          class="nav-link"
          @click="toggleVerticalMenuActive"
        >
          <b-avatar
            v-if="selected_chain && selected_chain.logos"
            variant="transparent"
            rounded
            size="21"
            :src="selected_chain.logos[mode]"
            class="badge-minimal"
          />
          <feather-icon
            v-else
            icon="MenuIcon"
            size="21"
          />
        </b-link>
      </li>
    </ul>

    <!-- Left Col -->
    <div class="bookmark-wrapper align-items-center flex-grow-1 d-none d-lg-flex">
      <b-media
        v-if="selected_chain"
        no-body
      >
        <b-media-aside class="mr-75">
          <b-link
            class="nav-link"
            @click="toggleVerticalMenuActive"
          >
            <b-avatar
              v-b-tooltip.hover.bottom="tips"
              variant="transparent"
              badge
              rounded
              size="44"
              :src="selected_chain.logos[mode]"
              class="badge-minimal"
              :badge-variant="variant"
            /></b-link>
        </b-media-aside>
        <b-media-body class="my-auto">
          <h6 class="mb-0 ">
            <span>{{ selected_chain.chain_name }}</span>
          </h6>
        </b-media-body>
      </b-media>
    </div>

    <!-- <dark-Toggler class="d-none d-lg-block" /> -->
    <!-- Right Col -->
    <b-navbar-nav class="nav align-items-center ml-auto">
      <dark-Toggler class="d-none d-lg-block" />
      <search-bar />
      <b-dropdown
        v-if="isFinschiaSelected"
        class="ml-1"
        variant="link"
        no-caret
        toggle-class="p-0"
        right
      >

        <template #button-content>
          <b-button
            v-ripple.400="'rgba(255, 255, 255, 0.15)'"
            variant="primary"
            class="btn-icon"
          >
            <feather-icon icon="KeyIcon" />
            {{ walletName }}
          </b-button>
        </template>

        <b-dropdown-item
          v-for="(item,k) in accounts"
          :key="k"
          :disabled="!item.address"
          @click="updateDefaultWallet(item.wallet)"
        >
          <div class="d-flex flex-column">
            <div class="d-flex justify-content-between">
              <span class="font-weight-bolder">
                {{ item.wallet }}
                <b-avatar
                  v-if="item.wallet===walletName"
                  variant="success"
                  size="sm"
                >
                  <feather-icon icon="CheckIcon" />
                </b-avatar>
              </span>
              <b-link :to="`/${selected_chain.chain_name}/account/${item.address.addr}`">
                <feather-icon icon="ArrowRightIcon" />
              </b-link>
            </div>
            <small>{{ item.address ? formatAddr(item.address.addr) : `Not available on ${selected_chain.chain_name}` }}</small>
          </div>
        </b-dropdown-item>
        <b-dropdown-divider />
        <connect-dosi-vault wrapper-component="b-dropdown-item" />
        <b-dropdown-divider />

        <b-dropdown-item :to="{ name: 'accounts' }">
          <feather-icon
            icon="KeyIcon"
            size="16"
          />
          <span class="align-middle ml-50">Accounts</span>
        </b-dropdown-item>

        <b-dropdown-item :to="{ name: 'delegations' }">
          <feather-icon
            icon="BookOpenIcon"
            size="16"
          />
          <span class="align-middle ml-50">My Delegations</span>
        </b-dropdown-item>
      </b-dropdown>
    </b-navbar-nav>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  BLink, BNavbarNav, BMedia, BMediaAside, BAvatar, BMediaBody, VBTooltip, BButton,
  BDropdown, BDropdownItem, BDropdownDivider,
} from 'bootstrap-vue'
import Ripple from 'vue-ripple-directive'
import DarkToggler from '@core/layouts/components/app-navbar/components/DarkToggler.vue'
import SearchBar from '@core/layouts/components/app-navbar/components/SearchBar.vue'
// import CartDropdown from '@core/layouts/components/app-navbar/components/CartDropdown.vue'
import { timeIn, toDay } from '@/libs/utils'
import { getLocalAccounts } from '@/libs/local'
// import UserDropdown from '@core/layouts/components/app-navbar/components/UserDropdown.vue'
import ConnectDosiVault from '../../views/components/ConnectDosiVault/index.vue'

export default {
  components: {
    BLink,
    BNavbarNav,
    BAvatar,
    BMedia,
    BMediaAside,
    BMediaBody,
    BButton,
    BDropdown,
    BDropdownItem,
    BDropdownDivider,
    // Navbar Components
    DarkToggler,
    SearchBar,
    // CartDropdown,
    // UserDropdown,
    ConnectDosiVault,
  },
  directives: {
    'b-tooltip': VBTooltip,
    Ripple,
  },
  props: {
    toggleVerticalMenuActive: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      variant: 'success',
      tips: 'Synced',
      index: 0,
    }
  },
  computed: {
    ...mapGetters({
      mode: 'mode',
      isFinschiaSelected: 'chains/isFinschiaSelected',
    }),
    walletName() {
      const key = this.$store?.state?.chains?.defaultWallet
      return key || 'Wallet'
    },
    selected_chain() {
      this.block()
      return this.$store.state.chains.selected
    },
    chainVariant() {
      return this.variant
    },
    accounts() {
      let accounts = getLocalAccounts() || {}
      accounts = Object.entries(accounts).map(v => ({ wallet: v[0], address: v[1].address.find(x => x.chain === this.selected_chain.chain_name) }))

      if (!this.$store.state.chains.defaultWallet && accounts.length > 0) {
        this.updateDefaultWallet(accounts[0].wallet)
      }
      if (accounts.findIndex(x => x.wallet === this.walletName) < 0 && this.walletName !== 'Wallet') {
        this.updateDefaultWallet(null)
      }
      return accounts
    },
  },
  mounted() {

  },
  methods: {
    formatAddr(v) {
      return v.substring(0, 10).concat('...', v.substring(v.length - 10))
    },
    updateDefaultWallet(v) {
      this.$store.commit('setDefaultWallet', v)
    },
    change(v) {
      this.index = v
      const conf = this.$store.state.chains.selected
      localStorage.setItem(`${conf.chain_name}-api-index`, v)
      window.location.reload()
    },
    block() {
      const conf = this.$store.state.chains.selected
      const s = localStorage.getItem(`${conf.chain_name}-api-index`) || 0
      this.index = Number(s)
      this.$store.commit('setHeight', 0)
      this.$http.getLatestBlock().then(block => {
        this.$store.commit('setHeight', Number(block.block.header.height))
        if (timeIn(block.block.header.time, 1, 'm')) {
          this.variant = 'danger'
          this.tips = `Halted ${toDay(block.block.header.time, 'from')}, Height: ${this.$store.state.chains.height} `
        } else {
          this.variant = 'success'
          this.tips = 'Synced'
        }
      })
    },
  },
}
</script>
