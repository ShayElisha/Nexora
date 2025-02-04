// src/components/events/Events.jsx
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Modal from "react-modal";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";

const Events = () => {
  // State לניהול בחירת תאריך, מודלים, האירועים ועובדים פנימיים
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [detailModalIsOpen, setDetailModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  // תאריך הפעיל בלוח (לבדיקה אם התא שייך לחודש הנוכחי)
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  // מצב עדכון – אם true, הטופס במודל ישמש לעדכון אירוע קיים
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  // רשימת עובדים פנימיים (לטובת בחירת עובדים)
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // טופס יצירת/עריכת אירוע – כולל שדה participantType (external, internal, other)
  const [formData, setFormData] = useState({
    companyId: "", // managed externally (e.g. from the logged in user)
    _id: "", // במצב עדכון – מזהה האירוע
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "", // שעת התחלה
    endTime: "", // שעת סיום
    allDay: true,
    location: "",
    meetingUrl: "",
    eventType: "other", // options: meeting, holiday, reminder, other
    participantType: "external", // "external", "internal", or "other"
    participants: [], // עבור Internal – יכיל מזהי עובדים (ריק כברירת מחדל)
    externalParticipants: [{ name: "", email: "", phone: "" }],
    recurrence: "",
    reminder: 15,
    attachments: [{ fileName: "", fileUrl: "" }],
    createdBy: "", // managed externally
    notes: "",
  });

  // טעינת האירועים מהשרת
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get("/events");
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to fetch events");
      }
    };
    fetchEvents();
  }, []);

  // טעינת רשימת העובדים (למשתתפים פנימיים)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        // הנחה: הנתונים מגיעים במבנה { data: [...] }
        setEmployeeOptions(response.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  // Open modal for creating an event on a specific day
  const openModalForDate = (date) => {
    setSelectedDate(date);
    setModalIsOpen(true);
    setIsUpdateMode(false);
    setFormData((prev) => ({
      ...prev,
      _id: "",
      startDate: date.toISOString().split("T")[0],
    }));
  };

  // Close create/update event modal and reset form
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedDate(null);
    setIsUpdateMode(false);
    setFormData({
      companyId: "",
      _id: "",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      allDay: true,
      location: "",
      meetingUrl: "",
      eventType: "other",
      participantType: "external",
      participants: [],
      externalParticipants: [{ name: "", email: "", phone: "" }],
      recurrence: "",
      reminder: 15,
      attachments: [{ fileName: "", fileUrl: "" }],
      createdBy: "",
      notes: "",
    });
  };

  // Open event details modal
  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setDetailModalIsOpen(true);
  };

  // Close event details modal
  const closeDetailModal = () => {
    setDetailModalIsOpen(false);
    setSelectedEvent(null);
  };

  // Handler for form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handler for multi-select internal participants
  const handleMultiSelectChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData((prev) => ({ ...prev, participants: selectedValues }));
  };

  // Handler for הסרת עובד פנימי (Internal) מהכיפים
  const handleRemoveInternalParticipant = (empId) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((id) => id !== empId),
    }));
  };

  // Handler for external participant fields
  const handleExternalParticipantChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.externalParticipants];
      updated[0] = { ...updated[0], [name]: value };
      return { ...prev, externalParticipants: updated };
    });
  };

  // Handler for attachment fields
  const handleAttachmentChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.attachments];
      updated[0] = { ...updated[0], [name]: value };
      return { ...prev, attachments: updated };
    });
  };

  // Submit create/update event form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = { ...formData };

    if (dataToSend.participantType === "internal") {
      // שומרים רק IDs של העובדים שנבחרו
      dataToSend.externalParticipants = [];
    } else if (dataToSend.participantType === "external") {
      // שומרים רק גורם חיצוני
      dataToSend.participants = [];
    } else {
      // participantType === "other"
      dataToSend.participants = [];
      dataToSend.externalParticipants = [];
    }

    try {
      if (isUpdateMode) {
        // עדכון אירוע קיים
        const response = await axiosInstance.put(
          `/events/${dataToSend._id}`,
          dataToSend
        );
        // עדכון סטייט מקומי...
        toast.success("Event updated successfully");
      } else {
        // יצירת אירוע חדש
        const response = await axiosInstance.post("/events", dataToSend);
        // עדכון סטייט מקומי...
        toast.success("Event created successfully");
      }
      closeModal();
    } catch (error) {
      console.error("Error creating/updating event:", error);
      toast.error("Failed to create/update event");
    }
  };
  // Get events for a specific day (including events spanning multiple days)
  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const start = new Date(event.startDate);
      const end = event.endDate ? new Date(event.endDate) : start;
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const s = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return d >= s && d <= e;
    });
  };

  // Helper function to conditionally render a field only if its value is not empty
  const renderField = (label, value) => {
    if (!value) return null;
    return (
      <p className="text-base">
        <span className="font-bold">{label}:</span> {value}
      </p>
    );
  };

  // Define tile class for each day cell – background white for current month, gray for others
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      return `relative min-h-[150px] flex flex-col justify-center items-center border border-gray-300 transition-colors duration-200 hover:bg-gray-100 ${
        date.getMonth() === activeStartDate.getMonth()
          ? "bg-white"
          : "bg-gray-200"
      }`;
    }
    return "";
  };

  // Define tile content: display day number at top-right and event titles below
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const dayEvents = getEventsForDate(date);
      return (
        <>
          <div className="absolute top-1 right-1 text-xs font-bold text-gray-800">
            {date.getDate()}
          </div>
          <div className="mt-6 w-full px-1 space-y-1">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  openEventDetails(event);
                }}
                className="cursor-pointer bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs text-center transition transform hover:scale-105"
              >
                {event.title}
              </div>
            ))}
          </div>
        </>
      );
    }
    return null;
  };

  // Function to trigger update mode – prefill form data with selected event details
  const handleUpdateEvent = () => {
    if (!selectedEvent) return;
    setIsUpdateMode(true);
    setFormData({
      ...selectedEvent,
      startDate: new Date(selectedEvent.startDate).toISOString().split("T")[0],
      endDate: selectedEvent.endDate
        ? new Date(selectedEvent.endDate).toISOString().split("T")[0]
        : "",
    });
    setDetailModalIsOpen(false);
    setModalIsOpen(true);
  };

  // Function to delete an event
  const handleDeleteEvent = async () => {
    if (!selectedEvent || !selectedEvent._id) return;
    try {
      await axiosInstance.delete(`/events/${selectedEvent._id}`);
      setEvents((prev) => prev.filter((ev) => ev._id !== selectedEvent._id));
      toast.success("Event deleted successfully");
      closeDetailModal();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col">
      <h1 className="text-4xl font-extrabold text-center py-6 text-gray-900">
        Calendar
      </h1>
      {/* Calendar Container */}
      <div className="flex-grow w-full px-4">
        <Calendar
          onClickDay={openModalForDate}
          tileContent={tileContent}
          tileClassName={tileClassName}
          onActiveStartDateChange={({ activeStartDate }) =>
            setActiveStartDate(activeStartDate)
          }
          formatDay={() => ""}
          nextLabel={<span className="text-gray-900 text-2xl">&gt;</span>}
          prevLabel={<span className="text-gray-900 text-2xl">&lt;</span>}
          navigationLabel={({ label }) => (
            <div className="bg-gray-200 text-gray-900 p-2 rounded mb-4 text-center text-xl font-semibold">
              {label}
            </div>
          )}
          className="mx-auto w-full max-w-6xl bg-white shadow-xl rounded-lg p-6"
        />
      </div>

      {/* Modal for creating/updating event */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Create Event"
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl mx-auto overflow-y-auto max-h-[90vh] transition-all"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center"
        ariaHideApp={false}
      >
        <h2 className="text-2xl font-bold mb-6">
          {isUpdateMode
            ? "Update Event"
            : `Create Event for ${selectedDate && selectedDate.toDateString()}`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-lg font-medium mb-1">Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-lg font-medium mb-1">
              Description:
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
              rows="3"
            />
          </div>
          {/* Start & End Dates */}
          <div className="flex flex-col md:flex-row md:space-x-6">
            <div className="flex-1">
              <label className="block text-lg font-medium mb-1">
                Start Date:
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-lg font-medium mb-1">
                End Date:
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          {/* All Day */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="allDay"
              checked={formData.allDay}
              onChange={handleCheckboxChange}
              className="mr-2 h-5 w-5"
            />
            <label className="text-lg font-medium">All Day Event</label>
          </div>
          {/* Conditionally render Start Time and End Time if not All Day */}
          {!formData.allDay && (
            <div className="flex flex-col md:flex-row md:space-x-6">
              <div className="flex-1">
                <label className="block text-lg font-medium mb-1">
                  Start Time:
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
                  required={!formData.allDay}
                />
              </div>
              <div className="flex-1">
                <label className="block text-lg font-medium mb-1">
                  End Time:
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
                  required={!formData.allDay}
                />
              </div>
            </div>
          )}
          {/* Participant Type */}
          <div>
            <label className="block text-lg font-medium mb-1">
              Participant Type:
            </label>
            <select
              name="participantType"
              value={formData.participantType}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              <option value="external">External</option>
              <option value="internal">Internal</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* Conditionally render fields based on participant type */}
          {formData.participantType === "external" && (
            <div>
              <label className="block text-lg font-medium mb-1">
                External Participant (Name, Email, Phone):
              </label>
              <div className="flex flex-col md:flex-row md:space-x-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.externalParticipants[0].name}
                  onChange={handleExternalParticipantChange}
                  className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors mb-2 md:mb-0"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.externalParticipants[0].email}
                  onChange={handleExternalParticipantChange}
                  className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors mb-2 md:mb-0"
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={formData.externalParticipants[0].phone}
                  onChange={handleExternalParticipantChange}
                  className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
          {formData.participantType === "internal" && (
            <div>
              <label className="block text-lg font-medium mb-1">
                Select Internal Participants:
              </label>
              <select
                name="participants"
                multiple
                value={formData.participants}
                onChange={handleMultiSelectChange}
                className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
              >
                {employeeOptions.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
              {/* Display selected internal participants as chips */}
              {formData.participants.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.participants.map((empId) => {
                    const emp = employeeOptions.find((e) => e._id === empId);
                    if (!emp) return null;
                    return (
                      <div
                        key={empId}
                        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                      >
                        <span>
                          {emp.name} - {emp.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInternalParticipant(empId)}
                          className="ml-2 text-red-600 font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* For participantType "other" - no additional fields */}
          {/* Recurrence */}
          <div>
            <label className="block text-lg font-medium mb-1">
              Recurrence:
            </label>
            <input
              type="text"
              name="recurrence"
              value={formData.recurrence}
              onChange={handleInputChange}
              placeholder="e.g., daily, weekly, monthly, yearly"
              className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>
          {/* Reminder */}
          <div>
            <label className="block text-lg font-medium mb-1">
              Reminder (minutes):
            </label>
            <input
              type="number"
              name="reminder"
              value={formData.reminder}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>
          {/* Attachments */}
          <div>
            <label className="block text-lg font-medium mb-1">
              Attachment (File Name & File URL):
            </label>
            <div className="flex flex-col md:flex-row md:space-x-6">
              <input
                type="text"
                name="fileName"
                placeholder="File Name"
                value={formData.attachments[0].fileName}
                onChange={handleAttachmentChange}
                className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors mb-2 md:mb-0"
              />
              <input
                type="text"
                name="fileUrl"
                placeholder="File URL"
                value={formData.attachments[0].fileUrl}
                onChange={handleAttachmentChange}
                className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="block text-lg font-medium mb-1">Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:outline-none transition-colors"
              rows="3"
            />
          </div>
          {/* Action Buttons */}
          <div className="flex space-x-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              {isUpdateMode ? "Update Event" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="bg-red-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal for displaying event details */}
      {selectedEvent && (
        <Modal
          isOpen={detailModalIsOpen}
          onRequestClose={closeDetailModal}
          contentLabel="Event Details"
          className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-auto overflow-y-auto max-h-[90vh] transition-all"
          overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center"
          ariaHideApp={false}
        >
          <h2 className="text-3xl font-bold mb-8">Event Details</h2>
          <div className="space-y-4 text-lg">
            {renderField("Title", selectedEvent.title)}
            {renderField("Description", selectedEvent.description)}
            {selectedEvent.startDate &&
              renderField(
                "Start Date",
                new Date(selectedEvent.startDate).toDateString()
              )}
            {selectedEvent.endDate &&
              renderField(
                "End Date",
                new Date(selectedEvent.endDate).toDateString()
              )}
            {renderField("Start Time", selectedEvent.startTime)}
            {renderField("End Time", selectedEvent.endTime)}
            {renderField("All Day", selectedEvent.allDay ? "Yes" : "No")}
            {renderField("Location", selectedEvent.location)}
            {renderField("Meeting URL", selectedEvent.meetingUrl)}
            {renderField("Event Type", selectedEvent.eventType)}

            {/* כאן שדות externals */}
            {selectedEvent.externalParticipants &&
              selectedEvent.externalParticipants.length > 0 &&
              selectedEvent.externalParticipants[0].name !== "" &&
              renderField(
                "External Participant",
                `${selectedEvent.externalParticipants[0].name}${
                  selectedEvent.externalParticipants[0].email
                    ? " (" + selectedEvent.externalParticipants[0].email + ")"
                    : ""
                }${
                  selectedEvent.externalParticipants[0].phone
                    ? " (" + selectedEvent.externalParticipants[0].phone + ")"
                    : ""
                }`
              )}

            {/* כאן נוסיף את הצגת העובדים הפנימיים (participants) */}
            {selectedEvent.participants &&
              selectedEvent.participants.length > 0 && (
                <div>
                  <p className="font-bold">Internal Participants:</p>
                  <ul className="ml-4 list-disc">
                    {selectedEvent.participants.map((emp) => (
                      <li key={emp._id}>
                        {/* בהנחה שבמודל של Employee יש name, phone, tz, role, וכו' */}
                        {emp.name}
                        {emp.phone && ` (Phone: ${emp.phone})`}
                        {emp.email && ` (Email: ${emp.email})`}
                        {emp.role && ` - Role: ${emp.role}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {renderField("Recurrence", selectedEvent.recurrence)}
            {selectedEvent.attachments &&
              selectedEvent.attachments.length > 0 &&
              selectedEvent.attachments[0].fileName !== "" &&
              renderField(
                "Attachment",
                `${selectedEvent.attachments[0].fileName}: ${selectedEvent.attachments[0].fileUrl}`
              )}
            {renderField("Notes", selectedEvent.notes)}
          </div>
          <div className="mt-8 flex justify-end space-x-6">
            <button
              onClick={handleUpdateEvent}
              className="bg-green-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              Update Event
            </button>
            <button
              onClick={handleDeleteEvent}
              className="bg-red-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              Delete Event
            </button>
            <button
              onClick={closeDetailModal}
              className="bg-gray-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper function to render a field only if its value is not empty
const renderField = (label, value) => {
  if (!value) return null;
  return (
    <p>
      <span className="font-bold">{label}:</span> {value}
    </p>
  );
};

export default Events;
