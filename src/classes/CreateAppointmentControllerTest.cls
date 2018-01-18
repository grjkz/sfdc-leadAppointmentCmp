@isTest
public class CreateAppointmentControllerTest {

	private static final String JSON_STRING = '{\"OwnerId\":\"0051N000005dIB7QAM\",\"Phone\":\"1234567890\",\"Email\":\"andrew.vays@gsd.com\",\"Location\":\"79 Madison Ave New York NY 10016\",\"Subject\":\"Appointment\",\"StartDateTime\":\"01/17/2018 09:00 AM\",\"EndDateTime\":\"01/17/2018 10:00 AM\",\"ShowAs\":\"Busy\"}"';
	
	private static Lead testLead;

	private static void setup() {
		testLead = new Lead(
			FirstName = 'FirstName',
			LastName = 'LastName',
			Company = 'testCompany',
			Phone = '1234567890',
			Email = 'test@email.com',
			Status = 'Open - Not Contacted'
		);
		insert testLead;
	}

	@isTest
	private static void createAppointment() {
		setup();

		Test.startTest();
			CreateAppointmentController.createAppointment(testLead.Id, JSON_STRING);
		Test.stopTest();

		//Account createdAccount = [SELECT Name FROM Account];
		Contact createdContact = [SELECT FirstName, LastName FROM Contact];
		Opportunity createdOpp = [SELECT Name FROM Opportunity];
		Event createdEvent = [SELECT StartDateTime, EndDateTime, WhoId, WhatId FROM Event];

		// assert that these records have actually been created
		//System.assert();

		System.assertEquals(createdContact.Id, createdEvent.WhoId, 'WhoId on lead should match the created contact id');
		System.assertEquals(createdOpp.Id, createdEvent.WhatId, 'WhatId on lead should match the created Opportunity id');

		DateTime expectedStartDate = DateTime.newInstance(2018, 1, 17, 9, 0, 0);
		DateTime expectedEndDate = expectedStartDate.addHours(1);
		System.assertEquals(expectedStartDate, createdEvent.StartDateTime, 'Expecting the start datetime on the event to be correct');
		System.assertEquals(expectedEndDate, createdEvent.EndDateTime, 'Expecting the end datetime on the event to be correct');
	}

	@isTest
	private static void getEvents() {
		setup();
		CreateAppointmentController.createAppointment(testLead.Id, JSON_STRING);
		
		List<Event> returnedEvents;
		Test.startTest();
			returnedEvents = (List<Event>)JSON.deserialize(CreateAppointmentController.getEvents(), List<Event>.class);
		Test.stopTest();

		System.assertEquals(1, returnedEvents.size(), 'Expecting all the Events this user owns, to be returned');
	}
}