'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: 'MtaConnector',
	HashModuleName: 'mta-connector',

	UserDefaultQuotaMB: 0,

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ServerModuleName] || {};
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.UserDefaultQuotaMB = Types.pNonNegativeInt(oAppDataSection.UserDefaultQuotaMB, this.UserDefaultQuotaMB);
		}
	}
};
