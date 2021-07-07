export default {
  moduleName: 'MtaConnectorWebclient',

  requiredModules: [],

  getPages () {
    return [
      {
        pageName: 'mailinglists',
        beforeUsers: true,
        pageTitle: 'MTACONNECTORWEBCLIENT.HEADING_MAILINGLISTS_SETTINGS_TABNAME',
        component () {
          return import('./pages/MailingLists')
        },
      }
    ]
  },
  getAdminUserTabs () {
    return [
      {
        tabName: 'mta-connector-aliases',
        title: 'MTACONNECTORWEBCLIENT.LABEL_SETTINGS_TAB_ALIASES',
        paths: [
          'id/:id/mta-connector-aliases',
          'search/:search/id/:id/mta-connector-aliases',
          'page/:page/id/:id/mta-connector-aliases',
          'search/:search/page/:page/id/:id/mta-connector-aliases',
        ],
        component () {
          return import('./components/AliasesAdminSettingsPerUser')
        },
      },
    ]
  },
}
