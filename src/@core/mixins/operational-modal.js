export const operationalModal = {
  watch: {
    msg() {
      const bypass = this.isMaxWarningShowed
      this.$emit('msg-change', this.msg, bypass)
    },
  },
}

export const _ = null
