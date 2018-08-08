'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CEditMailDomainView()
{
	this.sHeading = TextUtils.i18n('%MODULENAME%/HEADING_CREATE_MAILDOMAIN');
	this.id = ko.observable(0);
	this.domain = ko.observable('');
	this.count = ko.observable(0);
}

CEditMailDomainView.prototype.ViewTemplate = '%ModuleName%_EditMailDomainView';

CEditMailDomainView.prototype.getCurrentValues = function ()
{
	return [
		this.id(),
		this.domain()
	];
};

CEditMailDomainView.prototype.clearFields = function ()
{
	this.id(0);
	this.domain('');
};

CEditMailDomainView.prototype.parse = function (iEntityId, oResult)
{
	if (oResult)
	{
		this.id(iEntityId);
		this.domain(oResult.Name);
		this.count(oResult.Count);
	}
	else
	{
		this.clearFields();
	}
};

CEditMailDomainView.prototype.getParametersForSave = function ()
{
	return {
		DomainName: this.domain()
	};
};

module.exports = new CEditMailDomainView();
