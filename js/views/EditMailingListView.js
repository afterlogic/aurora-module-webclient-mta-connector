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
function CEditMailingListView()
{
	this.sHeading = TextUtils.i18n('%MODULENAME%/HEADING_CREATE_MAILINGLIST');
	this.id = ko.observable(0);
	this.email = ko.observable('');
	this.memberEmail = ko.observable('');
	this.members = ko.observableArray([]);
	this.selectedMembers = ko.observableArray([]);
}

CEditMailingListView.prototype.ViewTemplate = '%ModuleName%_EditMailingListView';

CEditMailingListView.prototype.getCurrentValues = function ()
{
	return [
		this.id(),
		this.email()
	];
};

CEditMailingListView.prototype.clearFields = function ()
{
	this.id(0);
	this.email('');
};

CEditMailingListView.prototype.parse = function (iEntityId, oResult)
{
	if (_.isArray(oResult))
	{
		this.id(iEntityId);
		this.members(oResult);
	}
	else
	{
		this.clearFields();
	}
};

CEditMailingListView.prototype.getParametersForSave = function ()
{
	return {
		Email: this.email()
	};
};

CEditMailingListView.prototype.setRequestEntityDataFunction = function (fRequestEntityData)
{
	this.fRequestEntityData = fRequestEntityData;
};

/**
 * Validates member email and sends request to create a new member.
 */
CEditMailingListView.prototype.addNewMember = function ()
{
	if (this.memberEmail() === '')
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_EMPTY_MEMBER'));
		return;
	}
	
	Ajax.send(Settings.ServerModuleName, 'AddMailingListMember', {
		'ListId': this.id(),
		'ListName': this.memberEmail()
	}, function (oResponse) {
		if (oResponse.Result)
		{
			this.memberEmail('');
			if (_.isFunction(this.fRequestEntityData))
			{
				this.fRequestEntityData();
			}
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_NEW_MEMBER'));
		}
	}, this);
};

/**
 * Validates selectes members and sends request to delete them.
 */
CEditMailingListView.prototype.deleteMembers = function ()
{
	if (this.selectedMembers().length === 0)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_EMPTY_MEMBERS'));
		return;
	}
	
	Ajax.send(Settings.ServerModuleName, 'DeleteMailingListMembers', {
		'ListId': this.id(),
		'Members': this.selectedMembers()
	}, function (oResponse) {
		if (oResponse.Result)
		{
			this.selectedMembers([]);
			if (_.isFunction(this.fRequestEntityData))
			{
				this.fRequestEntityData();
			}
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_MEMBERS_PLURAL', {}, null, this.selectedMembers().length));
		}
	}, this);
};

module.exports = new CEditMailingListView();
