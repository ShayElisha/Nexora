import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Ticket,
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  Calendar,
  Tag,
  Flag,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "Open":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Resolved":
      return "bg-green-100 text-green-700 border-green-300";
    case "Closed":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "Bug Report":
      return "🐛";
    case "Feature Request":
      return "✨";
    case "Technical Support":
      return "🔧";
    case "Billing":
      return "💳";
    case "General Question":
      return "❓";
    case "Account Issue":
      return "👤";
    default:
      return "📋";
  }
};

const SupportTicketDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Fetch ticket
  const {
    data: ticket,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["supportTicket", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/support-tickets/${id}`);
      return res.data.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("supportTickets.failedToFetchTicket"));
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ id, comment }) => {
      await axiosInstance.post(`/support-tickets/${id}/comments`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["supportTicket", id]);
      setNewComment("");
      toast.success(t("supportTickets.commentAddedSuccessfully"));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("supportTickets.failedToAddComment"));
    },
  });

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error(t("supportTickets.pleaseEnterComment"));
      return;
    }
    addCommentMutation.mutate({ id, comment: newComment });
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="text-center">
          <p className="text-red-500 font-medium text-lg">{t("supportTickets.ticketNotFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard/support-tickets")}
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-3xl">{getCategoryIcon(ticket.category)}</span>
              {ticket.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User size={16} />
                {ticket.createdBy?.name || t("supportTickets.unknown")}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2">{t("supportTickets.status")}</label>
            <div
              className={`px-4 py-2 rounded-lg border text-center font-semibold ${getStatusColor(
                ticket.status
              )}`}
            >
              {t(`supportTickets.status.${ticket.status.toLowerCase().replace(' ', '')}`)}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2">{t("supportTickets.priority")}</label>
            <div
              className={`px-4 py-2 rounded-lg border text-center font-semibold ${getStatusColor(
                ticket.status
              )}`}
            >
              {t(`supportTickets.priority.${ticket.priority.toLowerCase()}`)}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 p-6 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="text-lg font-semibold mb-3">{t("supportTickets.description")}</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Comments Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            {t("supportTickets.comments")} ({ticket.comments?.length || 0})
          </h2>

          {/* Comments List */}
          <div className="space-y-4 mb-4">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {comment.userId?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {comment.userId?.name || t("supportTickets.unknown")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-2">{comment.comment}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">{t("supportTickets.noComments")}</p>
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("supportTickets.addCommentPlaceholder")}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border resize-none"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={addCommentMutation.isLoading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {addCommentMutation.isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t("supportTickets.adding")}
                </>
              ) : (
                <>
                  <Send size={20} />
                  {t("supportTickets.addComment")}
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetails;

