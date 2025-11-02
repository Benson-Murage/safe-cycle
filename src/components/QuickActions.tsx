import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, Smile, FileText } from "lucide-react";
import LogPeriodDialog from "./dialogs/LogPeriodDialog";
import LogSymptomDialog from "./dialogs/LogSymptomDialog";

interface QuickActionsProps {
  userId: string;
}

const QuickActions = ({ userId }: QuickActionsProps) => {
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [symptomDialogOpen, setSymptomDialogOpen] = useState(false);

  return (
    <>
      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setPeriodDialogOpen(true)}
              variant="soft"
              className="h-24 flex flex-col gap-2"
            >
              <Droplet className="h-6 w-6" />
              <span>Log Period</span>
            </Button>
            <Button
              onClick={() => setSymptomDialogOpen(true)}
              variant="soft"
              className="h-24 flex flex-col gap-2"
            >
              <Smile className="h-6 w-6" />
              <span>Log Symptoms</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <LogPeriodDialog
        open={periodDialogOpen}
        onOpenChange={setPeriodDialogOpen}
        userId={userId}
      />
      <LogSymptomDialog
        open={symptomDialogOpen}
        onOpenChange={setSymptomDialogOpen}
        userId={userId}
      />
    </>
  );
};

export default QuickActions;