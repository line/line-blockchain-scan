<template>
  <b-table-simple
    v-if="typeof tablefield === 'object'"
    :small="small"
    striped
    stacked="sm"
    responsive="sm"
  >
    <b-tbody>
      <b-tr
        v-for="(value, name) in tablefield"
        :key="name"
      >
        <b-td
          style="text-transform: capitalize;"
        >
          {{ name }}
        </b-td>
        <b-td v-if="isTokenField(value)">
          {{ formatTokens( value ) }}
        </b-td>
        <b-td v-else-if="isArrayText(value)">
          {{ value.join(', ') }}
        </b-td>
        <b-td v-else-if="isHex(value)">
          {{ formatHexAddress(value) }}
        </b-td>
        <b-td v-else-if="Array.isArray(value)">
          <array-field-component :tablefield="value" />
        </b-td>
        <b-td v-else-if="value === null">
          {{ 'null' }}
        </b-td>
        <b-td
          v-else-if="typeof (value) ==='object'"
          hover
          class="overflow-hidden"
        >
          <b-table-simple
            :small="small"
            striped
            stacked="sm"
            responsive="sm"
            class="data-table"
          >
            <b-tbody>
              <b-tr
                v-for="key in Object.keys(value)"
                :key="key"
              >
                <b-td>{{ key }}</b-td>
                <b-td>
                  <array-field-component
                    v-if="Array.isArray(value[key])"
                    :tablefield="value[key]"
                  />
                  <object-field-component
                    v-else-if="typeof value[key] === 'object'"
                    :tablefield="value[key]"
                  />
                  <object-field-component
                    v-else-if="isObjectText(value[key])"
                    :tablefield="toObject(value[key])"
                  />
                  <span v-else>{{ value[key] }}</span>
                </b-td>
              </b-tr>
            </b-tbody>
          </b-table-simple>
        </b-td>
        <b-td v-else>
          {{ addNewLine(value) }}
        </b-td>
      </b-tr>
    </b-tbody>
  </b-table-simple>
</template>

<script>
import {
  BTableSimple, BTr, BTd, BTbody,
} from 'bootstrap-vue'
import {
  abbr, getStakingValidatorByHex, isHexAddress, isStringArray, isToken,
} from '@/libs/utils'
import { tokenFormatter } from '@/libs/formatter'
import ArrayFieldComponent from './ArrayFieldComponent.vue'

export default {
  name: 'ObjectFieldComponent',
  components: {
    BTableSimple,
    BTr,
    BTd,
    BTbody,
    ArrayFieldComponent,
  },
  props: {
    tablefield: {
      type: [Array, Object],
      default: () => {},
    },
    small: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    formatObject(value) {
      // console.log(value, typeof (value) === 'object', Object.keys(value))
      // if (typeof (value) === 'object' && Object.keys(value).length === 1) {
      //   console.log(value)
      //   return value[Object.keys(value)[0]]
      // }
      return value
    },
    isObjectText(v) {
      return String(v).startsWith('{') && String(v).endsWith('}')
    },
    toObject(v) {
      return JSON.parse(v)
    },
    formatText: v => abbr(v, 60),
    eval_value(value) {
      return Array.from(value)
    },
    isTokenField(value) {
      return isToken(value)
    },
    isHex(value) {
      return isHexAddress(value)
    },
    formatHexAddress(v) {
      return getStakingValidatorByHex(this.$http.config.chain_name, v)
    },
    isArrayText(value) {
      return isStringArray(value)
    },
    formatTokens(value) {
      return tokenFormatter(value)
    },
    addNewLine(value) {
      if (typeof value === 'string' && value.indexOf('\\n') > -1) {
        return value.replaceAll('\\n', '\n')
      }

      return value
    },
  },
}
</script>

<style lang='css' scoped>
@media (min-width: 768px) {
  td:first-child { width: 20% ;}
  .data-table td {
    padding-left: 0 !important;
  }
}

.table th, .table td {
  vertical-align: top;
  overflow-wrap: anywhere;
}

</style>
