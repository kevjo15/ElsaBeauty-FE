export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  imageUrl: string;
}

/**
 * Body för skapa/uppdatera behandling. duration är en .NET TimeSpan-sträng
 * ("HH:mm:ss"). imageUrl ignoreras av API:et (bilden hanteras via
 * uploadServiceImage) men fältet ingår i DTO-kontraktet — skicka "".
 */
export interface ServiceInput {
  name: string;
  description: string;
  duration: string;
  price: number;
  imageUrl: string;
}

export interface Category {
  name: string;
}

export interface CategoryWithServices {
  id: string;
  name: string;
  services: Service[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DaySlots {
  date: string;
  availableSlots: TimeSlot[];
}

export interface BookingRequest {
  userId: string;
  serviceId: string;
  employeeId: string;
  startTime: string;
  endTime: string;
}

export interface EmployeeSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface WorkDay {
  date: string;      // "yyyy-MM-dd"
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
}

export interface SetWorkDaysRequest {
  from: string;          // "yyyy-MM-dd"
  to: string;            // "yyyy-MM-dd"
  workDays: WorkDay[];
}

export interface GenerateWorkDaysRequest {
  from: string; // "yyyy-MM-dd"
  to: string;   // "yyyy-MM-dd"
}

export interface BookingResponse {
  id: string;
  userId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  employeeId?: string;
  conversationId?: string;
  isChatOpen?: boolean;
  status?: string;
  // Flat strings
  employeeName?: string;
  customerName?: string;
  serviceName?: string;
  // Nested objects populated from BE
  user?: { firstName?: string; lastName?: string; email?: string };
  employee?: { firstName?: string; lastName?: string; email?: string };
  service?: { id: string; name: string; description?: string; duration?: string; price?: number };
}

export interface BookingsReportRow {
  startTime: string;
  serviceName: string;
  price: number;
  customerName: string;
  employeeName: string;
  isCancelled: boolean;
}

export interface BookingsReportServiceLine {
  serviceName: string;
  count: number;
  revenue: number;
}

export interface BookingsReport {
  from: string;
  to: string;
  totalBookings: number;
  totalRevenue: number;
  cancelledBookings: number;
  perService: BookingsReportServiceLine[];
  rows: BookingsReportRow[];
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt?: string;
}

export interface BookingChatMeta {
  startTime: string;
  endTime: string;
  status?: string;
  isChatOpen?: boolean;
}

export interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export enum NotificationType {
  BookingReminder = 0,
  BookingConfirmation = 1,
  BookingCancellation = 2,
  BookingUpdated = 3,
  MessageReceived = 4,
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: NotificationType;
  bookingId?: string;
  userId: string;
  conversationId?: string;
}
