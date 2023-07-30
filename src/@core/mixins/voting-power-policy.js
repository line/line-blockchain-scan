import BigNumber from 'bignumber.js'
import {
  VALIDATORS_OWNED_BY_LINE_AFFILIATES,
  VALIDATORS_OWNED_BY_US_COMPANIES,
  VALIDATORS_FGM,
  VALIDATORS_FOUNDATION,
  HIDDEN_VALIDATOR_STATUSES,
} from '@/constants/validators'

// Previous business logic: https://wiki.linecorp.com/display/blockchain/LBS_v1.1.0_Policies
// Current business logic: https://wiki.linecorp.com/display/blockchain/LBS_v1.2.2_Overview
const VOTING_POWER_LIMIT_SINGLE = 0.3 // Hotfix v1.2.2.2: https://line-enterprise.slack.com/archives/C03PCPW8LTF/p1689303610170389?thread_ts=1689303323.833099&cid=C03PCPW8LTF
const VOTING_POWER_LIMIT_ALL_LINE_AFFILIATES = 0.45
const VOTING_POWER_LIMIT_ALL_US_COMPANIES = 0.18
const VOTING_POWER_LIMIT_SINGLE_US_COMPANY = 0.13

const phase = window.appConfig.PHASE

export const votingPowerPolicy = {
  created() {
    this.$http.getStakingPool().then(pool => {
      this.stakingPool = pool.bondedToken
    })
  },
  data() {
    return {
      stakingPool: 1,
      inflationRate: new BigNumber(0),
      foundationTax: new BigNumber(0),
      communityTax: new BigNumber(0),
      validators: [],
    }
  },
  computed: {
    decoratedValidators() {
      return this.validators
        // .filter(({ commission: { rate } }) => rate < 1) // unhide validators with 100% commission_rate in v1.2.2
        .filter(item => !HIDDEN_VALIDATOR_STATUSES.includes(item.status))
        .map(validator => ({
          ...validator,
          votingPower: validator.tokens / this.stakingPool,

          // individual ARR: https://wiki.linecorp.com/display/blockchain/LBS_v1.2.2_Overview
          arr: this.inflationRate
            .times(new BigNumber(1).minus(this.foundationTax))
            .times(new BigNumber(1).minus(this.communityTax))
            .times(new BigNumber(1).minus(validator.commission.rate))
            .div(this.bondedRatio),

          isLineAffiliate: this.isLineAffiliate(validator.operator_address),
          isUSCompany: this.isUSCompany(validator.operator_address),
          isFGM: this.isFGM(validator.operator_address),
          isFoundationValidator: this.isFoundationValidator(validator.description.moniker),
        }))
        .sort((a, b) => {
          // desc isLineAffiliate (... => 3 => 2 => 1 => false)
          if (a.isLineAffiliate < b.isLineAffiliate) return 1
          if (a.isLineAffiliate > b.isLineAffiliate) return -1

          // then desc isFGM (true => false)
          if (a.isFGM < b.isFGM) return 1
          if (a.isFGM > b.isFGM) return -1

          // then desc isFoundationValidator (true => false)
          if (a.isFoundationValidator < b.isFoundationValidator) return 1
          if (a.isFoundationValidator > b.isFoundationValidator) return -1

          // then desc arr (greater first)
          if (a.arr.lt(b.arr)) return 1
          if (a.arr.gt(b.arr)) return -1

          // then asc moniker (alphabetical)
          if (a.description.moniker > b.description.moniker) return 1
          if (a.description.moniker < b.description.moniker) return -1

          return 0
        })
    },
    totalVotingPowerOfLineAffiliates() {
      return this.decoratedValidators.reduce((prev, curr) => (curr.isLineAffiliate
        ? prev + curr.votingPower
        : prev), 0)
    },
    totalVotingPowerOfUSCompanies() {
      return this.decoratedValidators.reduce((prev, curr) => (curr.isUSCompany
        ? prev + curr.votingPower
        : prev), 0)
    },
  },
  methods: {
    isLineAffiliate(address) {
      if (VALIDATORS_OWNED_BY_LINE_AFFILIATES[phase].includes(address)) {
        // as there is the defined order between LINE affiliates,
        // here we return the index plus 1, not returning `true`
        return VALIDATORS_OWNED_BY_LINE_AFFILIATES[phase].indexOf(address) + 1 // add 1 to prevent returning 0
      }
      return false
    },
    isFGM(address) {
      return VALIDATORS_FGM[phase].includes(address)
    },
    isFoundationValidator(moniker) {
      return VALIDATORS_FOUNDATION[phase].includes(moniker)
    },
    isUSCompany(address) {
      return VALIDATORS_OWNED_BY_US_COMPANIES[phase].includes(address)
    },
    isOverVotingPower(validator) {
      return [
        // applied to all validators: Single validator's VP is 30% or more
        validator.votingPower >= VOTING_POWER_LIMIT_SINGLE,

        // applied to validators owned by LINE affiliates: Total VP of validators owned by LINE is 45% or more
        validator.isLineAffiliate
          && this.totalVotingPowerOfLineAffiliates >= VOTING_POWER_LIMIT_ALL_LINE_AFFILIATES,

        // applied to validators owned by US companies:
        validator.isUSCompany
          && [
            // Single validator's VP is 13% or more
            validator.votingPower >= VOTING_POWER_LIMIT_SINGLE_US_COMPANY,

            // Total VP of validators owned by US companies is 18% or more
            this.totalVotingPowerOfUSCompanies >= VOTING_POWER_LIMIT_ALL_US_COMPANIES,
          ].some(condition => Boolean(condition)),
      ].some(condition => Boolean(condition))
    },
  },
}

export const _ = null
