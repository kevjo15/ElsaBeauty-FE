import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Sparkles, Star } from "lucide-react";
import {
  Service,
  getAllServices,
  CategoryWithServices,
  getCategoriesWithServices,
} from "@/services/api/apiService";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesData, categoriesData] = await Promise.all([
          getAllServices(),
          getCategoriesWithServices(),
        ]);
        setServices(servicesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to format duration string (e.g., "00:30:00" to "30 min")
  const formatDuration = (duration: string): string => {
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (!match) return duration;

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);

    if (hours > 0) {
      return `${hours} h ${minutes > 0 ? `${minutes} min` : ""}`;
    }
    return `${minutes} min`;
  };

  // Get featured services (first 3)
  const featuredServices = services.slice(0, 3);

  // Get newest services (next 2)
  const newServices = services.slice(3, 5);

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative mb-12 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-primary/5 p-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Welcome to ElsaBeauty</h1>
          <p className="text-lg mb-6">
            Your destination for beauty and relaxation. Discover our premium
            services and book your appointment today.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate("/bookings/new")}
            >
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/services")}
            >
              Explore Services
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="featured" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="featured">Featured Services</TabsTrigger>
          <TabsTrigger value="new">New Arrivals</TabsTrigger>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="book">Book Now</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Loading services...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredServices.map((service) => (
                  <Card
                    key={service.id}
                    className="overflow-hidden transition-all hover:shadow-md"
                  >
                    <div className="bg-primary/5 px-4 py-1">
                      <Badge variant="outline" className="bg-background/80">
                        Featured
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {service.name}
                        <Sparkles className="h-4 w-4 text-primary" />
                      </CardTitle>
                      <CardDescription>Beauty Treatment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                      <Separator className="my-3" />
                      <p className="text-sm">{service.description}</p>
                      <p className="text-lg font-bold mt-4 text-primary">
                        {service.price} kr
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/service/${service.id}`)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Loading services...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {newServices.map((service) => (
                <Card
                  key={service.id}
                  className="overflow-hidden transition-all hover:shadow-md"
                >
                  <div className="bg-primary/5 px-4 py-1">
                    <Badge variant="outline" className="bg-background/80">
                      New
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription>New service</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    <Separator className="my-3" />
                    <p className="text-sm">{service.description}</p>
                    <p className="text-lg font-bold mt-4 text-primary">
                      {service.price} kr
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/service/${service.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Loading services...</p>
            </div>
          ) : (
            <>
              {categories.map((category) => (
                <div key={category.id} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {category.name}
                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                    <span className="text-sm font-normal text-muted-foreground">
                      {category.services.length} services
                    </span>
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {category.services.map((service) => (
                      <Card
                        key={service.id}
                        className="overflow-hidden transition-all hover:shadow-md"
                      >
                        <CardHeader>
                          <CardTitle>{service.name}</CardTitle>
                          <CardDescription>{category.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                          <Separator className="my-3" />
                          <p className="text-sm">{service.description}</p>
                          <p className="text-lg font-bold mt-4 text-primary">
                            {service.price} kr
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button
                            className="w-full"
                            onClick={() => navigate(`/service/${service.id}`)}
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="book" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Appointment</CardTitle>
                <CardDescription>
                  Select a service and time that works for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <p>
                    Ready to treat yourself? Book an appointment with our
                    skilled professionals.
                  </p>
                  <Button
                    className="gap-2 mt-4"
                    onClick={() => navigate("/bookings/new")}
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us</CardTitle>
                <CardDescription>
                  Experience the ElsaBeauty difference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Professional and experienced staff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Premium products and services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Relaxing and comfortable environment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Convenient online booking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default HomePage;
