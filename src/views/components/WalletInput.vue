<template>
  <b-form-group
    label="Wallet"
    label-for="wallet"
  >
    <validation-provider
      v-slot="{ errors }"
      rules="required"
      name="wallet"
    >
      <b-form-radio-group
        v-model="content"
        stacked
        @input="handleInput()"
      >
        <b-form-radio
          name="wallet"
          value="dosiVault"
          class="d-none d-md-block"
        >
          DOSI Vault
        </b-form-radio>
      </b-form-radio-group>
      <small class="text-danger">{{ errors[0] }}</small>
    </validation-provider>
  </b-form-group>
</template>

<script>
import { ValidationProvider } from 'vee-validate'
import {
  BFormRadioGroup, BFormRadio, BFormGroup,
} from 'bootstrap-vue'
import { getLocalAccounts } from '@/libs/local'

export default {
  name: 'WalletInput',
  components: {
    BFormRadioGroup,
    BFormRadio,
    BFormGroup,
    ValidationProvider,
  },
  props: {
    value: {
      type: String,
      default: 'dosiVault',
    },
  },
  data() {
    return {
      content: this.value,
    }
  },
  methods: {
    handleInput() {
      this.$emit('input', this.content)
      const accounts = getLocalAccounts()
      const wallet = accounts[this.$store.state.chains.defaultWallet]
      if (wallet) {
        wallet.device = this.content
        localStorage.setItem('accounts', JSON.stringify(accounts)) // update signer device
      }
    },
  },
}
</script>
