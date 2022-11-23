'use strict';

module.exports = function (oAppData) {
	var		
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js')
	;
	
	Settings.init(oAppData);
	
	if (ModulesManager.isModuleAvailable(Settings.ServerModuleName) && ModulesManager.isModuleAvailable('MailDomains'))
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
	
	return null;
};
