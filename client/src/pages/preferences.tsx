import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Settings, 
  Save,
  User,
  Heart,
  DollarSign,
  Navigation
} from "lucide-react";

interface CustomerPreferences {
  id: number;
  userId: string;
  preferredCategories: string[];
  budgetRange?: string;
  location?: string;
  dietaryRestrictions: string[];
  interests: string[];
  preferredDistance?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Preferences() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    preferredCategories: [] as string[],
    budgetRange: "",
    location: "",
    dietaryRestrictions: [] as string[],
    interests: [] as string[],
    preferredDistance: "",
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch customer preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<CustomerPreferences>({
    queryKey: ["/api/customer-preferences"],
    enabled: isAuthenticated,
  });

  // Update form data when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setFormData({
        preferredCategories: preferences.preferredCategories || [],
        budgetRange: preferences.budgetRange || "",
        location: preferences.location || "",
        dietaryRestrictions: preferences.dietaryRestrictions || [],
        interests: preferences.interests || [],
        preferredDistance: preferences.preferredDistance || "",
      });
    }
  }, [preferences]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const method = preferences ? "PUT" : "POST";
      const response = await apiRequest(method, "/api/customer-preferences", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your preferences have been saved!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-preferences"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Restaurant",
    "Cafe", 
    "Retail",
    "Service",
    "Healthcare",
    "Beauty",
    "Fitness",
    "Entertainment",
    "Education",
    "Technology"
  ];

  const budgetRanges = [
    "$0 - $25",
    "$25 - $50", 
    "$50 - $100",
    "$100 - $200",
    "$200+"
  ];

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Keto",
    "Halal",
    "Kosher"
  ];

  const interestOptions = [
    "Fine Dining",
    "Casual Dining",
    "Fast Food",
    "Organic/Local",
    "International Cuisine",
    "Shopping",
    "Wellness",
    "Entertainment",
    "Art & Culture",
    "Sports & Recreation"
  ];

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferredCategories: checked
        ? [...prev.preferredCategories, category]
        : prev.preferredCategories.filter(c => c !== category)
    }));
  };

  const handleDietaryChange = (dietary: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: checked
        ? [...prev.dietaryRestrictions, dietary]
        : prev.dietaryRestrictions.filter(d => d !== dietary)
    }));
  };

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferencesMutation.mutate(formData);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">LocalDiscover</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Preferences
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Tell us what you like so we can give you better recommendations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Preferred Categories */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Heart className="w-5 h-5" />
                <span>Preferred Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={formData.preferredCategories.includes(category)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <DollarSign className="w-5 h-5" />
                  <span>Budget Range</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preferencesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    value={formData.budgetRange} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budgetRange: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <Navigation className="w-5 h-5" />
                  <span>Preferred Distance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preferencesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    value={formData.preferredDistance} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferredDistance: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="How far are you willing to travel?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Within 1 mile</SelectItem>
                      <SelectItem value="5">Within 5 miles</SelectItem>
                      <SelectItem value="10">Within 10 miles</SelectItem>
                      <SelectItem value="25">Within 25 miles</SelectItem>
                      <SelectItem value="50">Within 50 miles</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Location */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <MapPin className="w-5 h-5" />
                <span>Your Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  type="text"
                  placeholder="Enter your city or zip code"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              )}
            </CardContent>
          </Card>

          {/* Dietary Restrictions */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Dietary Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dietaryOptions.map((dietary) => (
                    <div key={dietary} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dietary-${dietary}`}
                        checked={formData.dietaryRestrictions.includes(dietary)}
                        onCheckedChange={(checked) => 
                          handleDietaryChange(dietary, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`dietary-${dietary}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {dietary}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {interestOptions.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={(checked) => 
                          handleInterestChange(interest, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`interest-${interest}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg"
              disabled={savePreferencesMutation.isPending || preferencesLoading}
              className="min-w-32"
            >
              {savePreferencesMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}