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

		// for some reason moment.js millisecond is off by -3 hours local time
		// so we need to format to apex datetime string before sending to controller
		newEventData.StartDateTime = newEventData.StartDateTime.format('MM/DD/YYYY HH:mm A');
		newEventData.EndDateTime = newEventData.EndDateTime.format('MM/DD/YYYY HH:mm A');

		action.setParams({
			leadId: theLead.Id,
			newEventData: JSON.stringify(newEventData)
		});

		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log('state:', state);

			if (state === 'SUCCESS') {
				alert('Lead Sucessfully Converted!');
				$A.get('e.force:refreshView').fire();
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

	createEventObj : function(cmp, eventData) {
		const theLead = cmp.get('v.theLead');
		const newEventRecordData = {
			OwnerId: theLead.OwnerId,
			Phone: theLead.Phone,
			Email: theLead.Email,
			Location: theLead.Street + ' ' + theLead.City + ' ' + theLead.State + ' ' + theLead.PostalCode,
			Subject: eventData.title,
			StartDateTime: eventData.start,
			EndDateTime: eventData.end,
			ShowAs: 'Busy'
		};
		return newEventRecordData;
	},

	loadDataToCalendar : function(cmp, data){
    let cal_elmt = cmp.find('calendar').getElement();
    this.cmpt = cmp;

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
        	
        	this.cmpt.set('v.newEvent', this.createEventObj(cmp, eventData));
      	}

      	$(cal_elmt).fullCalendar('unselect');
      }.bind(this),
			selectOverlap: function(event) {
				return event.id === 'NEW_EVENT';
			},
      eventLimit: true,
      eventClick: $A.getCallback(function(calEvent, jsEvent, view) {
      	if (calEvent.id === 'NEW_EVENT') {

          // let editRecordEvent = $A.get('e.force:editRecord');
          // editRecordEvent.setParams({
          //     'recordId': calEvent.id
          // });
          // editRecordEvent.fire();
      	}
      })
    });
  },

    tranformToFullCalendarFormat : function(component,events) {
        var eventArr = [];
        for(var i = 0;i < events.length;i++){
            eventArr.push({
                'id': events[i].Id,
                'start': moment.tz(events[i].StartDateTime, 'America/Los_Angeles'),
                'end': moment.tz(events[i].EndDateTime, 'America/Los_Angeles'),
                'title': events[i].Subject
            });
        }
        return eventArr;
    },
    fetchEvents : function(component) {

        				const data = [
    				      {
						        title: 'Meeting',
						        start: '2018-01-15T10:30:00',
						        end: '2018-01-15T12:30:00'
						      },
						      {
						        title: 'Lunch',
						        start: '2018-01-16T12:00:00'
						      },
						      {
						        title: 'Meeting',
						        start: '2018-01-17T14:30:00'
						      },
						      {
						        title: 'Happy Hour',
						        start: '2018-01-18T17:30:00'
						      },
						      {
						        title: 'Dinner',
						        start: '2018-01-19T20:00:00'
						      },
        				];
                this.loadDataToCalendar(component, data);
                component.set('v.events', data);


        // var action = component.get('c.getEvents'); 

        // action.setCallback(this, function(response) {
        //     var state = response.getState();
        //     console.log(state);
        //     if(component.isValid() && state === 'SUCCESS'){
        //         var eventArr = this.tranformToFullCalendarFormat(component,response.getReturnValue());
        //         this.loadDataToCalendar(component,eventArr);
        //         component.set('v.events',eventArr);
        //     }
        // });

        // $A.enqueueAction(action); 
    }
})