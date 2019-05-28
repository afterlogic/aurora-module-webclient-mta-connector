'use strict';

module.exports = function (oAppData) {
	var
		_ = require('underscore'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),
				
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js')
	;
	
	Settings.init(oAppData);
	
	if (ModulesManager.isModuleAvailable(Settings.ServerModuleName) && ModulesManager.isModuleAvailable('MailDomains'))
	{
		if (App.getUserRole() === Enums.UserRole.SuperAdmin)
		{
			return {
				/**
				 * Registers admin settings tabs before application start.
				 * 
				 * @param {Object} ModulesManager
				 */
				start: function (ModulesManager)
				{
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
						Type: 'MailingList',
						ScreenHash: 'mailinglists',
						LinkTextKey: '%MODULENAME%/HEADING_MAILINGLISTS_SETTINGS_TABNAME',
						EditView: require('modules/%ModuleName%/js/views/EditMailingListView.js'),
						Filters: [
							{
								sEntity: 'Domain',
								sField: 'DomainId',
								mList: function () {
									return _.map(Cache.domains(), function (oDomain) {
										return {
											text: oDomain.Name,
											value: oDomain.Id
										};
									});
								},
								sAllText: TextUtils.i18n('%MODULENAME%/LABEL_ALL_DOMAINS')
							}
						],

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
					ModulesManager.run('AdminPanelWebclient', 'changeAdminPanelEntityData', [{
						Type: 'User',
						EditView: require('modules/%ModuleName%/js/views/EditUserView.js'),
						Filters: [
							{
								sEntity: 'Domain',
								sField: 'DomainId',
								mList: function () {
									return _.map(Cache.domains(), function (oDomain) {
										return {
											text: oDomain.Name,
											value: oDomain.Id
										};
									});
								},
								sAllText: TextUtils.i18n('%MODULENAME%/LABEL_ALL_DOMAINS')
							}
						]
					}]);
					ModulesManager.run('FilesWebclient', 'hidePersonalFilesAdminSection');
				}
			};
		}
		else
		{
			return {
				/**
				 * Registers admin settings tabs before application start.
				 * 
				 * @param {Object} ModulesManager
				 */
				start: function (ModulesManager)
				{
					App.subscribeEvent('ReceiveAjaxResponse::after', function (oParams) {
							var
								oResponse = oParams.Response
							;

							if (oResponse.Result && oResponse.Module === 'Files' &&
								(oResponse.Method === 'GetFiles' ||
								oResponse.Method === 'Delete')
							)
							{
								var
									oAccountList = ModulesManager.run('MailWebclient', 'getAccountList'),
									oAccount = oAccountList ? oAccountList.getCurrent() : null
								;
								if (oAccount && oAccount.bDefault)
								{
									oAccount.updateQuotaParams();
								}
							}
						});
				}
			};
		}
	}
	
	return null;
};
