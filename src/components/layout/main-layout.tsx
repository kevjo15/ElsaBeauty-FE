import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/services/api/authContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ModeToggle from "@/components/mode-toggle";

// Icons
import {
  Menu,
  Home,
  Calendar,
  Scissors,
  Bell,
  User,
  LogOut,
} from "lucide-react";

import {
  CategoryWithServices,
  getCategoriesWithServices,
} from "@/services/api/apiService";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesWithServices();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : "U";
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navbar */}
      <header className="border-b sticky top-0 z-40 bg-background">
        <div className="container flex h-16 items-center px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col h-full py-4">
                <div className="px-3 py-2">
                  <h2 className="text-lg font-semibold">ElsaBeauty</h2>
                  <p className="text-sm text-muted-foreground">Beauty Salon</p>
                </div>
                <Separator className="my-4" />
                <nav className="flex-1">
                  <ul className="mt-2 space-y-1">
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => navigate("/home")}
                      >
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    </li>
                    <li>
                      <Button variant="ghost" className="w-full justify-start">
                        <Scissors className="mr-2 h-4 w-4" />
                        Services
                      </Button>
                    </li>
                    <li>
                      <Button variant="ghost" className="w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Appointment
                      </Button>
                    </li>
                  </ul>
                </nav>
                <Separator className="my-4" />
                <div className="px-3 py-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">ElsaBeauty</h1>
          </div>
          <div className="flex flex-1 justify-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    onClick={() => navigate("/home")}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Services</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 md:w-[500px] lg:w-[600px]">
                      {categories.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                          {categories.map((category) => (
                            <div key={category.id} className="space-y-2">
                              <Button
                                variant="link"
                                className="p-0 h-auto text-sm font-medium text-primary"
                                onClick={() =>
                                  navigate(`/category/${category.id}`)
                                }
                              >
                                {category.name}
                              </Button>
                              {category.services.length > 0 ? (
                                <div className="space-y-1 ml-3 border-l-2 border-primary/10 pl-2">
                                  {category.services.map((service) => (
                                    <Button
                                      key={service.id}
                                      variant="ghost"
                                      size="sm"
                                      className="px-2 py-1 h-auto text-xs justify-start w-full hover:text-primary transition-colors"
                                      onClick={() =>
                                        navigate(`/service/${service.id}`)
                                      }
                                    >
                                      {service.name}
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground ml-3">
                                  No services available
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No categories available
                        </div>
                      )}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Bookings</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 md:w-[500px] lg:w-[600px]">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-medium text-primary"
                            onClick={() => navigate("/bookings")}
                          >
                            My Appointments
                          </Button>
                          <div className="space-y-1 ml-3 border-l-2 border-primary/10 pl-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 py-1 h-auto text-xs justify-start w-full hover:text-primary transition-colors"
                              onClick={() => navigate("/bookings")}
                            >
                              View My Bookings
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 py-1 h-auto text-xs justify-start w-full hover:text-primary transition-colors"
                              onClick={() => navigate("/bookings/history")}
                            >
                              Booking History
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-medium text-primary"
                            onClick={() => navigate("/bookings")}
                          >
                            Book New Appointment
                          </Button>
                          <div className="space-y-1 ml-3 border-l-2 border-primary/10 pl-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 py-1 h-auto text-xs justify-start w-full hover:text-primary transition-colors"
                              onClick={() => navigate("/bookings")}
                            >
                              Schedule New Booking
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 py-1 h-auto text-xs justify-start w-full hover:text-primary transition-colors"
                              onClick={() => navigate("/bookings")}
                            >
                              Check Available Times
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <ModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.email || ""} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <div className="mt-1">
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                            {user.role}
                          </span>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default MainLayout;
