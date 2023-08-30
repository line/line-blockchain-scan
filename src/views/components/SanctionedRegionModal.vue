<template>
  <b-modal
    id="sanctioned-region-modal"
    title="Staking not available"
    centered
    size="md"
    modal-class="custom-transaction-modal"
    hide-footer
  >
    This feature is not available in your region.
  </b-modal>
</template>

<script>
import { BModal } from 'bootstrap-vue'

export default {
  name: 'SantionedRegionModal',
  components: {
    BModal,
  },
}
</script>
