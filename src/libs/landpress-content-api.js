const landpress = require('../constants/landpress.json')

const phase = window.appConfig.PHASE
const landpressProject = landpress.project[phase]

export default class LandpressContentAPI {
  constructor() {
    this.endpoint = landpressProject.url
    this.clientApiKey = landpressProject['x-client-api-key']
    this.headers = {
      'Content-Type': 'text/plain',
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',

      // if there is no x-client-api-key,
      // don't include it in header in order to use Public Permission
      ...(this.clientApiKey && { 'x-client-api-key': this.clientApiKey }),
    }
  }

  async getItem(collection, itemId) {
    return fetch(`${this.endpoint}/collections/${collection}/items/${itemId}`, {
      method: 'GET',
      headers: this.headers,
    }).then(response => response.json())
  }

  async getSingleType(singleType) {
    return fetch(`${this.endpoint}/collections/${singleType}/item`, {
      method: 'GET',
      headers: this.headers,
    }).then(response => response.json())
  }
}
