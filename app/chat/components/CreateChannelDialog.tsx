import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelName: string
  onChannelNameChange: (value: string) => void
  channelDescription: string
  onChannelDescriptionChange: (value: string) => void
  onSubmit: () => void
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  channelName,
  onChannelNameChange,
  channelDescription,
  onChannelDescriptionChange,
  onSubmit
}: CreateChannelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription>
            Create a new channel for your community
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={channelName}
              onChange={(e) => onChannelNameChange(e.target.value)}
              placeholder="general"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={channelDescription}
              onChange={(e) => onChannelDescriptionChange(e.target.value)}
              placeholder="A place for general discussion"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Create Channel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 