'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CCache()
{
	this.domains = ko.observableArray([]);
	
	App.subscribeEvent('ReceiveAjaxResponse::after', this.onAjaxResponse.bind(this));
	App.subscribeEvent('SendAjaxRequest::before', this.onAjaxSend.bind(this));
}

CCache.prototype.init = function ()
{
	Ajax.send(Settings.ServerModuleName, 'GetDomains', {}, function (oResponse) {
		if (oResponse && oResponse.Result && _.isArray(oResponse.Result.Items))
		{
			this.domains(oResponse.Result.Items);
		}
	}, this);
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
	if (oParams.Response.Module === Settings.ServerModuleName && oParams.Response.Method === 'GetDomains' && oParams.Response.Result)
	{
		this.domains(_.isArray(oParams.Response.Result.Items) ? oParams.Response.Result.Items : []);
	}
};

module.exports = new CCache();
