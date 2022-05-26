import enums from 'src/enums'

import settings from './settings'

import AliasesAdminSettingsPerUser from './components/AliasesAdminSettingsPerUser'
import EditMailingList from './components/EditMailingList'
import Empty from 'src/components/Empty'

export default {
  moduleName: 'MtaConnectorWebclient',

  requiredModules: ['MtaConnector', 'MailDomains'],

  init (appData) {
    settings.init(appData)
  },

  getPages () {
    const UserRoles = enums.getUserRoles()
    return [
      {
        pageName: 'mailinglists',
        pagePath: '/mailinglists',
        pageComponent: () => import('./pages/MailingLists'),
        pageChildren: [
          { path: 'id/:id', component: EditMailingList },
          { path: 'create', component: EditMailingList },
          { path: 'search/:search', component: Empty },
          { path: 'search/:search/id/:id', component: EditMailingList },
          { path: 'page/:page', component: Empty },
          { path: 'page/:page/id/:id', component: EditMailingList },
          { path: 'search/:search/page/:page', component: Empty },
          { path: 'search/:search/page/:page/id/:id', component: EditMailingList },
        ],
        pageUserRole: UserRoles.SuperAdmin,
        pageTitle: 'MTACONNECTORWEBCLIENT.HEADING_MAILINGLISTS_SETTINGS_TABNAME',
      }
    ]
  },

  getAdminUserTabs () {
    return [
      {
        tabName: 'aliases',
        tabTitle: 'MTACONNECTORWEBCLIENT.LABEL_SETTINGS_TAB_ALIASES',
        tabRouteChildren: [
          { path: 'id/:id/aliases', component: AliasesAdminSettingsPerUser },
          { path: 'search/:search/id/:id/aliases', component: AliasesAdminSettingsPerUser },
          { path: 'page/:page/id/:id/aliases', component: AliasesAdminSettingsPerUser },
          { path: 'search/:search/page/:page/id/:id/aliases', component: AliasesAdminSettingsPerUser },
        ],
      },
    ]
  },

  getUserMainDataComponent () {
    return import('./components/EditUserMainData')
  },
}
