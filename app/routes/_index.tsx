import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-700 to-black">
      <div className="p-8 bg-white rounded-lg shadow-xl w-96">
        <h1 className="text-3xl font-bold text-center text-gray-700 mb-6">Logga in</h1>
        <form>
          <div className="mb-4">
            <input type="email" id="email" placeholder="Enter your email" className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200" />
          </div>
          <button type="submit" className="w-full py-2 px-4 hover:bg-black text-white font-bold rounded-lg shadow-md hover:shadow-lg transition duration-200 bg-gradient-to-l from-gray-700 to-black">Logga in</button>
        </form>
      </div>
    </div>
  );
}
