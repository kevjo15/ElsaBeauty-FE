import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/services/api/authContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, Coffee, Sun, Moon, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Service,
  TimeSlot,
  BookingRequest,
  getAllServices,
  getAvailableTimeSlots,
  createBooking,
} from "@/services/api/apiService";

// Define view types for time slot display
type TimeSlotViewType = "grid" | "timeline" | "list";

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewType, setViewType] = useState<TimeSlotViewType>("grid");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getAllServices();
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Failed to load services. Please try again later.");
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (selectedService && selectedDate) {
        setLoading(true);
        setError(null);
        try {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          console.log("Fetching time slots for:", {
            serviceId: selectedService.id,
            date: formattedDate,
          });

          const mockSlots: TimeSlot[] = [];
          const startHour = 9;
          const endHour = 17;

          for (let hour = startHour; hour < endHour; hour++) {
            const startTime = new Date(selectedDate);
            startTime.setHours(hour, 0, 0, 0);

            const endTime = new Date(selectedDate);
            endTime.setHours(hour + 1, 0, 0, 0);

            mockSlots.push({
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              isAvailable: true,
            });
          }

          try {
            const slots = await getAvailableTimeSlots(
              selectedService.id,
              formattedDate
            );
            setAvailableSlots(slots);
          } catch (apiError) {
            console.error("API error, using mock data:", apiError);
            setAvailableSlots(mockSlots);
          }

          setSelectedSlot(null);
        } catch (error) {
          console.error("Error fetching time slots:", error);
          setError(
            "Failed to load available time slots. Using mock data for demonstration."
          );

          const mockSlots: TimeSlot[] = [];
          const startHour = 9;
          const endHour = 17;

          for (let hour = startHour; hour < endHour; hour++) {
            const startTime = new Date(selectedDate);
            startTime.setHours(hour, 0, 0, 0);

            const endTime = new Date(selectedDate);
            endTime.setHours(hour + 1, 0, 0, 0);

            mockSlots.push({
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              isAvailable: true,
            });
          }

          setAvailableSlots(mockSlots);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTimeSlots();
  }, [selectedService, selectedDate]);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId) || null;
    setSelectedService(service);
    setSelectedSlot(null);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBookingSubmit = async () => {
    if (!user || !selectedService || !selectedSlot) {
      setError("Please select a service and time slot.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("User data:", user);

      const bookingData: BookingRequest = {
        userId: user?.id || "test-user-id",
        serviceId: selectedService.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      };

      console.log("Sending booking data:", bookingData);

      await createBooking(bookingData);
      setSuccess("Booking created successfully!");

      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setAvailableSlots([]);

      setTimeout(() => {
        navigate("/bookings");
      }, 2000);
    } catch (error) {
      console.error("Error creating booking:", error);
      setError("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    return `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;
  };

  // Helper function to get time period based on hour
  const getTimePeriod = (hour: number) => {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    return "evening";
  };

  // Scroll to a specific time period in the timeline view
  const scrollToTimePeriod = (period: "morning" | "afternoon" | "evening") => {
    if (!timelineRef.current) return;

    const hourToScrollTo =
      period === "morning" ? 9 : period === "afternoon" ? 13 : 17;
    const timeSlotElements =
      timelineRef.current.querySelectorAll(".timeline-slot");

    for (let i = 0; i < timeSlotElements.length; i++) {
      const slotTime = timeSlotElements[i].getAttribute("data-time");
      if (slotTime && parseInt(slotTime) >= hourToScrollTo) {
        timeSlotElements[i].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        break;
      }
    }
  };

  // Get the count of available slots by time period
  const getSlotCountByPeriod = () => {
    const counts = { morning: 0, afternoon: 0, evening: 0 };

    availableSlots.forEach((slot) => {
      const hour = new Date(slot.startTime).getHours();
      if (hour >= 5 && hour < 12) counts.morning++;
      else if (hour >= 12 && hour < 17) counts.afternoon++;
      else counts.evening++;
    });

    return counts;
  };

  // Calculate slot popularity (mock data for demonstration)
  const getSlotPopularity = (slot: TimeSlot): "low" | "medium" | "high" => {
    const hour = new Date(slot.startTime).getHours();
    const minute = new Date(slot.startTime).getMinutes();

    // This is just a mock implementation - in a real app, this would be based on actual booking data
    if (hour === 12 || hour === 13 || (hour === 17 && minute === 0))
      return "high";
    if (hour === 10 || hour === 11 || hour === 16) return "medium";
    return "low";
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Book an Appointment</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={selectedService?.id || ""}
                    onValueChange={handleServiceChange}
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {service.price} kr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedService && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-medium">{selectedService.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedService.description}
                    </p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>Duration: {selectedService.duration}</span>
                      <span>Price: {selectedService.price} kr</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                        disabled={!selectedService}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Select Time Slot</CardTitle>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewType("grid")}
                          className={viewType === "grid" ? "bg-primary/10" : ""}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <rect width="7" height="7" x="3" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="14" rx="1" />
                            <rect width="7" height="7" x="3" y="14" rx="1" />
                          </svg>
                          Grid
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View as grid</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewType("timeline")}
                          className={
                            viewType === "timeline" ? "bg-primary/10" : ""
                          }
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Timeline
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View as timeline</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewType("list")}
                          className={viewType === "list" ? "bg-primary/10" : ""}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <line x1="8" x2="21" y1="6" y2="6" />
                            <line x1="8" x2="21" y1="12" y2="12" />
                            <line x1="8" x2="21" y1="18" y2="18" />
                            <line x1="3" x2="3.01" y1="6" y2="6" />
                            <line x1="3" x2="3.01" y1="12" y2="12" />
                            <line x1="3" x2="3.01" y1="18" y2="18" />
                          </svg>
                          List
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View as list</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : selectedService && selectedDate ? (
                availableSlots.length > 0 ? (
                  <div className="space-y-4">
                    {/* Quick selection shortcuts */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          if (viewType === "timeline") {
                            scrollToTimePeriod("morning");
                          } else {
                            document
                              .getElementById("morning-section")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      >
                        <Sun className="h-4 w-4 mr-1 text-yellow-500" />
                        Morning
                        <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                          {getSlotCountByPeriod().morning}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          if (viewType === "timeline") {
                            scrollToTimePeriod("afternoon");
                          } else {
                            document
                              .getElementById("afternoon-section")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      >
                        <Coffee className="h-4 w-4 mr-1 text-orange-500" />
                        Afternoon
                        <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                          {getSlotCountByPeriod().afternoon}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          if (viewType === "timeline") {
                            scrollToTimePeriod("evening");
                          } else {
                            document
                              .getElementById("evening-section")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      >
                        <Moon className="h-4 w-4 mr-1 text-blue-500" />
                        Evening
                        <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                          {getSlotCountByPeriod().evening}
                        </span>
                      </Button>
                    </div>

                    {/* Grid View */}
                    {viewType === "grid" && (
                      <div className="space-y-4">
                        <div
                          id="morning-section"
                          className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md"
                        >
                          <h3 className="text-sm font-medium flex items-center">
                            <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                            Morning
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1.5 mt-2">
                            {availableSlots
                              .filter((slot) => {
                                const hour = new Date(
                                  slot.startTime
                                ).getHours();
                                return hour >= 8 && hour < 12;
                              })
                              .map((slot, index) => {
                                const popularity = getSlotPopularity(slot);
                                return (
                                  <TooltipProvider key={index}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant={
                                            selectedSlot &&
                                            selectedSlot.startTime ===
                                              slot.startTime
                                              ? "default"
                                              : "outline"
                                          }
                                          className={cn(
                                            "h-auto py-2 w-full relative",
                                            popularity === "high" &&
                                              "border-orange-300",
                                            popularity === "medium" &&
                                              "border-yellow-300"
                                          )}
                                          onClick={() => handleSlotSelect(slot)}
                                        >
                                          {formatTimeSlot(slot)}
                                          {popularity === "high" && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                            </span>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {popularity === "high"
                                            ? "Popular time - booking quickly!"
                                            : popularity === "medium"
                                            ? "Moderately popular time"
                                            : "Plenty of availability"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                          </div>
                        </div>

                        <div
                          id="afternoon-section"
                          className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md"
                        >
                          <h3 className="text-sm font-medium flex items-center">
                            <Coffee className="h-4 w-4 mr-2 text-orange-500" />
                            Afternoon
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1.5 mt-2">
                            {availableSlots
                              .filter((slot) => {
                                const hour = new Date(
                                  slot.startTime
                                ).getHours();
                                return hour >= 12 && hour < 17;
                              })
                              .map((slot, index) => {
                                const popularity = getSlotPopularity(slot);
                                return (
                                  <TooltipProvider key={index}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          key={index}
                                          variant={
                                            selectedSlot &&
                                            selectedSlot.startTime ===
                                              slot.startTime
                                              ? "default"
                                              : "outline"
                                          }
                                          className={cn(
                                            "h-auto py-2 w-full relative",
                                            popularity === "high" &&
                                              "border-orange-300",
                                            popularity === "medium" &&
                                              "border-yellow-300"
                                          )}
                                          onClick={() => handleSlotSelect(slot)}
                                        >
                                          {formatTimeSlot(slot)}
                                          {popularity === "high" && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                            </span>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {popularity === "high"
                                            ? "Popular time - booking quickly!"
                                            : popularity === "medium"
                                            ? "Moderately popular time"
                                            : "Plenty of availability"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                          </div>
                        </div>

                        <div
                          id="evening-section"
                          className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md"
                        >
                          <h3 className="text-sm font-medium flex items-center">
                            <Moon className="h-4 w-4 mr-2 text-blue-500" />
                            Evening
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-1.5 mt-2">
                            {availableSlots
                              .filter((slot) => {
                                const hour = new Date(
                                  slot.startTime
                                ).getHours();
                                return hour >= 17;
                              })
                              .map((slot, index) => {
                                const popularity = getSlotPopularity(slot);
                                return (
                                  <TooltipProvider key={index}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          key={index}
                                          variant={
                                            selectedSlot &&
                                            selectedSlot.startTime ===
                                              slot.startTime
                                              ? "default"
                                              : "outline"
                                          }
                                          className={cn(
                                            "h-auto py-2 w-full relative",
                                            popularity === "high" &&
                                              "border-orange-300",
                                            popularity === "medium" &&
                                              "border-yellow-300"
                                          )}
                                          onClick={() => handleSlotSelect(slot)}
                                        >
                                          {formatTimeSlot(slot)}
                                          {popularity === "high" && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                            </span>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {popularity === "high"
                                            ? "Popular time - booking quickly!"
                                            : popularity === "medium"
                                            ? "Moderately popular time"
                                            : "Plenty of availability"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline View */}
                    {viewType === "timeline" && (
                      <div className="relative">
                        <div className="absolute top-0 bottom-0 left-16 w-px bg-border"></div>
                        <div
                          ref={timelineRef}
                          className="space-y-2 max-h-[400px] overflow-y-auto pr-2"
                        >
                          {availableSlots
                            .sort(
                              (a, b) =>
                                new Date(a.startTime).getTime() -
                                new Date(b.startTime).getTime()
                            )
                            .map((slot, index) => {
                              const startTime = new Date(slot.startTime);
                              const hour = startTime.getHours();
                              const timePeriod = getTimePeriod(hour);
                              const popularity = getSlotPopularity(slot);

                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "timeline-slot flex items-center p-2 rounded-md transition-colors",
                                    timePeriod === "morning" &&
                                      "bg-yellow-50 dark:bg-yellow-950/20",
                                    timePeriod === "afternoon" &&
                                      "bg-orange-50 dark:bg-orange-950/20",
                                    timePeriod === "evening" &&
                                      "bg-blue-50 dark:bg-blue-950/20",
                                    selectedSlot &&
                                      selectedSlot.startTime ===
                                        slot.startTime &&
                                      "border-2 border-primary"
                                  )}
                                  data-time={hour}
                                  onClick={() => handleSlotSelect(slot)}
                                >
                                  <div className="w-16 font-medium text-right pr-4">
                                    {format(startTime, "HH:mm")}
                                  </div>
                                  <div className="relative w-4 h-4 rounded-full bg-background border-2 border-primary z-10 flex-shrink-0">
                                    {popularity === "high" && (
                                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-4 flex-grow">
                                    <div className="font-medium">
                                      {formatTimeSlot(slot)}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      {timePeriod === "morning" && (
                                        <Sun className="h-3 w-3 mr-1 text-yellow-500" />
                                      )}
                                      {timePeriod === "afternoon" && (
                                        <Coffee className="h-3 w-3 mr-1 text-orange-500" />
                                      )}
                                      {timePeriod === "evening" && (
                                        <Moon className="h-3 w-3 mr-1 text-blue-500" />
                                      )}
                                      {timePeriod.charAt(0).toUpperCase() +
                                        timePeriod.slice(1)}

                                      {popularity === "high" && (
                                        <span className="ml-2 flex items-center text-orange-600">
                                          <Users className="h-3 w-3 mr-1" />
                                          Popular
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* List View */}
                    {viewType === "list" && (
                      <Tabs defaultValue="morning" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger
                            value="morning"
                            className="flex items-center"
                          >
                            <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                            Morning
                            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                              {getSlotCountByPeriod().morning}
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="afternoon"
                            className="flex items-center"
                          >
                            <Coffee className="h-4 w-4 mr-2 text-orange-500" />
                            Afternoon
                            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                              {getSlotCountByPeriod().afternoon}
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="evening"
                            className="flex items-center"
                          >
                            <Moon className="h-4 w-4 mr-2 text-blue-500" />
                            Evening
                            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                              {getSlotCountByPeriod().evening}
                            </span>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="morning" className="mt-4">
                          <div className="space-y-2">
                            {availableSlots
                              .filter((slot) => {
                                const hour = new Date(
                                  slot.startTime
                                ).getHours();
                                return hour >= 8 && hour < 12;
                              })
                              .map((slot, index) => {
                                const popularity = getSlotPopularity(slot);
                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex items-center p-3 rounded-md border transition-colors",
                                      selectedSlot &&
                                        selectedSlot.startTime ===
                                          slot.startTime
                                        ? "bg-primary/10 border-primary"
                                        : "hover:bg-muted/50",
                                      popularity === "high" &&
                                        "border-orange-300",
                                      popularity === "medium" &&
                                        "border-yellow-300"
                                    )}
                                    onClick={() => handleSlotSelect(slot)}
                                  >
                                    <div className="flex-grow">
                                      <div className="font-medium">
                                        {formatTimeSlot(slot)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Morning slot
                                      </div>
                                    </div>
                                    {popularity === "high" && (
                                      <div className="flex items-center text-orange-600 text-sm">
                                        <Users className="h-4 w-4 mr-1" />
                                        Popular
                                      </div>
                                    )}
                                    {selectedSlot &&
                                      selectedSlot.startTime ===
                                        slot.startTime && (
                                        <div className="ml-2 text-primary">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                          </svg>
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                          </div>
                        </TabsContent>

                        <TabsContent value="afternoon" className="mt-4">
                          <div className="space-y-2">
                            {availableSlots
                              .filter((slot) => {
                                const hour = new Date(
                                  slot.startTime
                                ).getHours();
                                return hour >= 12 && hour < 17;
                              })
                              .map((slot, index) => {
                                const popularity = getSlotPopularity(slot);
                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex items-center p-3 rounded-md border transition-colors",
                                      selectedSlot &&
                                        selectedSlot.startTime ===
                                          slot.startTime
                                        ? "bg-primary/10 border-primary"
                                        : "hover:bg-muted/50",
                                      popularity === "high" &&
                                        "border-orange-300",
                                      popularity === "medium" &&
                                        "border-yellow-300"
                                    )}
                                    onClick={() => handleSlotSelect(slot)}
                                  >
                                    <div className="flex-grow">
                                      <div className="font-medium">
                                        {formatTimeSlot(slot)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Afternoon slot
                                      </div>
                                    </div>
                                    {popularity === "high" && (
                                      <div className="flex items-center text-orange-600 text-sm">
                                        <Users className="h-4 w-4 mr-1" />
                                        Popular
                                      </div>
                                    )}
                                    {selectedSlot &&
                                      selectedSlot.startTime ===
                                        slot.startTime && (
                                        <div className="ml-2 text-primary">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                          </svg>
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                          </div>
                        </TabsContent>

                        <TabsContent value="evening" className="mt-4">
                          <div className="space-y-2">
                            {availableSlots
                              .filter((slot) => {
                                const hour = new Date(
                                  slot.startTime
                                ).getHours();
                                return hour >= 17;
                              })
                              .map((slot, index) => {
                                const popularity = getSlotPopularity(slot);
                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex items-center p-3 rounded-md border transition-colors",
                                      selectedSlot &&
                                        selectedSlot.startTime ===
                                          slot.startTime
                                        ? "bg-primary/10 border-primary"
                                        : "hover:bg-muted/50",
                                      popularity === "high" &&
                                        "border-orange-300",
                                      popularity === "medium" &&
                                        "border-yellow-300"
                                    )}
                                    onClick={() => handleSlotSelect(slot)}
                                  >
                                    <div className="flex-grow">
                                      <div className="font-medium">
                                        {formatTimeSlot(slot)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Evening slot
                                      </div>
                                    </div>
                                    {popularity === "high" && (
                                      <div className="flex items-center text-orange-600 text-sm">
                                        <Users className="h-4 w-4 mr-1" />
                                        Popular
                                      </div>
                                    )}
                                    {selectedSlot &&
                                      selectedSlot.startTime ===
                                        slot.startTime && (
                                        <div className="ml-2 text-primary">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                          </svg>
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}

                    {selectedSlot && (
                      <div className="mt-6">
                        <Separator className="my-4" />
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg border">
                            <h3 className="font-medium text-primary">
                              Booking Summary
                            </h3>
                            <dl className="mt-3 grid grid-cols-1 gap-y-3 text-sm">
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                  Service:
                                </dt>
                                <dd className="font-medium">
                                  {selectedService.name}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground">Date:</dt>
                                <dd className="font-medium">
                                  {format(selectedDate, "PPP")}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground">Time:</dt>
                                <dd className="font-medium">
                                  {formatTimeSlot(selectedSlot)}
                                </dd>
                              </div>
                              <div className="flex justify-between border-t pt-3 mt-2">
                                <dt className="text-muted-foreground font-medium">
                                  Price:
                                </dt>
                                <dd className="font-bold text-primary">
                                  {selectedService.price} kr
                                </dd>
                              </div>
                            </dl>
                          </div>

                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handleBookingSubmit}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                                Processing...
                              </>
                            ) : (
                              "Confirm Booking"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No available time slots for the selected date.
                    </p>
                    <p className="text-sm mt-2">
                      Please select a different date.
                    </p>
                  </div>
                )
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Please select a service and date to view available time
                    slots.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mt-6">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </MainLayout>
  );
};

export default BookingPage;
