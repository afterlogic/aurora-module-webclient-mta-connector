'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: 'MtaConnector',
	HashModuleName: 'mta-connector',

	UserDefaultQuotaMB: 0,

	EnableMultiTenant: false,
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oAppDataSection = oAppData[this.ServerModuleName] || {},
			oCoreDataSection = oAppData['Core'] || {}
		;
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.UserDefaultQuotaMB = Types.pNonNegativeInt(oAppDataSection.UserDefaultQuotaMB, this.UserDefaultQuotaMB);
		}
		
		if (!_.isEmpty(oCoreDataSection))
		{
			this.EnableMultiTenant = Types.pBool(oCoreDataSection.EnableMultiTenant, this.EnableMultiTenant);
		}
	}
};
