'use strict';

var
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
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

CEditMailDomainView.prototype.isValidSaveData = function ()
{
	var bValid = $.trim(this.domain()) !== '';
	if (!bValid)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_MAILDOMAIN_NAME_EMPTY'));
	}
	return bValid;
};

CEditMailDomainView.prototype.getParametersForSave = function ()
{
	return {
		DomainName: this.domain()
	};
};

CEditMailDomainView.prototype.showUsers = function ()
{
	ModulesManager.run('AdminPanelWebclient', 'showEntities', ['User', {'Domain': this.id()}]);
};

module.exports = new CEditMailDomainView();
