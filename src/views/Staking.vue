<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <b-card
      v-if="pingVals && pingVals.length > 0"
      title="❤️ Helping Ping.pub By Staking ❤️"
    >
      <b-table
        :items="pingVals"
        :fields="validator_fields"
        :sort-desc="true"
        sort-by="tokens"
        striped
        hover
        responsive="sm"
      >
        <!-- A virtual column -->
        <template #cell(index)="data">
          {{ data.index + 1 }}
        </template>
        <!-- Column: Validator -->
        <template #cell(description)="data">
          <b-media
            vertical-align="center"
            class="text-truncate"
            style="max-width:320px;"
          >
            <template #aside>
              <b-avatar
                v-if="data.item.avatar"
                v-b-tooltip.hover.v-primary
                v-b-tooltip.hover.right="data.item.description.details"
                size="32"
                variant="light-primary"
                :src="data.item.avatar"
              />
              <b-avatar
                v-if="!data.item.avatar"
                v-b-tooltip.hover.v-primary
                v-b-tooltip.hover.right="data.item.description.details"
              >
                <feather-icon icon="ServerIcon" />
              </b-avatar>
            </template>
            <span class="font-weight-bolder d-block text-nowrap">
              <router-link
                :to="`./staking/${data.item.operator_address}`"
              >
                {{ data.item.description.moniker }}
              </router-link>
            </span>
            <small
              class="text-muted"
            >{{ data.item.description.website || data.item.description.identity }}</small>
          </b-media>
        </template>
        <!-- Token -->
        <template #cell(tokens)="data">
          <div
            v-if="data.item.tokens > 0"
            class="d-flex flex-column"
          >
            <span class="font-weight-bold mb-0">{{ tokenFormatter(data.item.tokens, stakingParameters.bond_denom) }}</span>
            <span class="font-small-2 text-muted text-nowrap d-none d-lg-block">{{ percent(data.item.votingPower) }}%</span>
          </div>
          <span v-else>{{ data.item.delegator_shares }}</span>
        </template>
        <!-- Token -->
        <template #cell(changes)="data">
          <small
            v-if="data.item.changes>0"
            class="text-success"
          >+{{ data.item.changes }}</small>
          <small v-else-if="data.item.changes===0">-</small>
          <small
            v-else
            class="text-danger"
          >{{ data.item.changes }}</small>
        </template>
        <template #cell(operation)="data">
          <b-button
            v-b-modal.operation-modal
            :name="data.item.operator_address"
            variant="primary"
            size="sm"
            @click="selectValidator(data.item.operator_address)"
          >
            Delegate
          </b-button>
        </template>
      </b-table>
    </b-card>
    <b-card
      no-body
    >
      <b-card-header class="d-flex justify-content-between">
        <b-media
          no-body
          class="d-flex media-arr"
        >
          <div class="d-flex">
            <b-media-aside
              class="mr-2"
            >
              <b-avatar
                size="48"
                variant="light-primary"
              >
                <feather-icon
                  size="24"
                  icon="TrendingUpIcon"
                />
              </b-avatar>
            </b-media-aside>
            <b-media-body class="my-auto">
              <b-card-text class="font-small-3 mb-0 text-capitalize">
                Annual Reward Rate (ARR)
                <span
                  v-b-tooltip.hover.top="'This value is provided for reference only and might not guarantee your actual ARR.'"
                  class="circle-icon"
                />
              </b-card-text>
              <h4 class="font-weight-bolder mb-0 text-primary">
                {{ aprPretty }}
              </h4>
            </b-media-body>
          </div>
          <div class="vr border-left border-light ml-3 mr-3" />
          <div
            class="my-auto inner-html-1"
            v-html="arrGuideHtml"
          />
        </b-media>
      </b-card-header>
      <b-card-body class="pl-0 pr-0 pb-0">
        <b-table
          class="mb-0"
          :items="list"
          :fields="validator_fields"
          :sort-desc="true"
          sort-by="tokens"
          striped
          hover
          responsive="sm"
        >
          <!-- A virtual column -->
          <template #cell(index)="data">
            <b-badge :variant="rankBadge(data)">
              {{ data.index + 1 }}
            </b-badge>
          </template>
          <!-- Column: Validator -->
          <template #cell(description)="data">
            <b-media
              vertical-align="center"
              class="text-truncate"
              style="max-width:320px;"
            >
              <template #aside>
                <b-avatar
                  v-if="data.item.avatar"
                  v-b-tooltip.hover.v-primary
                  v-b-tooltip.hover.right="data.item.description.details"
                  size="32"
                  variant="light-primary"
                  :src="data.item.avatar"
                />
                <b-avatar
                  v-if="!data.item.avatar"
                  v-b-tooltip.hover.v-primary
                  v-b-tooltip.hover.right="data.item.description.details"
                >
                  <feather-icon icon="ServerIcon" />
                </b-avatar>
              </template>
              <span class="font-weight-bolder d-block text-nowrap">
                <router-link
                  :to="`./staking/${data.item.operator_address}`"
                >
                  {{ data.item.description.moniker }}
                </router-link>
              </span>
              <small
                class="text-muted"
              >{{ data.item.description.website || data.item.description.identity }}</small>
            </b-media>
          </template>
          <!-- Token -->
          <template #cell(tokens)="data">
            <div
              v-if="data.item.tokens > 0"
              class="d-flex flex-column"
            >
              <span class="font-weight-bold mb-0">{{ tokenFormatter(data.item.tokens, stakingParameters.bond_denom) }}</span>
              <span class="font-small-2 text-muted text-nowrap d-none d-lg-block">{{ percent(data.item.votingPower) }}%</span>
            </div>
            <span v-else>{{ data.item.delegator_shares }}</span>
          </template>
          <!-- Token -->
          <template #cell(changes)="data">
            <small
              v-if="data.item.changes>0"
              class="text-success"
            >+{{ data.item.changes }}</small>
            <small v-else-if="data.item.changes===0">-</small>
            <small
              v-else
              class="text-danger"
            >{{ data.item.changes }}</small>
          </template>
          <template #cell(operation)="data">
            <span
              v-b-tooltip.top.html="isOverVotingPower(data.item.votingPower) ? 'Temporarily unavailable <br>(Voting Power exceeds 25%)' : ''"
              class="d-inline-block"
              tabindex="0"
            >
              <b-button
                v-b-modal.operation-modal
                :name="data.item.operator_address"
                variant="primary"
                size="sm"
                :disabled="isOverVotingPower(data.item.votingPower)"
                @click="selectValidator(data.item.operator_address)"
              >
                Delegate
              </b-button>
            </span>
          </template>
        </b-table>
      </b-card-body>
      <template #footer>
        <small class="d-none d-md-block">
          <b-badge variant="danger">
              &nbsp;
          </b-badge>
          Top 33%
          <b-badge variant="warning">
              &nbsp;
          </b-badge>
          Top 67% of Voting Power
        </small>
      </template>
    </b-card>
    <div class="card">
      <div class="card-header">
        <h4
          class="card-title"
          v-html="importantNoticeTitle"
        />
      </div>
      <div
        class="card-body inner-html-2"
        v-html="importantNoticeHtml"
      />
    </div>
    * Your use of this website and service is entirely at your own risk. By continuing to access or use the webiste or any service provided herein, you confirm your agreement to these
    <router-link to="/tos_staking">
      terms.
    </router-link>
    <operation-modal
      type="Delegate"
      :validator-address="validator_address"
    />
    <div id="txevent" />
  </div>
</template>

<script>
import {
  BTable, BMedia, BMediaAside, BMediaBody, BAvatar, BBadge, BCard, BCardText, BCardHeader, VBTooltip, BCardBody, BButton,
} from 'bootstrap-vue'
import { sanitize } from 'dompurify'
import { validators } from '@/@core/mixins/validators'
import { percent } from '@/libs/utils'
import { formatToken } from '@/libs/formatter'
import { keybase } from '@/libs/fetch'
import OperationModal from '@/views/components/OperationModal/index.vue'
import landpress from '../constants/landpress.json'
// import { toHex } from '@cosmjs/encoding'
// import fetch from 'node-fetch'

const phase = window.appConfig.PHASE
const landpressProject = landpress.project[phase]

// Landpress single type
const arrGuideST = landpressProject.single_type.staking_arr_guide
const importantNoticeST = landpressProject.single_type.staking_important_notice

export default {
  components: {
    BCard,
    BTable,
    BMedia,
    BMediaAside,
    BMediaBody,
    BAvatar,
    BBadge,
    BCardText,
    BCardHeader,
    BCardBody,
    BButton,
    OperationModal,
  },
  directives: {
    'b-tooltip': VBTooltip,
  },
  mixins: [validators],
  data() {
    return {
      islive: true,
      validator_address: null,
      delegations: [],
      changes: {},
      latestPower: {},
      previousPower: {},
      validator_fields: [
        {
          key: 'index',
          label: '#',
          tdClass: 'd-none d-md-block',
          thClass: 'd-none d-md-block',
        },
        { key: 'description', label: 'Validator' },
        {
          key: 'tokens',
          label: 'Voting Power',
          sortable: true,
          tdClass: 'text-right',
          thClass: 'text-right',
          sortByFormatted: true,
        },
        {
          key: 'changes',
          label: '24H Changes',
        },
        {
          key: 'commission',
          formatter: value => `${percent(value.rate)}%`,
          tdClass: 'text-right',
          thClass: 'text-right',
        },
        {
          key: 'operation',
          label: '',
          tdClass: 'text-right',
          thClass: 'text-right',
        },
      ],
      statusOptions: [],
      selectedStatus: 'active',
      isInactiveLoaded: false,
      inactiveValidators: [],
      arrGuideHtml: '',
      importantNoticeTitle: '',
      importantNoticeHtml: '',
    }
  },
  computed: {
    pingVals() {
      return this.list.filter(x => x.description.identity === '6783E9F948541962')
    },
    list() {
      const tab = this.selectedStatus === 'active' ? this.decoratedValidators : this.inactiveValidators
      return tab.map(x => {
        const xh = x
        if (Object.keys(this.latestPower).length > 0 && Object.keys(this.previousPower).length > 0) {
          const latest = this.latestPower[x.consensus_pubkey.key] || 0
          const previous = this.previousPower[x.consensus_pubkey.key] || 0
          xh.changes = latest - previous
        }
        return xh
      })
    },
  },
  created() {
    // set
    this.initial()
  },
  beforeDestroy() {
    this.islive = false
  },
  mounted() {
    const elem = document.getElementById('txevent')
    elem.addEventListener('txcompleted', () => {
      this.initial()
    })
  },
  methods: {
    initial() {
      this.$landpress.getSingleType(arrGuideST).then(data => {
        this.arrGuideHtml = sanitize(data.body.content) // sanitize to prevent XSS
      })
      this.$landpress.getSingleType(importantNoticeST).then(data => {
        this.importantNoticeTitle = sanitize(data.body.title) // sanitize to prevent XSS
        this.importantNoticeHtml = sanitize(data.body.content) // sanitize to prevent XSS
      })
      this.$http.getValidatorList().then(res => {
        const identities = []
        const temp = res
        for (let i = 0; i < temp.length; i += 1) {
          const { identity } = temp[i].description
          const url = this.$store.getters['chains/getAvatarById'](identity)
          if (url) {
            temp[i].avatar = url
          } else if (identity && identity !== '') {
            identities.push(identity)
          }
        }

        // fetch avatar from keybase
        let promise = Promise.resolve()
        identities.forEach(item => {
          promise = promise.then(() => new Promise(resolve => {
            this.avatar(item, resolve)
          }))
        })
        this.validators = temp
        this.getPreviousPower(this.validators.length)
      })
    },
    getPreviousPower(length) {
      this.$http.getValidatorListByHeight('latest', 0).then(data => {
        let height = Number(data.block_height)
        if (height > 14400) {
          height -= 14400
        } else {
          height = 1
        }
        data.validators.forEach(x => {
          this.$set(this.latestPower, x.pub_key.key, Number(x.voting_power))
        })
        for (let offset = 100; offset < length; offset += 100) {
          this.$http.getValidatorListByHeight('latest', offset).then(latest => {
            latest.validators.forEach(x => {
              this.$set(this.latestPower, x.pub_key.key, Number(x.voting_power))
            })
          })
        }
        for (let offset = 0; offset < length; offset += 100) {
          this.$http.getValidatorListByHeight(height, offset).then(previous => {
            previous.validators.forEach(x => {
              this.$set(this.previousPower, x.pub_key.key, Number(x.voting_power))
            })
          })
        }
      })
    },
    getValidatorListByStatus() {
      if (this.isInactiveLoaded) return
      const statusList = ['BOND_STATUS_UNBONDED', 'BOND_STATUS_UNBONDING']
      statusList.forEach(status => {
        this.$http.getValidatorListByStatus(status).then(res => {
          const identities = []
          const temp = res
          for (let i = 0; i < temp.length; i += 1) {
            const { identity } = temp[i].description
            const url = this.$store.getters['chains/getAvatarById'](identity)
            if (url) {
              temp[i].avatar = url
            } else if (identity && identity !== '') {
              identities.push(identity)
            }
          }

          // fetch avatar from keybase
          let promise = Promise.resolve()
          identities.forEach(item => {
            promise = promise.then(() => new Promise(resolve => {
              this.avatar(item, resolve)
            }))
          })
          this.inactiveValidators = this.inactiveValidators.concat(res)
        })
      })
      this.isInactiveLoaded = true
    },
    selectValidator(da) {
      this.validator_address = da
    },
    percent,
    tokenFormatter(amount, denom) {
      return formatToken({ amount, denom }, {}, 0)
    },
    rankBadge(data) {
      if (this.selectedStatus === 'inactive') return 'primary'
      const { index, item } = data
      if (index === 0) {
        window.sum = item.tokens
      } else {
        window.sum += item.tokens
      }
      const rank = window.sum / this.stakingPool
      if (rank < 0.333) {
        return 'danger'
      }
      if (rank < 0.67) {
        return 'warning'
      }
      return 'primary'
    },
    avatar(identity, resolve) {
      if (this.islive) {
        keybase(identity).then(d => {
          resolve()
          if (Array.isArray(d.them) && d.them.length > 0) {
            const pic = d.them[0].pictures
            if (pic) {
              const list = this.selectedStatus === 'active' ? this.decoratedValidators : this.inactiveValidators
              const validator = list.find(u => u.description.identity === identity)
              this.$set(validator, 'avatar', pic.primary.url)
              this.$store.commit('cacheAvatar', { identity, url: pic.primary.url })
            }
          }
        })
      }
    },
  },
}
</script>

<style lang="scss">
@import '@core/scss/base/bootstrap-extended/_include'; // Bootstrap includes
@include media-breakpoint-down(xs) {
  .media-arr {
    flex-direction: column;

    .vr {
      visibility: hidden;
    }
  }

}

@include media-breakpoint-up(sm) {
  .media-arr, .media-arr .media-aside {
    align-items: center !important;
  }
}

.inner-html-1 p {
  font-size: 0.9rem !important;
  margin-bottom: 0 !important;
}
</style>

<style scoped>
.circle-icon {
  margin-bottom: -2px;
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  border: 1px solid;
  position: relative;
}
.circle-icon::before {
  content: "?";
  font-size: 0.6rem;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.vr {
  height: 50px;
  width: 1px
}
</style>
