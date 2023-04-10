<template>
  <div>
    <b-row>
      <b-col>
        <b-form-group
          label="Sender"
          label-for="Account"
        >
          <b-input-group class="mb-25">
            <b-form-input
              :value="address"
              readonly
            />
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { operationalModal } from '@/@core/mixins/operational-modal'
import {
  BRow,
  BCol,
  BInputGroup,
  BFormInput,
  BFormGroup,
} from 'bootstrap-vue'
import { MsgWithdrawDelegatorReward, MsgWithdrawValidatorCommission } from 'cosmjs-types/cosmos/distribution/v1beta1/tx'

export default {
  name: 'WithdrawCommissionDialogue',
  components: {
    BRow,
    BCol,
    BInputGroup,
    BFormInput,
    BFormGroup,

  },
  mixins: [operationalModal],
  props: {
    address: {
      type: String,
      default: '',
    },
    validatorAddress: {
      type: String,
      default: '',
    },
  },
  data() {
    return {

    }
  },
  computed: {
    msg() {
      const rewardValue = {
        delegatorAddress: this.address,
        validatorAddress: this.validatorAddress,
      }
      const commissionValue = {
        validatorAddress: this.validatorAddress,
      }

      return [
        {
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          value: rewardValue,
          encodedValue: MsgWithdrawDelegatorReward.encode(rewardValue).finish(),
        },
        {
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
          value: commissionValue,
          encodedValue: MsgWithdrawValidatorCommission.encode(commissionValue).finish(),
        },
      ]
    },
  },
  mounted() {
    this.$emit('update', {
      modalTitle: 'Withdraw Validator Commission',
      historyName: 'withdraw',
    })
  },
  methods: {

  },
}
</script>
