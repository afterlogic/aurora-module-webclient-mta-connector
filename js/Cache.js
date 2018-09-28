'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CCache()
{
	this.selectedTenantId = ModulesManager.run('AdminPanelWebclient', 'getKoSelectedTenantId');
	this.domainsByTenants = ko.observable({});
	if (_.isFunction(this.selectedTenantId))
	{
		this.selectedTenantId.subscribe(function () {
			if (typeof this.domainsByTenants()[this.selectedTenantId()] === 'undefined')
			{
				Ajax.send(Settings.ServerModuleName, 'GetDomains');
			}
		}, this);
	}
	this.domains = ko.computed(function () {
		var aDomains = _.isFunction(this.selectedTenantId) ? this.domainsByTenants()[this.selectedTenantId()] : [];
		return _.isArray(aDomains) ? aDomains : [];
	}, this);
	
	App.subscribeEvent('ReceiveAjaxResponse::after', this.onAjaxResponse.bind(this));
	App.subscribeEvent('SendAjaxRequest::before', this.onAjaxSend.bind(this));
}

CCache.prototype.init = function ()
{
	Ajax.send(Settings.ServerModuleName, 'GetDomains');
};

CCache.prototype.getDomain = function (iId)
{
	return _.find(this.domains(), function (oDomain) {
		return oDomain.Id === iId;
	});
};

CCache.prototype.onAjaxSend = function (oParams)
{
	if (oParams.Module === Settings.ServerModuleName && oParams.Method === 'GetDomain')
	{
		var oDomain = this.getDomain(oParams.Parameters.Id);
		if (oDomain)
		{
			if (_.isFunction(oParams.ResponseHandler))
			{
				oParams.ResponseHandler.apply(oParams.Context, [{
					'Module': oParams.Module,
					'Method': oParams.Method,
					'Result': oDomain
				}, {
					'Module': oParams.Module,
					'Method': oParams.Method,
					'Parameters': oParams.Parameters
				}]);
				oParams.Continue = false;
			}
		}
	}
};

CCache.prototype.onAjaxResponse = function (oParams)
{
	if (oParams.Response.Module === Settings.ServerModuleName && oParams.Response.Method === 'GetDomains')
	{
		var
			iTenantId = oParams.Request.Parameters.TenantId,
			aDomains = oParams.Response.Result && _.isArray(oParams.Response.Result.Items) ? oParams.Response.Result.Items : []
		;
		
		_.each(aDomains, function (oDomain) {
			oDomain.Id = Types.pInt(oDomain.Id);
		});
		
		this.domainsByTenants()[iTenantId] = aDomains;
		this.domainsByTenants.valueHasMutated();
	}
};

module.exports = new CCache();
