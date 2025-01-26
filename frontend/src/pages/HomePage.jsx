import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/create-company");
  };

  return (
    <header className="bg-black opacity-75 font-semibold text-white py-60">
      <div className="container mx-auto items-center px-16 text-center">
        <h1 className="text-6xl font-extrabold mb-4">
          Welcome to Our Platform
        </h1>
        <p className="text-lg mb-4 p-0.5">
          Manage your inventory, track orders, and streamline your business with
          ease.
        </p>
        <button
          onClick={handleSignUp}
          className="py-4 px-14 bg-violet-500 text-white font-semibold rounded-full shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75"
        >
          Sign Up
        </button>
      </div>
    </header>
  );
};

export default HomePage;
