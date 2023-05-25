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
  <!-- Error page-->
  <div class="misc-wrapper">
    <b-link class="brand-logo">
      <b-img
        :src="appLogo"
        alt="logo"
      />
    </b-link>
    <div class="misc-inner p-2 p-sm-3">
      <div class="w-100 text-center">
        <h2 class="mb-1">
          System Maintenance 👷
        </h2>
        <p class="mb-2">
          Due to Finschia Mainnet Upgrade, LINE Blockchain Scan will be unavailable during the following period: 08:30-20:30 (UTC+9, It may change depending on the work situation)
        </p>

        <!-- image -->
        <b-img
          fluid
          :src="imgUrl"
          alt="Error page"
        />
      </div>
    </div>
  </div>
<!-- / Error page-->
</template>

<script>
/* eslint-disable global-require */
import { BLink, BImg } from 'bootstrap-vue'
import { $themeConfig } from '@themeConfig'
import store from '@/store/index'

export default {
  components: {
    BLink,
    BImg,
  },
  data() {
    return {
      downImg: require('@/assets/images/pages/error.svg'),
    }
  },
  computed: {
    imgUrl() {
      if (store.state.appConfig.layout.skin === 'dark') {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.downImg = require('@/assets/images/pages/error-dark.svg')
        return this.downImg
      }
      return this.downImg
    },
    appLogo() {
      const { appLogoImage, appLogoImageDark } = $themeConfig.app
      if (store.state.appConfig.layout.skin === 'dark') {
        return appLogoImageDark
      }
      return appLogoImage
    },
  },
}
</script>

<style lang="scss">
@import '@core/scss/vue/pages/page-misc.scss';
</style>
