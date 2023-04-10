<template>
  <div>
    <form-wizard
      color="#2d2ca0"
      :title="null"
      :subtitle="null"
      shape="square"
      finish-button-text="Save"
      class="steps-transparent mb-3 md"
      @on-complete="formSubmitted"
    >
      <!-- address  -->
      <tab-content
        title="Accounts"
        :before-change="validationFormAddress"
      >
        <validation-observer
          ref="accountRules"
          tag="form"
        >
          <b-row>
            <b-col md="12">
              <b-form-group
                label="Account Name"
                label-for="account_name"
              >
                <validation-provider
                  #default="{ errors }"
                  name="Account Name"
                  rules="required"
                >
                  <b-form-input
                    id="account_name"
                    v-model="name"
                    :state="errors.length > 0 ? false:null"
                    placeholder="Enter an account name"
                  />
                  <small class="text-danger">{{ errors[0] }}</small>
                </validation-provider>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col
              v-for="i in addresses"
              :key="i.addr"
              cols="12"
            >
              <b-input-group class="mb-25">
                <b-input-group-prepend is-text>
                  <b-avatar
                    :src="i.logo"
                    size="18"
                    variant="light-primary"
                    rounded
                  />
                </b-input-group-prepend>
                <b-form-input
                  readonly
                  :value="i.addr"
                />
              </b-input-group>
            </b-col>
          </b-row>
        </validation-observer>
      </tab-content>
    </form-wizard>
  </div>
</template>

<script>
import { FormWizard, TabContent } from 'vue-form-wizard'
import { ValidationProvider, ValidationObserver } from 'vee-validate'
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'
// import 'vue-form-wizard/dist/vue-form-wizard.min.css'
import 'vue-form-wizard/dist/vue-form-wizard.min.css'
import {
  BRow,
  BCol,
  BFormGroup,
  BFormInput,
  BAvatar,
  BInputGroup,
  BInputGroupPrepend,
} from 'bootstrap-vue'
import { required } from '@validations'
import store from '@/store'
import {
  addressDecode, addressEnCode,
} from '@/libs/utils'
import { getLocalAccounts } from '@/libs/local'
import connectDosiVaultMixin from './components/ConnectDosiVault/mixin'

export default {
  components: {
    ValidationProvider,
    ValidationObserver,
    FormWizard,
    TabContent,
    BAvatar,
    BRow,
    BCol,
    BFormGroup,
    BFormInput,
    BInputGroup,
    BInputGroupPrepend,
    // eslint-disable-next-line vue/no-unused-components
    ToastificationContent,
  },
  mixins: [connectDosiVaultMixin],
  data() {
    return {
      debug: '',
      dosiVaultError: false,
      device: 'dosiVault',
      address: '',
      name: '',
      originalName: '',
      required,
      selected: [],
      accounts: null,
      exludes: [], // HD Path is NOT supported,
      edit: false,
    }
  },
  computed: {
    chains() {
      const config = JSON.parse(localStorage.getItem('chains'))
      this.exludes.forEach(x => {
        delete config[x]
      })
      return config
    },
    addresses() {
      if (this.accounts && this.accounts.address) {
        const { data } = addressDecode(this.accounts.address)
        return this.selected.map(x => {
          if (this.chains[x]) {
            const { logo, addr_prefix } = this.chains[x]
            const addr = addressEnCode(addr_prefix, data)
            return {
              chain: x, addr, logo,
            }
          }
          return null
        }).filter(x => x != null)
      }
      return []
    },
  },
  async mounted() {
    const { selected } = store.state.chains
    if (selected && selected.chain_name && !this.exludes.includes(selected.chain_name)) {
      this.selected.push(selected.chain_name)
    }
    const name = new URLSearchParams(window.location.search).get('name')
    const wallets = getLocalAccounts()
    if (name && wallets && wallets[name]) {
      const wallet = wallets[name]
      this.device = wallet.device
      this.originalName = wallet.name
      this.name = wallet.name
      this.edit = true
      if (wallet.address) {
        wallet.address.forEach(a => {
          if (!this.selected.includes(a.chain)) {
            this.selected.push(a.chain)
          }
        })
        this.address = wallet.address[0].addr
        this.localAddress()
      }
    } else {
      const accounts = this.$router.params?.accounts ?? await this.connectDosiVault()
      // eslint-disable-next-line prefer-destructuring
      this.accounts = accounts[0]
    }
  },
  methods: {
    localAddress() {
      if (!this.address) return false
      try {
        const { data } = addressDecode(this.address)
        if (data) {
          this.accounts = {
            address: this.address,
            pubkey: data,
          }
          return true
        }
      } catch (e) { this.debug = e }
      return false
    },
    formSubmitted() {
      const string = localStorage.getItem('accounts')
      const accounts = string ? JSON.parse(string) : {}

      accounts[this.name] = {
        name: this.name,
        device: this.device,
        address: this.addresses,
      }

      if (this.edit === true) {
        if (accounts[this.originalName]) {
          delete accounts[this.originalName]
        }
      }

      localStorage.setItem('accounts', JSON.stringify(accounts))
      if (!this.$store.state.chains.defaultWallet || this.$store.state.chains.defaultWallet === this.originalName) {
        this.$store.commit('setDefaultWallet', this.name)
      }

      this.$toast({
        component: ToastificationContent,
        props: {
          title: 'Address Saved!',
          icon: 'EditIcon',
          variant: 'success',
        },
      })

      this.$router.push('./accounts')
    },
    validationFormAddress() {
      return new Promise((resolve, reject) => {
        this.$refs.accountRules.validate().then(success => {
          if (success) {
            resolve(true)
          } else {
            reject()
          }
        })
      })
    },
  },
}
</script>

<style lang="scss">
  // @import '@core/assets/fonts/feather/iconfont.css';
  @import '@core/scss/vue/libs/vue-wizard.scss';

  .wizard-nav-pills {
    display: none !important;
  }
</style>
