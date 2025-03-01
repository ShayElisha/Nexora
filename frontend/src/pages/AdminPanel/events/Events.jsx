import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Modal from "react-modal";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const Events = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // State לניהול בחירת תאריך, מודלים, האירוע הנבחר ומצב עדכון
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [detailModalIsOpen, setDetailModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // טופס יצירת/עריכת אירוע
  const [formData, setFormData] = useState({
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

  // שימוש ב-React Query לטעינת האירועים
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await axiosInstance.get("/events");
      return response.data;
    },
  });
  const events = eventsData || [];

  // שימוש ב-React Query לטעינת רשימת העובדים עבור משתתפים פנימיים
  const {
    data: employeesData,
    isLoading: isEmployeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees");
      return response.data.data;
    },
  });
  const employeeOptions = employeesData || [];

  // --- Handlers לשינויי טופס ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMultiSelectChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, participants: selectedOptions }));
  };

  const handleExternalParticipantChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.externalParticipants];
      updated[0] = { ...updated[0], [name]: value };
      return { ...prev, externalParticipants: updated };
    });
  };

  const handleAttachmentChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.attachments];
      updated[0] = { ...updated[0], [name]: value };
      return { ...prev, attachments: updated };
    });
  };

  const handleRemoveInternalParticipant = (empId) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((id) => id !== empId),
    }));
  };

  // --- Handlers לניהול המודלים ---
  // פתיחת מודל ליצירת אירוע בתאריך מסוים
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

  // סגירת מודל יצירה/עדכון ואיפוס הטופס
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

  // פתיחת פרטי אירוע במודל
  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setDetailModalIsOpen(true);
  };

  // סגירת מודל פרטי אירוע
  const closeDetailModal = () => {
    setDetailModalIsOpen(false);
    setSelectedEvent(null);
  };

  // Mutation ליצירה או עדכון אירוע
  const mutation = useMutation({
    mutationFn: async (dataToSend) => {
      if (isUpdateMode) {
        const response = await axiosInstance.put(
          `/events/${dataToSend._id}`,
          dataToSend
        );
        return response.data;
      } else {
        const response = await axiosInstance.post("/events", dataToSend);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(
        isUpdateMode ? t("events.updatedSuccess") : t("events.createdSuccess")
      );
      closeModal();
    },
    onError: (error) => {
      console.error("Error creating/updating event:", error);
      toast.error(t("events.createUpdateError"));
    },
  });

  // Handler לשליחת טופס יצירה/עדכון אירוע
  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = { ...formData };

    if (dataToSend.participantType === "internal") {
      dataToSend.externalParticipants = [];
    } else if (dataToSend.participantType === "external") {
      dataToSend.participants = [];
    } else {
      dataToSend.participants = [];
      dataToSend.externalParticipants = [];
    }

    mutation.mutate(dataToSend);
  };

  // Mutation למחיקת אירוע
  const deleteMutation = useMutation({
    mutationFn: async (eventId) => {
      const response = await axiosInstance.delete(`/events/${eventId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(t("events.deletedSuccess"));
      closeDetailModal();
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error(t("events.deletedError"));
    },
  });

  // Handler למחיקת אירוע
  const handleDeleteEvent = () => {
    if (!selectedEvent || !selectedEvent._id) return;
    deleteMutation.mutate(selectedEvent._id);
  };

  // Helper להצגת שדה אם יש לו ערך
  const renderField = (label, value) => {
    if (!value) return null;
    return (
      <p className="text-base">
        <span className="font-bold">{label}:</span> {value}
      </p>
    );
  };

  // הפונקציה מחזירה את רשימת האירועים לתאריך מסוים
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

  // הגדרת מחלקת CSS עבור כל תא בלוח, תוך שימוש במחלקות מהקונפיגורציה
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      return `relative min-h-[150px] flex flex-col justify-center items-center border border-border-color transition-colors duration-200 hover:bg-accent/10 ${
        date.getMonth() === activeStartDate.getMonth()
          ? "bg-bg"
          : "bg-secondary"
      }`;
    }
    return "";
  };

  // תוכן התא בלוח: מציג את מספר היום ושמות האירועים
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const dayEvents = getEventsForDate(date);
      return (
        <>
          <div className="absolute top-1 right-1 text-xs font-bold text-text">
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
                className="cursor-pointer bg-accent text-button-text px-1 py-0.5 rounded text-xs text-center transition transform hover:scale-105"
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

  // מצב עדכון – ממלא את הטופס בפרטי האירוע הנבחר
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

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col">
      <h1 className="text-4xl font-extrabold text-center py-6 text-primary">
        {t("events.calendar")}
      </h1>
      {/* Calendar Container */}
      <div className="flex-grow w-full px-4">
        <Calendar
          locale={i18n.language}
          onClickDay={openModalForDate}
          tileContent={tileContent}
          tileClassName={tileClassName}
          onActiveStartDateChange={({ activeStartDate }) =>
            setActiveStartDate(activeStartDate)
          }
          formatDay={() => ""}
          nextLabel={
            <span className="text-primary text-2xl">{t("events.next")}</span>
          }
          prevLabel={
            <span className="text-primary text-2xl">{t("events.prev")}</span>
          }
          navigationLabel={({ label }) => (
            <div className="bg-secondary text-primary p-2 rounded mb-4 text-center text-xl font-semibold">
              {label}
            </div>
          )}
          className="mx-auto w-full max-w-6xl bg-white shadow-xl rounded-lg p-6"
        />
      </div>

      {/* Modal ליצירה/עדכון אירוע */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel={t("events.modalLabel")}
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl mx-auto overflow-y-auto max-h-[90vh] transition-all"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center"
        ariaHideApp={false}
      >
        <h2 className="text-2xl font-bold mb-6">
          {isUpdateMode
            ? t("events.updateEvent")
            : t("events.createEventFor", {
                date: selectedDate && selectedDate.toDateString(),
              })}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-lg font-medium mb-1">
              {t("events.title")}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
              required
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-lg font-medium mb-1">
              {t("events.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
              rows="3"
            />
          </div>
          {/* Start & End Dates */}
          <div className="flex flex-col md:flex-row md:space-x-6">
            <div className="flex-1">
              <label className="block text-lg font-medium mb-1">
                {t("events.startDate")}
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-lg font-medium mb-1">
                {t("events.endDate")}
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
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
            <label className="text-lg font-medium">{t("events.allDay")}</label>
          </div>
          {/* Conditionally render Start Time and End Time if not All Day */}
          {!formData.allDay && (
            <div className="flex flex-col md:flex-row md:space-x-6">
              <div className="flex-1">
                <label className="block text-lg font-medium mb-1">
                  {t("events.startTime")}
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
                  required={!formData.allDay}
                />
              </div>
              <div className="flex-1">
                <label className="block text-lg font-medium mb-1">
                  {t("events.endTime")}
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
                  required={!formData.allDay}
                />
              </div>
            </div>
          )}
          {/* Participant Type */}
          <div>
            <label className="block text-lg font-medium mb-1">
              {t("events.participantTypes")}
            </label>
            <select
              name="participantType"
              value={formData.participantType}
              onChange={handleInputChange}
              className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
            >
              <option value="external">
                {t("events.participantType.external")}
              </option>
              <option value="internal">
                {t("events.participantType.internal")}
              </option>
              <option value="other">{t("events.participantType.other")}</option>
            </select>
          </div>
          {/* Fields for external participants */}
          {formData.participantType === "external" && (
            <div>
              <label className="block text-lg font-medium mb-1">
                {t("events.externalParticipantLabel")}
              </label>
              <div className="flex flex-col md:flex-row md:space-x-6">
                <input
                  type="text"
                  name="name"
                  placeholder={t("events.externalParticipant.namePlaceholder")}
                  value={formData.externalParticipants[0].name}
                  onChange={handleExternalParticipantChange}
                  className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors mb-2 md:mb-0"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder={t("events.externalParticipant.emailPlaceholder")}
                  value={formData.externalParticipants[0].email}
                  onChange={handleExternalParticipantChange}
                  className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors mb-2 md:mb-0"
                />
                <input
                  type="text"
                  name="phone"
                  placeholder={t("events.externalParticipant.phonePlaceholder")}
                  value={formData.externalParticipants[0].phone}
                  onChange={handleExternalParticipantChange}
                  className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
          {/* Fields for internal participants */}
          {formData.participantType === "internal" && (
            <div>
              <label className="block text-lg font-medium mb-1">
                {t("events.selectInternalParticipants")}
              </label>
              <select
                name="participants"
                multiple
                value={formData.participants}
                onChange={handleMultiSelectChange}
                className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
              >
                {employeeOptions.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
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
          {/* For participantType "other" – אין שדות נוספים */}
          <div>
            <label className="block text-lg font-medium mb-1">
              {t("events.recurrence")}
            </label>
            <input
              type="text"
              name="recurrence"
              value={formData.recurrence}
              onChange={handleInputChange}
              placeholder={t("events.recurrencePlaceholder")}
              className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">
              {t("events.reminderLabel")}
            </label>
            <input
              type="number"
              name="reminder"
              value={formData.reminder}
              onChange={handleInputChange}
              className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">
              {t("events.attachmentLabel")}
            </label>
            <div className="flex flex-col md:flex-row md:space-x-6">
              <input
                type="text"
                name="fileName"
                placeholder={t("events.attachment.fileNamePlaceholder")}
                value={formData.attachments[0].fileName}
                onChange={handleAttachmentChange}
                className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors mb-2 md:mb-0"
              />
              <input
                type="text"
                name="fileUrl"
                placeholder={t("events.attachment.fileUrlPlaceholder")}
                value={formData.attachments[0].fileUrl}
                onChange={handleAttachmentChange}
                className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">
              {t("events.notes")}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full border border-border-color rounded p-3 focus:ring-primary focus:outline-none transition-colors"
              rows="3"
            />
          </div>
          <div className="flex space-x-6">
            <button
              type="submit"
              className="bg-button-bg text-button-text px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              {isUpdateMode ? t("events.updateEvent") : t("events.createEvent")}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="bg-red-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              {t("events.cancel")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal להצגת פרטי אירוע */}
      {selectedEvent && (
        <Modal
          isOpen={detailModalIsOpen}
          onRequestClose={closeDetailModal}
          contentLabel={t("events.eventDetails")}
          className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-auto overflow-y-auto max-h-[90vh] transition-all"
          overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center"
          ariaHideApp={false}
        >
          <h2 className="text-3xl font-bold mb-8">
            {t("events.eventDetails")}
          </h2>
          <div className="space-y-4 text-lg">
            {renderField(t("events.title"), selectedEvent.title)}
            {renderField(t("events.description"), selectedEvent.description)}
            {selectedEvent.startDate &&
              renderField(
                t("events.startDate"),
                new Date(selectedEvent.startDate).toDateString()
              )}
            {selectedEvent.endDate &&
              renderField(
                t("events.endDate"),
                new Date(selectedEvent.endDate).toDateString()
              )}
            {renderField(t("events.startTime"), selectedEvent.startTime)}
            {renderField(t("events.endTime"), selectedEvent.endTime)}
            {renderField(
              t("events.allDay"),
              selectedEvent.allDay ? t("events.yes") : t("events.no")
            )}
            {renderField(t("events.location"), selectedEvent.location)}
            {renderField(t("events.meetingUrl"), selectedEvent.meetingUrl)}
            {renderField(t("events.eventType"), selectedEvent.eventType)}
            {selectedEvent.externalParticipants &&
              selectedEvent.externalParticipants.length > 0 &&
              selectedEvent.externalParticipants[0].name !== "" &&
              renderField(
                t("events.externalParticipant"),
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
            {selectedEvent.participants &&
              selectedEvent.participants.length > 0 && (
                <div>
                  <p className="font-bold">
                    {t("events.internalParticipants")}:
                  </p>
                  <ul className="ml-4 list-disc">
                    {selectedEvent.participants.map((emp) => (
                      <li key={emp._id}>
                        {emp.name}
                        {emp.phone && ` (${t("events.phone")}: ${emp.phone})`}
                        {emp.email && ` (${t("events.email")}: ${emp.email})`}
                        {emp.role && ` - ${t("events.role")}: ${emp.role}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {renderField(t("events.recurrence"), selectedEvent.recurrence)}
            {selectedEvent.attachments &&
              selectedEvent.attachments.length > 0 &&
              selectedEvent.attachments[0].fileName !== "" &&
              renderField(
                t("events.attachment"),
                `${selectedEvent.attachments[0].fileName}: ${selectedEvent.attachments[0].fileUrl}`
              )}
            {renderField(t("events.notes"), selectedEvent.notes)}
          </div>
          <div className="mt-8 flex justify-end space-x-6">
            <button
              onClick={handleUpdateEvent}
              className="bg-green-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              {t("events.updateEvent")}
            </button>
            <button
              onClick={handleDeleteEvent}
              className="bg-red-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              {t("events.deleteEvent")}
            </button>
            <button
              onClick={closeDetailModal}
              className="bg-gray-600 text-white px-6 py-3 rounded shadow-lg transform transition hover:scale-105"
            >
              {t("events.close")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Events;
