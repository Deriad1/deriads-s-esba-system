import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer); // cleanup timer
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-6xl font-bold text-red-500">404</h1>
      <h2 className="text-2xl font-semibold mt-4 text-white">Page Not Found</h2>
      <p className="text-white/80 mt-2">
        Sorry, the page you are looking for does not exist.
      </p>
      <p className="text-white/70 mt-2">
        Redirecting you to the login page in 5 seconds...
      </p>
      <a
        href="/"
        className="mt-6 px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
      >
        Go Back Home
      </a>
    </div>
  );
};

export default NotFoundPage;
