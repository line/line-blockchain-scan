<template>
  <div>
    <MaintenanceBanner />
    <layout-vertical>

      <router-view :key="$route.params.chain" />

      <template #navbar="{ toggleVerticalMenuActive }">
        <navbar :toggle-vertical-menu-active="toggleVerticalMenuActive" />
      </template>

    </layout-vertical>
  </div>
</template>

<script>
import MaintenanceBanner from '@/views/components/MaintenanceBanner.vue'
import LayoutVertical from '@core/layouts/layout-vertical/LayoutVertical.vue'
import Navbar from '../components/Navbar.vue'

export default {
  components: {
    LayoutVertical,
    Navbar,
    MaintenanceBanner,
  },
}
</script>
