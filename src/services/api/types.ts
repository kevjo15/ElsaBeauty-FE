export interface Service {
  id: string;
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
  startTime: string;
  endTime: string;
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
  // Potential extra fields from backend
  employeeName?: string;
  customerName?: string;
  serviceName?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  employee?: { firstName?: string; lastName?: string };
  service?: { id: string; name: string; description?: string; duration?: string; price?: number };
}

export interface UserNameDTO {
  firstName: string;
  lastName: string;
}

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
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
