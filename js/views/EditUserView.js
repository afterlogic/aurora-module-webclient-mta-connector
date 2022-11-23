'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Cache = ModulesManager.run('MailDomains', 'getMailDomainsCache'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CEditUserView()
{
	this.id = ko.observable(0);
	this.publicId = ko.observable('');
	this.domains = Cache.domains;
	this.selectedDomain = ko.observable(null);
	this.password = ko.observable('');
	this.quota = ko.observable(Settings.UserDefaultQuotaMB);
	// this.bAllowMakeTenant = Settings.EnableMultiTenant && App.getUserRole() === Enums.UserRole.SuperAdmin;
	this.bAllowMakeTenant = false;
	this.tenantAdminSelected = ko.observable(false);
	this.writeSeparateLog = ko.observable(false);
	this.QuotaKiloMultiplier = 1024;
	
	this.sHeading = TextUtils.i18n('ADMINPANELWEBCLIENT/HEADING_CREATE_USER');
	this.sActionCreate = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE');
	this.sActionCreateInProgress = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE_IN_PROGRESS');
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

CEditUserView.prototype.ViewTemplate = '%ModuleName%_EditUserView';
CEditUserView.prototype.ViewConstructorName = 'CEditUserView';

CEditUserView.prototype.getCurrentValues = function ()
{
	// There is a problem with considering this.selectedDomain() in state of changes on this form.
	// this.domains() changes affect on this.selectedDomain().
	// this.selectedDomain() changes might be not that important.
	return [
		this.id(),
		this.publicId(),
		this.tenantAdminSelected(),
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
	this.tenantAdminSelected(false);
	this.writeSeparateLog(false);
};

CEditUserView.prototype.parse = function (iEntityId, oResult)
{
	if (oResult)
	{
		this.id(iEntityId);
		this.publicId(oResult.PublicId);
		this.tenantAdminSelected(oResult.Role === Enums.UserRole.TenantAdmin);
		this.writeSeparateLog(!!oResult.WriteSeparateLog);
		this.quota(Types.pInt(oResult["MtaConnector::TotalQuotaBytes"], 1) / (this.QuotaKiloMultiplier * this.QuotaKiloMultiplier));
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
	if (Cache.showErrorIfDomainsEmpty())
	{
		return false;
	}
	if (!bValidUserName)
	{
		Screens.showError(TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_USER_NAME_EMPTY'));
		return false;
	}
	if (!bValidPassword)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PASSWORD_EMPTY'));
		return false;
	}
	return true;
};

CEditUserView.prototype.getParametersForSave = function ()
{
	var
		sDomain = this.id() === 0 && this.selectedDomain() ? '@' + this.selectedDomain().Name : '',
		oParametersForSave = {
			UserId: this.id(),
			PublicId: $.trim(this.publicId()) + sDomain,
			DomainId: this.selectedDomain() ? this.selectedDomain().Id : 0,
			QuotaBytes: this.quota() * this.QuotaKiloMultiplier * this.QuotaKiloMultiplier,//MB to Bytes conversion
			Role: this.tenantAdminSelected() ? Enums.UserRole.TenantAdmin : Enums.UserRole.NormalUser,
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
		if (_.isFunction(oParent.createEntity))
		{
			oParent.createEntity();
		}
		else if (_.isFunction(oParent.save))
		{
			oParent.save(oRoot);
		}
	});
};

CEditUserView.prototype.onRoute = function (aTabParams, aCurrentEntitiesId)
{
	Cache.showErrorIfDomainsEmpty();
	if ((typeof aCurrentEntitiesId.Domain) === 'number')
	{
		this.selectedDomain(_.find(this.domains(), function (oDomain) {
			return oDomain.Id === aCurrentEntitiesId.Domain;
		}));
	}
};

CEditUserView.prototype.showAdvancedReport = function (sMessage, oResponse)
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
