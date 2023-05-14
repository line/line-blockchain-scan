import BigNumber from 'bignumber.js'
import { StakingParameters } from '@/libs/utils'
import { numberWithCommas } from '@/libs/formatter'

const VOTING_POWER_LIMIT = 0.25 // https://wiki.linecorp.com/display/blockchain/LBS_v1.1.0_Policies

export const validators = {
  data() {
    return {
      stakingPool: 1,
      inflationRate: new BigNumber(0),
      foundationTax: new BigNumber(0),
      communityTax: new BigNumber(0),
      totalSupply: new BigNumber(0),
      stakingParameters: new StakingParameters(),
      validators: [],
    }
  },
  created() {
    this.$http.getValidatorList().then(res => {
      this.validators = res
    })
    this.$http.getStakingParameters().then(res => {
      this.stakingParameters = res
      this.$http.getBankTotal(res.bond_denom).then(total => { this.totalSupply = new BigNumber(total.amount) })
    })
    this.$http.getMintingInflation().then(res => { this.inflationRate = new BigNumber(res) })
    this.$http.getFoundationParams().then(res => { this.foundationTax = new BigNumber(res.params.foundation_tax) })
    this.$http.getDistributionParameters().then(res => { this.communityTax = new BigNumber(res.community_tax) })
    this.$http.getStakingPool().then(pool => {
      this.stakingPool = pool.bondedToken
    })
  },
  computed: {
    decoratedValidators() {
      return this.validators
        .filter(({ commission: { rate } }) => rate < 1)
        .map(validator => ({
          ...validator,
          votingPower: validator.tokens / this.stakingPool,
        }))
        .sort((validator1, validator2) => {
          if (new BigNumber(validator1.votingPower).gt(new BigNumber(validator2.votingPower))) {
            return 1
          }
          return -1
        })
    },
    bondedToken() {
      const bondedToken = this.decoratedValidators.reduce((result, validator) => result.plus(new BigNumber(validator.tokens)), new BigNumber(0))

      return bondedToken
    },
    commissionRate() {
      if (this.decoratedValidators.length < 1) return new BigNumber(0)

      const commissions = this.decoratedValidators
        .map(validator => new BigNumber(validator.commission.rate))
        .sort((commission1, commission2) => {
          if (commission1.gt(commission2)) {
            return 1
          }
          return -1
        })

      return commissions[0]
    },
    bondedRatio() {
      if (this.totalSupply.isZero()) {
        return new BigNumber(0)
      }
      return BigNumber(this.stakingPool).div(this.totalSupply)
    },
    apr() {
      if (this.bondedRatio.isZero()) {
        return new BigNumber(0)
      }

      return this.inflationRate
        .times(100)
        .times(new BigNumber(1).minus(this.foundationTax))
        .times(new BigNumber(1).minus(this.communityTax))
        .times(new BigNumber(1).minus(this.commissionRate))
        .div(this.bondedRatio)
    },
    aprPretty() {
      if (this.apr.gte(new BigNumber(200)) || this.apr.lte(new BigNumber(0))) {
        return 'In Progress'
      }

      return `~${numberWithCommas(this.apr.decimalPlaces(2).toString())}%`
    },
  },
  methods: {
    isOverVotingPower(votingPower) {
      return votingPower > VOTING_POWER_LIMIT
    },
  },
}

export const _ = null
