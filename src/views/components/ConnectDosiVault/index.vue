<template>
  <component
    :is="wrapperComponent"
    v-bind="wrapperProps"
    @click="handleClick"
  >
    <span class="inner-wrapper">
      <feather-icon icon="PlusIcon" />
      <span class="align-middle ml-50">Connect DOSI Vault</span>
    </span>
    <b-modal
      v-model="modalVisibility"
      centered
      size="md"
      title="Connect DOSI Vault"
      :hide-header-close="false"
      :hide-footer="true"
      modal-class="connect-dosi-vault-modal"
    >
      Download DOSI Vault browser extension for wallet connection.
      <a
        href="https://vault.dosi.world"
        target="_blank"
        rel="noopener noreferrer"
        @click="handleLinkClick"
      >
        <div class="w-100 h-100 p-3 mt-2 mb-2 bg-light d-flex flex-column align-items-center">
          <img src="/logos/dosi-vault.png">
          <span class="text-body mt-1">
            DOSI Vault browser extension
          </span>
        </div>
      </a>
    </b-modal>
  </component>
</template>

<script>
import {
  BCard, BModal, BDropdownItem, BButton,
} from 'bootstrap-vue'
import FeatherIcon from '@/@core/components/feather-icon/FeatherIcon.vue'
import mixin from './mixin'

export default {
  components: {
    BCard,
    BModal,
    BDropdownItem,
    BButton,
    FeatherIcon,
  },
  mixins: [mixin],
  props: {
    wrapperComponent: {
      type: String,
      default: 'span',
    },
    wrapperProps: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      modalVisibility: false,
    }
  },
  methods: {
    isDsvAvailable() {
      return !!(window.dosiVault && window.dosiVault.getOfflineSigner)
    },
    async handleClick() {
      if (!this.isDsvAvailable()) {
        this.modalVisibility = true
      } else {
        const accounts = await this.connectDosiVault()
        if (accounts) {
          this.$router.push({ name: 'accounts-import', params: { accounts } })
        }
      }
    },
    handleLinkClick() {
      this.modalVisibility = false
    },
  },
}
</script>

<style scoped>
.inner-wrapper {
  pointer-events: none;
}
</style>

<style lang="scss">
.connect-dosi-vault-modal {
  .modal-header {
    .modal-title {
      font-size: 24px;
    }
    .close {
      margin: 0;
    }
  }
}
</style>
