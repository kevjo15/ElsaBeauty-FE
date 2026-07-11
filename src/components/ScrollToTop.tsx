import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router återställer inte scrollpositionen vid navigering.
 * Scrollar till toppen vid varje route-byte, eller till ankaret om URL:en har en hash.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
