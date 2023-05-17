<template>
  <div>
    <b-row>
      <b-col>
        <b-form-group
          label="Sender"
          label-for="sender"
        >
          <b-input-group class="mb-25">

            <b-form-input
              name="sender"
              :value="address"
              readonly
            />
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group
          label="Recipient"
          label-for="Recipient"
        >
          <validation-provider
            #default="{ errors }"
            rules="required"
            name="recipient"
          >
            <b-input-group class="mb-25">
              <b-form-input
                id="Recipient"
                v-model="recipient"
                :state="errors.length > 0 ? false:null"
              />
            </b-input-group>
            <small class="text-danger">{{ errors[0] }}</small>
          </validation-provider>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group
          label="Available Token"
          label-for="Token"
        >
          <validation-provider
            #default="{ errors }"
            rules="required"
            name="Token"
          >
            <b-form-select
              v-model="token"
            >
              <b-form-select-option
                v-for="item in balanceOptions"
                :key="item.denom"
                :value="item.denom"
              >
                {{ format(item) }}
              </b-form-select-option>
            </b-form-select>
            <small class="text-danger">{{ errors[0] }}</small>
          </validation-provider>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group
          label="Amount"
          label-for="Amount"
        >
          <validation-provider
            v-slot="{ errors }"
            rules="required|regex:^([0-9\.]+)$"
            name="amount"
          >
            <b-input-group class="mb-25">
              <b-form-input
                id="Amount"
                v-model="amount"
                :state="errors.length > 0 ? false:null"
                placeholder="Input a number"
                type="number"
                @input="handleAmountInputChange"
              />
              <b-input-group-append is-text>
                <max-clear-button-group
                  @on-max-click="maximizeAmount"
                  @on-clear-click="clearAmount"
                />
                {{ printDenom() }}
              </b-input-group-append>
            </b-input-group>
            <small class="text-danger">{{ errors[0] }}</small>
          </validation-provider>
          <b-form-text
            v-if="isMaxWarningShowed"
          >
            <span class="text-warning">The amount of tokens in your wallet will be zero. No transaction requests can be made after that. Please decide carefully.</span>
          </b-form-text>
          <b-form-text>
            ≈ <strong class="text-primary">{{ currencySign }}{{ valuation }}</strong>
          </b-form-text>
        </b-form-group>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { ValidationProvider } from 'vee-validate'
import {
  BRow, BCol, BInputGroup, BInputGroupAppend, BFormInput, BFormGroup,
  BFormSelect, BFormSelectOption, BFormText,
} from 'bootstrap-vue'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import {
  required, email, url, between, alpha, integer, password, min, digits, alphaDash, length,
} from '@validations'
import {
  getUnitAmount, getUserCurrency, getUserCurrencySign,
} from '@/libs/utils'
import { formatToken, formatTokenAmount, formatTokenDenom } from '@/libs/formatter'
import { operationalModal } from '@/@core/mixins/operational-modal'
import MaxClearButtonGroup from '../MaxClearButtonGroup.vue'

export default {
  name: 'TransforDialogue',
  components: {
    BRow,
    BCol,
    BInputGroup,
    BInputGroupAppend,
    BFormInput,
    BFormText,
    BFormGroup,
    BFormSelect,
    BFormSelectOption,
    ValidationProvider,
    MaxClearButtonGroup,
  },
  mixins: [operationalModal],
  props: {
    address: {
      type: String,
      default: '',
    },
    balance: {
      type: Array,
      default: () => [],
    },
    feeWithTimestamp: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      currency: getUserCurrency(),
      currencySign: getUserCurrencySign(),
      token: '',
      amount: null,
      recipient: '',
      required,
      password,
      email,
      min,
      integer,
      url,
      alpha,
      between,
      digits,
      length,
      alphaDash,
      isSimulating: false,
      isMaxWarningShowed: false,
    }
  },
  computed: {
    msg() {
      const value = {
        fromAddress: this.address,
        toAddress: this.recipient,
        amount: [
          {
            amount: getUnitAmount(this.amount, this.token),
            denom: this.token,
          },
        ],
      }
      return [
        {
          typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          value,
          encodedValue: MsgSend.encode(value).finish(),
        },
      ]
    },
    balanceOptions() {
      return this.setupBalance()
    },
    IBCDenom() {
      return this.$store.state.chains.denoms
    },
    valuation() {
      const { amount } = this
      if (amount) {
        const d2 = this.printDenom()
        const quote = this.$store.state.chains.quotes[d2]
        const price = quote ? quote[this.currency] : 0
        return parseFloat((amount * price).toFixed(2))
      }
      return 0
    },
    maxAmountBeforeFeeInCoinMinimalDenom() {
      const selectedBalance = this.balance.find(item => item.denom === this.token)
      if (selectedBalance) {
        return selectedBalance.amount
      }
      return 0
    },
  },
  watch: {
    feeWithTimestamp(newVal) {
      const { fee } = newVal
      const feeInCoinMinimalDenom = getUnitAmount(fee, this.token)
      const maxAmountAfterFeeInCoinMinimalDenom = this.maxAmountBeforeFeeInCoinMinimalDenom - feeInCoinMinimalDenom
      if (this.isSimulating && !this.isMaxWarningShowed) {
        this.amount = formatTokenAmount(maxAmountAfterFeeInCoinMinimalDenom, 6, this.token)
        this.isSimulating = false
        this.isMaxWarningShowed = true
      }
      if (this.isMaxWarningShowed) {
        if (getUnitAmount(this.amount, this.token) > maxAmountAfterFeeInCoinMinimalDenom) {
          this.amount = formatTokenAmount(maxAmountAfterFeeInCoinMinimalDenom, 6, this.token)
        }
      }
    },
  },
  mounted() {
    this.$emit('update', {
      modalTitle: 'Transfer Tokens',
      historyName: 'send',
    })
  },

  methods: {
    setupBalance() {
      if (this.balance && this.balance.length > 0) {
        this.token = this.balance[0].denom
        return this.balance
      }
      if (this.$store) {
        this.token = this.$store.state.chains.selected.assets[0].base
      }
      return []
    },
    format(v) {
      return formatToken(v, this.IBCDenom, 6)
    },
    printDenom() {
      return formatTokenDenom(this.IBCDenom[this.token] || this.token)
    },
    clearAmount() {
      this.isMaxWarningShowed = false
      this.amount = null
    },
    // The amount used for MAX button
    maximizeAmount() {
      this.isSimulating = true
      if (this.maxAmountBeforeFeeInCoinMinimalDenom) {
        const value = {
          fromAddress: this.address,
          toAddress: this.recipient || this.address, // if recipient is not entered, simulate sending token to user themself
          amount: [
            {
              amount: this.maxAmountBeforeFeeInCoinMinimalDenom,
              denom: this.token,
            },
          ],
        }
        const msg = [
          {
            typeUrl: '/cosmos.bank.v1beta1.MsgSend',
            value,
            encodedValue: MsgSend.encode(value).finish(),
          },
        ]
        const bypass = true // bypass the form validation check because we need to simulate before filling the value
        this.$emit('msg-change', msg, bypass) // trigger msg-change to simulate the fee for the transaction
      }
    },
    handleAmountInputChange() {
      this.isMaxWarningShowed = false
    },
  },

}
</script>

<style lang="scss" scoped>
#Amount {
  z-index: 1;
}
.input-group-text {
  position: relative;
}
</style>
