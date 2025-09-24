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
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Sparkles, Star, Search } from "lucide-react";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Service, getAllServices } from "@/services/api/apiService";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const servicesData = await getAllServices();
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = services.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
    );
    setSearchResults(results);
  }, [searchQuery, services]);

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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="bg-primary/5 px-4 py-1">
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/3 mb-3" />
                    <Skeleton className="h-px w-full my-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-6 w-1/4 mt-4" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="bg-primary/5 px-4 py-1">
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/3 mb-3" />
                    <Skeleton className="h-px w-full my-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-6 w-1/4 mt-4" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
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
          {/* Search Bar */}
          <div className="mb-6">
            <InputWithIcon
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((service) => (
                  <Card
                    key={service.id}
                    className="overflow-hidden transition-all hover:shadow-md"
                  >
                    <CardHeader>
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>Search Result</CardDescription>
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
          ) : loading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="mb-4">
                    <Skeleton className="h-7 w-1/4 mb-2" />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((j) => (
                      <Card key={j} className="overflow-hidden">
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-1/3 mb-3" />
                          <Skeleton className="h-px w-full my-3" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-6 w-1/4 mt-4" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-10 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="overflow-hidden transition-all hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
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

        <TabsContent value="book" className="space-y-6 mt-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-10 w-1/3 mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
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
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default HomePage;
