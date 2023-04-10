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
  BRow, BCol, BInputGroup, BFormInput, BFormGroup,
} from 'bootstrap-vue'
import { MsgWithdrawDelegatorReward } from 'cosmjs-types/cosmos/distribution/v1beta1/tx'

export default {
  name: 'WithdrawDialogue',
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
  },
  data() {
    return {
      account: [],
      balance: [],
      delegations: [],
      feeDenom: '',
    }
  },
  computed: {
    msg() {
      const txMsgs = []
      this.delegations.forEach(i => {
        const value = {
          delegatorAddress: this.address,
          validatorAddress: i.delegation.validator_address,
        }
        txMsgs.push({
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          value,
          encodedValue: MsgWithdrawDelegatorReward.encode(value).finish(),
        })
      })
      return txMsgs
    },
  },
  mounted() {
    this.$emit('update', {
      modalTitle: 'Withdraw Rewards',
      historyName: 'withdraw',
    })
    this.loadData()
  },

  methods: {
    loadData() {
      this.$http.getStakingDelegations(this.address).then(res => {
        this.delegations = res.delegation_responses
      })
    },
  },
}
</script>
