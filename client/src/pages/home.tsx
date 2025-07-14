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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeightChart } from "@/components/WeightChart";
import { FileUpload } from "@/components/FileUpload";
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Scale, 
  Activity,
  Camera,
  Upload,
  Trash2,
  Calendar,
  Edit,
  Images,
  Link,
  Unlink
} from "lucide-react";

interface WeightEntry {
  id: number;
  userId: string;
  weight: string;
  unit: string;
  entryType: string;
  photoPath?: string;
  notes?: string;
  recordedAt: string;
  createdAt: string;
}

interface ActivityLog {
  id: number;
  userId: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export default function Home() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("lbs");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  // Fetch weight entries
  const { data: weightEntries = [], isLoading: weightsLoading } = useQuery<WeightEntry[]>({
    queryKey: ["/api/weight-entries"],
    retry: false,
  });

  // Fetch activity logs
  const { data: activityLogs = [], isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
    retry: false,
  });

  // Add weight entry mutation
  const addWeightMutation = useMutation({
    mutationFn: async (data: { weight: string; unit: string; notes?: string }) => {
      return await apiRequest("/api/weight-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      setIsAddingWeight(false);
      setNewWeight("");
      setNotes("");
      toast({
        title: "Success",
        description: "Weight entry added successfully!",
      });
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
        description: "Failed to add weight entry",
        variant: "destructive",
      });
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return await apiRequest("/api/upload-weight-photo", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      setIsUploadingPhoto(false);
      setSelectedFile(null);
      toast({
        title: "Success",
        description: `Photo uploaded! Detected weight: ${data.detectedWeight} lbs`,
      });
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
        description: "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  // Delete weight entry mutation
  const deleteWeightMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/weight-entries/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Success",
        description: "Weight entry deleted successfully!",
      });
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
        description: "Failed to delete weight entry",
        variant: "destructive",
      });
    },
  });

  const handleAddWeight = () => {
    if (!newWeight) return;
    addWeightMutation.mutate({
      weight: newWeight,
      unit: weightUnit,
      notes: notes || undefined,
    });
  };

  const handlePhotoUpload = () => {
    if (!selectedFile) return;
    uploadPhotoMutation.mutate(selectedFile);
  };

  const handleDeleteWeight = (id: number) => {
    if (confirm("Are you sure you want to delete this weight entry?")) {
      deleteWeightMutation.mutate(id);
    }
  };

  const currentWeight = weightEntries[0];
  const previousWeight = weightEntries[1];
  const weightTrend = currentWeight && previousWeight ? 
    parseFloat(currentWeight.weight) - parseFloat(previousWeight.weight) : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Scale className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                WeightWise
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.firstName || 'User'}!
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = "/api/logout"}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Weight Tracker
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your weight progress with AI-powered photo recognition
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Scale className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center space-x-2">
              <Images className="w-4 h-4" />
              <span>Google Photos</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentWeight ? `${currentWeight.weight} ${currentWeight.unit}` : "No data"}
              </div>
              {weightTrend !== 0 && (
                <p className={`text-xs flex items-center ${
                  weightTrend > 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {weightTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(weightTrend).toFixed(1)} lbs from last entry
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weightEntries.length}</div>
              <p className="text-xs text-muted-foreground">
                Weight tracking entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityLogs.length}</div>
              <p className="text-xs text-muted-foreground">
                Actions logged
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Dialog open={isAddingWeight} onOpenChange={setIsAddingWeight}>
            <DialogTrigger asChild>
              <Button className="flex-1 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Weight Entry</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Weight Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Enter weight"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={weightUnit} onValueChange={setWeightUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this weight entry"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddWeight}
                  disabled={!newWeight || addWeightMutation.isPending}
                  className="w-full"
                >
                  {addWeightMutation.isPending ? "Adding..." : "Add Weight Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadingPhoto} onOpenChange={setIsUploadingPhoto}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Upload Scale Photo</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Scale Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photo">Select scale photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  onClick={handlePhotoUpload}
                  disabled={!selectedFile || uploadPhotoMutation.isPending}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadPhotoMutation.isPending ? "Uploading..." : "Upload & Detect Weight"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weight Chart */}
        {weightEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightChart entries={weightEntries} />
            </CardContent>
          </Card>
        )}

        {/* Weight Entries & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Weight Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weightsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))
              ) : weightEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No weight entries yet. Add your first entry!
                </p>
              ) : (
                weightEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {entry.entryType === "photo" ? (
                        <Camera className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Scale className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium">{entry.weight} {entry.unit}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.recordedAt).toLocaleDateString()}
                          {entry.notes && ` • ${entry.notes}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWeight(entry.id)}
                      disabled={deleteWeightMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))
              ) : activityLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activity yet. Start tracking your weight!
                </p>
              ) : (
                activityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{log.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

            {/* Weight Entry Form */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add Weight Entry</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Dialog open={isAddingWeight} onOpenChange={setIsAddingWeight}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Manual Entry</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Weight Entry</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="weight">Weight</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            placeholder="Enter weight"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit">Unit</Label>
                          <Select value={weightUnit} onValueChange={setWeightUnit}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Any additional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleAddWeight}
                          disabled={!newWeight || addWeightMutation.isPending}
                          className="w-full"
                        >
                          {addWeightMutation.isPending ? "Adding..." : "Add Weight Entry"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isUploadingPhoto} onOpenChange={setIsUploadingPhoto}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 flex items-center space-x-2">
                        <Camera className="h-4 w-4" />
                        <span>Upload Scale Photo</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Scale Photo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="photo">Select scale photo</Label>
                          <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          />
                        </div>
                        <Button 
                          onClick={handlePhotoUpload}
                          disabled={!selectedFile || uploadPhotoMutation.isPending}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadPhotoMutation.isPending ? "Uploading..." : "Upload & Detect Weight"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Photos Tab */}
          <TabsContent value="photos" className="space-y-6 mt-6">
            <GooglePhotosTab />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activityLogs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No recent activity. Add your first weight entry to get started!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-shrink-0">
                          {log.action === 'weight_entry' && <Plus className="h-5 w-5 text-green-500" />}
                          {log.action === 'photo_upload' && <Camera className="h-5 w-5 text-blue-500" />}
                          {log.action === 'weight_delete' && <Trash2 className="h-5 w-5 text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Google Photos Tab Component
function GooglePhotosTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Google Photos
  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ["/api/google-photos"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Connect to Google Photos mutation
  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/google");
      return response;
    },
    onSuccess: (data) => {
      window.location.href = data.authUrl;
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
        description: "Failed to connect to Google Photos",
        variant: "destructive",
      });
    },
  });

  // Disconnect Google Photos mutation
  const disconnectGoogleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/google-photos/disconnect", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-photos"] });
      toast({
        title: "Success",
        description: "Google Photos disconnected successfully",
      });
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
        description: "Failed to disconnect Google Photos",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Images className="w-5 h-5" />
            <span>Google Photos Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {photosData?.connected ? 
                  "Connected to Google Photos. Your recent photos will appear below." :
                  "Connect your Google Photos account to see your recent photos here."
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Only you can see your photos. We don't store or share them.
              </p>
            </div>
            <div className="flex space-x-2">
              {photosData?.connected ? (
                <Button
                  variant="outline"
                  onClick={() => disconnectGoogleMutation.mutate()}
                  disabled={disconnectGoogleMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Unlink className="w-4 h-4" />
                  <span>Disconnect</span>
                </Button>
              ) : (
                <Button
                  onClick={() => connectGoogleMutation.mutate()}
                  disabled={connectGoogleMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Link className="w-4 h-4" />
                  <span>Connect Google Photos</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Photos (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photosLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : photosData?.photos?.length === 0 ? (
            <div className="text-center py-12">
              <Images className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {photosData?.needsAuth ? 
                  "Connect your Google Photos account to see your photos here." :
                  "No photos found in the last 30 days."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {photosData?.photos?.map((photo: any) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.baseUrl || `${photo.baseUrl}=w300-h300-c`}
                    alt={photo.filename}
                    className="w-full aspect-square object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={() => window.open(photo.baseUrl, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary">
                        View
                      </Button>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {photo.mediaMetadata?.creationTime && 
                      new Date(photo.mediaMetadata.creationTime).toLocaleDateString()
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}