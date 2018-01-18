public class CreateAppointmentController {


	@AuraEnabled
	public static Lead getLead(Id leadId) {
		return [
			SELECT FirstName, LastName, Street, City, State, PostalCode, Phone, Email, 
				Owner.FirstName, Owner.LastName, Owner.Phone, Owner.Email
			FROM Lead WHERE Id = :leadId
		];
	}

	@AuraEnabled
	public static void createAppointment(Id leadId, String newEventData) {
		Database.LeadConvertResult lcr = convertLead(leadId);

		if (lcr.isSuccess()) {
			createEvent(lcr, newEventData);
		}

	}

	@TestVisible
	private static Database.LeadConvertResult convertLead(Id leadId) {
		Database.LeadConvert lc = new Database.LeadConvert();
		Database.LeadConvertResult lcr;
		lc.setLeadId(leadId);

		LeadStatus convertStatus = [SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1];
		lc.setConvertedStatus(convertStatus.MasterLabel);

		// convert lead into an account and contact, as well as (optionally) an opportunity.
		try {
			lcr = Database.convertLead(lc);
		}
		catch(Exception ex) {
			throw new AuraHandledException(ex.getMessage());
		}

		return lcr;
	}

	@TestVisible
	private static void createEvent(Database.LeadConvertResult lcr, String newEventData) {
		TempEvent parsedEvent = parseEventJSON(newEventData);
		Event newEventRecord = parsedEvent.generateEvent();
		newEventRecord.WhoId = lcr.getContactId();
		newEventRecord.WhatId = lcr.getOpportunityId();

		try {
			insert newEventRecord;
		}
		catch(DMLException ex) {
			throw new AuraHandledException(ex.getMessage());
		}
	}

	public class TempEvent {
		public Id OwnerId;
		public String Phone;
		public String Email;
		public String Location;
		public String Subject;
		public String StartDateTime;
		public String EndDateTime;
		public String ShowAs;

		public Event generateEvent() {
			Event newEvent = new Event(
				OwnerId = this.OwnerId,
				Location = this.Location,
				Subject = this.Subject,
				StartDateTime = DateTime.parse(this.StartDateTime),
				EndDateTime = DateTime.parse(this.EndDateTime),
				ShowAs = this.ShowAs
			);
			return newEvent;
		}
	}

	private static TempEvent parseEventJSON(String jsonString) {
		return (TempEvent)JSON.deserialize(jsonString, TempEvent.class);
	}
}