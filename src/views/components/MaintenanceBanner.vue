<template>
  <div
    v-if="navbarStyle === 'static'"
    class="banner"
  >
    Due to Finschia Mainnet Upgrade, LINE Blockchain Scan will be unavailable during the following period:
    May 25, 09:00-20:00 (UTC+9).
  </div>
</template>

<script>
import { $themeConfig } from '@themeConfig'

export default {
  name: 'MaintenanceBanner',
  data() {
    return {
      navbarStyle: $themeConfig.layout.navbar.type,
    }
  },
}
</script>

<style scoped>
.banner {
    background-color: #2d2ca0;
    padding: 29px 29px 29px 23px;
    font-size: 16px;
    color: white;
    z-index: 999;
    position: relative;
}
</style>
