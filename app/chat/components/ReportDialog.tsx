import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: string
  onReasonChange: (value: string) => void
  onSubmit: () => void
}

export function ReportDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onSubmit
}: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Message</DialogTitle>
          <DialogDescription>
            Please provide a reason for reporting this message
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Explain why you're reporting this message"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Submit Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 