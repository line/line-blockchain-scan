export default {
  methods: {
    async connectDosiVault() {
      const chainId = await this.$http.getLatestBlock().then(ret => ret.block.header.chain_id)
      await window.dosiVault.enable(chainId)
      const offlineSigner = window.dosiVault.getOfflineSigner(chainId)
      return offlineSigner.getAccounts()
    },
  },
}
