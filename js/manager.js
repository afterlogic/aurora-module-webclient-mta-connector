'use strict';

module.exports = function (oAppData) {
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
				
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),

		Cache = require('modules/%ModuleName%/js/Cache.js'),
		Settings = require('modules/%ModuleName%/js/Settings.js')
	;
	
	Settings.init(oAppData);
	
	if (ModulesManager.isModuleAvailable(Settings.ServerModuleName) && App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		return {
			/**
			 * Registers admin settings tabs before application start.
			 * 
			 * @param {Object} ModulesManager
			 */
			start: function (ModulesManager)
			{
				Cache.init();
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/AliasesPerUserAdminSettingsView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/AliasesPerUserAdminSettingsView.js'));
							},
							'admin-bundle'
						);
					},
					Settings.HashModuleName + '-aliases',
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB_ALIASES')
				]);
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelEntityType', [{
					Type: 'Domain',
					ScreenHash: 'domain',
					LinkTextKey: '%MODULENAME%/HEADING_MAILDOMAIN_SETTINGS_TABNAME',
					EditView: require('modules/%ModuleName%/js/views/EditMailDomainView.js'),
					
					ServerModuleName: Settings.ServerModuleName,
					GetListRequest: 'GetDomains',
					GetRequest: 'GetDomain',
					CreateRequest: 'CreateDomain',
					DeleteRequest: 'DeleteDomains',
					
					NoEntitiesFoundText: TextUtils.i18n('%MODULENAME%/INFO_NO_ENTITIES_FOUND_MAILDOMAIN'),
					ActionCreateText: TextUtils.i18n('%MODULENAME%/ACTION_CREATE_ENTITY_MAILDOMAIN'),
					ReportSuccessCreateText: TextUtils.i18n('%MODULENAME%/REPORT_CREATE_ENTITY_MAILDOMAIN'),
					ErrorCreateText: TextUtils.i18n('%MODULENAME%/ERROR_CREATE_ENTITY_MAILDOMAIN'),
					CommonSettingsHeadingText: TextUtils.i18n('%MODULENAME%/HEADING_EDIT_MAILDOMAIN'),
					ActionDeleteText: TextUtils.i18n('%MODULENAME%/ACTION_DELETE_MAILDOMAIN'),
					ConfirmDeleteLangConst: '%MODULENAME%/CONFIRM_DELETE_MAILDOMAIN_PLURAL',
					ReportSuccessDeleteLangConst: '%MODULENAME%/REPORT_DELETE_ENTITIES_MAILDOMAIN_PLURAL',
					ErrorDeleteLangConst: '%MODULENAME%/ERROR_DELETE_ENTITIES_MAILDOMAIN_PLURAL'
				}]);
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelEntityType', [{
					Type: 'MailingList',
					ScreenHash: 'mailinglists',
					LinkTextKey: '%MODULENAME%/HEADING_MAILINGLISTS_SETTINGS_TABNAME',
					EditView: require('modules/%ModuleName%/js/views/EditMailingListView.js'),
					
					ServerModuleName: Settings.ServerModuleName,
					GetListRequest: 'GetMailingLists',
					GetRequest: 'GetMailingListMembers',
					CreateRequest: 'CreateMailingList',
					DeleteRequest: 'DeleteMailingLists',
					
					NoEntitiesFoundText: TextUtils.i18n('%MODULENAME%/INFO_NO_ENTITIES_FOUND_MAILINGLIST'),
					ActionCreateText: TextUtils.i18n('%MODULENAME%/ACTION_CREATE_ENTITY_MAILINGLIST'),
					ReportSuccessCreateText: TextUtils.i18n('%MODULENAME%/REPORT_CREATE_ENTITY_MAILINGLIST'),
					ErrorCreateText: TextUtils.i18n('%MODULENAME%/ERROR_CREATE_ENTITY_MAILINGLIST'),
					CommonSettingsHeadingText: TextUtils.i18n('%MODULENAME%/HEADING_EDIT_MAILINGLIST'),
					ActionDeleteText: TextUtils.i18n('%MODULENAME%/ACTION_DELETE_MAILINGLIST'),
					ConfirmDeleteLangConst: '%MODULENAME%/CONFIRM_DELETE_MAILINGLIST_PLURAL',
					ReportSuccessDeleteLangConst: '%MODULENAME%/REPORT_DELETE_ENTITIES_MAILINGLIST_PLURAL',
					ErrorDeleteLangConst: '%MODULENAME%/ERROR_DELETE_ENTITIES_MAILINGLIST_PLURAL'
				}]);
			}
		};
	}
	
	return null;
};
