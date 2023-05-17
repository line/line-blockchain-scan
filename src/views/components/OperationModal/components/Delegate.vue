<template>
  <div>
    <b-row>
      <b-col>
        <b-form-group
          label="Delegator"
          label-for="Delegator"
        >
          <validation-provider
            #default="{ errors }"
            rules="required"
            name="Delegator"
          >
            <b-form-input
              v-model="selectedAddress"
              readonly
            />
            <small class="text-danger">{{ errors[0] }}</small>
          </validation-provider>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <validation-provider
          #default="{ errors }"
          rules="required"
          name="Validator"
        >
          <b-form-group
            label="Validator"
            label-for="validator"
          >
            <v-select
              v-model="selectedValidator"
              :options="valOptions"
              :reduce="val => val.value"
              placeholder="Select a validator"
              :readonly="validatorAddress"
              :selectable="(v) => v.value"
            />
          </b-form-group>
          <small class="text-danger">{{ errors[0] }}</small>
        </validation-provider>
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
              text-field="label"
            >
              <b-form-select-option
                v-for="x in balanceOptions"
                :key="x.denom"
                :value="x.denom"
              >
                {{ format(x) }}
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
            <b-input-group>
              <b-form-input
                id="Amount"
                v-model="amount"
                :state="errors.length > 0 ? false : null"
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
        </b-form-group>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { ValidationProvider } from 'vee-validate'
import {
  BRow, BCol, BInputGroup, BFormInput, BFormGroup, BFormSelect, BFormSelectOption,
  BFormText, BInputGroupAppend,
} from 'bootstrap-vue'
import { MsgDelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx'
import {
  required, email, url, between, alpha, integer, password, min, digits, alphaDash, length,
} from '@validations'
import { getUnitAmount } from '@/libs/utils'
import { formatToken, formatTokenAmount, formatTokenDenom } from '@/libs/formatter'
import vSelect from 'vue-select'
import { operationalModal } from '@/@core/mixins/operational-modal'
import { validators } from '@/@core/mixins/validators'
import MaxClearButtonGroup from '../MaxClearButtonGroup.vue'

export default {
  components: {
    BRow,
    BCol,
    BInputGroup,
    BFormInput,
    BFormGroup,
    BFormSelect,
    BFormSelectOption,
    BFormText,
    vSelect,
    BInputGroupAppend,
    ValidationProvider,
    MaxClearButtonGroup,
  },
  mixins: [operationalModal, validators],
  props: {
    validatorAddress: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
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
      selectedAddress: this.address,
      availableAddress: [],
      validators: [],
      unbundValidators: [],
      selectedValidator: this.validatorAddress,
      token: '',
      amount: null,
      selectedChain: '',
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
    valOptions() {
      let options = []
      const vals = this.decoratedValidators
        .filter(x => !this.isOverVotingPower(x.votingPower))
        .map(x => ({ value: x.operator_address, label: `${x.description.moniker} (${Number(x.commission.rate) * 100}%)` }))
      if (vals.length > 0) {
        options.push({ value: null, label: '=== ACTIVE VALIDATORS ===' })
        options = options.concat(vals)
      }
      const unbunded = this.unbundValidators.map(x => ({ value: x.operator_address, label: `* ${x.description.moniker} (${Number(x.commission.rate) * 100}%)` }))
      if (unbunded.length > 0) {
        options.push({ value: null, label: '=== INACTIVE VALIDATORS ===', disabled: true })
        options = options.concat(unbunded)
      }
      return options
    },
    balanceOptions() {
      return this.setupBalance()
    },
    msg() {
      const value = {
        delegatorAddress: this.selectedAddress,
        validatorAddress: this.selectedValidator,
        amount: {
          amount: getUnitAmount(this.amount, this.token),
          denom: this.token,
        },
      }

      return [{
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value,
        encodedValue: MsgDelegate.encode(value).finish(),
      }]
    },
    IBCDenom() {
      return this.$store.state.chains.denoms
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
    decoratedValidators() {
      if (!this.decoratedValidators || this.decoratedValidators.length < 1 || !!this.selectedValidator) {
        return
      }
      this.selectedValidator = this.decoratedValidators[0].operator_address
    },
    feeWithTimestamp(newVal) {
      const { fee } = newVal
      const feeInCoinMinimalDenom = getUnitAmount(fee, this.token)
      const maxAmountAfterFeeInCoinMinimalDenom = this.maxAmountBeforeFeeInCoinMinimalDenom - feeInCoinMinimalDenom
      if (this.isSimulating) {
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
      modalTitle: 'Delegate Token',
      historyName: 'delegate',
    })
    this.loadData()
  },
  methods: {
    loadData() {
      this.$http.getValidatorUnbondedList().then(v => {
        this.unbundValidators = v
      })
    },
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
    printDenom() {
      return formatTokenDenom(this.token)
    },
    format(v) {
      return formatToken(v, this.IBCDenom, 6)
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
          delegatorAddress: this.selectedAddress,
          validatorAddress: this.selectedValidator,
          amount: {
            amount: this.maxAmountBeforeFeeInCoinMinimalDenom,
            denom: this.token,
          },
        }
        const msg = [{
          typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
          value,
          encodedValue: MsgDelegate.encode(value).finish(),
        }]
        const bypass = true // bypass the form validation check because we need to simulate before filling the value
        this.$emit('msg-change', msg, bypass)
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
