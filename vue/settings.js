import typesUtils from 'src/utils/types'

class MtaConnectorSettings {
  constructor(appData) {
    const mtaData = typesUtils.pObject(appData.MtaConnector)
    this.userDefaultQuotaMB = typesUtils.pNonNegativeInt(mtaData.UserDefaultQuotaMB)
  }
}

let settings = null

export default {
  init (appData) {
    settings = new MtaConnectorSettings(appData)
  },

  getUserDefaultQuotaMB () {
    return settings.userDefaultQuotaMB
  },
}
