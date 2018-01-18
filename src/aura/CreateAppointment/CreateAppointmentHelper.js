({
	getLeadRecord : function(cmp, leadId) {
		var action = cmp.get('c.getLead');
		action.setParams({leadId: leadId});

		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log('getLead return state', state);

			if (state === 'SUCCESS') {
				console.log('From server: ' + response.getReturnValue());
				cmp.set('v.theLead', response.getReturnValue());
			}
			else if (state === 'ERROR') {
				var errors = response.getError();
				if (errors) {
					if (errors[0] && errors[0].message) {
						console.log('Error message: ' + errors[0].message);
					}
				}
				else {
					console.log('Unknown error');
				}
			}
		});

		$A.enqueueAction(action);
	},

	saveAppointment : function(cmp) {
		const newEventData = cmp.get('v.newEvent');
		const theLead = cmp.get('v.theLead');
		var action = cmp.get('c.createAppointment');

		newEventData.StartDateTime = newEventData.StartDateTime.utc().format('x');
		newEventData.EndDateTime = newEventData.EndDateTime.utc().format('x');

		action.setParams({
			leadId: theLead.Id,
			newEventData: JSON.stringify(newEventData)
		});

		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log('state:', state);

			if (state === 'SUCCESS') {
				alert('Lead Sucessfully Converted!');
				$A.get("e.force:navigateToObjectHome").setParams({"scope": "Lead"}).fire();
			}
			else if (state === 'ERROR') {
				var errors = response.getError();
				if (errors) {
					if (errors[0] && errors[0].message) {
						console.log('Error message: ' + errors[0].message);
						alert('Error message: ' + errors[0].message);
					}
				}
				else {
					alert('Unknown error');
				}
			}
		});

		$A.enqueueAction(action);
	},

	createNewEventObj : function(cmp, eventData) {
		const theLead = cmp.get('v.theLead');
		let newEventRecordData = {
			OwnerId: theLead.OwnerId,
			Phone: theLead.Phone,
			Email: theLead.Email,
			Location: theLead.Street + ' ' + theLead.City + ' ' + theLead.State + ' ' + theLead.PostalCode,
			Subject: eventData.title,
			StartDateTime: eventData.start,
			StartDateTime_d: eventData.start.format('ddd MMM DD, YYYY'),
			StartDateTime_t: eventData.start.format('hh:mm A'),
			EndDateTime: eventData.end,
			ShowAs: 'Busy'
		};
		return newEventRecordData;
	},

	// used for display purposes when user clicks on any calendar event
	createCalendarEventObj : function(eventData) {
		const newEventRecordData = {
			OwnerId: eventData.Id,
			// Phone: eventData.Who.Phone,
			// Email: eventData.Who.Email,
			Location: eventData.location,
			Subject: eventData.title,
			StartDateTime: eventData.start,
			StartDateTime_d: eventData.start.format('ddd MMM DD, YYYY'),
			StartDateTime_t: eventData.start.format('hh:mm A'),
			EndDateTime: eventData.end,
			ShowAs: eventData.showAs
		};
		return newEventRecordData;
	},

	loadDataToCalendar : function(cmp, data){
    let cal_elmt = cmp.find('calendar').getElement();

    $(cal_elmt).fullCalendar({
      events: data,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'agendaDay,agendaWeek,month',
      },
      minTime: '06:00:00',
      maxTime: '20:00:00',
      defaultDate: moment().format('YYYY-MM-DD'),
      defaultView: 'agendaWeek',
      aspectRatio: 1.35,
      navLinks: true,
      editable: false,
      selectable: true,
      select: function(start, end, jsEvent, view) {
      	if (view.type === 'agendaDay' || view.type === 'agendaWeek') {
      		// first, localize the times (mutates)
      		start.local();
      		end.local();
      		
      		// remove pre-existing event if exists
      		$(cal_elmt).fullCalendar('removeEvents', 'NEW_EVENT');

        	// if selected time frame is less than 1 hour, default to 1
        	const timeDiff = moment.duration(end.diff(start)).asHours();
        	if (timeDiff < 1) {
        		end.add(1 - timeDiff, 'h');
        	}

        	// create new event
        	const eventData = {
        		id: 'NEW_EVENT',
        		title: 'Appointment',
        		start: start,
        		end: end,
        		editable: true,
        		backgroundColor: 'green'
        	};
        	$(cal_elmt).fullCalendar('renderEvent', eventData, true);
        	
        	cmp.set('v.newEvent', this.createNewEventObj(cmp, eventData));
      	}

      	$(cal_elmt).fullCalendar('unselect');
      }.bind(this),
			// selectOverlap: function(event) {
			// 	return (event.id === 'NEW_EVENT') ? 
			// 		true : 
			// 		confirm('New appointment overlaps an existing one. Continue to create appointment for this time?');
			// },
      eventLimit: true,
      eventClick: function(calEvent, jsEvent, view) {
      	if (calEvent.id === 'NEW_EVENT') {
	    		cmp.set('v.selectedEvent', cmp.get('v.newEvent'));
	    		cmp.set('v.disableModalEditFields', false);
      	}
      	else {
	    		cmp.set('v.selectedEvent', this.createCalendarEventObj(calEvent));
	    		cmp.set('v.disableModalEditFields', true);
      	}
      }.bind(this)
    });
  },

  fetchEvents : function(component) {
	  var action = component.get('c.getEvents'); 

	  action.setCallback(this, function(response) {
	      var state = response.getState();
	      console.log('c.getEvents stats: ', state);

	      if(component.isValid() && state === 'SUCCESS') {
	          var eventArr = this.tranformToFullCalendarSchema(JSON.parse(response.getReturnValue()));
	          this.loadDataToCalendar(component, eventArr);
	      }
		});

	  $A.enqueueAction(action);
  },

  tranformToFullCalendarSchema : function(events) {
    var eventArr = [];

    for(var i = 0;i < events.length;i++){
      eventArr.push({
        id: events[i].Id,
        title: events[i].Subject,
        email: events[i].Email,
        phone: events[i].Phone,
        start: moment.utc(events[i].StartDateTime).local(),
        end: moment.utc(events[i].EndDateTime).local(),
        location: events[i].Location,
        showAs: events[i].ShowAs
      });
    }
    return eventArr;
  }

})