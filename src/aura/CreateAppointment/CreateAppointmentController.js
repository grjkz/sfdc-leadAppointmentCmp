({
	doInit : function(cmp, event, helper) {
		helper.getLeadRecord(cmp, cmp.get('v.recordId'));
	},

	saveAppt : function(cmp, event, helper) {
		if (cmp.get('v.newEvent')) {
			helper.saveAppointment(cmp);
		}
		else {
			console.log('no event created');
		}
	},

	doDebug : function(cmp) {
		debugger;
	},

	afterScriptsLoaded : function(cmp, event, helper) {
		console.log('jquery loaded');
		helper.loadCalendar(cmp);
	},

	scriptsLoaded: function(cmp,evt,helper){
	  var events = cmp.get("v.events");
	  if(!events.length) {
      helper.fetchEvents(cmp);
	  }
  }
})