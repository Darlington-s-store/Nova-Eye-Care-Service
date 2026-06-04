export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDateStr: string; // YYYY-MM-DD
  startTimeStr: string; // HH:MM or HH:MM AM/PM
}

export const getGoogleCalendarUrl = (event: CalendarEventData) => {
  const title = encodeURIComponent(event.title);
  
  // Normalize time string to 24h format (HH:MM)
  let hoursStr = "09";
  let minutesStr = "00";
  const timeStr = event.startTimeStr.trim().toUpperCase();
  
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const cleanTime = timeStr.replace(/\s*[A-Z]{2}/, "").trim();
    const parts = cleanTime.split(":");
    let hours = parseInt(parts[0], 10) || 9;
    const minutes = parts[1] || "00";
    
    if (timeStr.includes("PM") && hours < 12) {
      hours += 12;
    } else if (timeStr.includes("AM") && hours === 12) {
      hours = 0;
    }
    hoursStr = hours.toString().padStart(2, "0");
    minutesStr = minutes;
  } else {
    const parts = timeStr.split(":");
    hoursStr = (parts[0] || "09").padStart(2, "0");
    minutesStr = (parts[1] || "00").padStart(2, "0");
  }

  // Parse YYYY-MM-DD date parts
  // We use split(/[-T]/) to ensure it extracts just the date part safely
  const dateParts = event.startDateStr.split(/[-T]/);
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);
  
  // Construct local date object
  const start = new Date(year, month, day, parseInt(hoursStr, 10), parseInt(minutesStr, 10));
  
  // Add 30 minutes duration
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  
  // Format to GCal template format: YYYYMMDDTHHMMSSZ (UTC time)
  const formatToGCalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  const dates = `${formatToGCalDate(start)}/${formatToGCalDate(end)}`;
  const details = encodeURIComponent(event.description);
  const location = encodeURIComponent(event.location);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};
