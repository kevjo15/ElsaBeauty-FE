import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { Service, getAllServices } from "@/services/api/apiService";
import { Calendar, Clock, Sparkles, Star, Search } from "lucide-react";

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
      <div className="hero min-h-[40vh] bg-base-200 rounded-lg mb-12">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Welcome to ElsaBeauty</h1>
            <p className="py-6">
              Your destination for beauty and relaxation. Discover our premium
              services and book your appointment today.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                className="btn btn-primary gap-2"
                onClick={() => navigate("/bookings/new")}
              >
                <Calendar className="h-4 w-4" />
                Book Appointment
              </button>

              <button
                className="btn btn-outline gap-2"
                onClick={() => navigate("/services")}
              >
                Explore Services
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div role="tablist" className="tabs tabs-boxed w-full mb-6">
        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="Featured Services"
          defaultChecked
        />
        <div role="tabpanel" className="tab-content p-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card w-full bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="skeleton h-5 w-20 mb-2"></div>
                    <div className="skeleton h-6 w-3/4 mb-2"></div>
                    <div className="skeleton h-4 w-1/2 mb-4"></div>
                    <div className="skeleton h-4 w-1/3 mb-3"></div>
                    <div className="skeleton h-px w-full my-3"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-6 w-1/4 mt-4"></div>
                    <div className="skeleton h-10 w-full mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service) => (
                <div
                  key={service.id}
                  className="card w-full bg-base-100 shadow-xl transition-all hover:shadow-md"
                >
                  <div className="card-body">
                    <div className="badge badge-secondary">Featured</div>
                    <h2 className="card-title flex items-center gap-2">
                      {service.name}
                      <Sparkles className="h-4 w-4 text-primary" />
                    </h2>
                    <p>Beauty Treatment</p>
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <p className="text-sm">{service.description}</p>
                    <p className="text-lg font-bold mt-4 text-primary">
                      {service.price} kr
                    </p>
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-primary w-full"
                        onClick={() => navigate(`/service/${service.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="New Arrivals"
        />
        <div role="tabpanel" className="tab-content p-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div key={i} className="card w-full bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="skeleton h-5 w-20 mb-2"></div>
                    <div className="skeleton h-6 w-3/4 mb-2"></div>
                    <div className="skeleton h-4 w-1/2 mb-4"></div>
                    <div className="skeleton h-4 w-1/3 mb-3"></div>
                    <div className="skeleton h-px w-full my-3"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-6 w-1/4 mt-4"></div>
                    <div className="skeleton h-10 w-full mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {newServices.map((service) => (
                <div
                  key={service.id}
                  className="card w-full bg-base-100 shadow-xl transition-all hover:shadow-md"
                >
                  <div className="card-body">
                    <div className="badge badge-accent">New</div>
                    <h2 className="card-title">{service.name}</h2>
                    <p>New service</p>
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <p className="text-sm">{service.description}</p>
                    <p className="text-lg font-bold mt-4 text-primary">
                      {service.price} kr
                    </p>
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-primary w-full"
                        onClick={() => navigate(`/service/${service.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="All Services"
        />
        <div role="tabpanel" className="tab-content p-10">
          {/* Search Bar */}
          <div className="mb-6">
            <label className="input input-bordered flex items-center gap-2">
              <Search className="h-4 w-4 opacity-70" />
              <input
                type="text"
                className="grow"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((service) => (
                  <div
                    key={service.id}
                    className="card w-full bg-base-100 shadow-xl transition-all hover:shadow-md"
                  >
                    <div className="card-body">
                      <h2 className="card-title">{service.name}</h2>
                      <p>Search Result</p>
                      <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                      <hr className="my-3" />
                      <p className="text-sm">{service.description}</p>
                      <p className="text-lg font-bold mt-4 text-primary">
                        {service.price} kr
                      </p>
                      <div className="card-actions justify-end">
                        <button
                          className="btn btn-primary w-full"
                          onClick={() => navigate(`/service/${service.id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="mb-4">
                    <div className="skeleton h-7 w-1/4 mb-2"></div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="card w-full bg-base-100 shadow-xl"
                      >
                        <div className="card-body">
                          <div className="skeleton h-6 w-3/4 mb-2"></div>
                          <div className="skeleton h-4 w-1/2 mb-4"></div>
                          <div className="skeleton h-4 w-1/3 mb-3"></div>
                          <div className="skeleton h-px w-full my-3"></div>
                          <div className="skeleton h-4 w-full mb-2"></div>
                          <div className="skeleton h-4 w-full mb-2"></div>
                          <div className="skeleton h-6 w-1/4 mt-4"></div>
                          <div className="skeleton h-10 w-full mt-4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="card w-full bg-base-100 shadow-xl transition-all hover:shadow-md"
                >
                  <div className="card-body">
                    <h2 className="card-title">{service.name}</h2>
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <p className="text-sm">{service.description}</p>
                    <p className="text-lg font-bold mt-4 text-primary">
                      {service.price} kr
                    </p>
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-primary w-full"
                        onClick={() => navigate(`/service/${service.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="Book Now"
        />
        <div role="tabpanel" className="tab-content p-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="card w-full bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="skeleton h-6 w-3/4 mb-2"></div>
                    <div className="skeleton h-4 w-1/2 mb-4"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-4 w-3/4 mb-2"></div>
                    <div className="skeleton h-10 w-1/3 mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card w-full bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Book Your Appointment</h2>
                  <p>Select a service and time that works for you</p>
                  <div className="flex flex-col gap-4">
                    <p>
                      Ready to treat yourself? Book an appointment with our
                      skilled professionals.
                    </p>
                    <button
                      className="btn btn-primary gap-2 mt-4"
                      onClick={() => navigate("/bookings/new")}
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule Now
                    </button>
                  </div>
                </div>
              </div>

              <div className="card w-full bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Why Choose Us</h2>
                  <p>Experience the ElsaBeauty difference</p>
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;
