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

	scriptsLoaded: function(cmp,evt,helper){
	  var events = cmp.get("v.events");
	  if(!events.length) {
      helper.fetchEvents(cmp);
	  }
	  else {
	  	alert('You have not created a new appointment yet.');
	  }
  }

})