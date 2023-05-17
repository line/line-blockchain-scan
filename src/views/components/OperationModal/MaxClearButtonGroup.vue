<template>
  <div style="position: absolute; left: -105px; z-index: 3">
    <b-badge
      variant="success"
      style="cursor: pointer; margin-right: 4px"
      @click="onMaxClick"
    >
      MAX
    </b-badge>
    <b-badge
      variant="danger"
      style="cursor: pointer;"
      @click="onClearClick"
    >
      CLEAR
    </b-badge>
  </div>
</template>

<script>
import { BBadge } from 'bootstrap-vue'

export default {
  name: 'MaxClearButtonGroup',
  components: {
    BBadge,
  },
  methods: {
    onMaxClick() {
      this.$emit('on-max-click')
    },
    onClearClick() {
      this.$emit('on-clear-click')
    },
  },
}
</script>
