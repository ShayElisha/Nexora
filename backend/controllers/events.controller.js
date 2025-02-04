// controllers/event.controller.js
import mongoose from "mongoose";
import Event from "../models/events.model.js";

export const createEvent = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const createdBy = req.user._id;
    // חילוץ השדות מהגוף של הבקשה
    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      location,
      meetingUrl,
      eventType,
      participants,
      externalParticipants,
      recurrence,
      attachments,
      notes,
    } = req.body;

    // יצירת האירוע במסד הנתונים
    const newEvent = await Event.create({
      companyId: companyId,
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      location,
      meetingUrl,
      eventType,
      participants,
      externalParticipants,
      recurrence,
      attachments,
      createdBy: createdBy,
      notes,
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: error.message });
  }
};

// קריאת כל האירועים
export const getEvents = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const events = await Event.find({ companyId }).populate("participants");
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: error.message });
  }
};

// קריאת אירוע בודד לפי מזהה
export const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: error.message });
  }
};

// עדכון אירוע קיים כולל כל השדות
export const updateEvent = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const eventId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // חילוץ השדות מהגוף של הבקשה
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      meetingUrl,
      eventType,
      participants,
      externalParticipants,
      recurrence,
      attachments,
      createdBy,
      dayReminderSent,
      twoHoursReminderSent,
      notes,
    } = req.body;

    // עדכון האירוע במסד הנתונים – כל השדות מועברים לעדכון
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        companyId: companyId,
        title,
        description,
        startDate,
        endDate,
        allDay,
        location,
        meetingUrl,
        eventType,
        participants,
        externalParticipants,
        recurrence,
        attachments,
        dayReminderSent,
        twoHoursReminderSent,
        createdBy,
        notes,
      },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: error.message });
  }
};

// מחיקת אירוע לפי מזהה
export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: error.message });
  }
};
