import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Heart, Star, Utensils, Coffee } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">LocalDiscover</h1>
            </div>
            <Button onClick={() => window.location.href = '/api/login'}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Discover Local Businesses
            <span className="text-primary"> Just for You</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Get personalized recommendations for local restaurants, cafes, and services based on your preferences.
            Support your community and find hidden gems nearby.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Explore Local Businesses
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="dark:text-white">Smart Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI analyzes your preferences to suggest the perfect local businesses
                that match your taste and budget.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="dark:text-white">Verified Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Read authentic reviews from real customers and share your own experiences
                to help others discover great places.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="dark:text-white">Local First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Support your local community by discovering nearby businesses and
                building connections with your neighbors.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Popular Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Explore Popular Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Utensils className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Restaurants</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fine dining & casual</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Coffee className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Cafes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Coffee & desserts</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Services</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Hair, spa & more</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-white text-sm font-bold">R</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Retail</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Shops & boutiques</p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to discover local gems?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Join our community and start exploring the best local businesses in your area.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Personalized Recommendations
          </Button>
        </div>
      </main>
    </div>
  );
}
