import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Scale, 
  Camera, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Target,
  Activity,
  LogOut,
  Upload,
  Trash2
} from "lucide-react";
import WeightChart from "@/components/WeightChart";

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

      <div className="max-w-6xl mx-auto p-4 space-y-6">
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
      </div>
    </div>
  );
}