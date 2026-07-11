import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/public-layout";
import { Home, Calendar } from "lucide-react";

const NotFoundPage = () => {
  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <p className="text-7xl font-extrabold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold">Sidan kunde inte hittas</h1>
        <p className="mt-2 max-w-md text-base-content/70">
          Sidan du letar efter finns inte längre, eller så har adressen skrivits
          fel. Ingen fara — vägen tillbaka är nära.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-primary">
            <Home className="h-4 w-4" />
            Till startsidan
          </Link>
          <Link to="/bookings" className="btn btn-outline">
            <Calendar className="h-4 w-4" />
            Boka behandling
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default NotFoundPage;
