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
  status?: string;
}

export interface UserNameDTO {
  firstName: string;
  lastName: string;
}
