import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pill, Plus, Bell, Check, X, Clock, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MedicationTrackerProps {
  userId: string;
}

interface Medication {
  id: string;
  name: string;
  type: string;
  dosage: string | null;
  frequency: string;
  reminder_time: string | null;
  reminder_enabled: boolean;
  custom_reminder_text: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  date: string;
  time_taken: string | null;
  taken: boolean;
  skipped_reason: string | null;
}

const medicationTypes = [
  { value: "birth_control", label: "Birth Control", icon: "💊" },
  { value: "supplement", label: "Supplement", icon: "🌿" },
  { value: "medication", label: "Medication", icon: "💉" },
  { value: "other", label: "Other", icon: "📦" },
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as_needed", label: "As Needed" },
];

const MedicationTracker = ({ userId }: MedicationTrackerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "birth_control",
    dosage: "",
    frequency: "daily",
    reminder_time: "08:00",
    reminder_enabled: true,
    custom_reminder_text: "",
    notes: "",
  });

  useEffect(() => {
    fetchMedications();
    fetchTodayLogs();
  }, [userId]);

  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setMedications(data);
    if (error) console.error("Error fetching medications:", error);
  };

  const fetchTodayLogs = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("medication_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    if (data) setTodayLogs(data);
    if (error) console.error("Error fetching today's logs:", error);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "birth_control",
      dosage: "",
      frequency: "daily",
      reminder_time: "08:00",
      reminder_enabled: true,
      custom_reminder_text: "",
      notes: "",
    });
    setEditingMed(null);
  };

  const handleAddMedication = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a medication name");
      return;
    }

    setIsLoading(true);
    try {
      if (editingMed) {
        const { error } = await supabase
          .from("medications")
          .update({
            name: formData.name,
            type: formData.type,
            dosage: formData.dosage || null,
            frequency: formData.frequency,
            reminder_time: formData.reminder_time || null,
            reminder_enabled: formData.reminder_enabled,
            custom_reminder_text: formData.custom_reminder_text || null,
            notes: formData.notes || null,
          })
          .eq("id", editingMed.id);

        if (error) throw error;
        toast.success("Medication updated!");
      } else {
        const { error } = await supabase.from("medications").insert({
          user_id: userId,
          name: formData.name,
          type: formData.type,
          dosage: formData.dosage || null,
          frequency: formData.frequency,
          reminder_time: formData.reminder_time || null,
          reminder_enabled: formData.reminder_enabled,
          custom_reminder_text: formData.custom_reminder_text || null,
          notes: formData.notes || null,
          start_date: format(new Date(), "yyyy-MM-dd"),
        });

        if (error) throw error;
        toast.success("Medication added!");
      }

      setShowAddDialog(false);
      resetForm();
      fetchMedications();
    } catch (error: any) {
      toast.error(error.message || "Failed to save medication");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMedication = async (medicationId: string, taken: boolean, reason?: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const currentTime = format(new Date(), "HH:mm:ss");

    try {
      const { error } = await supabase.from("medication_logs").upsert({
        user_id: userId,
        medication_id: medicationId,
        date: today,
        time_taken: taken ? currentTime : null,
        taken,
        skipped_reason: reason || null,
      }, { onConflict: "user_id,medication_id,date" });

      if (error) throw error;

      toast.success(taken ? "Medication logged as taken!" : "Medication marked as skipped");
      fetchTodayLogs();
    } catch (error: any) {
      toast.error(error.message || "Failed to log medication");
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", medicationId);

      if (error) throw error;

      toast.success("Medication deleted");
      fetchMedications();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete medication");
    }
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      type: med.type,
      dosage: med.dosage || "",
      frequency: med.frequency,
      reminder_time: med.reminder_time || "08:00",
      reminder_enabled: med.reminder_enabled,
      custom_reminder_text: med.custom_reminder_text || "",
      notes: med.notes || "",
    });
    setShowAddDialog(true);
  };

  const isTakenToday = (medicationId: string) => {
    return todayLogs.find(log => log.medication_id === medicationId && log.taken);
  };

  const isSkippedToday = (medicationId: string) => {
    return todayLogs.find(log => log.medication_id === medicationId && !log.taken);
  };

  const getTypeIcon = (type: string) => {
    return medicationTypes.find(t => t.value === type)?.icon || "💊";
  };

  return (
    <Card className="bg-gradient-card shadow-colorful border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-vibrant text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Medications & Reminders</CardTitle>
              <CardDescription className="text-white/80">
                Track medications with custom reminders
              </CardDescription>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMed ? "Edit Medication" : "Add Medication"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="med-name">Medication Name</Label>
                  <Input
                    id="med-name"
                    placeholder="e.g., Birth Control Pill"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {medicationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="med-dosage">Dosage (optional)</Label>
                  <Input
                    id="med-dosage"
                    placeholder="e.g., 1 tablet, 500mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <Label htmlFor="reminder-enabled">Enable Reminders</Label>
                  </div>
                  <Switch
                    id="reminder-enabled"
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                  />
                </div>

                {formData.reminder_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reminder-time">Reminder Time</Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={formData.reminder_time}
                        onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-text">Custom Reminder Text (for discretion)</Label>
                      <Input
                        id="custom-text"
                        placeholder="e.g., Daily wellness check"
                        value={formData.custom_reminder_text}
                        onChange={(e) => setFormData({ ...formData, custom_reminder_text: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        This text will appear in notifications instead of the medication name
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="med-notes">Notes (optional)</Label>
                  <Textarea
                    id="med-notes"
                    placeholder="Additional instructions or notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddMedication} disabled={isLoading} className="bg-gradient-primary">
                  {editingMed ? "Update" : "Add Medication"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No medications added yet. Add your first medication to start tracking.
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground">Today's Medications</h4>
            {medications
              .filter(med => med.frequency === "daily" || med.frequency === "as_needed")
              .map((med) => {
                const taken = isTakenToday(med.id);
                const skipped = isSkippedToday(med.id);

                return (
                  <div
                    key={med.id}
                    className={`p-4 rounded-lg border transition-all ${
                      taken
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : skipped
                        ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(med.type)}</span>
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {med.dosage && <span>{med.dosage}</span>}
                            {med.reminder_enabled && med.reminder_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {med.reminder_time.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {taken ? (
                          <Badge className="bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            Taken
                          </Badge>
                        ) : skipped ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            Skipped
                          </Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleLogMedication(med.id, true)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLogMedication(med.id, false, "Skipped")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditMedication(med)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Medication?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{med.name}" and all its logs. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMedication(med.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationTracker;
