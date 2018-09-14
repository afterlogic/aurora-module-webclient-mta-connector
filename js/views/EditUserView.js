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
	this.domains.subscribe(function () {
		if (_.isFunction(this.updateSavedState))
		{
			this.updateSavedState();
		}
	}, this);
	this.selectedDomain = ko.observable(null);
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
		this.writeSeparateLog(),
		this.password()
	];
};

CEditUserView.prototype.clearFields = function ()
{
	this.id(0);
	this.publicId('');
	this.selectedDomain(null);
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
		this.password('      ');
	}
	else
	{
		this.clearFields();
	}
};

CEditUserView.prototype.isValidSaveData = function ()
{
	var
		bValidUserName = $.trim(this.publicId()) !== '',
		bValidPassword = $.trim(this.password()) !== '' || this.password() === '      '
	;
	if (!bValidUserName)
	{
		Screens.showError(TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_USER_NAME_EMPTY'));
	}
	if (!bValidPassword)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PASSWORD_EMPTY'));
	}
	return bValidUserName && bValidPassword;
};

CEditUserView.prototype.getParametersForSave = function ()
{
	var
		sDomain = this.id() === 0 ?  '@' + this.selectedDomain().Name : '',
		oParametersForSave = {
			Id: this.id(),
			PublicId: $.trim(this.publicId()) + sDomain,
			DomainId: this.selectedDomain().Id,
			QuotaBytes: this.quota() * this.QuotaKiloMultiplier * this.QuotaKiloMultiplier,//MB to Bytes conversion
			Role: this.role(),
			WriteSeparateLog: this.writeSeparateLog()
		}
	;

	if (this.password() !== '      ') //6 spaces represent default password view
	{
		oParametersForSave.Password = $.trim(this.password());
	}

	return oParametersForSave;
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

CEditUserView.prototype.onRoute = function (aTabParams, aCurrentEntitiesId)
{
	if ((typeof aCurrentEntitiesId.Domain) === 'number')
	{
		this.selectedDomain(_.find(this.domains(), function (oDomain) {
			return oDomain.Id === aCurrentEntitiesId.Domain;
		}));
	}
};

CEditUserView.prototype.onGetUserQuotaResponse = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result)
	{
		this.quota(oResponse.Result / (this.QuotaKiloMultiplier * this.QuotaKiloMultiplier));//Bytes to MB  conversion
	}
	else
	{
		this.quota(0);
	}
};

CEditUserView.prototype.showReport = function (sMessage, oResponse)
{
	var
		sSubMessage = '',
		oSubscriptionResult = null
	;

	if (oResponse.SubscriptionsResult &&
		oResponse.SubscriptionsResult["MtaConnector::onAfterUpdateEntity"])
	{
		oSubscriptionResult = oResponse.SubscriptionsResult["MtaConnector::onAfterUpdateEntity"];
	}

	if (!oSubscriptionResult || !oSubscriptionResult.Result ||
		(typeof oSubscriptionResult.IsPasswordChanged !== 'undefined'  && oSubscriptionResult.IsPasswordChanged === false))
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PASSWORD_NOT_UPDATED'));
	}
	else if (typeof oSubscriptionResult.IsPasswordChanged !== 'undefined'  && oSubscriptionResult.IsPasswordChanged === true)
	{
		sSubMessage = '<br>' + TextUtils.i18n('%MODULENAME%/PASSWORD_UPDATED');
	}
	else
	{
		sSubMessage = '<br>' + TextUtils.i18n('%MODULENAME%/PASSWORD_NOT_UPDATED');
	}

	Screens.showReport(sMessage + sSubMessage);
};

module.exports = new CEditUserView();
