<template>
  <div>
    <b-row>
      <b-col>
        <b-form-group
          label="Delegator"
          label-for="Account"
        >
          <validation-provider
            #default="{ errors }"
            rules="required"
            name="Delegator"
          >
            <b-form-input
              v-model="address"
              readonly
            />
            <small class="text-danger">{{ errors[0] }}</small>
          </validation-provider>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group
          label="From Validator"
          label-for="validator"
        >
          <v-select
            :value="validatorAddress"
            :options="valOptions"
            :reduce="val => val.value"
            placeholder="Select a validator"
            :disabled="true"
          />
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group
          label="Current Delegation"
          label-for="Token"
        >
          <validation-provider
            #default="{ errors }"
            rules="required"
            name="Token"
          >
            <v-select
              v-model="token"
              :options="tokenOptions"
              :reduce="token => token.value"
            />
            <small class="text-danger">{{ errors[0] }}</small>
          </validation-provider>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group
          label="To Validator"
          label-for="validator"
        >
          <v-select
            v-model="toValidator"
            :options="valOptions"
            :reduce="val => val.value"
            placeholder="Select a validator"
            :selectable="(v) => v.value"
          />
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
                :state="errors.length > 0 ? false:null"
                placeholder="Input a number"
                type="number"
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
        </b-form-group>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { ValidationProvider } from 'vee-validate'
import {
  BRow, BCol, BInputGroup, BFormInput, BFormGroup,
  BInputGroupAppend,
} from 'bootstrap-vue'
import { MsgBeginRedelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx'
import {
  required, email, url, between, alpha, integer, password, min, digits, alphaDash, length,
} from '@validations'
import { getUnitAmount } from '@/libs/utils'
import { formatToken, formatTokenAmount, formatTokenDenom } from '@/libs/formatter'
import vSelect from 'vue-select'
import { operationalModal } from '@/@core/mixins/operational-modal'
import { votingPowerPolicy } from '@/@core/mixins/voting-power-policy'
import { HIDDEN_VALIDATOR_STATUSES } from '@/constants/validators'
import MaxClearButtonGroup from '../MaxClearButtonGroup.vue'

export default {
  name: 'Redelegate',
  components: {
    BRow,
    BCol,
    BInputGroup,
    BFormInput,
    BFormGroup,
    vSelect,
    BInputGroupAppend,
    ValidationProvider,
    MaxClearButtonGroup,
  },
  mixins: [operationalModal, votingPowerPolicy],
  props: {
    validatorAddress: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      selectedAddress: this.address,
      unbundValidators: [],
      validators: [],
      toValidator: null,
      token: '',
      amount: null,
      delegations: [],

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
    }
  },
  computed: {
    valOptions() {
      let options = []
      const vals = this.decoratedValidators
        .filter(x => !this.isOverVotingPower(x) && !HIDDEN_VALIDATOR_STATUSES.includes(x.status))
        .map(x => ({ value: x.operator_address, label: `${x.description.moniker} (${Number(x.commission.rate) * 100}%)` }))
      if (vals.length > 0) {
        options.push({ value: null, label: '=== ACTIVE VALIDATORS ===' })
        options = options.concat(vals)
      }

      // `this.unbundValidators` includes unbonded validators and is excluded 'Validator' of Redelegate pop-over in v1.2.1.2
      // const unbunded = this.unbundValidators.map(x => ({ value: x.operator_address, label: `* ${x.description.moniker} (${Number(x.commission.rate) * 100}%)` }))
      // if (unbunded.length > 0) {
      //   options.push({ value: null, label: '=== INACTIVE VALIDATORS ===', disabled: true })
      //   options = options.concat(unbunded)
      // }
      return options
    },
    tokenOptions() {
      if (!this.delegations) return []
      return this.delegations.filter(x => x.delegation.validator_address === this.validatorAddress).map(x => ({ value: x.balance.denom, label: formatToken(x.balance) }))
    },
    msg() {
      const value = {
        delegatorAddress: this.address,
        validatorSrcAddress: this.validatorAddress,
        validatorDstAddress: this.toValidator,
        amount: {
          amount: getUnitAmount(this.amount, this.token),
          denom: this.token,
        },
      }
      return [{
        typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
        value,
        encodedValue: MsgBeginRedelegate.encode(value).finish(),
      }]
    },
    // The amount used for MAX button
    maxAmountBeforeFeeInCoinMinimalDenom() {
      // find all the delegations of the current selected validatorAddress
      const delegations = this.delegations.filter(x => x.delegation.validator_address === this.validatorAddress)

      // in the delegations found, find the one that has denom matching with current chain
      // to get the amount
      const selectedDelegation = delegations.find(item => item.balance.denom === this.token)
      if (selectedDelegation) {
        return selectedDelegation.balance.amount
      }
      return 0
    },
  },
  mounted() {
    this.$emit('update', {
      modalTitle: 'Redelegate Token',
      historyName: 'redelegate',
    })
    this.loadData()
  },
  methods: {
    loadData() {
      this.$http.getValidatorList().then(v => {
        this.validators = v
      })
      this.$http.getValidatorUnbondedList().then(v => {
        this.unbundValidators = v
      })
      this.$http.getStakingDelegations(this.address).then(res => {
        this.delegations = res.delegation_responses
        this.delegations.forEach(x => {
          if (x.delegation.validator_address === this.validatorAddress) {
            this.token = x.balance.denom
            this.$emit('update', {
              feeDenom: x.balance.denom,
            })
          }
        })
      })
    },

    format(v) {
      return formatToken(v)
    },
    printDenom() {
      return formatTokenDenom(this.token)
    },
    clearAmount() {
      this.amount = null
    },
    maximizeAmount() {
      if (this.maxAmountBeforeFeeInCoinMinimalDenom) {
        // Due to specs, user can undelegate all the amount without deducting the fee.
        this.amount = formatTokenAmount(this.maxAmountBeforeFeeInCoinMinimalDenom, 6, this.token, false)
      }
    },
  },
}
</script>
<style lang="scss">
@import '@core/scss/vue/libs/vue-select.scss';
</style>

<style lang="scss" scoped>
#Amount {
  z-index: 1;
}
.input-group-text {
  position: relative;
}
</style>
