import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import MailingModel from './classes/Mailing'

const mailingList = {}
let currentMailingLists = []

export default {
  getMailingLists (tenantId) {
    return new Promise((resolve, reject) => {
      webApi.sendRequest({
        moduleName: 'MtaConnector',
        methodName: 'GetMailingLists',
        parameters: {
          TenantId: tenantId,
          Type: 'MailingList',
          DomainId: 1
        },
      }).then(result => {
        if (_.isArray(result?.Items)) {
          const mailingLists = _.map(result.Items, function (data) {
            return new MailingModel(data)
          })
          const totalCount = typesUtils.pInt(result.Count)
          mailingList[tenantId] = {
            items: mailingLists,
            totalCount,
          }
          resolve({ mailingLists, totalCount, tenantId })
        } else {
          resolve({ mailingLists: [], totalCount: 0, tenantId })
        }
      }, response => {
        notification.showError(errors.getTextFromResponse(response))
        resolve({ mailingLists: [], totalCount: 0, tenantId })
      })
    })
  },
  getPagedMailingLists (tenantId, search, page, limit, domainId = -1) {
    const parameters = {
      TenantId: tenantId,
      Type: 'MailingList',
      Search: search,
      Offset: limit * (page - 1),
      Limit: limit,
    }
    if (domainId !== -1) {
      parameters.DomainId = domainId
    }
    return new Promise((resolve, reject) => {
      webApi.sendRequest({
        moduleName: 'MtaConnector',
        methodName: 'GetMailingLists',
        parameters
      }).then(result => {
        if (_.isArray(result?.Items)) {
          const mailingLists = _.map(result.Items, function (data) {
            return new MailingModel(data)
          })
          const totalCount = typesUtils.pInt(result.Count)
          currentMailingLists = mailingLists
          resolve({ mailingLists, totalCount, tenantId, search, page, limit })
        } else {
          resolve({ mailingLists: [], totalCount: 0, tenantId, search, page, limit })
        }
      }, response => {
        notification.showError(errors.getTextFromResponse(response))
        resolve({ mailingLists: [], totalCount: 0, tenantId, search, page, limit })
      })
    })
  },
}
