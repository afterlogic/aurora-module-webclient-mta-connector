'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Cache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CEditUserView()
{
	this.sHeading = TextUtils.i18n('ADMINPANELWEBCLIENT/HEADING_CREATE_USER');
	this.id = ko.observable(0);
	this.publicId = ko.observable('');
	this.domains = Cache.domains;
	this.selectedDomain = ko.observableArray('');
	this.password = ko.observable('');
	this.quota = ko.observable(Settings.UserDefaultQuotaMB);
	this.aRoles = [
		{text: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_ADMINISTRATOR'), value: Enums.UserRole.SuperAdmin},
		{text: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_USER'), value: Enums.UserRole.NormalUser},
		{text: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_GUEST'), value: Enums.UserRole.Customer}
	];
	this.role = ko.observable(Enums.UserRole.NormalUser);
	this.writeSeparateLog = ko.observable(false);
	this.QuotaKiloMultiplier = 1024;
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

CEditUserView.prototype.ViewTemplate = '%ModuleName%_EditUserView';
CEditUserView.prototype.ViewConstructorName = 'CEditUserView';

CEditUserView.prototype.getCurrentValues = function ()
{
	return [
		this.id(),
		this.publicId(),
		this.selectedDomain(),
		this.role(),
		this.writeSeparateLog()
	];
};

CEditUserView.prototype.clearFields = function ()
{
	this.id(0);
	this.publicId('');
	this.selectedDomain('');
	this.password('');
	this.quota(Settings.UserDefaultQuotaMB);
	this.role(Enums.UserRole.NormalUser);
	this.writeSeparateLog(false);
};

CEditUserView.prototype.parse = function (iEntityId, oResult)
{
	if (oResult)
	{
		this.id(iEntityId);
		this.publicId(oResult.PublicId);
		this.role(oResult.Role);
		this.writeSeparateLog(!!oResult.WriteSeparateLog);
		this.getUserQuota(iEntityId);
	}
	else
	{
		this.clearFields();
	}
};

CEditUserView.prototype.isValidSaveData = function ()
{
	var bValid = $.trim(this.publicId()) !== '';
	if (!bValid)
	{
		Screens.showError(TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_USER_NAME_EMPTY'));
	}
	return bValid;
};

CEditUserView.prototype.getParametersForSave = function ()
{
	var sDomain = this.id() === 0 ?  '@' + this.selectedDomain().Name : '';

	return {
		Id: this.id(),
		PublicId: $.trim(this.publicId()) + sDomain,
		DomainId: this.selectedDomain().Id,
		Password: this.password(),
		Quota: this.quota() * this.QuotaKiloMultiplier * this.QuotaKiloMultiplier,//MB to Bytes conversion
		Role: this.role(),
		WriteSeparateLog: this.writeSeparateLog()
	};
};

CEditUserView.prototype.saveEntity = function (aParents, oRoot)
{
	_.each(aParents, function (oParent) {
		if (oParent.constructor.name === 'CEntitiesView' && _.isFunction(oParent.createEntity))
		{
			oParent.createEntity();
		}
		if (oParent.constructor.name === 'CCommonSettingsPaneView' && _.isFunction(oParent.save))
		{
			oParent.save(oRoot);
		}
	});
};

CEditUserView.prototype.getUserQuota = function (iUserId)
{
	Ajax.send(
		'MtaConnector',
		'GetUserQuota',
		{
			'UserId': iUserId
		},
		this.onGetUserQuotaResponse,
		this
	);
};

CEditUserView.prototype.onGetUserQuotaResponse = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result)
	{
		this.quota(oResponse.Result / this.QuotaKiloMultiplier);
	}
	else
	{
		this.quota(0);
	}
};

module.exports = new CEditUserView();
