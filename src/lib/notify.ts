import { apiService } from "./api";

type NotificationInput = {
  title: string;
  body: string;
  link?: string;
};

export const notifyUser = async (recipientId: string, n: NotificationInput) => {
  try {
    await apiService.notifications.create({
      recipientId,
      audience: "user",
      title: n.title,
      body: n.body,
      link: n.link ?? null,
    });
  } catch (err) {
    console.error("Failed to notify user:", err);
  }
};

export const notifyAdmins = async (n: NotificationInput) => {
  try {
    await apiService.notifications.create({
      recipientId: null,
      audience: "admin",
      title: n.title,
      body: n.body,
      link: n.link ?? null,
    });
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
};
