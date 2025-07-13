import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe,
  Heart,
  Eye,
  Sparkles,
  TrendingUp,
  MapIcon,
  Users
} from "lucide-react";

interface BusinessProfile {
  id: number;
  businessName: string;
  category?: string;
  description?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
}

interface Recommendation {
  id: number;
  userId: string;
  businessId: number;
  recommendationType: string;
  score: string;
  reason?: string;
  isViewed: boolean;
  createdAt: string;
  business: BusinessProfile;
}

export default function Recommendations() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
    enabled: isAuthenticated,
  });

  // Mark recommendation as viewed mutation
  const markViewedMutation = useMutation({
    mutationFn: async (recommendationId: number) => {
      await apiRequest("POST", `/api/recommendations/${recommendationId}/viewed`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
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
    },
  });

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'preference':
        return <Heart className="w-4 h-4" />;
      case 'location':
        return <MapIcon className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getRecommendationTypeLabel = (type: string) => {
    switch (type) {
      case 'preference':
        return 'Based on your preferences';
      case 'location':
        return 'Near you';
      case 'trending':
        return 'Trending now';
      default:
        return 'Recommended for you';
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'preference':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'location':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'trending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5 text-white" />
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Personalized Recommendations
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover local businesses tailored just for you based on your preferences and activity
          </p>
        </div>

        {/* Recommendations Section */}
        <div className="space-y-6">
          {recommendationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                      <Skeleton className="w-8 h-8 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No recommendations yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete your preferences to get personalized business recommendations.
              </p>
              <Button onClick={() => window.location.href = '/preferences'}>
                Set Your Preferences
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <Card 
                  key={recommendation.id} 
                  className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                    !recommendation.isViewed ? 'ring-2 ring-purple-200 dark:ring-purple-700' : ''
                  }`}
                  onClick={() => {
                    if (!recommendation.isViewed) {
                      markViewedMutation.mutate(recommendation.id);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge 
                            className={`${getRecommendationTypeColor(recommendation.recommendationType)} text-xs`}
                          >
                            <span className="flex items-center space-x-1">
                              {getRecommendationIcon(recommendation.recommendationType)}
                              <span>{getRecommendationTypeLabel(recommendation.recommendationType)}</span>
                            </span>
                          </Badge>
                          {!recommendation.isViewed && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {recommendation.business.businessName}
                        </CardTitle>
                        
                        {recommendation.business.category && (
                          <Badge variant="outline" className="mb-2">
                            {recommendation.business.category}
                          </Badge>
                        )}
                        
                        <div className="flex items-center space-x-1 text-sm text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4" />
                          <span className="text-gray-600 dark:text-gray-400 ml-2">4.0</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {(parseFloat(recommendation.score) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Match
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="p-2">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {recommendation.reason && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          <strong>Why this recommendation:</strong> {recommendation.reason}
                        </p>
                      </div>
                    )}
                    
                    {recommendation.business.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {recommendation.business.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {recommendation.business.location && (
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{recommendation.business.location}</span>
                        </div>
                      )}
                      
                      {recommendation.business.contactPhone && (
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>{recommendation.business.contactPhone}</span>
                        </div>
                      )}
                      
                      {recommendation.business.website && (
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={recommendation.business.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Open Now</span>
                      </div>
                      <div className="flex space-x-2">
                        {!recommendation.isViewed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markViewedMutation.mutate(recommendation.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Mark as Viewed
                          </Button>
                        )}
                        <Button size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {!recommendationsLoading && recommendations.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700 mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {recommendations.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Recommendations
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {recommendations.filter(r => !r.isViewed).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    New Recommendations
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(recommendations.reduce((acc, r) => acc + parseFloat(r.score), 0) / recommendations.length * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Average Match Score
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}